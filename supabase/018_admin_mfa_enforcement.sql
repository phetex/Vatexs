-- Phase 2 of admin 2FA: until now, every "admin" RLS policy only checked
-- profiles.is_admin, so a stolen password used directly against the API
-- (bypassing admin.html's login screen) would still pass every one of these
-- checks with no TOTP code required. auth.jwt()->>'aal' reflects whether the
-- current session actually completed an MFA challenge (aal2) or only a
-- password sign-in (aal1) — requiring aal2 here closes that gap.
--
-- Only run this after every admin account has a verified TOTP factor —
-- otherwise that admin locks themselves out of every one of these tables.

create or replace function public.is_admin_mfa()
returns boolean
language sql
stable
as $$
  select
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
    and coalesce((auth.jwt() ->> 'aal') = 'aal2', false);
$$;

-- support_tickets / ticket_messages
drop policy if exists "Admins can view all tickets" on public.support_tickets;
create policy "Admins can view all tickets"
  on public.support_tickets for select using (public.is_admin_mfa());

drop policy if exists "Ticket participants can view messages" on public.ticket_messages;
create policy "Ticket participants can view messages"
  on public.ticket_messages for select using (
    exists (
      select 1 from public.support_tickets
      where support_tickets.id = ticket_messages.ticket_id
      and (
        support_tickets.reporter_id = auth.uid()
        or public.is_admin_mfa()
      )
    )
  );

-- orders / listings admin visibility
drop policy if exists "Admins can view all orders" on public.orders;
create policy "Admins can view all orders"
  on public.orders for select using (public.is_admin_mfa());

drop policy if exists "Admins can view all listings" on public.listings;
create policy "Admins can view all listings"
  on public.listings for select using (public.is_admin_mfa());

-- push_debug_log
drop policy if exists "Admins can view all debug logs" on public.push_debug_log;
create policy "Admins can view all debug logs"
  on public.push_debug_log for select using (public.is_admin_mfa());

-- appointments / conversations / messages
drop policy if exists "Admins can manage appointments" on public.appointments;
create policy "Admins can manage appointments"
  on public.appointments for all
  using (public.is_admin_mfa())
  with check (public.is_admin_mfa());

drop policy if exists "Admins can view all conversations" on public.conversations;
create policy "Admins can view all conversations"
  on public.conversations for select using (public.is_admin_mfa());

drop policy if exists "Admins can view all messages" on public.messages;
create policy "Admins can view all messages"
  on public.messages for select using (public.is_admin_mfa());

-- social_links / deals
drop policy if exists "Admins can manage social links" on public.social_links;
create policy "Admins can manage social links"
  on public.social_links for all
  using (public.is_admin_mfa())
  with check (public.is_admin_mfa());

drop policy if exists "Admins can update any listing" on public.listings;
create policy "Admins can update any listing"
  on public.listings for update using (public.is_admin_mfa());

-- analytics
drop policy if exists "Admins can view analytics events" on public.analytics_events;
create policy "Admins can view analytics events"
  on public.analytics_events for select using (public.is_admin_mfa());
