/** 独自の教材用データ。実ユーザーの問い合わせは含みません。 */
export function makeTriageRequest(model = 'jev-1.13.0') {
  return {
    model,
    state: '予定を保存するとエラーが出て、登録できません。',
    questions: {
      category: {
        type: 'choice',
        instructions: 'この問い合わせの主な用件を1つ選んでください。',
        criteria: {
          bug: 'エラーや期待どおりに動かないという報告',
          feature_request: '現在はない機能の追加や改善の要望',
          how_to: '操作方法や設定方法についての質問',
          other: '用件は分かるが、上のどの分類にも該当しない内容',
          unclear: '主な用件を判断するための情報が足りない内容',
        },
      },
    },
  };
}
