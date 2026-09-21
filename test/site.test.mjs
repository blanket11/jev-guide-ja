import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { escapeHtml, inline, renderMarkdown } from '../scripts/markdown.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(path.join(root, 'content/manifest.json'), 'utf8'));
const sources = JSON.parse(await readFile(path.join(root, 'content/sources.json'), 'utf8'));

test('HTML・引用符をコードとしてエスケープする', () => {
  assert.equal(escapeHtml('<"&>'), '&lt;&quot;&amp;&gt;');
  assert.ok(renderMarkdown('```html\n<script>alert(1)</script>\n```').includes('&lt;script&gt;'));
  assert.ok(!renderMarkdown('Hello <script>').includes('<script>'));
});
test('危険なリンクを拒否する', () => {
  assert.throws(() => inline('[bad](javascript:evil)'), /Unsafe/);
  assert.throws(() => inline('[bad](data:text\/html)'), /Unsafe/);
});
test('未閉鎖のMarkdown構文を検出する', () => {
  assert.throws(() => renderMarkdown('```js\nx'), /Unclosed/);
  assert.throws(() => renderMarkdown(':::note test\nx'), /Unclosed/);
});
test('見出し・表・確認問題を生成できる', () => {
  const headings = [];
  const html = renderMarkdown('## 題名\n\n| 見出し |\n| --- |\n| 内容 |\n\n:::answer 確認\n本文\n:::', { headings });
  assert.equal(headings[0].id, 'section-1');
  assert.ok(html.includes('<table>')); assert.ok(html.includes('<details'));
});
test('章のメタデータと参照先が全て存在する', async () => {
  assert.equal(manifest.length, 30);
  assert.equal(new Set(manifest.map(page => page.slug)).size, manifest.length);
  for (const page of manifest) {
    assert.match(page.checked, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(page.goal && page.summary && page.sources.length);
    for (const key of page.sources) assert.ok(sources[key]?.url, `${page.slug}: ${key}`);
    const md = await readFile(path.join(root, 'content', `${page.slug}.md`), 'utf8');
    assert.ok(md.length > 450, page.slug);
    for (const [, code] of md.matchAll(/```json\n([\s\S]*?)\n```/g)) {
      assert.doesNotThrow(() => JSON.parse(code), `Invalid JSON: ${page.slug}`);
    }
  }
});
test('ビルドと全ページの内部リンク・構造・秘密情報なしを検証する', async () => {
  const result = spawnSync(process.execPath, ['scripts/build.mjs'], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const dir = path.join(root, 'dist');
  const htmlFiles = (await readdir(dir)).filter(file => file.endsWith('.html'));
  assert.equal(htmlFiles.length, 31);
  let links = 0;
  for (const file of htmlFiles) {
    const html = await readFile(path.join(dir, file), 'utf8');
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1, file);
    assert.ok(html.includes('lang="ja"'), file);
    assert.ok(html.includes("connect-src 'none'"), file);
    assert.ok(html.includes('非公式'), file);
    assert.ok(!html.includes(':::demo'), file);
    assert.ok(!/<script[^>]*src="https?:/i.test(html), file);
    assert.ok(!/TYPESAFE_API_KEY\s*=\s*[a-zA-Z0-9_-]{12}/.test(html), file);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length, `Duplicate ID in ${file}`);
    for (const [, target] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (target.startsWith('https://') || target.startsWith('data:')) continue;
      assert.ok(!target.startsWith('/'), `Absolute path breaks subpath: ${file} -> ${target}`);
      const [filename, fragment] = target.split('#');
      const resolved = path.join(dir, filename || file);
      assert.ok((await stat(resolved)).isFile(), `${file} -> ${target}`);
      if (fragment) {
        const targetHtml = await readFile(resolved, 'utf8');
        assert.ok(targetHtml.includes(`id="${fragment}"`), `Broken fragment: ${file} -> ${target}`);
      }
      links++;
    }
  }
  assert.ok(links > 1000);
});
test('モック実習がAPIキーなしで動く', () => {
  const result = spawnSync(process.execPath, ['examples/triage.mjs', '--mock'], {
    cwd: root, encoding: 'utf8', env: { ...process.env, TYPESAFE_API_KEY: '' },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.stdout.includes('mock-teaching-fixture'));
  assert.ok(result.stdout.includes('MOCK'));
});
