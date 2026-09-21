/**
 * 学習用の最小HTTPクライアント。公式SDKではありません。
 * 参照：https://docs.typesafe.ai/api（2026-09-21確認）
 * 外部通信はevaluate()を明示的に呼んだ場合だけ発生します。
 * 公式SDKとの完全な互換性、実APIでの疎通は未検証です。
 */
const ENDPOINT = 'https://api.typesafe.ai/v1/systemone';
const RETRYABLE = new Set([429, 529]);
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isTextData = value => typeof value === 'string' || (value !== null && typeof value === 'object');
const isProbability = value => Number.isFinite(value) && value >= 0 && value <= 1;
const isNonnegativeInteger = value => Number.isSafeInteger(value) && value >= 0;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/** エラーにはキー・入力本文・提供元の応答本文を含めません。 */
export class JevClientError extends Error {
  constructor(code, message, status = null) {
    super(message);
    this.name = 'JevClientError';
    this.code = code;
    this.status = status;
  }
}
const invalid = message => new JevClientError('INVALID_RESPONSE', message);

export function validateRequest(request) {
  if (!isObject(request) || typeof request.model !== 'string' || !request.model.trim()
      || !isTextData(request.state) || !isObject(request.questions)
      || Object.keys(request.questions).length === 0) {
    throw new JevClientError('INVALID_REQUEST', 'model / state / questionsを確認してください。');
  }
  for (const question of Object.values(request.questions)) {
    if (!isObject(question) || !isTextData(question.instructions)) {
      throw new JevClientError('INVALID_REQUEST', '質問にはinstructionsが必要です。');
    }
    if (question.type === 'choice') {
      if (!isObject(question.criteria) || Object.keys(question.criteria).length < 1
          || Object.keys(question.criteria).length > 255
          || Object.values(question.criteria).some(value => value !== null && !isTextData(value))) {
        throw new JevClientError('INVALID_REQUEST', 'Choiceのcriteriaを確認してください。');
      }
    } else if (question.type === 'score') {
      if (!Array.isArray(question.criteria) || question.criteria.length < 2
          || question.criteria.length > 10 || question.criteria.some(value => !isTextData(value))) {
        throw new JevClientError('INVALID_REQUEST', 'Scoreは2〜10段階のcriteriaで定義してください。');
      }
    } else if (question.type === 'noul') {
      if (question.criteria !== undefined && (!isObject(question.criteria)
          || Object.keys(question.criteria).some(key => key !== 'true' && key !== 'false')
          || Object.values(question.criteria).some(value => !isTextData(value)))) {
        throw new JevClientError('INVALID_REQUEST', 'Noulのcriteriaを確認してください。');
      }
    } else {
      throw new JevClientError('INVALID_REQUEST', '未対応の質問形式です。');
    }
  }
  try { JSON.stringify(request); }
  catch { throw new JevClientError('INVALID_REQUEST', 'JSONに変換できない値が含まれています。'); }
  return request;
}

function validateDistribution(probabilities, keys) {
  if (!isObject(probabilities) || Object.keys(probabilities).length !== keys.length
      || keys.some(key => !Object.hasOwn(probabilities, key) || !isProbability(probabilities[key]))
      || Math.abs(Object.values(probabilities).reduce((sum, p) => sum + p, 0) - 1) > 0.001) {
    throw invalid('確率分布の形または値が不正です。');
  }
}

