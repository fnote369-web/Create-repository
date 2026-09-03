# Future Letter 30days

1年後の私から、毎朝届く手紙。React（Vite）製のフロントエンドと、Google Apps Script + Googleスプレッドシートの
バックエンドで構成された、30日間のレター配信サービスです。

以前このリポジトリにあった「インナーチャイルドカード」アプリは `legacy/inner-child-card/` に移動して残してあります。

## クイックスタート（ローカルモード・Google設定不要）

```bash
npm install
npm run dev
```

`VITE_API_BASE_URL` を設定しない状態では、データはすべてこのブラウザの localStorage に保存される
**ローカルモード**で動作します。Googleアカウントなしで、登録〜手紙閲覧〜マイページ〜管理者画面〜テストモードまで、
すべての機能をその場で試せます。

- 管理者ログインのパスワード（ローカルモード既定値）: `future-letter-admin`
  （`.env` に `VITE_LOCAL_ADMIN_PASSWORD=...` を設定すると変更できます）

本番用に Google Apps Script バックエンドへ接続する方法は [`gas-backend/README.md`](./gas-backend/README.md) を参照してください。

## 構成

```
src/
  lib/            データ層・ビジネスロジック（api.js が local/GAS を自動切替）
    letters.js      テンプレート版30通の手紙生成
    localBackend.js ローカルモード（localStorage）バックエンド
    gasBackend.js    Google Apps Script バックエンドへのHTTPクライアント
  context/        SessionContext（利用者セッション）/ AdminContext（管理者セッション）
  components/     共通UIパーツ
  pages/          画面（トップ、オンボーディング、マイページ、手紙閲覧、設定、管理者、テストモード等）
gas-backend/      Google Apps Script側のコード一式（.gs）とセットアップ手順
legacy/           以前のアプリ（インナーチャイルドカード）
```

## 作成・変更したファイル

- 新規: `src/` 以下すべて（React + Viteアプリ一式）
- 新規: `gas-backend/` 以下すべて（GASバックエンド一式）
- 新規: `.env.example`
- 変更: `index.html`, `vite.config.js`, `package.json`, `.gitignore`
- 変更: `.github/workflows/deploy-pages.yml`（Viteビルドを行うように更新）
- 移動: 旧トップレベルの `index.html/app.js/cards.js/style.css/README.md` → `legacy/inner-child-card/`

## 完成した機能

- トップページ（サービス紹介・「はじめる」「続きから/ログイン」・レスポンシブ対応）
- オンボーディングウィザード（1問ずつ／数問ずつ、下書き自動保存、雰囲気選択、同意チェック、二重送信防止）
- 30通の手紙（Day1〜30、7段階のテーマ構成、回答内容を反映したテンプレート生成、雰囲気による文体の変化）
- マイページ（進捗・読了数・次回配信予定・Day一覧・既読/未読表示）
- 手紙閲覧画面（本文・今日の問いかけ・今日の一歩・メモ欄・「読みました」）
- 設定画面（配信の一時停止/再開、メールアドレス変更、最初からやり直す、登録情報の削除）
- マジックリンクログイン（メールアドレスにログインリンクを送信する方式。ローカルモードではリンクをその場で表示）
- 管理者画面（統計、利用者一覧・検索、利用者ごとの詳細、配信停止/再開、テスト送信、手動送信、CSV出力、管理者パスワード認証）
- テストモード（Day指定表示、配信日を1日進める、メール本文プレビュー、スマホ幅プレビュー、利用者リセット）
- プライバシーポリシー・利用規約ページと、登録画面の同意チェック
- Google Apps Scriptバックエンド一式（利用者API、管理者API、メール配信、AI生成＋自動フォールバック、二重送信防止）
- アクセシビリティ配慮（大きめのタップ領域、十分なコントラスト、日本語エラーメッセージ、状態表示バナー）

## まだ外部設定が必要な部分

このセッションではGoogleアカウントへのアクセスができないため、以下は**コードとしては完成していますが、
実際の動作にはお客様ご自身でのGoogle側の設定が必要**です。

