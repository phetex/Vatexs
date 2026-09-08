-- Country at signup — used to show buyers a converted price estimate in
-- their own currency next to the real (NGN) listing price. Payments still
-- always charge in NGN; this is display-only.

alter table public.profiles
  add column if not exists country_code text;

-- Pick up country_code from signup metadata, same as full_name already does.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, country_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'country_code'
  );
  return new;
end;
$$;
