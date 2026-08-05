-- 業者ごとの発注方法・締切・納品曜日などを保存するテーブルを追加します。
-- Supabase SQL Editorで一度だけ実行してください。

create table if not exists public.supplier_order_settings (
  supplier text primary key,
  method text not null default 'LINE',
  contact text,
  cutoff text,
  delivery_days text,
  minimum_order text,
  memo text,
  updated_at timestamptz not null default now()
);

alter table public.supplier_order_settings enable row level security;

drop policy if exists "authenticated users can read supplier order settings" on public.supplier_order_settings;
create policy "authenticated users can read supplier order settings"
on public.supplier_order_settings for select
to authenticated
using (true);

drop policy if exists "authenticated users can insert supplier order settings" on public.supplier_order_settings;
create policy "authenticated users can insert supplier order settings"
on public.supplier_order_settings for insert
to authenticated
with check (true);

drop policy if exists "authenticated users can update supplier order settings" on public.supplier_order_settings;
create policy "authenticated users can update supplier order settings"
on public.supplier_order_settings for update
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated users can delete supplier order settings" on public.supplier_order_settings;
create policy "authenticated users can delete supplier order settings"
on public.supplier_order_settings for delete
to authenticated
using (true);

create or replace function public.touch_supplier_order_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists supplier_order_settings_touch_updated_at on public.supplier_order_settings;
create trigger supplier_order_settings_touch_updated_at
before update on public.supplier_order_settings
for each row
execute function public.touch_supplier_order_settings_updated_at();
