-- In-app notification inbox. Populated server-side (service role only,
-- alongside every push notification already sent) so users can see history
-- even if they missed the push or never enabled notifications at all.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "Users can view their own notifications" on public.notifications;
create policy "Users can view their own notifications"
  on public.notifications for select using (auth.uid() = user_id);

drop policy if exists "Users can mark their own notifications as read" on public.notifications;
create policy "Users can mark their own notifications as read"
  on public.notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- No insert policy: rows are only ever written by Edge Functions via the
-- service role, alongside sendPushToUser() — never directly by a client.
