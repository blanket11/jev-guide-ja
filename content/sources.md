:::brief 困ったときに、必要な一次情報へ戻る
- **基本：** Introduction・State・Primitivesで仕組みを確認します。
- **実装：** API referenceと、使うSDKの資料へ戻ります。
- **運用：** Models・既知の失敗条件・Legalも利用時に確認します。
:::

:::cards 確認したい内容から、資料を選ぶ
モデル・料金・上限 | Models
入出力と実装 | API reference / SDK
失敗条件・データ | Jaggedness / Legal
! 以下は参照先の案内です。公式ドキュメント全体を網羅した翻訳ではありません。
:::

## 一次情報に戻るための案内
このガイドで参照した公式資料をまとめています。

- これは公式ドキュメント全体の完全な翻訳や網羅的なSDKリファレンスではありません。
- 主要概念、API、JavaScript SDKの入口、代表的な応用、運用上の注意を対象としています。
- 確認日は2026年9月21日です。

## 最初に読む資料
- [Introduction](https://docs.typesafe.ai/introduction)
- [Quick start](https://docs.typesafe.ai/introduction/quickstart)
- [System One](https://docs.typesafe.ai/concepts/system-one)
- [State](https://docs.typesafe.ai/concepts/state)
- [Primitives](https://docs.typesafe.ai/primitives)

## 質問と結果の形
- [Choice](https://docs.typesafe.ai/primitives/choice)
- [Score](https://docs.typesafe.ai/primitives/score)
- [Noul](https://docs.typesafe.ai/primitives/noul)
- [Advanced: structure](https://docs.typesafe.ai/primitives/advanced)
- [Confidence](https://docs.typesafe.ai/confidence)
- [API reference](https://docs.typesafe.ai/api)

## 実装とモデル
- [JavaScript SDK](https://docs.typesafe.ai/sdk/javascript)
- [TypeSafeClient](https://docs.typesafe.ai/sdk/javascript/api/classes/TypeSafeClient)
- [TypeSafeClientConfig](https://docs.typesafe.ai/sdk/javascript/api/interfaces/TypeSafeClientConfig)
- [Models](https://docs.typesafe.ai/models)
- [Agent skill](https://docs.typesafe.ai/agent-skill)

## 設計と応用
- [How to build with TypeSafe](https://docs.typesafe.ai/concepts/how-to-build-with-system-one)
- [Patterns](https://docs.typesafe.ai/patterns)
- [Speculative fan-out](https://docs.typesafe.ai/patterns/fan-out)
- [Confidence-gated routing](https://docs.typesafe.ai/patterns/confidence-routing)
- [Composite scoring](https://docs.typesafe.ai/patterns/composite-scoring)
- [Intent routing](https://docs.typesafe.ai/patterns/intent-routing)
- [Re-ranking cookbook](https://docs.typesafe.ai/cookbooks/rerank_typesafe)
- [Line-by-line search](https://docs.typesafe.ai/cookbooks/semantic_find)
- [Function calling cookbook](https://docs.typesafe.ai/cookbooks/function_calling)

## 評価と注意点
- [Self-consistency: choices](https://docs.typesafe.ai/cookbooks/consistency_choice_cookbook)
- [Self-consistency: nouls](https://docs.typesafe.ai/cookbooks/consistency_noul_cookbook)
- [Parallel questions cookbook](https://docs.typesafe.ai/cookbooks/parallel_questions)
- [Jev 1.13 jaggedness](https://docs.typesafe.ai/model-jaggedness/jev-1.13)
- [Legal](https://docs.typesafe.ai/legal)

## サイト公開
- [What is GitHub Pages?](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

## 網羅していない範囲
Python SDKの全クラス、JavaScript SDKの全型、公式Cookbookの全件、学習アルゴリズムの数理的な詳細は、本版では網羅していません。公式の索引から追加の資料を確認してください。

[公式ドキュメント索引](https://docs.typesafe.ai/llms.txt)

## 今後の確認時に見る場所
- 料金・モデルの別名・制限はModels、リクエストとレスポンスの形はAPI reference、SDKの呼び出し方はSDKの該当する版、既知の失敗条件はJaggednessを確認します。
- 本ガイドのコードが動くことだけを、全ての仕様が最新である証拠にはしません。

## 数値を使うときの原則
公式の実験結果を別のデータや日本語のサービスへそのまま当てはめないこと、独自に作った確率やしきい値を実測と呼ばないこと、結果と一緒に検証条件を残すことを編集方針にしています。
