/**
 * Pure helpers for the dynamic homepage subtitle.
 *
 * Given a recent conversation's title (or its first user message as a
 * fallback) we trim it into a short subject phrase and build a
 * deterministic prose + CTA pair. The same conversation always renders
 * the same sentence; different conversations get subtle variety.
 *
 * Grammar safety: every template treats `{subject}` as the object of a
 * preposition ("on {subject}", "with {subject}", "about {subject}"),
 * never as the grammatical subject of the sentence. That keeps the
 * line readable for *any* conversation title, whether it's a verb
 * phrase ("Draft a launch email"), a noun phrase ("Group trip plan
 * and budget") or a question ("What is vector search?").
 */

/**
 * FNV-1a 32-bit hash. Small, stable, no deps.
 * @param {string} input
 * @returns {number} unsigned 32-bit integer
 */
export function hashString(input) {
  let hash = 0x811c9dc5;
  const str = String(input ?? '');
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Trim + clean a title or first-message string into a short readable
 * subject phrase. Strips wrapping quotes, trailing punctuation and
 * collapses whitespace. Truncates on a word boundary.
 * @param {string} text
 * @param {number} [maxChars=36]
 * @returns {string}
 */
export function summariseTitle(text, maxChars = 36) {
  if (!text || typeof text !== 'string') return '';
  let out = text.replace(/\s+/g, ' ').trim();
  out = out.replace(/^["'“”‘’`]+|["'“”‘’`]+$/g, '');
  out = out.replace(/[.!?,;:\u2013\u2014]+$/g, '').trim();
  if (out.length <= maxChars) return out;
  const clipped = out.slice(0, maxChars);
  const lastSpace = clipped.lastIndexOf(' ');
  const base = lastSpace > maxChars * 0.6 ? clipped.slice(0, lastSpace) : clipped;
  return `${base.replace(/[.!?,;:\u2013\u2014]+$/g, '').trim()}\u2026`;
}

/**
 * Universal prose bank. Every template reads naturally for any
 * conversation title because `{subject}` is always the object of a
 * preposition rather than the grammatical subject.
 */
export const PROSE = [
  'Pick up where you left off on {subject}.',
  'Continue where you left off on {subject}.',
  'You left off on {subject}.',
  'Your thread on {subject} is still open.',
  'Your chat about {subject} is still open.',
  "Come back to {subject} when you're ready.",
  'Carry on with {subject}.',
];

/**
 * Short CTA imperatives. Paired with any prose above without creating
 * redundancy or grammar clashes.
 */
export const CTAS = ['Continue', 'Resume', 'Pick it up', 'Open it'];

/**
 * Build a deterministic { prose, cta } pair for a subject.
 * Selection is indexed by hashString(seed::subject) — pass the
 * conversation id as the seed so the same conversation always renders
 * the same sentence.
 *
 * @param {string} subject
 * @param {string} [seed]
 * @returns {{ prose: string; cta: string }}
 */
export function buildSubtitle(subject, seed = '') {
  const hash = hashString(`${seed}::${subject}`);
  const prose = PROSE[hash % PROSE.length].replace(/\{subject\}/g, subject);
  const cta = CTAS[hash % CTAS.length];
  return { prose, cta };
}
