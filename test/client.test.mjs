import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { evaluate, retryDelay, validateRequest, validateResponse } from '../examples/client.mjs';
import { makeTriageRequest } from '../examples/questions.mjs';
const fixture = JSON.parse(await readFile(new URL('../examples/mock-response.json', import.meta.url), 'utf8'));
const fresh = () => structuredClone(fixture);
const ok = () => Response.json(fresh());
const request = makeTriageRequest();
const options = { apiKey: 'test-only-not-a-real-key', fetchImpl: async () => ok(), sleep: async () => {} };

test('HTTP成功：URL・認証・リクエスト・応答の対応を確認する', async () => {
  let calls = 0;
  const answer = await evaluate(request, { ...options, fetchImpl: async (url, init) => {
    calls++;
    assert.equal(url, 'https://api.typesafe.ai/v1/systemone');
    assert.equal(init.method, 'POST');
    assert.equal(init.redirect, 'error');
    assert.equal(init.headers.Authorization, 'Bearer test-only-not-a-real-key');
    assert.deepEqual(JSON.parse(init.body), request);
    assert.ok(init.signal instanceof AbortSignal);
    return ok();
  }});
  assert.equal(calls, 1);
  assert.equal(answer.answers.category.choice, 'bug');
});

test('キーが空なら一切通信しない', async () => {
  let calls = 0;
  await assert.rejects(evaluate(request, { apiKey: '', fetchImpl: async () => { calls++; return ok(); } }), { code: 'MISSING_KEY' });
  assert.equal(calls, 0);
});
test('改行を含むキーを拒否する', async () => {
  await assert.rejects(evaluate(request, { ...options, apiKey: 'invalid\r\nkey' }), { code: 'MISSING_KEY' });
});
for (const status of [401, 422, 403, 500]) {
  test(`HTTP ${status}はこの教材では自動再送しない・本文を漏らさない`, async () => {
    let calls = 0;
    await assert.rejects(evaluate(request, { ...options, fetchImpl: async () => {
      calls++; return new Response('private-input-never-log-this', { status });
    }}), error => error.status === status && !error.message.includes('private-input'));
    assert.equal(calls, 1);
  });
}
for (const status of [429, 529]) {
  test(`HTTP ${status}はRetry-Afterを待って有限回の再試行をする`, async () => {
    let calls = 0; const waits = [];
    const result = await evaluate(request, { ...options, fetchImpl: async () => ++calls === 1
      ? new Response('', { status, headers: { 'Retry-After': '2' } }) : ok(), sleep: async ms => { waits.push(ms); } });
    assert.equal(result.answers.category.choice, 'bug');
    assert.equal(calls, 2); assert.deepEqual(waits, [2000]);
  });
}
test('混雑が続いても試行回数を超えない', async () => {
  let calls = 0; const waits = [];
  await assert.rejects(evaluate(request, { ...options, fetchImpl: async () => {
    calls++; return new Response('', { status: 529 });
  }, sleep: async ms => { waits.push(ms); } }), { status: 529 });
  assert.equal(calls, 3); assert.deepEqual(waits, [500, 1000]);
});
test('長いRetry-Afterを切り詰めて早期再送しない', async () => {
  let calls = 0;
  await assert.rejects(evaluate(request, { ...options, fetchImpl: async () => {
    calls++; return new Response('', { status: 429, headers: { 'Retry-After': '60' } });
  }}), { status: 429 });
  assert.equal(calls, 1);
});
test('通信失敗の元メッセージに秘密情報があっても表示しない', async () => {
  await assert.rejects(evaluate(request, { ...options, fetchImpl: async () => { throw new Error('secret payload'); } }),
    error => error.code === 'NETWORK' && !error.message.includes('secret'));
});
test('JSONでない成功応答は判定に使わない', async () => {
  await assert.rejects(evaluate(request, { ...options, fetchImpl: async () => new Response('not-json') }), { code: 'INVALID_RESPONSE' });
});
test('不正な設定は通信前に失敗する', async () => {
  await assert.rejects(evaluate(request, { ...options, maxAttempts: 999 }), { code: 'INVALID_CONFIG' });
  await assert.rejects(evaluate(request, { ...options, timeoutMs: 0 }), { code: 'INVALID_CONFIG' });
});
test('Retry-Afterの秒数・HTTP日時・不正値・待機上限を扱う', () => {
  assert.equal(retryDelay('2', 0), 2000);
  assert.equal(retryDelay('0', 0), 0);
  assert.equal(retryDelay(null, 2), 2000);
  assert.equal(retryDelay('garbage', 1), 1000);
  assert.equal(retryDelay('Mon, 21 Sep 2026 00:00:05 GMT', 0, Date.parse('2026-09-21T00:00:00Z')), 5000);
  assert.equal(retryDelay('99999', 0), null);
});
test('必須のリクエスト項目と質問形式を検証する', () => {
  for (const payload of [{}, { ...request, state: null }, { ...request, questions: {} },
    { ...request, questions: { x: { type: 'text', instructions: 'x' } } },
    { ...request, questions: { x: { type: 'score', instructions: 'x', criteria: ['only-one'] } } },
    { ...request, questions: { x: { type: 'choice', instructions: 'x', criteria: {} } } }]) {
    assert.throws(() => validateRequest(payload), { code: 'INVALID_REQUEST' });
  }
});
test('応答の型・未知の選択肢・範囲外の確率を拒否する', () => {
  for (const mutate of [
    b => { b.answers.category.type = 'noul'; },
    b => { b.answers.category.choice = 'delete_everything'; },
    b => { b.answers.category.probabilities.bug = 2; },
    b => { b.answers.category.confidence = -1; },
    b => { b.answers = {}; },
    b => { b.usage.input_tokens = '123'; },
    b => { b.answers.category.probabilities = { bug: 1 }; },
    b => { b.answers.category.choice = 'other'; },
  ]) {
    const body = fresh(); mutate(body);
    assert.throws(() => validateResponse(body, request.questions), { code: 'INVALID_RESPONSE' });
  }
});
test('Scoreは分布と期待値を検証する', () => {
  const questions = { x: { type: 'score', instructions: 'x', criteria: ['a', 'b', 'c'] } };
  const body = { model: 'mock', usage: { input_tokens: 0, output_tokens: 0 }, answers: {
    x: { type: 'score', score: 1.5, probabilities: { 0: 0, 1: 0.5, 2: 0.5 }, legend: { 0: 'a', 1: 'b', 2: 'c' }, confidence: 0.5 }
  }};
  assert.equal(validateResponse(body, questions).answers.x.score, 1.5);
  body.answers.x.score = 0.1;
  assert.throws(() => validateResponse(body, questions), { code: 'INVALID_RESPONSE' });
});
test('Noul応答に別のconfidenceを要求しない', () => {
  const questions = { x: { type: 'noul', instructions: 'x' } };
  const body = { model: 'mock', usage: { input_tokens: 0, output_tokens: 0 }, answers: { x: { type: 'noul', noul: 0.8 } } };
  assert.equal(validateResponse(body, questions).answers.x.noul, 0.8);
  body.answers.x.noul = 1.1;
  assert.throws(() => validateResponse(body, questions), { code: 'INVALID_RESPONSE' });
});
