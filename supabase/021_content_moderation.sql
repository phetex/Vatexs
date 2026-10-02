-- User-generated-content safeguards required by Apple guideline 1.2 and Google
-- Play's UGC policy: report objectionable content, a moderation queue the team
-- can act on, automatic filtering of objectionable text, and banning abusive
-- users. (User blocking already exists — see 009_blocking.sql.)

-- ---------------------------------------------------------------------------
-- Reports
-- ---------------------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles (id) on delete set null,
  target_type text not null check (target_type in ('listing', 'message', 'user')),
  target_id uuid not null,
  reported_user_id uuid references public.profiles (id) on delete cascade,
  reason text not null,
  details text,
  snapshot jsonb not null default '{}'::jsonb,
  status text not null default 'open' check (status in ('open', 'actioned', 'dismissed')),
  resolution_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists reports_status_created_idx on public.reports (status, created_at desc);
create index if not exists reports_reported_user_idx on public.reports (reported_user_id);
create unique index if not exists reports_open_dedupe_idx
  on public.reports (reporter_id, target_type, target_id) where status = 'open';

alter table public.reports enable row level security;

-- No client insert policy: reports are created by the report-content Edge
-- Function (so the offender is derived server-side and cannot be spoofed) or by
-- the block trigger below. Only 2FA-verified admins can read or resolve them.
drop policy if exists "Admins can view reports" on public.reports;
create policy "Admins can view reports"
  on public.reports for select using (public.is_admin_mfa());

drop policy if exists "Admins can update reports" on public.reports;
create policy "Admins can update reports"
  on public.reports for update using (public.is_admin_mfa()) with check (public.is_admin_mfa());

-- ---------------------------------------------------------------------------
-- Blocking a user also alerts the moderation team
-- ---------------------------------------------------------------------------
create or replace function public.notify_admins_of_block()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.reports (reporter_id, target_type, target_id, reported_user_id, reason, details)
  values (new.blocker_id, 'user', new.blocked_id, new.blocked_id, 'blocked', 'This user was blocked by another user.')
  on conflict (reporter_id, target_type, target_id) where status = 'open' do nothing;

  insert into public.notifications (user_id, title, body, data)
  select id, 'User blocked', 'A user was blocked and added to the moderation queue.', jsonb_build_object('type', 'new_report')
  from public.profiles where is_admin;

  return new;
end;
$$;

drop trigger if exists notify_admins_of_block on public.blocked_users;
create trigger notify_admins_of_block
  after insert on public.blocked_users
  for each row execute function public.notify_admins_of_block();

-- ---------------------------------------------------------------------------
-- Objectionable-content filter for listings and messages
-- ---------------------------------------------------------------------------
create table if not exists public.moderation_terms (
  term text primary key check (term ~ '^[a-z0-9 ]+$')
);

-- No policies: readable only by the SECURITY DEFINER filter and the service role.
alter table public.moderation_terms enable row level security;

insert into public.moderation_terms (term) values
  ('child porn'), ('kiddie porn'), ('underage sex'),
  ('porn'), ('pornography'), ('nudes'), ('sex tape'), ('escort service'),
  ('cocaine'), ('heroin'), ('mdma'), ('methamphetamine'),
  ('nigger'), ('nigga'), ('faggot'), ('kike'), ('chink'), ('tranny'),
  ('fuck'), ('fucking'), ('motherfucker'), ('cunt'), ('bitch'), ('whore'), ('slut')
on conflict do nothing;

create or replace function public.contains_objectionable(p_text text)
returns boolean
language sql stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.moderation_terms t
    where p_text ~* ('\m' || t.term || '\M')
  );
$$;

revoke execute on function public.contains_objectionable(text) from public, anon, authenticated;
grant execute on function public.contains_objectionable(text) to service_role;

create or replace function public.reject_objectionable_content()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  txt text;
begin
  if tg_table_name = 'listings' then
    txt := coalesce(new.title, '') || ' ' || coalesce(new.description, '');
  else
    txt := coalesce(new.body, '');
  end if;

  if public.contains_objectionable(txt) then
    raise exception 'This contains language that is not allowed on Vatexs. Please remove it and try again.'
      using errcode = 'P0001', hint = 'objectionable_content';
  end if;
  return new;
end;
$$;

drop trigger if exists reject_objectionable_listing on public.listings;
create trigger reject_objectionable_listing
  before insert or update of title, description on public.listings
  for each row execute function public.reject_objectionable_content();

drop trigger if exists reject_objectionable_message on public.messages;
create trigger reject_objectionable_message
  before insert on public.messages
  for each row execute function public.reject_objectionable_content();

-- ---------------------------------------------------------------------------
-- Banned users cannot publish new listings (the Edge Function also ejects them
-- from Supabase Auth, which stops sign-in and token refresh).
-- ---------------------------------------------------------------------------
drop policy if exists "Users can insert their own listings" on public.listings;
create policy "Users can insert their own listings"
  on public.listings for insert
  with check (
    auth.uid() = seller_id
    and not exists (select 1 from public.profiles where id = auth.uid() and banned_at is not null)
  );
