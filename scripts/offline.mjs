/** Make a portable, self-contained preview. Not used by the GitHub Pages build. */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = process.argv[2] || path.join(root, 'jev-guide-ja-preview.html');
const assets = {};
for (const file of await readdir(path.join(root, 'dist/assets'))) {
  assets[`assets/${file}`] = await readFile(path.join(root, 'dist/assets', file), 'utf8');
}
const pages = {};
for (const file of await readdir(path.join(root, 'dist'))) {
  if (file.endsWith('.html')) pages[file] = await readFile(path.join(root, 'dist', file), 'utf8');
}
const navScript = `
document.addEventListener('click', function(event) {
  const link = event.target.closest('a');
  if (!link) return;
  const href = link.getAttribute('href') || '';
  if (/^[a-z0-9-]+\\.html(?:#.*)?$/.test(href)) {
    event.preventDefault();
    parent.postMessage({ type: 'jev-offline-nav', href }, '*');
  } else if (/^https:\\/\\//.test(href)) {
    link.target = '_blank'; link.rel = 'noopener noreferrer';
  }
});
`;
const data = JSON.stringify({ pages, assets, navScript }).replaceAll('<', '\\u003c');
const script = `
'use strict';
const { pages, assets, navScript } = ${data};
const frame = document.getElementById('guide-frame');
function inlinePage(name) {
  let html = pages[name];
  html = html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, '');
  html = html.replace(/<link rel="icon"[^>]*>/, '');
  html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, src) => '<style>' + assets[src] + '</style>');
  html = html.replace(/<script src="([^"]+)"><\\/script>/g, (_, src) => '<script>' + assets[src].replaceAll('</script', '<\\\\/script') + '<' + '/script>');
  html = html.replace('</body>', '<script>' + navScript + '<' + '/script></body>');
  return html;
}
function mount(href, updateHistory = true) {
  const [name, fragment] = href.split('#');
  if (!Object.hasOwn(pages, name)) return;
  frame.srcdoc = inlinePage(name);
  document.title = 'Jev 日本語ガイド（非公式）｜オフラインプレビュー';
  frame.onload = () => {
    if (fragment) frame.contentDocument?.getElementById(fragment)?.scrollIntoView();
  };
  if (updateHistory) history.pushState(null, '', '#' + href);
}
window.addEventListener('message', event => {
  if (event.source === frame.contentWindow && event.data?.type === 'jev-offline-nav'
      && typeof event.data.href === 'string') mount(event.data.href);
});
window.addEventListener('popstate', () => mount(location.hash.slice(1) || 'index.html', false));
mount(location.hash.slice(1) || 'index.html', false);
`;
const css = `html,body{margin:0;height:100%;overflow:hidden}body{display:flex;flex-direction:column;font-family:system-ui,sans-serif;background:#f9fcfa}.preview-label{box-sizing:border-box;min-height:30px;flex:none;padding:5px 12px;background:#e5f1ec;color:#20473b;font-size:11px;text-align:center;line-height:20px}iframe{border:0;display:block;flex:1;width:100%;min-height:0}`;
const hash = text => `'sha256-${createHash('sha256').update(text).digest('base64')}'`;
// srcdoc inherits these hashes. Only the bundled author-controlled script/styles may execute.
const scriptHashes = [script, navScript, ...Object.entries(assets).filter(([key]) => key.endsWith('.js')).map(([,value]) => value)].map(hash).join(' ');
const styleHashes = [css, ...Object.entries(assets).filter(([key]) => key.endsWith('.css')).map(([, value]) => value)].map(hash).join(' ');
const csp = `default-src 'none'; script-src ${scriptHashes}; style-src ${styleHashes}; img-src data:; frame-src about: 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`;
const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${csp}"><title>Jev 日本語ガイド（非公式）｜オフラインプレビュー</title><style>${css}</style></head><body><div class="preview-label">オフラインプレビュー · 全30章 · API通信なし · 公式仕様確認：2026年9月21日</div><iframe id="guide-frame" title="Jev日本語学習ガイド"></iframe><script>${script}</script></body></html>`;
await writeFile(destination, html);
console.log(`Offline preview created: ${destination}`);
