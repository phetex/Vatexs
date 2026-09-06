-- Add Women and Men as top-level categories alongside Fashion.

insert into public.categories (name, slug, icon) values
  ('Women', 'women', 'woman-outline'),
  ('Men', 'men', 'man-outline')
on conflict (slug) do nothing;
