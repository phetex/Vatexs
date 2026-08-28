-- Vatexs marketplace schema
-- Run this once against your Supabase project (SQL Editor -> New query -> paste -> Run)

-- ============ profiles ============
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  phone text,
  location text,
  bio text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============ categories ============
create table if not exists public.categories (
  id serial primary key,
  name text not null unique,
  slug text not null unique,
  icon text not null default 'pricetag-outline'
);

alter table public.categories enable row level security;

create policy "Categories are viewable by everyone"
  on public.categories for select using (true);

insert into public.categories (name, slug, icon) values
  ('Fashion', 'fashion', 'shirt-outline'),
  ('Tech & Electronics', 'tech', 'phone-portrait-outline'),
  ('Home & Living', 'home', 'home-outline'),
  ('Beauty & Health', 'beauty', 'sparkles-outline'),
  ('Sports & Outdoors', 'sports', 'basketball-outline'),
  ('Kids & Baby', 'kids', 'balloon-outline'),
  ('Vehicles', 'vehicles', 'car-outline'),
  ('Other', 'other', 'ellipsis-horizontal-outline')
on conflict (slug) do nothing;

-- ============ listings ============
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  category_id integer not null references public.categories (id),
  title text not null,
  description text not null default '',
  price numeric(10, 2) not null check (price >= 0),
  currency text not null default 'GBP',
  condition text not null default 'used' check (condition in ('new', 'like_new', 'used', 'fair')),
  location text,
  status text not null default 'active' check (status in ('active', 'sold', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listings_category_idx on public.listings (category_id);
create index if not exists listings_seller_idx on public.listings (seller_id);
create index if not exists listings_status_idx on public.listings (status);
create index if not exists listings_created_idx on public.listings (created_at desc);

alter table public.listings enable row level security;

create policy "Active listings are viewable by everyone"
  on public.listings for select using (status = 'active' or seller_id = auth.uid());

create policy "Users can insert their own listings"
  on public.listings for insert with check (auth.uid() = seller_id);

create policy "Users can update their own listings"
  on public.listings for update using (auth.uid() = seller_id);

create policy "Users can delete their own listings"
  on public.listings for delete using (auth.uid() = seller_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists listings_set_updated_at on public.listings;
create trigger listings_set_updated_at
  before update on public.listings
  for each row execute procedure public.set_updated_at();

-- ============ listing_images ============
create table if not exists public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  url text not null,
  position integer not null default 0
);

create index if not exists listing_images_listing_idx on public.listing_images (listing_id);

alter table public.listing_images enable row level security;

create policy "Listing images are viewable by everyone"
  on public.listing_images for select using (true);

create policy "Owners can manage their listing images"
  on public.listing_images for all using (
    exists (
      select 1 from public.listings
      where listings.id = listing_images.listing_id
      and listings.seller_id = auth.uid()
    )
  );

-- ============ favorites ============
create table if not exists public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

alter table public.favorites enable row level security;

create policy "Users can view their own favorites"
  on public.favorites for select using (auth.uid() = user_id);

create policy "Users can manage their own favorites"
  on public.favorites for all using (auth.uid() = user_id);

-- ============ conversations ============
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings (id) on delete set null,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (listing_id, buyer_id, seller_id)
);

create index if not exists conversations_buyer_idx on public.conversations (buyer_id);
create index if not exists conversations_seller_idx on public.conversations (seller_id);

alter table public.conversations enable row level security;

create policy "Participants can view their conversations"
  on public.conversations for select using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "Buyers can start a conversation"
  on public.conversations for insert with check (auth.uid() = buyer_id);

-- ============ messages ============
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);

alter table public.messages enable row level security;

create policy "Participants can view messages"
  on public.messages for select using (
    exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
      and (conversations.buyer_id = auth.uid() or conversations.seller_id = auth.uid())
    )
  );

create policy "Participants can send messages"
  on public.messages for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
      and (conversations.buyer_id = auth.uid() or conversations.seller_id = auth.uid())
    )
  );

create or replace function public.touch_conversation()
returns trigger language plpgsql as $$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute procedure public.touch_conversation();

-- ============ storage: listing photos ============
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

create policy "Listing images are publicly readable"
  on storage.objects for select using (bucket_id = 'listing-images');

create policy "Authenticated users can upload listing images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'listing-images');

create policy "Owners can delete their uploaded listing images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'listing-images' and owner = auth.uid());

-- ============ realtime ============
alter publication supabase_realtime add table public.messages;
