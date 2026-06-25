create table if not exists public.public_product_flyers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  product_class text not null,
  short_description text,
  story text,
  main_image_path text,
  secondary_image_path text,
  display_order integer not null default 0,
  published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists public_product_flyers_public_idx
on public.public_product_flyers (published, display_order, created_at desc);

create index if not exists public_product_flyers_admin_idx
on public.public_product_flyers (display_order, created_at desc);

drop trigger if exists set_public_product_flyers_updated_at on public.public_product_flyers;
create trigger set_public_product_flyers_updated_at
before update on public.public_product_flyers
for each row execute function private.set_updated_at();

alter table public.public_product_flyers enable row level security;

grant select on table public.public_product_flyers to anon, authenticated;
grant insert, update, delete on table public.public_product_flyers to authenticated;

drop policy if exists "Public can read published product flyers" on public.public_product_flyers;
create policy "Public can read published product flyers"
on public.public_product_flyers
for select
to anon, authenticated
using (published = true);

drop policy if exists "Admins can manage product flyers" on public.public_product_flyers;
create policy "Admins can manage product flyers"
on public.public_product_flyers
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

insert into public.public_product_flyers (
  title,
  slug,
  product_class,
  short_description,
  story,
  main_image_path,
  secondary_image_path,
  display_order,
  published
)
values
  (
    'IRUNSVAN 028 HEAT 1.0',
    'irunsvan-028-heat-1-0',
    'Everyday Trainer',
    'A public display flyer for daily trainer discovery.',
    'Everyday Trainer models are built for easy daily movement, clean styling, and dependable comfort across regular training and casual wear.',
    '/public/product-images/SKUs/028/028-1.jpg',
    '/public/product-images/SKUs/028/028-4.jpg',
    10,
    true
  ),
  (
    'IRUNSVAN 166 FEI RAN 3.0',
    'irunsvan-166-fei-ran-3-0',
    'Everyday Trainer',
    'A lightweight everyday trainer presentation.',
    'FEI RAN 3.0 sits in the everyday class for buyers who want a versatile Irunsvan trainer with a lighter, more active profile.',
    '/public/product-images/SKUs/166/166-1.jpg',
    '/public/product-images/SKUs/166/166-2.jpg',
    20,
    true
  ),
  (
    'IRUNSVAN 121 Chasing Wind 1.0',
    'irunsvan-121-chasing-wind-1-0',
    'Everyday Trainer',
    'A daily trainer flyer for steady movement.',
    'Chasing Wind 1.0 rounds out the everyday trainer category with a simple, usable profile for daily runs, walking, and lifestyle wear.',
    '/public/product-images/SKUs/121/121-1.jpg',
    '/public/product-images/SKUs/121/121-2.jpg',
    30,
    true
  ),
  (
    'IRUNSVAN 126 CHASING LIGHT 1.0',
    'irunsvan-126-chasing-light-1-0',
    'Performance Trainer',
    'A performance trainer flyer for sharper sessions.',
    'Performance Trainer models bring a stronger training signal for faster workouts, tempo days, and more intentional road movement.',
    '/public/product-images/SKUs/126/126-1.jpg',
    '/public/product-images/SKUs/126/126-3.jpg',
    110,
    true
  ),
  (
    'IRUNSVAN 066 HEAT 2.0',
    'irunsvan-066-heat-2-0',
    'Performance Trainer',
    'A structured performance trainer presentation.',
    'HEAT 2.0 is presented as a more capable training option for customers who want a stronger feel than a basic daily trainer.',
    '/public/product-images/SKUs/066/066-1.jpg',
    '/public/product-images/SKUs/066/066-3.jpg',
    120,
    true
  ),
  (
    'IRUNSVAN 072 BREEZE SUC 1.0',
    'irunsvan-072-breeze-suc-1-0',
    'Performance Trainer',
    'A breathable performance trainer flyer.',
    'BREEZE SUC 1.0 keeps the performance trainer class visually light while still sitting above the everyday models in training intent.',
    '/public/product-images/SKUs/072/072-1.jpg',
    '/public/product-images/SKUs/072/072-3.jpg',
    130,
    true
  ),
  (
    'IRUNSVAN 098 HEAT 2.0 PRO',
    'irunsvan-098-heat-2-0-pro',
    'Performance Trainer',
    'A pro-level performance trainer presentation.',
    'HEAT 2.0 PRO is the strongest visual signal in the Performance Trainer category before the range moves into race-day shoes.',
    '/public/product-images/SKUs/098/098-1.jpg',
    '/public/product-images/SKUs/098/098-3.jpg',
    140,
    true
  ),
  (
    'IRUNSVAN 125 Feiran GT 3.0',
    'irunsvan-125-feiran-gt-3-0',
    'Race Day Performance',
    'A race-day performance flyer for top-end motion.',
    'Race Day Performance models are the sharpest public-facing shoes in the range, built to read faster, lighter, and more competition-focused.',
    '/public/product-images/SKUs/125/125-1.jpg',
    '/public/product-images/SKUs/125/125-3.jpg',
    210,
    true
  ),
  (
    'IRUNSVAN 131 SHADOW WING 3.0',
    'irunsvan-131-shadow-wing-3-0',
    'Race Day Performance',
    'A high-class race-day product flyer.',
    'SHADOW WING 3.0 is presented for the highest-performance lane: a shoe meant to feel technical, fast, and visually premium.',
    '/public/product-images/SKUs/131/131-1.jpg',
    '/public/product-images/SKUs/131/131-4.jpg',
    220,
    true
  ),
  (
    'IRUNSVAN 087 SHADOWING 2.0+',
    'irunsvan-087-shadowing-2-0-plus',
    'Race Day Performance',
    'A race-day flyer for technical speed.',
    'SHADOWING 2.0+ gives the Race Day Performance section another fast visual option while keeping the page organized by product class.',
    '/public/product-images/SKUs/087/1.jpg',
    '/public/product-images/SKUs/087/2.jpg',
    230,
    true
  ),
  (
    'IRUNSVAN 2503 SHADOW WING 2.0 PRO',
    'irunsvan-2503-shadow-wing-2-0-pro',
    'Race Day Performance',
    'A pro race-day flyer for the public Products page.',
    'SHADOW WING 2.0 PRO closes the race-day category as a focused public flyer for high-intent performance storytelling.',
    '/public/product-images/SKUs/2503/2503-1.jpg',
    '/public/product-images/SKUs/2503/2503-3.jpg',
    240,
    true
  )
on conflict (slug) do update
set
  title = excluded.title,
  product_class = excluded.product_class,
  short_description = excluded.short_description,
  story = excluded.story,
  main_image_path = excluded.main_image_path,
  secondary_image_path = excluded.secondary_image_path,
  display_order = excluded.display_order,
  published = excluded.published,
  updated_at = now();
