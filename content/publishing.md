:::brief 教材サイトの公開と、Jevの導入は別の作業
- **公開するもの：** Markdownから生成した静的なサイトです。
- **公開元：** Settings → PagesのSourceをGitHub Actionsにします。
- **確認するもの：** デプロイの成功に加え、記事・検索・デモの表示を見ます。
:::

:::flow GitHub Pagesへ公開する流れ
手元で確認 | テスト → ビルド → プレビュー
GitHubに置く | ソースをmainへ。秘密情報は除外
Pagesで配信 | 公開元の設定 → デプロイ → 表示確認
! Pagesが未設定のままでは公開処理が進みません。設定後に既存ワークフローを実行します。
:::

## 公開対象は静的なサイトだけ
- 本プロジェクトは、記事をMarkdownで管理し、Node.jsの標準機能だけでHTMLを生成します。
- サイトのビルドに追加のnpmパッケージやAPIキーは必要ありません。
- GitHub Pagesで静的なファイルを配信する構成です。 [GitHub公式：What is GitHub Pages?](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)

このサイトを公開しても、Jevを本番サービスへ組み込んだことにはなりません。教材の公開と、実サービスのAPI実装は別の作業です。

## ローカルで確認する
ZIPを展開して、そのディレクトリーで実行します。Node.js 22以上を使います。

```bash
npm test
npm run build
npm run preview
```

- プレビューは`http://127.0.0.1:4173`で開きます。
- 外部パッケージがないため、このサイトの確認に`npm install`は必要ありません。
- 記事を変更した場合は、もう一度`npm run build`を実行します。

## 新しいリポジトリへ置く
既存サービスのリポジトリには混ぜず、たとえば`jev-guide-ja`という新しいリポジトリを用意します。これは名前の例であり、この教材の作成時点でリポジトリを作成済みとはしていません。

- `.github/workflows/pages.yml`を含むソース一式を`main`ブランチへ置きます。
- `.env`や秘密情報を追加しないでください。
- 公開される内容は、ソースと生成サイトの両方を確認します。

## PagesをGitHub Actionsに設定する
- GitHubのリポジトリ設定でPagesを開き、公開元としてGitHub Actionsを選択します。
- ワークフローは、テスト、ビルド、成果物のアップロード、デプロイを行います。
- 必要な`pages: write`と`id-token: write`はデプロイジョブに限定しています。 [GitHub公式：Using custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

- 最初のpush時点でPagesが未設定だった場合は、設定後にActionsの「Publish Japanese guide」を手動実行してください。
- 公開URLは、成功したデプロイの出力またはPages設定画面に表示されるものを確認します。
- 予想したURLを公開済みとして案内しないでください。

## リポジトリ名が変わっても動く構成
- このサイトのページやアセットのリンクは相対パスにしています。
- ルートドメインだけでなく、リポジトリ名を含むサブパス配下での公開を想定しています。
- 公開後はトップページだけでなく、記事への直接アクセス、検索、デモも確認してください。

## 更新時の作業
記事を変えたら、その記事の出典と確認日を更新します。ビルドした日付だけで「公式確認済み」の日付を進めないでください。自動デプロイは内容の正しさを審査しないため、仕様の見直しは別に必要です。

:::answer 確認問題：トップページが表示されれば、公開確認は終わりですか？
記事への直接アクセス、戻る・進む、スマートフォンのメニュー、検索、コードのコピー、外部通信や秘密情報の混入がないかも確認します。
:::
