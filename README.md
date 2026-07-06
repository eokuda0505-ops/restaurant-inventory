# 飲食店 在庫管理 GitHub Pages + Supabase版

## 構成

- GitHub Pages: 画面公開
- Supabase: ログイン、在庫データ保存、操作履歴保存

## Supabase設定

1. Supabaseで新しいProjectを作成
2. SQL Editorで `supabase-schema.sql` を実行
3. SQL Editorで `supabase-seed.sql` を実行
4. Authenticationでスタッフ用ユーザーを作成
5. Project Settings > API から `Project URL` と `anon public key` を確認
6. `supabase-config.js` の値を差し替え

```js
window.INVENTORY_SUPABASE = {
  url: "https://xxxx.supabase.co",
  anonKey: "public anon key"
};
```

## 初期データ投入

初期商品291件は `supabase-seed.sql` で投入できます。
CSVで入れる場合は、画面を開いてログイン後、CSV取込で商品データを入れられます。
CSV用の商品初期データは `seed-items.csv` にあります。

1. GitHub PagesのURLを開く
2. Supabase Authで作成したスタッフアカウントでログイン
3. 右上の取込ボタンから `seed-items.csv` を選ぶ
4. 291件の商品がSupabaseへ保存される

## GitHub Pages公開

このフォルダ内のファイルをGitHubリポジトリへ置き、GitHub Pagesを有効化します。

必要ファイル:

- `index.html`
- `styles.css`
- `app.js`
- `supabase-config.js`
- `supabase-schema.sql`
- `supabase-seed.sql`
- `seed-items.json`
- `seed-items.csv`

GitHubでの流れ:

1. 新しいリポジトリを作成
2. このフォルダ内のファイルをアップロード
3. Settings > Pages を開く
4. Branch を `main`、Folder を `/root` にして保存
5. 表示されたGitHub Pages URLをスタッフに共有

## iPhone/iPadでの利用

スタッフはSafariでGitHub PagesのURLを開きます。
共有ボタンから「ホーム画面に追加」をすると、アプリのように起動できます。

ログイン後は15秒ごとに最新データを取得します。
すぐ反映したい場合は右上の更新ボタンを押してください。

## 注意

GitHub Pagesだけでは在庫データを保存できません。
必ずSupabaseのURLとanon keyを `supabase-config.js` に設定してください。
更新
