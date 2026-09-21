/** Pure teaching functions; no API calls and no model emulation. */
(function (root) {
  'use strict';
  const definitions = {
    choice: { type: 'choice', instructions: 'この問い合わせの主な用件を1つ選んでください。', criteria: {
      bug: 'エラーや期待どおりに動かないという報告',
      feature_request: '現在はない機能の追加や改善の要望',
      how_to: '操作方法や設定方法の質問',
      other: '用件は分かるが、どの分類にも該当しない',
      unclear: '主な用件を判断するための情報が足りない'
    } },
    score: { type: 'score', instructions: '文章に表れている不満の強さを評価してください。問題の技術的な重大さとは区別してください。', criteria: ['不満の表明がなく、落ち着いた説明', '不便さや不満を表しているが、穏やかな表現', '強い怒りや繰り返しの不満を明確に表している'] },
    noul: { type: 'noul', instructions: 'この文章は、新しい機能の追加を求めていますか？', criteria: { true: '現在はない機能の追加を明示的に求めている', false: '機能の追加を求めていない。操作の質問や不具合報告だけの場合も含む' } }
  };
  function makeRequest(type, state) {
    if (!Object.hasOwn(definitions, type)) throw new TypeError('Unknown question type');
    return { model: 'jev-1.13.0', state, questions: { sample: JSON.parse(JSON.stringify(definitions[type])) } };
  }
  function routeNoul(p, low = 0.2, high = 0.8) {
    if (![p, low, high].every(Number.isFinite) || p < 0 || p > 1 || low < 0 || high > 1 || low >= high) throw new RangeError('Invalid probability / thresholds');
    return p <= low ? 'no' : p >= high ? 'yes' : 'review';
  }
  function scoreFromWeights(weights) {
    if (!Array.isArray(weights) || weights.length < 2 || weights.some(w => !Number.isFinite(w) || w < 0)) throw new RangeError('Invalid weights');
    const total = weights.reduce((a, b) => a + b, 0);
    if (total <= 0) return null;
    const probabilities = weights.map(w => w / total);
    return { probabilities, score: probabilities.reduce((s, p, i) => s + i * p, 0) };
  }
  root.JevLab = Object.freeze({ makeRequest, routeNoul, scoreFromWeights });
})(globalThis);
