-- 商品マスターに g単価 を追加・修復します。
-- 古い画面キャッシュから空欄が送られても保存エラーにならないようにします。
-- Supabase SQL Editorで一度だけ実行してください。

alter table public.inventory_items
add column if not exists gram_price numeric;

alter table public.inventory_items
alter column gram_price set default 0;

update public.inventory_items
set gram_price = 0
where gram_price is null;

update public.inventory_items
set gram_price = substring(note from 'g単価[:：]\s*([0-9]+(?:\.[0-9]+)?)')::numeric
where gram_price = 0
  and note ~ 'g単価[:：]\s*[0-9]+';

alter table public.inventory_items
alter column gram_price drop not null;
