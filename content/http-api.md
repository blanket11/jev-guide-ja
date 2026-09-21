:::brief HTTPでは、JSONを送り、JSONの返答を読む
- **認証：** キーをBearerトークンとしてヘッダーに渡します。
- **対応：** questionsのIDと、answersのIDがつながります。
- **練習：** モックの成功と、実APIでの成功は分けて確認します。
:::

:::cards 同じ練習でも、通信の有無は別
example:mock | 固定の人工データ。通信・課金なし
example:live | 実際のAPIへ送信。キーと料金の確認が必要
! モックは値の読み取りと分岐のテストです。日本語の分類精度は測れません。
:::

## HTTP APIは何をしているか
- SDKの内側では、HTTPでリクエストを送ります。
- Jevの評価エンドポイントは`POST https://api.typesafe.ai/v1/systemone`です。
- 認証にはBearerトークン、本文にはJSONを使います。 [公式：API reference](https://docs.typesafe.ai/api)

`POST`は、ここでは評価したいデータを本文に付けて送る方法です。APIキーは認証ヘッダーに入れ、URLのクエリに付けません。

## 最小のリクエスト
以下は独自の入力例です。環境変数`TYPESAFE_API_KEY`を設定したターミナルで実行します。APIを呼ぶため、利用権限と料金の確認が必要です。

```bash
curl --fail-with-body --max-time 15 \
  https://api.typesafe.ai/v1/systemone \
  -H "Authorization: Bearer $TYPESAFE_API_KEY" \
  -H "Content-Type: application/json" \
  --data-binary @- <<'JSON'
{
  "model": "jev-1.13.0",
  "state": "予定をCSVでまとめて取り込む機能がほしいです。",
  "questions": {
    "requests_feature": {
      "type": "noul",
      "instructions": "この文章は、新しい機能の追加を求めていますか？"
    }
  }
}
JSON
```

返答は`answers.requests_feature.noul`を確認します。`questions`の識別名と`answers`の識別名が対応していることが重要です。[公式：API reference](https://docs.typesafe.ai/api)

## 付属プロジェクトで、通信なしの練習
サイトのソース一式には、SDKに依存しないNode.jsの実習も付属しています。プロジェクトのルートで次のコマンドを実行します。

```bash
npm run example:mock
```

- このモードは、手作業で用意した固定のレスポンスを使います。
- ネットワーク通信も課金もありません。
- 表示されるモデル名は`mock-teaching-fixture`で、実際のモデル名とは区別しています。
- これはAPIの性能テストではなく、値の読み取りと分岐処理の練習です。

## 実際のAPIを呼ぶ場合
プロジェクトの`.env.example`を`.env`にコピーし、キーをローカルで設定します。その上で、次のコマンドを実行します。

```bash
cp .env.example .env
# .envをエディターで開き、TYPESAFE_API_KEYを設定する
npm run example:live
```

- `examples/triage.mjs`が入口、`examples/client.mjs`がHTTP処理です。
- 入力は固定の架空の問い合わせです。
- 最初に小さい例で動作を確認し、実際の顧客データをそのまま送らないでください。

## 検証の境界
- 付属クライアントは、成功・認証失敗・レート制限・不正な応答などをモックで検証します。
- 実APIでの疎通、費用、日本語の精度、SDKとの完全な同等性は、この版では検証していません。
- 学習用クライアントであり、本番用SDKの代替を保証するものではありません。

:::answer 確認問題：モックで正しいラベルが出たら、日本語の分類精度を確認できたことになりますか？
なりません。モックは用意した値を返すだけです。確認できるのは、その値を自分のコードがどう扱うかです。
:::
