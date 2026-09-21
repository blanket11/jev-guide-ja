/** Render repository-authored learning diagrams as text, not raster images. */
export function renderLearningBlock(kind, title, body, { inline, escapeHtml }) {
  if (!['brief', 'flow', 'cards'].includes(kind)) throw new Error(`Unknown learning block: ${kind}`);
  if (!title.trim()) throw new Error('A learning block needs a title');
  const lines = body.split('\n').map(line => line.trim()).filter(Boolean);
  if (kind === 'brief') {
    if (lines.length !== 3 || lines.some(line => !line.startsWith('- '))) {
      throw new Error('A brief must contain exactly three bullet points');
    }
    return `<section class="chapter-brief" aria-labelledby="chapter-brief-title"><p class="eyebrow">先に、3つの要点</p><h2 id="chapter-brief-title">${inline(title)}</h2><ul>${lines.map(line => `<li>${inline(line.slice(2))}</li>`).join('')}</ul></section>`;
  }
  const notes = lines.filter(line => line.startsWith('! '));
  const items = lines.filter(line => !line.startsWith('! ')).map(line => {
    const [label, ...rest] = line.split(' | ');
    if (!label || !rest.length || !rest.join(' | ').trim()) throw new Error('Diagram entries need label | detail');
    return { label, detail: rest.join(' | ') };
  });
  if (items.length < 2 || items.length > 5) throw new Error('Diagrams need two to five items');
  const tag = kind === 'flow' ? 'ol' : 'ul';
  return `<figure class="learning-diagram ${kind} items-${items.length}" aria-label="${escapeHtml(title)}"><figcaption><span class="diagram-badge">${kind === 'flow' ? '流れで理解' : '並べて比較'}</span>${inline(title)}</figcaption><${tag} class="diagram-items" role="list">${items.map((item, index) => `<li class="diagram-item">${kind === 'flow' ? `<span class="diagram-step" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>` : ''}<strong>${inline(item.label)}</strong><p>${inline(item.detail)}</p></li>`).join('')}</${tag}>${notes.map(note => `<p class="diagram-note">${inline(note.slice(2))}</p>`).join('')}</figure>`;
}
