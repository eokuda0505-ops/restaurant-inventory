# 公開前チェックリスト

## 1. Supabase

- [ ] Supabaseで新規Projectを作成
- [ ] SQL Editorで `supabase-schema.sql` を実行
- [ ] SQL Editorで `supabase-seed.sql` を実行
- [ ] Authentication > Users でスタッフ用ユーザーを作成
- [ ] Project Settings > API で `Project URL` を確認
- [ ] Project Settings > API で `anon public key` を確認
- [ ] `supabase-config.js` にURLとanon keyを入力

## 2. GitHub

- [ ] GitHubで新規リポジトリを作成
- [ ] `restaurant-inventory-pages` フォルダ内のファイルをアップロード
- [ ] Settings > Pages を開く
- [ ] Sourceを `Deploy from a branch` にする
- [ ] Branchを `main`、Folderを `/root` にする
- [ ] GitHub PagesのURLが発行されるまで待つ

## 3. 初回確認

- [ ] GitHub PagesのURLを開く
- [ ] スタッフ用メール/パスワードでログイン
- [ ] 登録品目が291件表示される
- [ ] iPhone/iPadで同じURLを開いてログインできる
- [ ] 仕入で在庫を増やせる
- [ ] 使用で在庫を減らせる
- [ ] 別端末で更新ボタンを押すと在庫数が反映される

## 4. スタッフ運用

- [ ] iPhone/iPadのSafariでURLを開く
- [ ] 共有ボタンから「ホーム画面に追加」
- [ ] スタッフにログイン情報を共有
- [ ] 在庫入力ルールを共有

## 5. 注意点

- `supabase-config.js` の anon key は公開されてもよい種類のキーです。
- SupabaseのRLS設定により、ログイン済みユーザーだけが在庫を読込/更新できます。
- スタッフを辞めた人がいる場合は、SupabaseのAuthenticationから該当ユーザーを削除してください。
