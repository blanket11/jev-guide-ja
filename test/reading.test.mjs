import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { renderMarkdown } from '../scripts/markdown.mjs';
const content = new URL('../content/', import.meta.url);
const pages = JSON.parse(await readFile(new URL('manifest.json', content), 'utf8'));

test('要点は3項目で構成され、意味のある見出しを持つ', () => {
  const html = renderMarkdown(':::brief 先に分かること\n- **材料：** 短文\n- **質問：** 1問\n- **返答：** 値\n:::');
  assert.equal((html.match(/<li>/g) || []).length, 3);
  assert.ok(html.includes('aria-labelledby="chapter-brief-title"'));
  assert.ok(html.includes('<strong>材料：</strong>'));
});
test('順序と並列の図を、異なるリストで表現する', () => {
  const body = '材料 | 入力\n判断 | 出力\n! 教材です。\n:::';
  const flow = renderMarkdown(':::flow 流れ\n' + body);
  const cards = renderMarkdown(':::cards 比較\n' + body);
  assert.ok(flow.includes('<ol class="diagram-items"'));
  assert.ok(cards.includes('<ul class="diagram-items"'));
  assert.ok(flow.includes('<figcaption>') && flow.includes('教材です。'));
});
test('図の内容はHTMLとして実行しない', () => {
  const html = renderMarkdown(':::cards <img>\n<script> | a & b\n次 | <svg>\n:::');
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('a &amp; b'));
});
test('不完全な図・要点を公開せずビルドで拒否する', () => {
  assert.throws(() => renderMarkdown(':::brief 題名\n- 1つ\n:::'), /three/);
  assert.throws(() => renderMarkdown(':::flow 題名\n説明なし\n次 | 詳細\n:::'), /label/);
  assert.throws(() => renderMarkdown(':::flow 題名\n材料 | 入力'), /Unclosed/);
});
test('既存の見出しアンカーを変えず、ブロックで囲む', () => {
  const headings = [];
  const html = renderMarkdown('## 入力\n説明\n\n## 結果\n本文', { headings, blockSections: true });
  assert.deepEqual(headings.map(h => h.id), ['section-1', 'section-2']);
  assert.equal((html.match(/class="reading-block"/g) || []).length, 2);
  assert.equal((html.match(/<section /g) || []).length, (html.match(/<\/section>/g) || []).length);
});
test('30章すべてに、要点・図解・本文ブロックがある', async () => {
  for (const page of pages) {
    const md = await readFile(new URL(`${page.slug}.md`, content), 'utf8');
    assert.equal((md.match(/^:::brief /gm) || []).length, 1, page.slug);
    assert.ok(/^:::(flow|cards) /m.test(md), page.slug);
    const html = renderMarkdown(md, { blockSections: true });
    assert.ok(html.includes('class="chapter-brief"'), page.slug);
    assert.ok(html.includes('class="learning-diagram '), page.slug);
    assert.ok(html.includes('class="reading-block"'), page.slug);
    assert.ok(!html.includes(':::brief') && !html.includes(':::flow') && !html.includes(':::cards'), page.slug);
  }
});

test('元の記事のコード26件と全出典リンクを保持する', async () => {
  const codes = []; const links = [];
  for (const page of pages) {
    const md = await readFile(new URL(`${page.slug}.md`, content), 'utf8');
    codes.push(...(md.match(/```[^\n]*\n[\s\S]*?\n```/g) || []));
    links.push(...[...md.matchAll(/\]\(([^)]+)\)/g)].map(m => m[1]));
  }
  const hash = values => createHash('sha256').update(values.join('\n')).digest('hex');
  assert.equal(codes.length, 26);
  assert.equal(hash(codes), 'd3d1fc67d253e8ac4327a2ac26eb19f4b6a949e596e7a2524797021cb60c79a1');
  assert.equal(hash(links), 'c3cd45ba2fb827fdda455e863387f4ea79c52e12c135d4e5547d6a89e6b4c892');
});
