-- 商品マスターに g単価 を追加します。
-- Supabase SQL Editorで一度だけ実行してください。

alter table public.inventory_items
add column if not exists gram_price numeric not null default 0;

update public.inventory_items
set gram_price = substring(note from 'g単価[:：]\s*([0-9]+(?:\.[0-9]+)?)')::numeric
where gram_price = 0
  and note ~ 'g単価[:：]\s*[0-9]+';
