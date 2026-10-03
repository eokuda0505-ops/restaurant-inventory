-- 新しい会社・店舗を追加する時のテンプレートです。
-- 先に Authentication > Users で管理者ユーザーを作成してください。
-- 下の3か所を書き換えてからSupabase SQL Editorで実行します。

do $$
declare
  new_organization_id uuid;
  new_store_id uuid;
  admin_user_id uuid;
begin
  select id into admin_user_id
  from auth.users
  where email = 'admin@example.com'; -- 管理者メールに変更

  if admin_user_id is null then
    raise exception '指定したメールのユーザーがAuthenticationに見つかりません';
  end if;

  insert into public.organizations (name)
  values ('会社名を入力') -- 会社名に変更
  returning id into new_organization_id;

  insert into public.stores (organization_id, name)
  values (new_organization_id, '店舗名を入力') -- 店舗名に変更
  returning id into new_store_id;

  insert into public.store_members (store_id, user_id, role)
  values (new_store_id, admin_user_id, 'admin');

  insert into public.store_settings (store_id, app_name, business_name, manager_email)
  values (new_store_id, '在庫管理', '店舗名を入力', 'admin@example.com');
end $$;
