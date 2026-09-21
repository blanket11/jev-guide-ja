/** Trusted, repository-authored Markdown only. This is not a user-input sanitizer. */
export function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}
export function inline(text) {
  const stash = [];
  const hold = (html) => { const key = `\u0000${stash.length}\u0000`; stash.push(html); return key; };
  let value = text.replace(/`([^`]+)`/g, (_, code) => hold(`<code>${escapeHtml(code)}</code>`));
  value = value.replace(/\[([^\]]+)\]\(([^\s)]+)\)/g, (_, label, url) => {
    if (!/^(https:\/\/|[a-zA-Z0-9._/#-])/.test(url) || /^(javascript|data):/i.test(url)) throw new Error(`Unsafe URL: ${url}`);
    return hold(`<a href="${escapeHtml(url)}"${url.startsWith('https:') ? ' rel="noreferrer"' : ''}>${escapeHtml(label)}</a>`);
  });
  value = escapeHtml(value).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  return value.replace(/\u0000(\d+)\u0000/g, (_, i) => stash[Number(i)]);
}
export function renderMarkdown(markdown, { demo = () => '', headings = [] } = {}) {
  const lines = markdown.replaceAll('\r\n', '\n').split('\n');
  const output = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim() || 'text';
      const code = []; i++;
      while (i < lines.length && !lines[i].startsWith('```')) code.push(lines[i++]);
      if (i === lines.length) throw new Error('Unclosed code fence');
      i++;
      output.push(`<div class="code-block"><div class="code-top"><span>${escapeHtml(lang)}</span><button type="button" class="copy-code" aria-label="コードをコピー">コピー</button></div><pre tabindex="0"><code class="language-${escapeHtml(lang)}">${escapeHtml(code.join('\n'))}</code></pre></div>`);
      continue;
    }
    if (line.startsWith(':::demo ')) { output.push(demo(line.slice(8).trim())); i++; continue; }
    const callout = line.match(/^:::(note|tip|warning|answer)\s*(.*)$/);
    if (callout) {
      const body = []; i++;
      while (i < lines.length && lines[i].trim() !== ':::') body.push(lines[i++]);
      if (i === lines.length) throw new Error('Unclosed callout');
      i++;
      const html = renderMarkdown(body.join('\n'), { demo, headings });
      const title = inline(callout[2] || ({ note: '補足', tip: 'ポイント', warning: '注意', answer: '解説を読む' })[callout[1]]);
      output.push(callout[1] === 'answer'
        ? `<details class="answer"><summary>${title}</summary><div>${html}</div></details>`
        : `<aside class="callout ${callout[1]}"><p class="callout-title">${title}</p>${html}</aside>`);
      continue;
    }
    const heading = line.match(/^(#{2,4})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length; const id = `section-${headings.length + 1}`;
      headings.push({ level, id, title: heading[2].replaceAll('**', '').replaceAll('`', '') });
      output.push(`<h${level} id="${id}">${inline(heading[2])}<a class="heading-anchor" href="#${id}" aria-label="この見出しへのリンク">#</a></h${level}>`); i++; continue;
    }
    if (line.startsWith('|') && i + 1 < lines.length && /^\|[\s:|-]+\|$/.test(lines[i + 1])) {
      const cells = (row) => row.replace(/^\||\|$/g, '').split('|').map(s => inline(s.trim()));
      const head = cells(line); i += 2; const rows = [];
      while (i < lines.length && lines[i].startsWith('|')) rows.push(cells(lines[i++]));
      output.push(`<div class="table-scroll" role="region" aria-label="比較表" tabindex="0"><table><thead><tr>${head.map(s => `<th scope="col">${s}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(s => `<td>${s}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`); continue;
    }
    if (/^[-*] /.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) items.push(inline(lines[i++].slice(2)));
      output.push(`<ul>${items.map(s => `<li>${s}</li>`).join('')}</ul>`); continue;
    }
    const paragraph = [line]; i++;
    while (i < lines.length && lines[i].trim() && !/^(#{2,4}\s|```|:::|\||[-*] )/.test(lines[i])) paragraph.push(lines[i++]);
    output.push(`<p>${inline(paragraph.join('\n'))}</p>`);
  }
  return output.join('\n');
}
