import test from 'node:test';
import assert from 'node:assert/strict';
import '../assets/lab.js';
import { validateRequest } from '../examples/client.mjs';
const { makeRequest, routeNoul, scoreFromWeights } = globalThis.JevLab;
test('3種類のリクエストがAPIの質問構造を満たす', () => {
  for (const type of ['choice', 'score', 'noul']) {
    const request = makeRequest(type, '日本語の教材');
    assert.equal(request.questions.sample.type, type);
    assert.doesNotThrow(() => validateRequest(request));
  }
});
test('StateにHTMLを書いても入力文字列として保持する', () => {
  const input = '<script>alert(1)</script>';
  assert.equal(makeRequest('choice', input).state, input);
});
test('リクエストを変更してもデモの定義が汚染されない', () => {
  const one = makeRequest('choice', 'x'); one.questions.sample.criteria.bug = 'changed';
  assert.notEqual(makeRequest('choice', 'x').questions.sample.criteria.bug, 'changed');
});
test('未知の質問形式はエラーになる', () => {
  assert.throws(() => makeRequest('random', ''), TypeError);
});
test('Noulは境界も含めて3経路に分岐する', () => {
  assert.equal(routeNoul(0), 'no'); assert.equal(routeNoul(0.2), 'no');
  assert.equal(routeNoul(0.20001), 'review'); assert.equal(routeNoul(0.79999), 'review');
  assert.equal(routeNoul(0.8), 'yes'); assert.equal(routeNoul(1), 'yes');
});
test('Noulの範囲外やNaN、不正な境界を拒否する', () => {
  for (const p of [NaN, Infinity, -0.1, 1.1]) assert.throws(() => routeNoul(p), RangeError);
  assert.throws(() => routeNoul(0.5, 0.8, 0.2), RangeError);
});
test('Scoreの期待値を計算し確率の合計は1になる', () => {
  const result = scoreFromWeights([0, 50, 50]);
  assert.equal(result.score, 1.5); assert.deepEqual(result.probabilities, [0, 0.5, 0.5]);
  assert.equal(scoreFromWeights([0, 0, 100]).score, 2);
});
test('全重みゼロをNaNや偽のスコアにしない', () => {
  assert.equal(scoreFromWeights([0, 0, 0]), null);
  assert.throws(() => scoreFromWeights([-1, 1]), RangeError);
  assert.throws(() => scoreFromWeights([0, NaN]), RangeError);
});
