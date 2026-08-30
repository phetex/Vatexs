-- Vatexs push notifications + admin panel support — run once, after
-- 003_support.sql, via SQL Editor -> Run.

-- ============ push_tokens ============
create table if not exists public.push_tokens (
  user_id uuid not null references public.profiles (id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('ios', 'android', 'web')),
  updated_at timestamptz not null default now(),
  primary key (user_id, token)
);

alter table public.push_tokens enable row level security;

create policy "Users can view their own push tokens"
  on public.push_tokens for select using (auth.uid() = user_id);

create policy "Users can register their own push tokens"
  on public.push_tokens for insert with check (auth.uid() = user_id);

create policy "Users can remove their own push tokens"
  on public.push_tokens for delete using (auth.uid() = user_id);

create policy "Users can update their own push tokens"
  on public.push_tokens for update using (auth.uid() = user_id);

-- ============ admin visibility into orders (for the admin panel) ============
create policy "Admins can view all orders"
  on public.orders for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin)
  );

-- ============ admin visibility into listings (for the admin panel) ============
create policy "Admins can view all listings"
  on public.listings for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin)
  );
