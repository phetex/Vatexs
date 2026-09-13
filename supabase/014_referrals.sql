-- Referral program: every user gets a shareable code. When someone they
-- referred completes (releases) their first order, the referrer earns a
-- wallet credit worth ~£10 (converted to NGN at the time), redeemable
-- against future NGN purchases. This is a promo-only credit balance,
-- separate from seller payouts (which still pay out immediately, unchanged).

alter table public.profiles
  add column if not exists referral_code text,
  add column if not exists referred_by uuid references public.profiles(id),
  add column if not exists wallet_credit_ngn numeric not null default 0;

update public.profiles
set referral_code = upper(substr(replace(id::text, '-', ''), 1, 8))
where referral_code is null;

alter table public.profiles
  alter column referral_code set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_referral_code_unique'
  ) then
    alter table public.profiles add constraint profiles_referral_code_unique unique (referral_code);
  end if;
end $$;

alter table public.orders
  add column if not exists wallet_credit_used numeric not null default 0;

create table if not exists public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_id uuid not null references public.profiles(id) on delete cascade unique,
  order_id uuid not null references public.orders(id) on delete cascade,
  amount_ngn numeric not null,
  created_at timestamptz not null default now()
);

alter table public.referral_rewards enable row level security;

drop policy if exists "Users can view referral rewards they're part of" on public.referral_rewards;
create policy "Users can view referral rewards they're part of"
  on public.referral_rewards for select
  using (auth.uid() = referrer_id or auth.uid() = referred_id);

-- Atomic balance adjustment (positive to credit, negative to debit) so
-- concurrent orders/rewards can never race each other into a wrong total.
create or replace function public.increment_wallet_credit(p_user_id uuid, p_amount numeric)
returns void
language sql
security definer set search_path = public
as $$
  update public.profiles set wallet_credit_ngn = wallet_credit_ngn + p_amount where id = p_user_id;
$$;

-- Pick up referral_code from signup metadata, same way country_code already does.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_code text;
  referrer_id uuid;
begin
  new_code := upper(substr(replace(new.id::text, '-', ''), 1, 8));

  if new.raw_user_meta_data ->> 'referral_code' is not null then
    select id into referrer_id
    from public.profiles
    where referral_code = upper(new.raw_user_meta_data ->> 'referral_code');
  end if;

  insert into public.profiles (id, full_name, country_code, referral_code, referred_by)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'country_code',
    new_code,
    referrer_id
  );
  return new;
end;
$$;
