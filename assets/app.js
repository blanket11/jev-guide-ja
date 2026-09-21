(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  let toastTimer;
  function toast(message) { const box = $('#toast'); if (!box) return; box.textContent = message; box.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => box.classList.remove('visible'), 2500); }
  const getRead = () => { try { const parsed = JSON.parse(localStorage.getItem('jev-guide-read') || '[]'); return new Set(Array.isArray(parsed) ? parsed.filter(x => typeof x === 'string') : []); } catch { return new Set(); } };
  function syncProgress() {
    const read = getRead();
    const valid = (globalThis.JEV_SEARCH_DATA || []).map(p => p.slug);
    const count = valid.filter(slug => read.has(slug)).length;
    if ($('#progress-label')) $('#progress-label').textContent = `${count} / ${valid.length} ページ読了`;
    if ($('#progress-bar')) $('#progress-bar').value = count;
    $$('.chapter-link').forEach(a => a.classList.toggle('is-read', read.has(a.dataset.slug)));
    const mark = $('#mark-read');
    if (mark) { const done = read.has(mark.dataset.slug); mark.textContent = done ? '✓ 読了済み（取り消す）' : '読了にする'; mark.setAttribute('aria-pressed', String(done)); }
  }
  function saveRead(read) { try { localStorage.setItem('jev-guide-read', JSON.stringify([...read])); syncProgress(); } catch { toast('このブラウザーでは記録を保存できません。'); } }
  $('#mark-read')?.addEventListener('click', event => { const key = event.currentTarget.dataset.slug; const read = getRead(); read.has(key) ? read.delete(key) : read.add(key); saveRead(read); });
  $('#reset-progress')?.addEventListener('click', () => { if (confirm('このブラウザーの読了記録をリセットしますか？')) saveRead(new Set()); });
  syncProgress();
  const toggle = $('#theme-toggle');
  function themeLabel() { toggle?.setAttribute('aria-label', document.documentElement.dataset.theme === 'dark' ? 'ライトモードに切り替える' : 'ダークモードに切り替える'); }
  themeLabel();
  toggle?.addEventListener('click', () => { const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = theme; try { localStorage.setItem('jev-guide-theme', theme); } catch {} themeLabel(); });
  const menu = $('#menu-toggle');
  function setMenu(open) { document.body.classList.toggle('menu-open', open); menu?.setAttribute('aria-expanded', String(open)); menu?.setAttribute('aria-label', open ? '学習メニューを閉じる' : '学習メニューを開く'); if (open) $('#sidebar a')?.focus(); }
  menu?.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  $('#mobile-backdrop')?.addEventListener('click', () => setMenu(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { setMenu(false); menu?.focus(); } });
  const dialog = $('#search-dialog');
  const input = $('#search-input');
  function openSearch() { if (dialog && !dialog.open) dialog.showModal(); input?.focus(); }
  $('#open-search')?.addEventListener('click', openSearch);
  $('#close-search')?.addEventListener('click', () => dialog.close());
  dialog?.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } });
  document.addEventListener('keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(); } });
  function search() {
    const query = input.value.trim().normalize('NFKC').toLowerCase();
    const results = $('#search-results'); results.replaceChildren();
    if (!query) { $('#search-status').textContent = '日本語の本文・見出し・用語から検索できます。'; return; }
    const words = query.split(/\s+/);
    const matches = (globalThis.JEV_SEARCH_DATA || []).map(p => {
      const hay = `${p.title} ${p.summary} ${p.keywords} ${p.text}`.normalize('NFKC').toLowerCase();
      const score = words.every(w => hay.includes(w)) ? words.reduce((s, w) => s + (p.title.toLowerCase().includes(w) ? 10 : 0) + (p.keywords.toLowerCase().includes(w) ? 4 : 0) + 1, 0) : 0;
      return { ...p, score };
    }).filter(p => p.score > 0).sort((a,b) => b.score - a.score);
    $('#search-status').textContent = matches.length ? `${matches.length}件見つかりました。` : '該当するページがありません。別の言葉で検索してください。';
    for (const p of matches) {
      const a = document.createElement('a'); a.href = `${p.slug}.html`; a.className = 'search-result';
      const group = document.createElement('span'); group.textContent = p.group;
      const title = document.createElement('strong'); title.textContent = p.title;
      const summary = document.createElement('p'); summary.textContent = p.summary;
      a.append(group, title, summary); results.append(a);
    }
  }
  input?.addEventListener('input', search);
  document.addEventListener('click', async event => {
    const button = event.target.closest('.copy-code'); if (!button) return;
    const text = button.closest('.code-block')?.querySelector('code')?.textContent; if (text == null) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard not available');
      await navigator.clipboard.writeText(text); toast('コードをコピーしました。');
    } catch {
      const range = document.createRange(); range.selectNodeContents(button.closest('.code-block').querySelector('code'));
      const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range); toast('コードを選択しました。コピー操作をしてください。');
    }
  });
  if ($('#request-output')) {
    const update = () => { $('#request-output').textContent = JSON.stringify(JevLab.makeRequest($('#request-type').value, $('#request-state').value), null, 2); };
    $('#request-type').addEventListener('change', update); $('#request-state').addEventListener('input', update); update();
  }
  if ($('#noul-p')) {
    const update = () => { const p = Number($('#noul-p').value)/100; $('#noul-value').textContent = p.toFixed(2); const route = JevLab.routeNoul(p); const text = { no:'いいえとして扱う', review:'確認対象に回す', yes:'はいとして扱う' }; const box = $('#noul-route'); box.textContent = `${p.toFixed(2)} → ${text[route]}`; box.dataset.route = route; };
    $('#noul-p').addEventListener('input', update); update();
  }
  if ($('#score-result')) {
    const update = () => { const weights = [0,1,2].map(n => Number($(`#score-${n}`).value)); weights.forEach((v,n)=> { $(`#weight-${n}`).textContent = v; }); const result = JevLab.scoreFromWeights(weights); const box = $('#score-result'); box.replaceChildren(); if (!result) { box.textContent = '重みの合計が0です。どれかを1以上にしてください。'; return; } const strong = document.createElement('strong'); strong.textContent = `score = ${result.score.toFixed(3)}`; const p = document.createElement('p'); p.textContent = result.probabilities.map((v,n)=>`段階${n}：${(v*100).toFixed(1)}%`).join(' / '); box.append(strong,p); };
    [0,1,2].forEach(n=>$(`#score-${n}`).addEventListener('input', update)); update();
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      const entry = entries.find(e => e.isIntersecting); if (!entry) return;
      $$('.toc a').forEach(a => a.classList.toggle('active', a.hash === `#${entry.target.id}`));
    }, { rootMargin: '-130px 0px -60% 0px' });
    $$('.prose h2').forEach(h=>observer.observe(h));
  }
  // Keep the active chapter in view without scrolling the document.
  const active = $('#sidebar [aria-current="page"]');
  if (active && window.innerWidth > 980) { const side = $('#sidebar'); side.scrollTop = Math.max(0, active.offsetTop - 180); }
})();