1. Google Apps Scriptプロジェクトの作成とコードの貼り付け（`gas-backend/README.md` の手順1）
2. スクリプトプロパティの設定（`ADMIN_PASSWORD` を必ず変更、`SITE_URL`、AIモードを使うなら `AI_API_KEY` 等）
3. ウェブアプリとしてのデプロイ、発行されたURLを `VITE_API_BASE_URL` としてビルド時に設定
4. 実際のメール送信テスト（GmailAppの送信クォータ内で動作確認）

## 私がGoogle側で行う操作

`gas-backend/README.md` に詳細手順がありますが、要点は次の4つです。

1. script.google.com で新規プロジェクトを作成し、`gas-backend/*.gs` と `appsscript.json` の内容を貼り付ける
2. エディタで `setupAll` 関数を実行する（スプレッドシート作成・シート初期化・配信トリガー設置を自動で行います）
3. 「スクリプト プロパティ」で `ADMIN_PASSWORD` と `SITE_URL` を実際の値に変更する
4. 「デプロイ」→「新しいデプロイ」→「ウェブアプリ」で公開し、発行されたURLをフロントエンドの環境変数に設定する

## テスト方法

### ローカルモードでの機能確認（Google不要）

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:5173` を開き、「はじめる」から一通り登録〜マイページ〜手紙閲覧を試せます。
`http://localhost:5173/#/admin/login` から管理者画面（既定パスワード `future-letter-admin`）に入り、
「テストモード」から配信日を進めたり、特定のDayを表示したりできます。

### 本番ビルドの確認

```bash
npm run build
npm run preview
```

### GASバックエンド接続後の確認

`.env` に `VITE_API_BASE_URL` を設定して `npm run build` すると、実際のGoogleスプレッドシート／Gmail送信を
使う本番相当の動作を確認できます。GAS側のテストモード関数（管理者画面の「テストモード」）は本番と同じAPIを
使うため、配信時刻を待たずにテスト送信ができます。

## 公開方法

1. このリポジトリをGitHubにプッシュします。
2. GAS側のデプロイURLを、リポジトリの Settings → Secrets and variables → Actions → Variables に
   `VITE_API_BASE_URL` として登録します（未設定でもローカルモードとしてビルド・公開は可能です）。
3. `.github/workflows/deploy-pages.yml` が対象ブランチへのpushで自動的に `npm run build` を実行し、
   GitHub Pagesへ公開します（リポジトリの Settings → Pages で「GitHub Actions」を選択しておいてください）。
4. 独自ドメインを使う場合は、GitHub Pagesのカスタムドメイン設定、またはCloudflare Pages/Xserver等へ
   `dist/` フォルダの内容をアップロードしてください（`vite.config.js` の `base: './'` によりどのパスに
   置いても動作します）。

## 費用が発生する部分

- **GitHub Pages / フロントエンド**：無料です。
- **Google Apps Script / スプレッドシート**：個人のGoogleアカウントの無料枠内で利用できます
  （Gmail送信は1日あたり約100通が上限。利用者数が増えてきた場合はGoogle Workspaceへの移行をご検討ください）。
- **AIモード（任意）**：Claude APIまたはOpenAI APIのAPIキーを設定した場合のみ、利用した分だけ費用が発生します。
  未設定の場合は自動的に無料のテンプレートモードにフォールバックするため、費用は一切発生しません。

## セキュリティ上の注意点

- メールアドレスはURLに直接含めません。ログイン・手紙閲覧リンクはランダムな長いトークンを使用しています。
- 管理者画面はパスワード認証が必須で、URLを知っているだけでは入れません（管理者トークンは6時間で自動失効）。
- 管理者パスワード（`ADMIN_PASSWORD`）は必ず初期値から変更してください。
- AI APIキーはコードやフロントエンドに含めず、GAS側のスクリプトプロパティでのみ管理してください。
- スプレッドシートには個人情報（氏名・メールアドレス・回答内容）が含まれるため、共有設定を「自分のみ」のまま保つことを強く推奨します。
- 利用者は設定画面からいつでも配信停止・登録情報の削除ができます。
- 本サービスは自己成長のための体験ツールであり、専門的なカウンセリングや医療行為の代替ではない旨を、
  トップページ・利用規約に明記しています。
