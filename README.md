# Jev 日本語ガイド（非公式）

Jevを初めて学ぶ人に向けた、日本語の独立した学習サイトです。TypeSafe AIおよびJevとは無関係・非公認です。公式ドキュメントの全文翻訳ではなく、公式情報を基に学習順を組み直した独自の説明、教材、コード例を収録しています。

**公開リポジトリ： https://github.com/blanket11/jev-guide-ja**

GitHub Pagesの公開用ワークフローを同梱しています。初回は [Settings → Pages](https://github.com/blanket11/jev-guide-ja/settings/pages) のSourceを **GitHub Actions** に設定し、[Publish Japanese guide](https://github.com/blanket11/jev-guide-ja/actions/workflows/pages.yml) を手動実行してください。公開の成功とURLはワークフローの実行結果で確認します。

公式情報の確認日：2026年9月21日。参照元は `content/sources.json` と各記事に記載しています。主な原典は https://docs.typesafe.ai/ です。

## 内容

入門から基本概念、実装、応用、運用・品質、実践・資料まで全30章です。State、Choice、Score、Noul、confidence、質問設計、JavaScript / TypeScript SDK、HTTP API、Webサービスへの組み込み、再試行、並列質問、ルーティング、複合評価、検索の並べ替え、評価データ、料金、安全性を扱います。Kokoiku・HAZUMI・yuuadbに触れるページは未実装の設計例として明記しています。

全記事に目的・出典・確認日を配置しています。日本語全文検索、ライト／ダークモード、読了記録、コードコピー、スマートフォン用メニューがあります。3種類の対話的教材は「リクエストの組み立て」「Scoreの計算」「Noulのしきい値」であり、モデル推論は実行しません。

公開サイトはHTML / CSS / JavaScriptだけで動き、APIキー、アクセス解析、外部フォント、外部API通信を必要としません。記事の検索データも同梱しています。読了記録とテーマは、ブラウザーが許可する場合にlocalStorageへ保存します。保存が制限された環境でも記事の閲覧はできます。

## ローカルで起動

Node.js 22以上を使用します。ビルドに外部npmパッケージはなく、`npm install`は不要です。

```bash
npm test
npm run build
npm run preview
```

表示先は http://127.0.0.1:4173 です。`npm run dev`はビルドしてからプレビューを起動しますが、ファイル変更の自動監視はしません。変更後は再ビルドしてください。

## 全章を1ファイルでプレビュー

配布した `jev-guide-ja-preview.html` は、追加のサーバーなしでブラウザーから開けるプレビューです。外部サービスへのAPI通信はありません。公式資料へのリンクだけは外部サイトを開きます。ブラウザーの制限により、コピーや読了記録が利用できない場合はメッセージを出します。

ソースから作り直す場合は次のとおりです。この単体ファイルは確認用で、GitHub Pagesには通常の`dist/`を配信します。

```bash
npm run build
node scripts/offline.mjs jev-guide-ja-preview.html
```

## GitHub Pagesへ公開

既存サービスのリポジトリを変更しないため、例として`jev-guide-ja`という新しいリポジトリを用意します。GitHub側の権限・プラン・組織設定でPagesが利用できることを確認してください。GitHub公式の説明：https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages

展開したフォルダーをリポジトリのルートにします。`content/`や`package.json`が直下にある状態です。`.github/`を含むソース一式を`main`へpushします。`.env`、実際のAPIキー、既存サービスのデータは追加しません。

GitとGitHub CLIをセットアップ済みで、新しい公開リポジトリを作る場合のコマンド例です。実行するとGitHubに公開されます。既存の同名リポジトリがある場合は、このコマンドで上書きを試みないでください。

```bash
git init -b main
git add .
git status  # 秘密情報が含まれていないことを確認
git commit -m "Add unofficial Japanese Jev learning guide"
gh repo create jev-guide-ja --public --source=. --remote=origin --push
```

GitHubでリポジトリの **Settings → Pages → Build and deployment → Source** を **GitHub Actions** に変更します。その後、**Actions → Publish Japanese guide → Run workflow** を実行してください。初回push時点でPagesが未設定だった場合も、設定後に手動実行します。

ワークフローはテスト、HTML生成、成果物アップロード、Pagesデプロイを行います。成功後に表示される実際のURLを確認します。公開前に想定URLを公開済みとして案内しないでください。

公開後はホームだけでなく、記事URLの直接表示、相対リンク、検索、スマートフォンのメニュー、読了記録を確認してください。相対パスを採用しているため、リポジトリ名付きのサブパス配下で動く構成です。実環境での公開テストは未実施です。

GitHub公式のワークフロー仕様：https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

## 付属のHTTP実習

通信しないモック実習は次のコマンドで動きます。固定値を読み取って分岐するだけなので、Jevの性能や日本語の精度を検証したことにはなりません。

```bash
npm run example:mock
```

実APIを利用する場合は、利用権限・料金・送信するデータを確認してから、ローカルにキーを設定します。実行すると外部通信と入力トークンの課金が発生し得ます。作成環境では実行していません。

```bash
cp .env.example .env
# .envを編集してTYPESAFE_API_KEYを設定
npm run example:live
```

`examples/client.mjs`は公式SDKではなく、教材用の小さいHTTPクライアントです。429と529だけを有限回再試行し、Retry-Afterが30秒を超える場合は早く再送せず呼び出し元に失敗を返します。ネットワークエラーや401・422は自動再送しません。入力や提供元のエラー本文をそのままログに出さない構成です。API仕様への完全な追従、本番運用適性、実APIとの互換性を保証しません。

公式SDKを使う実習はサイトの12章にあります。SDKは別フォルダーへインストールする想定で、本サイトの依存には含めていません。

## 編集するファイル

本文は`content/*.md`、章順・見出し・説明・参照キーは`content/manifest.json`、原典は`content/sources.json`です。`assets/`に見た目と操作処理、`scripts/`に生成処理、`examples/`に実習、`test/`にテスト、`.github/workflows/pages.yml`に公開設定があります。

`dist/`は自動生成されるため直接編集しません。生成するMarkdownはこのリポジトリ専用の小さな構文です。段落、見出し（H2〜H4）、強調、インラインコード、リンク、コードブロック、表、`:::note` / `:::tip` / `:::warning` / `:::answer`、指定のデモをサポートします。任意のMarkdown拡張や、生のHTML・画像埋め込みには対応していません。未信頼のユーザー投稿を変換する用途では使わないでください。

公式仕様を更新した場合は、本文・実習・テスト・デモをまとめて確認します。日付は実際に原典を再確認した場合だけ更新します。ビルドした日を自動で公式確認日にしません。

## 検証状態・権利

実際の実行結果と未検証項目は`VALIDATION.md`を参照してください。各名称と公式ドキュメントの権利は、それぞれの権利者に帰属します。この成果物は公式本文・図版・ロゴの全文転載や複製を目的としません。独自コードと独自本文の配布ライセンスは、公開管理者が決定してください。第三者の素材を追加する際は別途取り扱いを確認します。
