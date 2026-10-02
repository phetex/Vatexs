-- Blocking was only enforced inside the send-message Edge Function. The RLS
-- policies on messages and conversations let a blocked user write directly via
-- the database API, bypassing the block entirely. Enforce it in RLS as well.
--
-- The check runs in a SECURITY DEFINER function because a blocked user cannot
-- read the other person's blocked_users row through RLS.

create or replace function public.users_blocked(a uuid, b uuid)
returns boolean
language sql stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.blocked_users
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;

revoke execute on function public.users_blocked(uuid, uuid) from public, anon;
grant execute on function public.users_blocked(uuid, uuid) to authenticated, service_role;

drop policy if exists "Participants can send messages" on public.messages;
create policy "Participants can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
        and not public.users_blocked(c.buyer_id, c.seller_id)
    )
  );

drop policy if exists "Buyers can start a conversation" on public.conversations;
create policy "Buyers can start a conversation"
  on public.conversations for insert
  with check (
    auth.uid() = buyer_id
    and not public.users_blocked(buyer_id, seller_id)
  );
