const STOP_WORDS = new Set('a an and are as at be by can could did do does for from had has have how i in into is it me my of on or our should that the their there these they this to was we what when where which who why will with would you your about tell please'.split(' '));

export function queryTerms(query: string): string[] {
  const words = query.toLowerCase().match(/[\p{L}\p{N}]+(?:[-’'][\p{L}\p{N}]+)*/gu) || [];
  return [...new Set(words.filter(word => word.length >= 2 && !STOP_WORDS.has(word)))];
}

export function escapePattern(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function queryPattern(query: string): RegExp | null {
  const terms = queryTerms(query).sort((a, b) => b.length - a.length);
  return terms.length ? new RegExp(`(?<![\\p{L}\\p{N}])(${terms.map(escapePattern).join('|')})(?![\\p{L}\\p{N}])`, 'giu') : null;
}

export function matchesQuery(text: string, query: string): boolean {
  return queryPattern(query)?.test(text) || false;
}

/** Select the passage covering the most query concepts, not the first generic word. */
export function buildExcerpt(content: string, query: string, windowSize = 320): { text: string; matched: boolean } {
  const clean = (content || '').replace(/\s+/g, ' ').trim();
  if (!clean) return { text: '', matched: false };
  const pattern = queryPattern(query);
  const matches = pattern ? [...clean.matchAll(pattern)] : [];
  if (!matches.length) return { text: clean.slice(0, windowSize) + (clean.length > windowSize ? '…' : ''), matched: false };

  let bestStart = 0;
  let bestScore = -1;
  for (const match of matches) {
    const index = match.index ?? 0;
    const start = Math.max(0, Math.min(index - Math.floor(windowSize / 3), clean.length - windowSize));
    const passage = clean.slice(start, start + windowSize);
    const hits = pattern ? [...passage.matchAll(pattern)].map(hit => hit[0].toLowerCase()) : [];
    const score = new Set(hits).size * 10 + Math.min(hits.length, 5);
    if (score > bestScore) { bestScore = score; bestStart = start; }
  }
  let start = bestStart;
  let end = Math.min(clean.length, start + windowSize);
  // Keep complete words without losing the matched term.
  if (start > 0 && /\S/.test(clean[start - 1])) {
    const boundary = clean.indexOf(' ', start);
    const firstHit = matches.find(match => (match.index ?? 0) >= start)?.index ?? end;
    if (boundary >= 0 && boundary < firstHit) start = boundary + 1;
  }
  if (end < clean.length && /\S/.test(clean[end])) {
    const boundary = clean.lastIndexOf(' ', end);
    if (boundary > start) end = boundary;
  }
  return { text: `${start > 0 ? '…' : ''}${clean.slice(start, end).trim()}${end < clean.length ? '…' : ''}`, matched: true };
}

/** Prefer the prose following a topic heading, stopping before the next section. */
export function topicExcerpt(content: string, topic: string, topics: string[], windowSize = 360): string {
  const clean = (content || '').replace(/\s+/g, ' ').trim();
  const lower = clean.toLowerCase();
  const heading = topic.replace(/\s+/g, ' ').trim();
  const index = lower.indexOf(heading.toLowerCase());
  if (index < 0) {
    const excerpt = buildExcerpt(clean, topic, windowSize);
    return excerpt.matched ? excerpt.text : '';
  }
  const start = index + heading.length;
  const nextHeading = topics.filter(t => t !== topic).map(t => lower.indexOf(t.replace(/\s+/g, ' ').trim().toLowerCase(), start)).filter(i => i >= start);
  const sectionEnd = nextHeading.length ? Math.min(...nextHeading) : clean.length;
  const section = clean.slice(start, sectionEnd).replace(/^[\s:–—-]+/, '').trim();
  if (!section) return '';
  return buildExcerpt(section, '', windowSize).text;
}

export function hasValidCitations(summary: string, sourceCount: number): boolean {
  const citations = [...summary.matchAll(/\[(\d+)\]/g)];
  return citations.length > 0 && citations.every(match => Number(match[1]) >= 1 && Number(match[1]) <= sourceCount);
}