/** 応答の形を検証するだけで、意味の正しさは検証しません。 */
export function validateResponse(body, questions) {
  if (!isObject(body) || typeof body.model !== 'string' || !body.model
      || !isObject(body.answers) || !isObject(body.usage)
      || !isNonnegativeInteger(body.usage.input_tokens)
      || !isNonnegativeInteger(body.usage.output_tokens)) {
    throw invalid('応答の共通項目が不正です。');
  }
  if (Object.keys(body.answers).length !== Object.keys(questions).length) {
    throw invalid('質問と回答の数が一致しません。');
  }
  for (const [id, question] of Object.entries(questions)) {
    const answer = Object.hasOwn(body.answers, id) ? body.answers[id] : null;
    if (!isObject(answer) || answer.type !== question.type) throw invalid('回答の型が質問と一致しません。');
    if (question.type === 'noul') {
      if (!isProbability(answer.noul)) throw invalid('Noulは0〜1である必要があります。');
      continue;
    }
    if (!isProbability(answer.confidence)) throw invalid('confidenceが不正です。');
    if (question.type === 'choice') {
      const keys = Object.keys(question.criteria);
      if (typeof answer.choice !== 'string' || !keys.includes(answer.choice)) throw invalid('未知の選択肢です。');
      validateDistribution(answer.probabilities, keys);
      if (answer.probabilities[answer.choice] + 0.001 < Math.max(...Object.values(answer.probabilities))) {
        throw invalid('choiceと確率分布が一致しません。');
      }
    } else if (question.type === 'score') {
      const keys = question.criteria.map((_, i) => String(i));
      validateDistribution(answer.probabilities, keys);
      if (!Number.isFinite(answer.score) || answer.score < 0 || answer.score > keys.length - 1
          || !isObject(answer.legend) || keys.some(key => typeof answer.legend[key] !== 'string')) {
        throw invalid('Scoreの値またはlegendが不正です。');
      }
      const expected = keys.reduce((sum, key) => sum + Number(key) * answer.probabilities[key], 0);
      if (Math.abs(expected - answer.score) > 0.01) throw invalid('Scoreと確率分布が一致しません。');
    }
  }
  return body;
}

/** Retry-Afterの秒数・HTTP日時に対応。大きすぎる待機は再送せず呼び出し元に戻します。 */
export function retryDelay(header, attempt, now = Date.now()) {
  let ms;
  if (header && /^\d+(\.\d+)?$/.test(header.trim())) ms = Number(header) * 1000;
  else if (header && Number.isFinite(Date.parse(header))) ms = Math.max(0, Date.parse(header) - now);
  else ms = 500 * 2 ** attempt;
  if (!Number.isFinite(ms) || ms > 30000) return null;
  return Math.max(0, ms);
}

/**
 * @param {object} request - 評価リクエスト
 * @param {object} options - キー・時間上限・テスト用依存関数
 * @returns {Promise<object>} 検証済みの構造（意味の正しさは保証しない）
 */
export async function evaluate(request, {
  apiKey,
  fetchImpl = globalThis.fetch,
  sleep = delay,
  maxAttempts = 3,
  timeoutMs = 8000,
} = {}) {
  validateRequest(request);
  if (typeof apiKey !== 'string' || !apiKey.trim() || /[\r\n]/.test(apiKey)) {
    throw new JevClientError('MISSING_KEY', 'ローカルのTYPESAFE_API_KEYを設定してください。');
  }
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 5
      || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60000) {
    throw new JevClientError('INVALID_CONFIG', '試行回数またはタイムアウト設定が不正です。');
  }
  const serialized = JSON.stringify(request);
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let response;
    try {
      response = await fetchImpl(ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey.trim()}`, 'Content-Type': 'application/json' },
        body: serialized,
        signal: AbortSignal.timeout(timeoutMs),
        redirect: 'error',
      });
    } catch {
      // 通信エラーは送信済みか判断できないため、この教材では自動再送しません。
      throw new JevClientError('NETWORK', '通信に失敗したか、タイムアウトしました。');
    }
    if (!response.ok) {
      const status = response.status;
      const ms = retryDelay(response.headers.get('retry-after'), attempt);
      await response.body?.cancel().catch(() => {});
      if (RETRYABLE.has(status) && attempt + 1 < maxAttempts && ms !== null) {
        await sleep(ms);
        continue;
      }
      throw new JevClientError('HTTP', `APIがエラーを返しました（HTTP ${status}）。`, status);
    }
    let body;
    try { body = await response.json(); }
    catch { throw invalid('JSON応答の読み取りに失敗しました。'); }
    return validateResponse(body, request.questions);
  }
  throw new JevClientError('HTTP', '試行回数の上限に達しました。');
}
