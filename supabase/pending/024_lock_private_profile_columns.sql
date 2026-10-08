-- DO NOT APPLY until the app version that reads its own profile via get_my_profile()
-- (1.0.1 or later) is the version nearly everyone is using. App versions up to 1.0.0
-- run `select('*')` on profiles and would fail to load their own profile afterwards.
--
-- After this, other users (and signed-out visitors) can read only the public columns
-- the app actually shows next to listings, chats and orders. Phone numbers, wallet
-- balances, the admin flag and similar fields become private to their owner (via
-- get_my_profile()) and to 2FA-verified admins (via admin_list_profiles()).

revoke select on public.profiles from anon, authenticated;

grant select (id, full_name, avatar_url, location, holiday_mode, created_at)
  on public.profiles to anon, authenticated;
