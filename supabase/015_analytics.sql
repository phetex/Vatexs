-- Anonymous usage analytics, gated by profiles.analytics_opt_in (Settings ->
-- "Analytics & cookies"). Events carry a random per-device id, never the
-- user's actual account id, so this stays genuinely anonymous per the
-- privacy policy's wording.

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  anon_id text not null,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_event_name_idx on public.analytics_events (event_name);
create index if not exists analytics_events_created_at_idx on public.analytics_events (created_at);

alter table public.analytics_events enable row level security;

-- Write-only from the app — nobody can read events back except an admin.
drop policy if exists "Authenticated users can log analytics events" on public.analytics_events;
create policy "Authenticated users can log analytics events"
  on public.analytics_events for insert
  to authenticated
  with check (true);

drop policy if exists "Admins can view analytics events" on public.analytics_events;
create policy "Admins can view analytics events"
  on public.analytics_events for select
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));
