# 検証記録 — 2026-09-21

## 成果物の状態

初版0.1.0。学習用記事30章、ホーム1ページ、原典の参照先33件です。本文Markdownの合計は42,068文字（コード・見出し・リンク表記を含む）です。GitHubリポジトリ作成・push・GitHub Pages公開は行っていません。

## 実際に実行して通った確認

**Node.js v22.16.0 / `npm test`：34件成功、失敗0件。** `test/`のNode標準テストです。質問構造、HTMLエスケープ、リクエスト生成、Scoreの計算、Noulの境界、HTTP成功・エラー・有限回再試行・不正応答、モック実習、全ページの内部リンクとフラグメント、JSONの構文を確認しました。HTTPテストは全て人工のfetch応答で、TypeSafeへ通信していません。

**`npm run build`：記事30ページとホームを生成。** 外部npm依存やAPIキーを使わず生成しました。

**`npm run example:mock`：成功。** `mock-teaching-fixture`という人工のモデル名、固定値、0トークンを表示します。モデルの推論や精度を検証したものではありません。

**ローカルHTTPサーバー：Nodeのfetchで確認。** ホーム、Score記事、検索データのHTTP 200とContent-Type、存在しないURLの404を確認しました。

**Chromiumの画面・操作確認：79項目成功。** Python Playwright 1.57.0を使い、1440×1080と390×844の画面で全30章の表示と横方向のはみ出しがないこと、検索と遷移、入力のエスケープ、3種類のデモ、確認問題の展開、テーマ切り替え、モバイルメニュー、コピーの代替操作を確認しました。JavaScript/CSPエラー0、外部HTTPリクエスト0でした。再実行コードは`test/browser-check.py`です。

**幅320pxの追加確認：5ページ成功。** ホーム、リクエスト作成、Score、モデル・料金、JavaScript SDKで横方向のはみ出しがないことを確認しました。

## ブラウザー検証の条件と限界

実行環境のChromiumでは、通常のlocalhost URLおよびfile URLへの直接移動が管理者ポリシーでブロックされました。そのため、実際に生成した単体プレビューHTMLをメモリー上へ読み込み、iframeのsrcdocに描画して確認しました。公開用と同じHTML・CSS・アプリケーションJavaScriptを同梱していますが、公開HTTPオリジンでの総合テストではありません。

このメモリー上のオリジンではlocalStorageが使えないため、読了記録の保存不可メッセージは確認できましたが、実オリジンでの永続保存は未検証です。通常のオリジンでlocalStorageを使用する実装はあります。コピーも、ブラウザー権限に応じた選択フォールバックを含む確認です。

画面キャプチャを目視で確認しました。全ブラウザーでの互換性、スクリーンリーダーの実機評価、GitHub Pagesのサブパス配下での実稼働は未検証です。内部参照にルート絶対パスがないことは自動テストで確認しています。

## 実行していないこと

実APIキーの設定、Jevの実リクエスト、公式SDKのインストール・型検査・実行、日本語の精度評価、料金と遅延の実測、業務データの送信、GitHub Actionsのリモート実行、GitHub Pagesへの公開は行っていません。

TypeSafeのモデル動作を再現・保証するテストではありません。記載した架空の確率、confidence、期待ラベル、しきい値、導入案に実証済みの効果はありません。

## 再実行方法

```bash
npm test
npm run build
npm run example:mock
node scripts/offline.mjs jev-guide-ja-preview.html
```

PythonのPlaywrightとChromiumを別途導入済みの環境では、追加の画面テストを実行できます。通常のビルドやGitHub ActionsにPythonやブラウザーは必要ありません。

```bash
python test/browser-check.py jev-guide-ja-preview.html \
  --browser /path/to/chromium \
  --output ./test-results
```
