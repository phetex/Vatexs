-- Admin-only appointments/calendar feature, plus admin oversight (read-only)
-- access to conversations and messages for support/dispute purposes. Admins
-- were previously invisible to these tables since the existing RLS only
-- allows conversation participants to see their own threads.

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  with_user_id uuid references public.profiles (id) on delete set null,
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 30,
  location text,
  notes text,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists appointments_scheduled_idx on public.appointments (scheduled_at);

alter table public.appointments enable row level security;

create policy "Admins can manage appointments"
  on public.appointments for all using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  ) with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

drop trigger if exists appointments_set_updated_at on public.appointments;
create trigger appointments_set_updated_at
  before update on public.appointments
  for each row execute procedure public.set_updated_at();

-- Admin oversight: view any conversation / message (existing participant
-- policies are untouched and still apply for regular users).
create policy "Admins can view all conversations"
  on public.conversations for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Admins can view all messages"
  on public.messages for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );
