-- Preparation for hiding private profile columns (phone, wallet balance, admin flag,
-- ...) from other users. Everything here is additive and safe for the app versions
-- already in the stores; the actual column lock-down is supabase/pending/024_*.sql
-- and is applied only after the new app version is widely adopted.

-- 1. The signed-in user's own full profile, readable without direct column access.
create or replace function public.get_my_profile()
returns setof public.profiles
language sql stable
security definer set search_path = public
as $$
  select * from public.profiles where id = auth.uid();
$$;

revoke execute on function public.get_my_profile() from public, anon;
grant execute on function public.get_my_profile() to authenticated, service_role;

-- 2. Full profile list for the admin portal (2FA-verified admins only).
create or replace function public.admin_list_profiles()
returns setof public.profiles
language sql stable
security definer set search_path = public
as $$
  select * from public.profiles where public.is_admin_mfa() order by created_at desc;
$$;

revoke execute on function public.admin_list_profiles() from public, anon;
grant execute on function public.admin_list_profiles() to authenticated, service_role;

-- 3. Row-level-security helpers read profiles, so they must not depend on the caller
--    being allowed to read the private columns.
create or replace function public.is_admin_mfa()
returns boolean
language sql stable
security definer set search_path = public
as $$
  select
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
    and coalesce((auth.jwt() ->> 'aal') = 'aal2', false);
$$;

create or replace function public.is_banned()
returns boolean
language sql stable
security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and banned_at is not null);
$$;

drop policy if exists "Users can insert their own listings" on public.listings;
create policy "Users can insert their own listings"
  on public.listings for insert
  with check (auth.uid() = seller_id and not public.is_banned());

-- 4. Image uploads: photos only, capped in size.
update storage.buckets
set file_size_limit = 15 * 1024 * 1024,
    allowed_mime_types = array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
where id = 'listing-images';
