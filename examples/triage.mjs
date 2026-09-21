import { readFile } from 'node:fs/promises';
import { evaluate, validateResponse, JevClientError } from './client.mjs';
import { makeTriageRequest } from './questions.mjs';

const isMock = process.argv.includes('--mock');
const request = makeTriageRequest(process.env.TYPESAFE_MODEL || 'jev-1.13.0');
try {
  const result = isMock
    ? validateResponse(JSON.parse(await readFile(new URL('./mock-response.json', import.meta.url), 'utf8')), request.questions)
    : await evaluate(request, { apiKey: process.env.TYPESAFE_API_KEY });
  const answer = result.answers.category;
  // 0.8は教材の仮の境界です。実運用では評価データで調整します。
  const action = answer.choice === 'unclear' || answer.confidence < 0.8
    ? '人による確認へ回す（表示のみ）'
    : '候補ラベルを表示する（自動保存はしない）';
  console.log(isMock ? 'MOCK：固定値による教材です。外部通信・課金・実際の推論はありません。' : 'LIVE：実際のAPIを呼び出しました。');
  console.log(JSON.stringify({
    model: result.model,
    category: answer.choice,
    probabilities: answer.probabilities,
    confidence: answer.confidence,
    nextAction: action,
    usage: result.usage,
  }, null, 2));
} catch (error) {
  console.error(error instanceof JevClientError ? `${error.code}: ${error.message}` : '実習の実行に失敗しました。設定とファイルを確認してください。');
  process.exitCode = 1;
}
