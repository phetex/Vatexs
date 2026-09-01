-- Vatexs user blocking — required alongside reporting for apps with
-- user-to-user messaging (Apple 1.2 / Play user-generated-content policies).

create table if not exists public.blocked_users (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

create index if not exists blocked_users_blocked_idx on public.blocked_users (blocked_id);

alter table public.blocked_users enable row level security;

create policy "Users can view their own blocks"
  on public.blocked_users for select using (auth.uid() = blocker_id);

create policy "Users can manage their own blocks"
  on public.blocked_users for all using (auth.uid() = blocker_id) with check (auth.uid() = blocker_id);
