/**
 * Pure helpers for the dynamic homepage subtitle.
 *
 * Given a recent conversation's title (or its first user message as a
 * fallback), we infer an intent, trim the subject into a readable phrase,
 * and build a prose + CTA pair deterministically — the same conversation
 * always renders the same sentence, but different conversations get
 * meaningful variety. Templates are intentionally short, sentence-cased,
 * and free of em-dashes / hyphens so the line reads naturally on a
 * single row.
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

const INTENT_KEYWORDS = [
  [
    'coding',
    /\b(code|coding|bug|debug|error|stack ?trace|function|api|endpoint|refactor|typescript|javascript|python|react|vue|svelte|rust|go(?:lang)?|java|kotlin|swift|sql|regex|compile|build|deploy|docker|kubernetes|k8s|test suite|unit test|jest|vitest|pytest|npm|yarn|webpack|vite)\b/i,
  ],
  [
    'writing',
    /\b(write|writing|draft|drafting|rewrite|edit|editing|copy|essay|blog|post|article|email|letter|newsletter|caption|tagline|headline|bio|memoir|poem|story|script|pitch|proofread|polish|outline)\b/i,
  ],
  [
    'research',
    /\b(research|compare|comparison|sources|citations|literature|study|studies|evidence|versus|what is|why does|how does|pros and cons|difference between|explain the)\b/i,
  ],
  [
    'planning',
    /\b(plan|planning|itinerary|schedule|agenda|roadmap|timeline|budget|trip|travel|vacation|holiday|wedding|launch|strategy|goals|calendar|checklist)\b/i,
  ],
  [
    'analysis',
    /\b(analyse|analyze|analysis|breakdown|review|audit|critique|evaluate|assess|interpret|unpack|dissect|deep dive|summarise|summarize|tldr)\b/i,
  ],
  [
    'image',
    /\b(image|picture|photo|photograph|illustration|logo|icon|wallpaper|artwork|painting|sketch|render|generate|diffusion|midjourney|dalle|stable diffusion)\b/i,
  ],
];

/**
 * Infer a high-level intent from free-form conversation text.
 * Falls back to 'general' when nothing matches.
 * @param {string} text
 * @returns {'writing'|'research'|'planning'|'coding'|'analysis'|'image'|'general'}
 */
export function inferIntent(text) {
  if (!text || typeof text !== 'string') return 'general';
  for (const [intent, pattern] of INTENT_KEYWORDS) {
    if (pattern.test(text)) return intent;
  }
  return 'general';
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
 * Prose bank. Each intent has at least 12 short, dash-free variants —
 * one complete sentence ending in a full stop. The CTA word is rendered
 * separately so the full line reads as either one sentence + imperative
 * or as a pair of micro-sentences.
 */
export const PROSE = {
  writing: [
    'You were drafting {subject}.',
    'Your {subject} draft is still resting.',
    'Your draft of {subject} is waiting.',
    'You were mid sentence on {subject}.',
    'That {subject} piece is unfinished.',
    'You were polishing {subject}.',
    'Your {subject} draft is half written.',
    'You were rewriting {subject}.',
    '{subject} was almost there.',
    'You were shaping the voice of {subject}.',
    'You were editing {subject}.',
    'Your {subject} is ready for one more pass.',
  ],
  research: [
    'You were digging into {subject}.',
    'You were chasing sources on {subject}.',
    'You had a few threads open on {subject}.',
    'Your {subject} research is still open.',
    'You were comparing notes on {subject}.',
    'You had questions about {subject}.',
    'You were gathering context on {subject}.',
    '{subject} still has loose ends.',
    'You were cross checking {subject}.',
    'You were mapping {subject}.',
    'You were weighing the angles on {subject}.',
    '{subject} still has open questions.',
  ],
  planning: [
    'You were mapping out {subject}.',
    'Your {subject} is still taking shape.',
    'You were sketching {subject}.',
    'You were lining up the pieces of {subject}.',
    'Your {subject} is still in draft.',
    'You were weighing options for {subject}.',
    '{subject} has decisions still to make.',
    'You were outlining {subject}.',
    'Your {subject} is almost ready.',
    'You were pacing out {subject}.',
    'You had {subject} half built.',
    '{subject} is one detail away from done.',
  ],
  coding: [
    'You were mid flow on {subject}.',
    'You were deep in {subject}.',
    '{subject} was almost passing.',
    'You were debugging {subject}.',
    'Your work on {subject} is still open.',
    'You were refactoring {subject}.',
    'You had the shape of {subject}.',
    'You were wiring up {subject}.',
    'You were tracing through {subject}.',
    '{subject} is one step from green.',
    'You were shipping {subject}.',
    'Your {subject} fix is one edit away.',
  ],
  analysis: [
    'You were unpacking {subject}.',
    'You were pulling {subject} apart.',
    'You were following the thread on {subject}.',
    'You were breaking down {subject}.',
    'You were weighing {subject}.',
    'Your review of {subject} is still open.',
    'You were reading between the lines of {subject}.',
    '{subject} has more angles to consider.',
    'You were tracing the logic of {subject}.',
    'You were stress testing {subject}.',
    '{subject} still has more to say.',
    'You were laying out {subject} piece by piece.',
  ],
  image: [
    'Your {subject} session is still open.',
    'You were iterating on {subject}.',
    'You were refining {subject}.',
    'You were dialling in the look of {subject}.',
    'Your {subject} was almost there.',
    'You were tweaking {subject}.',
    'You were reshaping {subject}.',
    '{subject} just needs one more pass.',
    'You were exploring variations of {subject}.',
    'You were composing {subject}.',
    'You were colouring in {subject}.',
    '{subject} is one render away.',
  ],
  general: [
    'You were chatting about {subject}.',
    'That {subject} thread is still open.',
    'You had more to say about {subject}.',
    'You were circling {subject}.',
    '{subject} was on your mind.',
    'You were working through {subject}.',
    'You left off on {subject}.',
    '{subject} is still in motion.',
    'You were picking apart {subject}.',
    '{subject} is sitting with you.',
    'You were mulling over {subject}.',
    'You were sitting with {subject}.',
  ],
};

/**
 * Shared CTA bank. Picked independently of the prose so the imperative
 * varies in lockstep with the sentence.
 */
export const CTAS = ['Continue', 'Pick it up', 'Keep going', 'Jump back in', 'Resume', 'Open it'];

/**
 * Build a deterministic { prose, cta } pair for the given intent + subject.
 * Selection is indexed by hashString(seed::subject) — pass the
 * conversation id as the seed so the same conversation always renders
 * the same sentence.
 *
 * @param {string} intent
 * @param {string} subject
 * @param {string} [seed] — conversation id or any stable identifier
 * @returns {{ prose: string; cta: string }}
 */
export function buildSubtitle(intent, subject, seed = '') {
  const bank = PROSE[intent] || PROSE.general;
  const hash = hashString(`${seed}::${subject}`);
  const prose = bank[hash % bank.length].replace(/\{subject\}/g, subject);
  const cta = CTAS[hash % CTAS.length];
  return { prose, cta };
}
