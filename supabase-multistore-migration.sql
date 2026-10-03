-- 汎用・複数店舗版への移行SQL
-- 既存データは THE PORT / THE PORT 店舗 に引き継がれます。
-- Supabase SQL Editorで一度だけ、全体を実行してください。

create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.store_members (
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'staff' check (role in ('admin', 'staff')),
  created_at timestamptz not null default now(),
  primary key (store_id, user_id)
);

create table if not exists public.store_settings (
  store_id uuid primary key references public.stores(id) on delete cascade,
  app_name text not null default '店舗在庫管理',
  business_name text not null default '店舗名',
  logo_url text,
  manager_email text,
  categories jsonb not null default '["野菜","果物","肉類","魚類","冷凍物","乾物","資材","乳製品、チーズ","酒類","仕込み品"]'::jsonb,
  storage_locations jsonb not null default '["冷蔵庫１","冷蔵庫２","冷蔵庫３","冷蔵庫４","冷凍庫１","冷凍庫２","冷凍庫３","冷凍庫４","冷凍庫５","冷凍庫６","ワイン冷蔵","ドリンク冷蔵"]'::jsonb,
  units jsonb not null default '["個","玉","本","pac","缶","ケース","食分","g","kg","ml","L"]'::jsonb,
  updated_at timestamptz not null default now()
);

do $$
declare
  default_organization_id uuid;
  default_store_id uuid;
begin
  select id into default_organization_id
  from public.organizations
  order by created_at
  limit 1;

  if default_organization_id is null then
    insert into public.organizations (name)
    values ('THE PORT')
    returning id into default_organization_id;
  end if;

  select id into default_store_id
  from public.stores
  where organization_id = default_organization_id
  order by created_at
  limit 1;

  if default_store_id is null then
    insert into public.stores (organization_id, name)
    values (default_organization_id, 'THE PORT 店舗')
    returning id into default_store_id;
  end if;

  insert into public.store_settings (store_id, app_name, business_name, manager_email)
  values (default_store_id, '在庫管理', 'THE PORT', 'okuda@anothertable.co.jp')
  on conflict (store_id) do nothing;

  insert into public.store_members (store_id, user_id, role)
  select default_store_id, id,
    case when email = 'okuda@anothertable.co.jp' then 'admin' else 'staff' end
  from auth.users
  on conflict (store_id, user_id) do nothing;

  alter table public.inventory_items add column if not exists store_id uuid references public.stores(id);
  alter table public.inventory_movements add column if not exists store_id uuid references public.stores(id);
  alter table public.menu_costings add column if not exists store_id uuid references public.stores(id);
  alter table public.supplier_order_settings add column if not exists store_id uuid references public.stores(id);

  update public.inventory_items set store_id = default_store_id where store_id is null;
  update public.inventory_movements set store_id = default_store_id where store_id is null;
  update public.menu_costings set store_id = default_store_id where store_id is null;
  update public.supplier_order_settings set store_id = default_store_id where store_id is null;
end $$;

alter table public.inventory_items alter column store_id set not null;
alter table public.inventory_movements alter column store_id set not null;
alter table public.menu_costings alter column store_id set not null;
alter table public.supplier_order_settings alter column store_id set not null;

-- 同じ業者名を別店舗でも登録できるようにします。
alter table public.supplier_order_settings drop constraint if exists supplier_order_settings_pkey;
create unique index if not exists supplier_order_settings_store_supplier_key
on public.supplier_order_settings (store_id, supplier);

create index if not exists inventory_items_store_id_idx on public.inventory_items(store_id);
create index if not exists inventory_movements_store_id_idx on public.inventory_movements(store_id);
create index if not exists menu_costings_store_id_idx on public.menu_costings(store_id);

