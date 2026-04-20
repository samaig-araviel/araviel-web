/**
 * Normalizes a citation URL for duplicate detection.
 *
 * Strips protocol, a leading "www.", trailing slashes, and the URL fragment,
 * and lowercases the host. The query string is preserved because distinct
 * queries identify distinct pages (e.g. YouTube video ids).
 *
 * @param {string} raw
 * @returns {string}
 */
export function normalizeCitationUrl(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  try {
    const url = new URL(trimmed);
    const host = url.host.replace(/^www\./, '').toLowerCase();
    const path = url.pathname.replace(/\/+$/, '');
    return `${host}${path}${url.search}`;
  } catch {
    return trimmed;
  }
}

/**
 * Returns a new array containing the first occurrence of each citation,
 * deduplicated by normalized URL. Order is preserved. When duplicates are
 * merged, a later entry with a non-empty snippet or a more descriptive title
 * upgrades the kept record.
 *
 * @param {Array<{url: string, title?: string, snippet?: string}>} citations
 * @returns {Array<{url: string, title?: string, snippet?: string}>}
 */
export function dedupeCitations(citations) {
  if (!Array.isArray(citations) || citations.length === 0) return [];
  const byKey = new Map();
  for (const c of citations) {
    if (!c || typeof c.url !== 'string' || c.url.length === 0) continue;
    const key = normalizeCitationUrl(c.url);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, { ...c });
      continue;
    }
    if (!existing.snippet && c.snippet) {
      existing.snippet = c.snippet;
    }
    if ((!existing.title || existing.title === existing.url) && c.title && c.title !== c.url) {
      existing.title = c.title;
    }
  }
  return Array.from(byKey.values());
}
