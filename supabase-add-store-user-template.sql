-- 既存店舗へスタッフを追加するテンプレートです。
-- 先に Authentication > Users で対象ユーザーを作成してください。
-- メール、店舗名、権限を書き換えてから実行します。

insert into public.store_members (store_id, user_id, role)
select
  s.id,
  u.id,
  'staff' -- 管理者にする場合は admin に変更
from public.stores s
cross join auth.users u
where s.name = '店舗名を入力'
  and u.email = 'staff@example.com'
on conflict (store_id, user_id)
do update set role = excluded.role;
