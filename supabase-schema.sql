create table if not exists public.inventory_items (
  id text primary key,
  name text not null,
  sku text not null,
  category text not null,
  supplier text,
  location text,
  unit text not null default '個',
  stock numeric not null default 0,
  ideal_weekday_stock numeric not null default 0,
  ideal_weekend_stock numeric not null default 0,
  reorder_point numeric not null default 0,
  unit_price numeric not null default 0,
  gram_price numeric not null default 0,
  note text,
  updated_at timestamptz not null default now()
);

alter table public.inventory_items
add column if not exists gram_price numeric not null default 0;

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  item_id text references public.inventory_items(id) on delete cascade,
  item_name text not null,
  movement_type text not null check (movement_type in ('receive', 'use')),
  quantity numeric not null check (quantity > 0),
  unit text not null,
  memo text,
  user_email text,
  created_at timestamptz not null default now()
);

create table if not exists public.menu_costings (
  id text primary key,
  name text not null,
  category text not null default 'FOOD',
  sale_price numeric not null default 0,
  yield_count numeric not null default 1,
  note text,
  ingredients jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.menu_costings
add column if not exists category text not null default 'FOOD';

alter table public.inventory_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.menu_costings enable row level security;

create policy "authenticated users can read inventory"
on public.inventory_items for select
to authenticated
using (true);

create policy "authenticated users can insert inventory"
on public.inventory_items for insert
to authenticated
with check (true);

create policy "authenticated users can update inventory"
on public.inventory_items for update
to authenticated
using (true)
with check (true);

create policy "authenticated users can delete inventory"
on public.inventory_items for delete
to authenticated
using (true);

create policy "authenticated users can read movements"
on public.inventory_movements for select
to authenticated
using (true);

create policy "authenticated users can insert movements"
on public.inventory_movements for insert
to authenticated
with check (true);

create policy "authenticated users can read menu costings"
on public.menu_costings for select
to authenticated
using (true);

create policy "authenticated users can insert menu costings"
on public.menu_costings for insert
to authenticated
with check (true);

create policy "authenticated users can update menu costings"
on public.menu_costings for update
to authenticated
using (true)
with check (true);

create policy "authenticated users can delete menu costings"
on public.menu_costings for delete
to authenticated
using (true);

create or replace function public.touch_inventory_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists inventory_items_touch_updated_at on public.inventory_items;
create trigger inventory_items_touch_updated_at
before update on public.inventory_items
for each row
execute function public.touch_inventory_updated_at();

create or replace function public.touch_menu_costings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists menu_costings_touch_updated_at on public.menu_costings;
create trigger menu_costings_touch_updated_at
before update on public.menu_costings
for each row
execute function public.touch_menu_costings_updated_at();
