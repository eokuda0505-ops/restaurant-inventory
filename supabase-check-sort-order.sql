-- 冷蔵庫チェック画面の手動並び替え用の列を追加します。
-- Supabase SQL Editorで一度だけ実行してください。

alter table public.inventory_items
add column if not exists check_sort_order numeric;

with ordered_items as (
  select
    id,
    row_number() over (
      partition by coalesce(location, '')
      order by coalesce(location, ''), name
    ) - 1 as next_order
  from public.inventory_items
)
update public.inventory_items as item
set check_sort_order = ordered_items.next_order
from ordered_items
where item.id = ordered_items.id
  and item.check_sort_order is null;
