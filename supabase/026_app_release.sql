-- Latest published app version per platform, read by the app to show an
-- "update available" notice. Publicly readable (guests included); written only
-- by the project owner via SQL, e.g.:
--   update public.app_release set latest_version = '1.0.2' where platform = 'ios';

create table if not exists public.app_release (
  platform text primary key check (platform in ('ios', 'android')),
  latest_version text not null,
  store_url text not null,
  updated_at timestamptz not null default now()
);

alter table public.app_release enable row level security;

drop policy if exists "Anyone can read the latest app version" on public.app_release;
create policy "Anyone can read the latest app version"
  on public.app_release for select using (true);

insert into public.app_release (platform, latest_version, store_url) values
  ('ios', '1.0.1', 'https://apps.apple.com/app/id6808147110'),
  ('android', '1.0.1', 'https://play.google.com/store/apps/details?id=com.vatexs.app')
on conflict (platform) do nothing;
