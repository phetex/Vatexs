-- Security fix: the "Users can update their own profile" policy only checks row
-- ownership, and `authenticated` holds UPDATE on every column. Any signed-in user
-- could therefore set their own is_admin = true (and then enroll their own 2FA
-- factor to satisfy is_admin_mfa()) or grant themselves wallet credit.
--
-- Privileged columns may now only be changed by the service role, by
-- SECURITY DEFINER functions, or by direct SQL — never by a client session.

alter table public.profiles
  add column if not exists banned_at timestamptz,
  add column if not exists ban_reason text;

create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if new.is_admin is distinct from old.is_admin
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

drop trigger if exists protect_profile_columns on public.profiles;
create trigger protect_profile_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- increment_wallet_credit is SECURITY DEFINER and was executable by every
-- signed-in user via PostgREST rpc(); only the service role (Edge Functions)
-- ever calls it.
revoke execute on function public.increment_wallet_credit(uuid, numeric) from public, anon, authenticated;
grant execute on function public.increment_wallet_credit(uuid, numeric) to service_role;

-- A seller must not be able to re-activate a listing a moderator removed.
-- (featured / featured_until stay client-writable: Promotional tools sets them.)
create or replace function public.protect_listing_columns()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('authenticated', 'anon') and old.status = 'hidden' and new.status is distinct from old.status then
    if not public.is_admin_mfa() then
      raise exception 'This listing was removed by moderators.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_listing_columns on public.listings;
create trigger protect_listing_columns
  before update on public.listings
  for each row execute function public.protect_listing_columns();
