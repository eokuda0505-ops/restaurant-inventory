# 開発・公開依頼文

飲食店向けの在庫管理システムをGitHub Pagesで公開したいです。

## 前提

- スタッフは主にiPhone/iPadで入力します。
- PC、iPad、スマホから同じURLで利用します。
- どの端末で入力しても同じ在庫数に反映したいです。
- GitHub Pagesは画面公開用に使います。
- 在庫データはSupabaseに保存します。

## 必須機能

- メール/パスワードログイン
- 商品ごとの業者名、カテゴリ、単価、現在庫、適正在庫 平日/土日の管理
- 仕入で在庫を増やす
- 使用で在庫を減らす
- CSV出力/取込
- iPhone/iPadで操作しやすい画面
- 複数端末で最新在庫を確認できる更新機能

## 現在の構成

- `index.html`: 画面
- `styles.css`: デザイン
- `app.js`: Supabase連携と在庫操作
- `supabase-config.js`: Supabase URL/key設定
- `supabase-schema.sql`: Supabaseテーブル作成SQL
- `supabase-seed.sql`: 初期商品291件の投入SQL
- `seed-items.csv`: 初期商品291件のCSV

## 公開作業

1. SupabaseでProjectを作る
2. `supabase-schema.sql` を実行
3. `supabase-seed.sql` を実行
4. スタッフ用ログインユーザーを作る
5. `supabase-config.js` にSupabaseのProject URLとanon keyを入れる
6. GitHubへファイルをアップロード
7. GitHub Pagesを有効化
