:::brief SDKは、まずローカルの小さな実習で使う
- **準備：** サイト本体とは別のフォルダーに公式SDKを入れます。
- **秘密：** キーは.envに置き、Gitやブラウザーへ出しません。
- **確認：** ラベル・確率・回答したモデル名を読みます。
:::

:::flow 最初のAPI呼び出しまで
準備する | SDKを入れ、.envを用意
質問を書く | index.mjsに材料とChoiceを記述
実行して確認 | ローカルで返答を読む
! 本文のコードは公式仕様に基づく教材です。SDKの実行・実API接続は未検証です。
:::

## SDKは、APIを扱いやすくするライブラリ
- 公式JavaScript SDKのパッケージ名は`@typesafe-ai/sdk`です。
- JavaScriptとTypeScriptに対応し、公式の必要条件はNode.js 20以上です。
- このガイドの付属プロジェクトはNode.js 22以上で検証しています。 [公式：JavaScript SDK](https://docs.typesafe.ai/sdk/javascript)

ここでは、**公開するドキュメントサイトとは別の、ローカル実習用フォルダー**を使います。ブラウザー上でSDKを実行したり、配信するJavaScriptにキーを埋め込んだりしません。

## インストールする
```bash
mkdir jev-sdk-practice
cd jev-sdk-practice
npm init -y
npm install @typesafe-ai/sdk
```

- インストールされたバージョンはロックファイルに記録し、動作を確認した版を維持します。
- このガイドでは最新バージョン番号を推測して固定していません。
- SDKを実際にインストールした実習は、本版の検証範囲に含まれていません。

## キーは.envに置く
- `.env`というファイルを作り、次の変数を設定します。
- 実際のキーをコードやチャットに貼り付けないでください。
- `.env`は`.gitignore`に追加します。
- SDKは既定で`TYPESAFE_API_KEY`を参照します。 [公式：TypeSafeClientConfig](https://docs.typesafe.ai/sdk/javascript/api/interfaces/TypeSafeClientConfig)

```text
TYPESAFE_API_KEY=ここを自分のキーに置き換える
```

## index.mjsを作る
```js
import { TypeSafeClient, choice } from "@typesafe-ai/sdk";

if (!process.env.TYPESAFE_API_KEY) {
  throw new Error("TYPESAFE_API_KEYが設定されていません。");
}

const client = new TypeSafeClient();

try {
  const result = await client.systemOne({
    model: "jev-1.13.0",
    state: "予定をCSVでまとめて登録したいです。",
    questions: {
      category: choice("主な用件を1つ選んでください。", {
        bug: "試した操作が失敗するという報告",
        feature_request: "新しい機能の追加や改善の要望",
        how_to: "既存機能の使い方の質問",
        other: "上記以外、または判定に必要な情報が不足"
      })
    }
  });
  console.log(result.model);
  console.log(result.answers.category);
} catch (error) {
  // 実運用では入力本文やAPIキーをログに含めない。
  console.error("Jevへのリクエストに失敗しました。",
    error instanceof Error ? error.name : "UnknownError");
  process.exitCode = 1;
}
```

- `.mjs`はES Modulesとして実行するJavaScriptです。
- 上の構造はTypeScriptでも使え、SDKは質問定義から返答の型を推論します。
- 今回はまず動きの理解を優先し、TypeScriptのビルド環境は必須にしません。 [公式：JavaScript SDK](https://docs.typesafe.ai/sdk/javascript)

```bash
node --env-file=.env index.mjs
```

## どこを確認するか
- `result.answers.category.choice`が選択結果です。
- `result.model`は実際に回答したモデルを示します。
- 期待どおりのラベルかだけでなく、確率の分布も確認してください。
- `jev-latest`のような別名は参照先が変わり得るため、本例は確認時点の版を明示しています。 [公式：Models](https://docs.typesafe.ai/models)

:::warning このコードの検証状態
公式SDKの仕様に基づく独自例です。この環境ではSDKのインストールと実API実行はしていません。付属の依存なしHTTP実習は、次章のモックテストで別に検証しています。
:::

:::answer 確認問題：TypeScriptの型が合っていれば、分類内容も正しいと保証できますか？
できません。型は値の形式を扱います。文章の意味を正しく判定したかは、正解データとの比較で検証します。
:::
