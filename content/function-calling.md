## Function callingを、小さな例で考える
「予定を見たい」と入力されたら予定画面を表示する、という仕組みを考えます。Jevに好きなコードを書かせて実行するのではなく、アプリ側で用意した候補から、意図に近いものを選ばせます。公式にも、決められた関数や閉じた候補の引数を質問に対応付ける教材があります。[公式：Function calling cookbook](https://docs.typesafe.ai/cookbooks/function_calling)

## まずは読み取り専用の候補だけ
この教材の選択肢は、`show_schedule`、`show_help`、`unsupported`です。削除・購入・投稿などの操作は扱いません。分類が成功しても、勝手に自由な関数名を実行する構造にはしません。

```js
const handlers = {
  show_schedule: () => ({ screen: "schedule" }),
  show_help: () => ({ screen: "help" })
};

function planScreen(answer) {
  // 0.85は説明用の値。運用時は実測で決める。
  if (answer.confidence < 0.85) {
    return { screen: "confirm_intent" };
  }
  if (!Object.hasOwn(handlers, answer.choice)) {
    return { screen: "unsupported" };
  }
  return handlers[answer.choice]();
}
```

このコードは、表示先の情報を返すだけです。モデルの出力を`eval`に渡したり、任意のURLやシェルコマンドとして実行したりしません。

## 引数が必要な場合
「どの予定か」を選ぶには、認可済みの予定を先に絞り、そのIDを候補として渡す設計を考えます。モデルが選んだIDについても、サーバーで所有権や公開範囲を検証します。選択肢に含めたことだけで、以後の権限確認を省略しません。

対象が候補にない、必要な情報が足りない、2つの予定が似ている、といった場合の経路も必要です。「選択されたから正しい」と処理を進めないでください。

## 自由な抽出と混同しない
何でも好きな文字列を生成して引数として返す設計と、既知の候補から選ぶ設計は違います。公式は、自由な文章生成には別の生成モデルを使う考え方を示しています。[公式：Jev 1.13 jaggedness](https://docs.typesafe.ai/model-jaggedness/jev-1.13)

:::answer 確認問題：戻り値の文字列を、そのまま関数名として実行してよいですか？
許可済みの対応表を通し、必要な引数検証と認可を行います。存在する関数だから実行してよい、ということではありません。
:::
