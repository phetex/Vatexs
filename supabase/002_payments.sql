-- Vatexs payments (Paystack escrow) — run once against your Supabase project,
-- after supabase/schema.sql, via SQL Editor -> New query -> paste -> Run.

-- ============ seller_payout_accounts ============
-- Holds only what's needed to pay a seller out via Paystack Transfers.
-- Full account numbers are never stored — only what Paystack returns back to us.
create table if not exists public.seller_payout_accounts (
  seller_id uuid primary key references public.profiles (id) on delete cascade,
  paystack_recipient_code text not null,
  bank_name text not null,
  account_name text not null,
  account_number_last4 text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.seller_payout_accounts enable row level security;

create policy "Sellers can view their own payout account"
  on public.seller_payout_accounts for select using (auth.uid() = seller_id);

-- No insert/update/delete policies for the client role: payout accounts are only
-- ever written by the "onboard-seller-bank" Edge Function using the service role
-- key, after verifying the account with Paystack. This prevents a client from
-- ever pointing payouts at an unverified account.

drop trigger if exists seller_payout_accounts_set_updated_at on public.seller_payout_accounts;
create trigger seller_payout_accounts_set_updated_at
  before update on public.seller_payout_accounts
  for each row execute procedure public.set_updated_at();

-- ============ orders ============
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id),
  buyer_id uuid not null references public.profiles (id),
  seller_id uuid not null references public.profiles (id),
  amount numeric(10, 2) not null check (amount >= 0),
  currency text not null default 'NGN',
  commission_amount numeric(10, 2) not null check (commission_amount >= 0),
  payout_amount numeric(10, 2) not null check (payout_amount >= 0),
  paystack_reference text not null unique,
  status text not null default 'pending' check (status in ('pending', 'paid', 'released', 'refunded', 'cancelled')),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  released_at timestamptz
);

create index if not exists orders_listing_idx on public.orders (listing_id);
create index if not exists orders_buyer_idx on public.orders (buyer_id);
create index if not exists orders_seller_idx on public.orders (seller_id);
create index if not exists orders_reference_idx on public.orders (paystack_reference);

alter table public.orders enable row level security;

create policy "Participants can view their orders"
  on public.orders for select using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- No insert/update/delete policies for the client role: orders are only ever
-- created by "initialize-payment" (server computes the real price — never
-- trust a client-supplied amount), flipped to 'paid' by the "paystack-webhook"
-- function after Paystack confirms the charge, and flipped to 'released' by
-- "confirm-receipt" only after a real Paystack transfer succeeds. All three
-- run with the service role key, which bypasses RLS entirely.

-- ============ realtime ============
alter publication supabase_realtime add table public.orders;
