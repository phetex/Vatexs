-- Marketing (social links) + Deals (admin can curate boosted listings
-- marketplace-wide, not just their own).

create table if not exists public.social_links (
  platform text primary key,
  url text not null,
  updated_at timestamptz not null default now()
);

alter table public.social_links enable row level security;

create policy "Social links are viewable by everyone"
  on public.social_links for select using (true);

create policy "Admins can manage social links"
  on public.social_links for all using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  ) with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Admins can boost/un-boost (and otherwise moderate) any listing, not just
-- their own — needed for the admin "Deals" panel.
create policy "Admins can update any listing"
  on public.listings for update using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );
