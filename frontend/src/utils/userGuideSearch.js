const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'can', 'could', 'did', 'do', 'does',
  'for', 'from', 'had', 'has', 'have', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its',
  'may', 'might', 'more', 'most', 'not', 'of', 'on', 'or', 'our', 'should', 'so', 'that',
  'the', 'their', 'then', 'there', 'these', 'this', 'to', 'was', 'we', 'were', 'what', 'when',
  'where', 'which', 'who', 'why', 'will', 'with', 'you', 'your'
]);

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[`*_>#]/g, ' ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text) {
  return normalize(text)
    .split(' ')
    .map(t => t.trim())
    .filter(Boolean)
    .filter(t => t.length >= 2 && !STOPWORDS.has(t));
}

function makeAnchorId(title) {
  return normalize(title).replace(/\s+/g, '-');
}

export function parseMarkdownSections(markdown) {
  const lines = String(markdown || '').split('\n');
  const sections = [];
  let current = null;

  const pushCurrent = () => {
    if (!current) return;
    const text = current.lines.join('\n').trim();
    sections.push({
      level: current.level,
      title: current.title,
      anchor: makeAnchorId(current.title),
      text,
      tokens: tokenize(`${current.title}\n${text}`)
    });
  };

  for (const line of lines) {
    const m = line.match(/^(#{1,3})\s+(.+?)\s*$/);
    if (m) {
      pushCurrent();
      current = {
        level: m[1].length,
        title: m[2],
        lines: []
      };
    } else if (current) {
      current.lines.push(line);
    }
  }
  pushCurrent();

  return sections.filter(s => s.title && s.text);
}

function scoreSection(section, queryTokens) {
  if (!queryTokens.length) return 0;
  const tokenSet = new Set(section.tokens);
  let score = 0;

  for (const t of queryTokens) {
    if (tokenSet.has(t)) score += 3;
    if (section.anchor.includes(t)) score += 5;
    if (normalize(section.title).includes(t)) score += 6;
  }

  const overlap = queryTokens.filter(t => tokenSet.has(t)).length;
  score += Math.min(10, overlap * 2);

  return score;
}

export function searchUserGuide(sections, query, { limit = 3 } = {}) {
  const queryTokens = tokenize(query);
  const scored = sections
    .map(s => ({ section: s, score: scoreSection(s, queryTokens) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
}

export function buildExcerpt(text, { maxChars = 600, maxLines = 10 } = {}) {
  const lines = String(text || '').split('\n').map(l => l.trimEnd());
  const kept = [];
  let chars = 0;

  for (const line of lines) {
    if (!line.trim()) continue;
    const nextChars = chars + line.length + 1;
    if (kept.length >= maxLines || nextChars > maxChars) break;
    kept.push(line);
    chars = nextChars;
  }

  const excerpt = kept.join('\n').trim();
  return excerpt || String(text || '').slice(0, maxChars).trim();
}

export function getContextSuggestion(pathname) {
  const path = String(pathname || '');

  if (path === '/' || path === '/design') return { title: 'Agents', query: 'agents create agent delete agent design mode' };
  if (path.match(/^\/[^/]+\/dashboard$/)) return { title: 'Dashboard & Analytics', query: 'dashboard analytics tool usage heatmap metrics' };
  if (path.match(/^\/[^/]+\/memories$/)) return { title: 'Sessions', query: 'sessions memories processing status unprocessed processed re-processing' };
  if (path.match(/^\/[^/]+\/memories\/[^/]+$/)) return { title: 'Sessions', query: 'view session messages tool calls metadata' };
  if (path.match(/^\/[^/]+\/policies$/)) return { title: 'Policies', query: 'policies composite checks violation logic severity' };
  if (path.match(/^\/[^/]+\/issues$/)) return { title: 'Issues & Review', query: 'issues review resolve unresolve compliance status filters' };
  if (path.match(/^\/[^/]+\/compliance\/[^/]+$/)) return { title: 'Issues & Review', query: 'compliance review violations messages tool flow more info' };
  if (path.match(/^\/[^/]+\/variants-flow$/)) return { title: 'Agent Variants & Tool Flows', query: 'variants tool flows transitions aggregated graph' };

  return { title: 'Getting Started', query: 'getting started quick start' };
}

