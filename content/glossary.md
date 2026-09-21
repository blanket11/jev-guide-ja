## JevとTypeSafe AI
Jevはモデル名、TypeSafe AIは提供元です。System Oneは、公式がJevのようなモデルを説明するために用いている位置付けです。[公式：System One](https://docs.typesafe.ai/concepts/system-one)

## APIとSDK
APIは、プログラムからサービスの機能を使うための入口です。SDKは、その入口を扱いやすくするライブラリです。JevはHTTPで直接呼ぶ方法と、公式SDKを使う方法があります。[公式：JavaScript SDK](https://docs.typesafe.ai/sdk/javascript)

## State
今回の判断の材料です。問い合わせの文章だけでも、関連情報をまとめたオブジェクトでも構いません。Reactの`useState`などの状態管理機能そのものを指すのではありません。[公式：State](https://docs.typesafe.ai/concepts/state)

## Questions・instructions・criteria
`questions`は質問の集合です。`instructions`は聞きたいこと、`criteria`は選択肢や判断基準です。IDは結果との対応を付ける名前で、質問の意味を代わりに伝えるものではありません。[公式：API reference](https://docs.typesafe.ai/api)

## Choice・Score・Noul
Choiceは選択肢から1つを選びます。Scoreは順序のある段階で評価します。Noulは、はいの確率を返します。3つは「全部同じ数値を返す機能」ではありません。[公式：Primitives](https://docs.typesafe.ai/primitives)

## Probabilities・confidence
`probabilities`は、候補または段階に配分された確率です。`confidence`は、ChoiceやScoreの分布から求められる要約値です。Noulには別のconfidenceはありません。[公式：Confidence](https://docs.typesafe.ai/confidence)

## しきい値・較正
しきい値は、値がある境界を超えたら処理を変えるための基準です。較正は、多くの予測を見たとき、示された確率と実際の結果がどの程度対応するかという考え方です。個別の判断の正解保証とは区別します。[公式：System One](https://docs.typesafe.ai/concepts/system-one)

## フォールバック・モック・回帰テスト
フォールバックは、失敗時に別の処理へ戻すことです。モックは、本物の外部サービスの代わりに、用意した値を返す仕組みです。回帰テストは、変更後に以前できていたことが壊れていないかを確認するテストです。本ガイドでは、API通信のモックテストと、モデルの精度評価を明確に分けています。

## トークン・レート制限
トークンは、モデルへの入力や出力を扱う単位です。日本語の1文字と常に一致するわけではありません。レート制限は、一定時間に処理できるリクエスト数やトークン数の制約です。金額の上限とは別に確認します。

## 非公式ガイド
このサイトはTypeSafe AIが発行した公式資料ではなく、独自に構成した日本語の学習教材です。原文の代替や公式の保証として使わず、仕様や契約の最終確認は公式資料で行います。
