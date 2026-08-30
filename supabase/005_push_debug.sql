-- Temporary diagnostic table for debugging push registration failures.
-- Safe to drop later once push notifications are confirmed working
-- everywhere: drop table public.push_debug_log;

create table if not exists public.push_debug_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id),
  platform text,
  stage text,
  message text,
  created_at timestamptz not null default now()
);

alter table public.push_debug_log enable row level security;

create policy "Users can insert their own debug logs"
  on public.push_debug_log for insert with check (auth.uid() = user_id);

create policy "Admins can view all debug logs"
  on public.push_debug_log for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin)
  );
