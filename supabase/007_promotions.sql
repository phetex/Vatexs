-- Vatexs promotional tools — lets a seller boost a listing so it sorts first
-- on Home/category feeds for a limited window. No payment involved yet (free
-- MVP); reuses the existing "sellers can update their own listings" RLS policy.

alter table public.listings
  add column if not exists featured boolean not null default false,
  add column if not exists featured_until timestamptz;

create index if not exists listings_featured_idx on public.listings (featured, featured_until);