create or replace function public.is_store_member(target_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.store_members
    where store_id = target_store_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_store_admin(target_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.store_members
    where store_id = target_store_id and user_id = auth.uid() and role = 'admin'
  );
$$;

alter table public.organizations enable row level security;
alter table public.stores enable row level security;
alter table public.store_members enable row level security;
alter table public.store_settings enable row level security;

drop policy if exists "members can read organizations" on public.organizations;
create policy "members can read organizations" on public.organizations for select to authenticated
using (exists (
  select 1 from public.stores s
  where s.organization_id = organizations.id and public.is_store_member(s.id)
));

drop policy if exists "members can read stores" on public.stores;
create policy "members can read stores" on public.stores for select to authenticated
using (public.is_store_member(id));

drop policy if exists "admins can update stores" on public.stores;
create policy "admins can update stores" on public.stores for update to authenticated
using (public.is_store_admin(id)) with check (public.is_store_admin(id));

drop policy if exists "users can read own memberships" on public.store_members;
create policy "users can read own memberships" on public.store_members for select to authenticated
using (user_id = auth.uid());

drop policy if exists "members can read store settings" on public.store_settings;
create policy "members can read store settings" on public.store_settings for select to authenticated
using (public.is_store_member(store_id));

drop policy if exists "admins can update store settings" on public.store_settings;
create policy "admins can update store settings" on public.store_settings for update to authenticated
using (public.is_store_admin(store_id)) with check (public.is_store_admin(store_id));

drop policy if exists "authenticated users can read inventory" on public.inventory_items;
drop policy if exists "authenticated users can insert inventory" on public.inventory_items;
drop policy if exists "authenticated users can update inventory" on public.inventory_items;
drop policy if exists "authenticated users can delete inventory" on public.inventory_items;
drop policy if exists "store members can read inventory" on public.inventory_items;
drop policy if exists "store members can insert inventory" on public.inventory_items;
drop policy if exists "store members can update inventory" on public.inventory_items;
drop policy if exists "store admins can delete inventory" on public.inventory_items;
create policy "store members can read inventory" on public.inventory_items for select to authenticated using (public.is_store_member(store_id));
create policy "store members can insert inventory" on public.inventory_items for insert to authenticated with check (public.is_store_member(store_id));
create policy "store members can update inventory" on public.inventory_items for update to authenticated using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));
create policy "store admins can delete inventory" on public.inventory_items for delete to authenticated using (public.is_store_admin(store_id));

drop policy if exists "authenticated users can read movements" on public.inventory_movements;
drop policy if exists "authenticated users can insert movements" on public.inventory_movements;
drop policy if exists "store members can read movements" on public.inventory_movements;
drop policy if exists "store members can insert movements" on public.inventory_movements;
create policy "store members can read movements" on public.inventory_movements for select to authenticated using (public.is_store_member(store_id));
create policy "store members can insert movements" on public.inventory_movements for insert to authenticated with check (public.is_store_member(store_id));

drop policy if exists "authenticated users can read menu costings" on public.menu_costings;
drop policy if exists "authenticated users can insert menu costings" on public.menu_costings;
drop policy if exists "authenticated users can update menu costings" on public.menu_costings;
drop policy if exists "authenticated users can delete menu costings" on public.menu_costings;
drop policy if exists "store members can read menu costings" on public.menu_costings;
drop policy if exists "store members can insert menu costings" on public.menu_costings;
drop policy if exists "store members can update menu costings" on public.menu_costings;
drop policy if exists "store admins can delete menu costings" on public.menu_costings;
create policy "store members can read menu costings" on public.menu_costings for select to authenticated using (public.is_store_member(store_id));
create policy "store members can insert menu costings" on public.menu_costings for insert to authenticated with check (public.is_store_member(store_id));
create policy "store members can update menu costings" on public.menu_costings for update to authenticated using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));
create policy "store admins can delete menu costings" on public.menu_costings for delete to authenticated using (public.is_store_admin(store_id));

drop policy if exists "authenticated users can read supplier order settings" on public.supplier_order_settings;
drop policy if exists "authenticated users can insert supplier order settings" on public.supplier_order_settings;
drop policy if exists "authenticated users can update supplier order settings" on public.supplier_order_settings;
drop policy if exists "authenticated users can delete supplier order settings" on public.supplier_order_settings;
drop policy if exists "store members can read supplier settings" on public.supplier_order_settings;
drop policy if exists "store admins can insert supplier settings" on public.supplier_order_settings;
drop policy if exists "store admins can update supplier settings" on public.supplier_order_settings;
drop policy if exists "store admins can delete supplier settings" on public.supplier_order_settings;
create policy "store members can read supplier settings" on public.supplier_order_settings for select to authenticated using (public.is_store_member(store_id));
create policy "store admins can insert supplier settings" on public.supplier_order_settings for insert to authenticated with check (public.is_store_admin(store_id));
create policy "store admins can update supplier settings" on public.supplier_order_settings for update to authenticated using (public.is_store_admin(store_id)) with check (public.is_store_admin(store_id));
create policy "store admins can delete supplier settings" on public.supplier_order_settings for delete to authenticated using (public.is_store_admin(store_id));

create or replace function public.touch_store_settings_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists store_settings_touch_updated_at on public.store_settings;
create trigger store_settings_touch_updated_at before update on public.store_settings
for each row execute function public.touch_store_settings_updated_at();
