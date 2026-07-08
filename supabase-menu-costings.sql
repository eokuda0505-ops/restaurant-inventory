-- Supabase SQL Editorで実行してください。
-- 既存の在庫テーブルはそのまま、原価計算用の menu_costings テーブルだけを追加します。

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

update public.menu_costings
set category = 'DRINKU'
where category = 'FOOD'
  and (id like 'excel-alcohol-%' or note like '%アルコール%');

alter table public.menu_costings enable row level security;

drop policy if exists "authenticated users can read menu costings" on public.menu_costings;
create policy "authenticated users can read menu costings"
on public.menu_costings for select
to authenticated
using (true);

drop policy if exists "authenticated users can insert menu costings" on public.menu_costings;
create policy "authenticated users can insert menu costings"
on public.menu_costings for insert
to authenticated
with check (true);

drop policy if exists "authenticated users can update menu costings" on public.menu_costings;
create policy "authenticated users can update menu costings"
on public.menu_costings for update
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated users can delete menu costings" on public.menu_costings;
create policy "authenticated users can delete menu costings"
on public.menu_costings for delete
to authenticated
using (true);

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
