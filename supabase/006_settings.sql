-- Vatexs settings: personalisation, holiday mode, privacy preferences —
-- run once, after 005_push_debug.sql, via SQL Editor -> Run.

alter table public.profiles add column if not exists holiday_mode boolean not null default false;
alter table public.profiles add column if not exists interested_categories integer[] not null default '{}';
alter table public.profiles add column if not exists analytics_opt_in boolean not null default true;

-- No new RLS policies needed: the existing "Users can update their own
-- profile" policy already covers these new columns.
