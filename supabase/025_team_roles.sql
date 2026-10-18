-- Team roles for the admin portal.
--   admin : everything (money actions, broadcasts, bans, managing the team)
--   staff : support and moderation only (tickets, reports, conversations, customers)
-- Both roles require a completed 2FA challenge (aal2) for database access.

alter table public.profiles
  add column if not exists is_staff boolean not null default false;

-- Staff status is a privileged column, exactly like is_admin: clients can never change it.
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if new.is_admin is distinct from old.is_admin
       or new.is_staff is distinct from old.is_staff
       or new.wallet_credit_ngn is distinct from old.wallet_credit_ngn
       or new.banned_at is distinct from old.banned_at
       or new.ban_reason is distinct from old.ban_reason
       or new.referral_code is distinct from old.referral_code
       or new.referred_by is distinct from old.referred_by then
      raise exception 'This profile field cannot be changed directly.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

-- Admin or staff, with a verified 2FA session.
create or replace function public.is_staff_mfa()
returns boolean
language sql stable
security definer set search_path = public
as $$
  select
    exists (select 1 from public.profiles where id = auth.uid() and (is_admin or is_staff))
    and coalesce((auth.jwt() ->> 'aal') = 'aal2', false);
$$;

-- Read-only access for staff to the support and moderation tables.
drop policy if exists "Staff can view all tickets" on public.support_tickets;
create policy "Staff can view all tickets"
  on public.support_tickets for select using (public.is_staff_mfa());

drop policy if exists "Staff can view ticket messages" on public.ticket_messages;
create policy "Staff can view ticket messages"
  on public.ticket_messages for select using (public.is_staff_mfa());

drop policy if exists "Staff can view all conversations" on public.conversations;
create policy "Staff can view all conversations"
  on public.conversations for select using (public.is_staff_mfa());

drop policy if exists "Staff can view all messages" on public.messages;
create policy "Staff can view all messages"
  on public.messages for select using (public.is_staff_mfa());

drop policy if exists "Staff can view reports" on public.reports;
create policy "Staff can view reports"
  on public.reports for select using (public.is_staff_mfa());

-- Customer list: staff see names and activity but not phone numbers, wallet balances or referral data.
drop function if exists public.admin_list_profiles();
create function public.admin_list_profiles()
returns setof jsonb
language sql stable
security definer set search_path = public
as $$
  select to_jsonb(p) - case when public.is_admin_mfa() then array[]::text[] else array['phone', 'wallet_credit_ngn', 'referral_code', 'referred_by', 'ban_reason'] end
  from public.profiles p
  where public.is_staff_mfa()
  order by p.created_at desc;
$$;

revoke execute on function public.admin_list_profiles() from public, anon;
grant execute on function public.admin_list_profiles() to authenticated, service_role;

-- Every role change is recorded. Written by the manage-team Edge Function (service role) only.
create table if not exists public.team_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_id uuid references public.profiles (id) on delete set null,
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists team_audit_log_created_idx on public.team_audit_log (created_at desc);
alter table public.team_audit_log enable row level security;

drop policy if exists "Admins can view the team audit log" on public.team_audit_log;
create policy "Admins can view the team audit log"
  on public.team_audit_log for select using (public.is_admin_mfa());
