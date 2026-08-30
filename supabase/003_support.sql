-- Vatexs customer support / dispute handling — run once against your
-- Supabase project, after 002_payments.sql, via SQL Editor -> Run.

-- ============ admin flag ============
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- Grant yourself admin access (edit the email if needed):
update public.profiles
set is_admin = true
where id = (select id from auth.users where email = 'eassam89@gmail.com');

-- ============ support_tickets ============
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders (id),
  reporter_id uuid not null references public.profiles (id),
  category text not null check (category in ('item_not_received', 'item_not_as_described', 'payment_issue', 'account', 'other')),
  subject text not null,
  message text not null,
  status text not null default 'open' check (status in ('open', 'in_review', 'resolved', 'refunded', 'closed')),
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists support_tickets_reporter_idx on public.support_tickets (reporter_id);
create index if not exists support_tickets_order_idx on public.support_tickets (order_id);
create index if not exists support_tickets_status_idx on public.support_tickets (status);

alter table public.support_tickets enable row level security;

create policy "Reporters can view their own tickets"
  on public.support_tickets for select using (auth.uid() = reporter_id);

create policy "Admins can view all tickets"
  on public.support_tickets for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin)
  );

-- Ticket creation and status changes go through the "open-ticket" and
-- "resolve-ticket" Edge Functions (service role), so there is no direct
-- insert/update policy for the client role here.

drop trigger if exists support_tickets_set_updated_at on public.support_tickets;
create trigger support_tickets_set_updated_at
  before update on public.support_tickets
  for each row execute procedure public.set_updated_at();

-- ============ ticket_messages ============
create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets (id) on delete cascade,
  sender_id uuid not null references public.profiles (id),
  is_admin_reply boolean not null default false,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists ticket_messages_ticket_idx on public.ticket_messages (ticket_id, created_at);

alter table public.ticket_messages enable row level security;

create policy "Ticket participants can view messages"
  on public.ticket_messages for select using (
    exists (
      select 1 from public.support_tickets
      where support_tickets.id = ticket_messages.ticket_id
      and (
        support_tickets.reporter_id = auth.uid()
        or exists (select 1 from public.profiles where id = auth.uid() and is_admin)
      )
    )
  );

-- All messages (reporter and admin) go through the "reply-ticket" Edge
-- Function using the service role, so is_admin_reply can never be spoofed
-- by a regular user and every reply can trigger an email notification.

-- ============ realtime ============
alter publication supabase_realtime add table public.support_tickets;
alter publication supabase_realtime add table public.ticket_messages;
