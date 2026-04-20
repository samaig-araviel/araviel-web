/**
 * Pure helpers for the dynamic homepage subtitle.
 *
 * Given a recent conversation's title (or its first user message as a
 * fallback), we infer an intent, trim the subject into a readable phrase,
 * and build a prose + CTA pair deterministically — the same conversation
 * always renders the same sentence, but different conversations get
 * meaningful variety.
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
    /\b(code|coding|bug|debug|error|stack ?trace|function|api|endpoint|refactor|typescript|javascript|python|react|vue|svelte|rust|go(?:lang)?|java|kotlin|swift|sql|regex|compile|build|deploy|docker|kubernetes|k8s|test suite|unit test|jest|vitest|pytest|npm|yarn|package\.json|webpack|vite)\b/i,
  ],
  [
    'writing',
    /\b(write|writing|draft|drafting|rewrite|edit|editing|copy|essay|blog|post|article|email|letter|newsletter|caption|tagline|headline|bio|memoir|poem|story|script|pitch|proofread|polish|outline)\b/i,
  ],
  [
    'research',
    /\b(research|compare|comparison|sources|citations|literature|study|studies|evidence|vs\.?|versus|what is|why does|how does|pros and cons|difference between|explain the)\b/i,
  ],
  [
    'planning',
    /\b(plan|planning|itinerary|schedule|agenda|roadmap|timeline|budget|trip|travel|vacation|holiday|wedding|launch|strategy|goals|calendar|checklist)\b/i,
  ],
  [
    'analysis',
    /\b(analy[sz]e|analy[sz]is|breakdown|review|audit|critique|evaluate|assess|interpret|unpack|dissect|deep dive|summari[sz]e|tldr)\b/i,
  ],
  [
    'image',
    /\b(image|picture|photo|photograph|illustration|logo|icon|wallpaper|artwork|painting|sketch|render|generate|diffusion|midjourney|dalle|dall-e|stable diffusion)\b/i,
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
 * @param {number} [maxChars=48]
 * @returns {string}
 */
export function summariseTitle(text, maxChars = 48) {
  if (!text || typeof text !== 'string') return '';
  let out = text.replace(/\s+/g, ' ').trim();
  out = out.replace(/^["'“”‘’`]+|["'“”‘’`]+$/g, '');
  out = out.replace(/[.!?,;:\-–—]+$/g, '').trim();
  if (out.length <= maxChars) return out;
  const clipped = out.slice(0, maxChars);
  const lastSpace = clipped.lastIndexOf(' ');
  const base = lastSpace > maxChars * 0.6 ? clipped.slice(0, lastSpace) : clipped;
  return `${base.replace(/[.!?,;:\-–—]+$/g, '').trim()}…`;
}

/**
 * Prose bank. Each intent has at least 10 variants. Templates may
 * contain `{subject}` (always resolved) and optional contextual tokens
 * `{recency}` and `{timeOfDay}`. Templates with an unresolved token are
 * skipped during selection so we never render dangling phrases.
 */
export const PROSE = {
  writing: [
    'You were drafting {subject} earlier —',
    '{subject} was still taking shape when you stepped away —',
    'Your draft of {subject} is waiting where you left it —',
    'You were mid-sentence on {subject} —',
    "That {subject} piece isn't quite finished —",
    'You were shaping the voice of {subject} —',
    'Your draft for {subject} is half-written —',
    '{subject} — you were finding the right opening —',
    'Your {subject} draft is still resting —',
    'You were polishing {subject} {recency} —',
    'You were rewriting {subject} {timeOfDay} —',
    '{subject} was almost there when you paused —',
  ],
  research: [
    'You were digging into {subject} —',
    'You were chasing sources on {subject} —',
    '{subject} — you had a few threads open —',
    'You were weighing options for {subject} —',
    'Your {subject} research is still open —',
    'You were comparing notes on {subject} —',
    'You were mapping {subject} {recency} —',
    'You had questions about {subject} —',
    'You were gathering context on {subject} —',
    "{subject} — you weren't quite done looking —",
    'You were cross-checking {subject} {timeOfDay} —',
    '{subject} still has a few loose ends to tie —',
  ],
  planning: [
    'You were mapping out {subject} —',
    'Your {subject} plan is still coming together —',
    '{subject} — you were sketching the shape of it —',
    'You were lining up the pieces for {subject} —',
    'Your {subject} is still in draft form —',
    'You were weighing options for {subject} {recency} —',
    '{subject} — a few decisions still to make —',
    'You were outlining {subject} {timeOfDay} —',
    'Your {subject} plan is almost ready —',
    'You were pacing out {subject} —',
    'That {subject} plan is still taking shape —',
    '{subject} — you had it half-built —',
  ],
  coding: [
    'You were mid-flow on {subject} —',
    'You were deep in {subject} —',
    '{subject} was almost passing —',
    'You were debugging {subject} —',
    'Your {subject} branch is still open —',
    'You were refactoring {subject} {recency} —',
    '{subject} — you had the shape of it —',
    'You were wiring up {subject} —',
    'You were tracing through {subject} —',
    '{subject} was one step from green —',
    'You were shipping {subject} {timeOfDay} —',
    'Your {subject} fix is one edit away —',
  ],
  analysis: [
    'You were unpacking {subject} —',
    'You were pulling {subject} apart —',
    '{subject} — you were following the thread —',
    'You were breaking down {subject} —',
    'You were weighing {subject} {recency} —',
    'Your {subject} review is still open —',
    'You were reading between the lines of {subject} —',
    '{subject} — a few more angles to consider —',
    'You were tracing the logic of {subject} —',
    'You were stress-testing {subject} {timeOfDay} —',
    '{subject} still has more to say —',
    'You were laying out {subject} piece by piece —',
  ],
  image: [
    'Your {subject} image session is still open —',
    'You were iterating on {subject} —',
    'You were refining {subject} —',
    '{subject} — you were dialling in the look —',
    'Your {subject} was almost there —',
    'You were tweaking {subject} {recency} —',
    'You were reshaping {subject} —',
    '{subject} — a few more passes and it lands —',
    'You were exploring variations of {subject} —',
    'You were composing {subject} {timeOfDay} —',
    '{subject} just needs one more pass —',
    'You were colouring in {subject} —',
  ],
  general: [
    'You were chatting about {subject} —',
    "{subject} — you weren't quite done —",
    'That {subject} thread is still open —',
    'You had more to say about {subject} —',
    'You were circling {subject} {recency} —',
    '{subject} — you had it on your mind —',
    'You were working through {subject} —',
    'You left off on {subject} —',
    '{subject} was still in motion when you paused —',
    'You were picking apart {subject} {timeOfDay} —',
    '{subject} is still sitting with you —',
    'You were mulling over {subject} —',
  ],
};

/**
 * Shared CTA bank. Picked independently of the prose so intent and CTA
 * vary in lockstep without feeling patterned.
 */
export const CTAS = ['Continue', 'Pick it up', 'Keep going', 'Jump back in', 'Resume', 'Open it'];

/**
 * Resolve optional contextual tokens based on the "now" reference time
 * and the conversation's last-updated timestamp.
 * @param {Date} now
 * @param {Date|null} updatedAt
 * @returns {{ recency: string|null; timeOfDay: string }}
 */
function resolveTokens(now, updatedAt) {
  const hour = now.getHours();
  let timeOfDay;
  if (hour < 5) timeOfDay = 'last night';
  else if (hour < 12) timeOfDay = 'this morning';
  else if (hour < 18) timeOfDay = 'this afternoon';
  else timeOfDay = 'tonight';

  let recency = null;
  if (updatedAt instanceof Date && !Number.isNaN(updatedAt.getTime())) {
    const sameDay =
      updatedAt.getFullYear() === now.getFullYear() &&
      updatedAt.getMonth() === now.getMonth() &&
      updatedAt.getDate() === now.getDate();
    if (sameDay) {
      recency = 'earlier today';
    } else {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const wasYesterday =
        updatedAt.getFullYear() === yesterday.getFullYear() &&
        updatedAt.getMonth() === yesterday.getMonth() &&
        updatedAt.getDate() === yesterday.getDate();
      if (wasYesterday) recency = 'yesterday';
    }
  }

  return { recency, timeOfDay };
}

function applyTokens(template, subject, tokens) {
  let out = template.replace(/\{subject\}/g, subject);
  if (out.includes('{recency}')) {
    if (!tokens.recency) return null;
    out = out.replace(/\{recency\}/g, tokens.recency);
  }
  if (out.includes('{timeOfDay}')) {
    out = out.replace(/\{timeOfDay\}/g, tokens.timeOfDay);
  }
  return out;
}

/**
 * Build a deterministic { prose, cta } pair for the given intent + subject.
 * Selection is indexed by hashString(seed) — pass the conversation id as
 * the seed so the same conversation always renders the same sentence.
 *
 * @param {string} intent
 * @param {string} subject
 * @param {string} [seed] — conversation id or any stable identifier
 * @param {object} [opts]
 * @param {Date}   [opts.now=new Date()]
 * @param {Date|null} [opts.updatedAt=null]
 * @returns {{ prose: string; cta: string }}
 */
export function buildSubtitle(intent, subject, seed = '', opts = {}) {
  const now = opts.now instanceof Date ? opts.now : new Date();
  const updatedAt = opts.updatedAt instanceof Date ? opts.updatedAt : null;
  const tokens = resolveTokens(now, updatedAt);

  const bank = PROSE[intent] || PROSE.general;
  const hash = hashString(`${seed}::${subject}`);

  let prose = null;
  for (let i = 0; i < bank.length; i += 1) {
    const template = bank[(hash + i) % bank.length];
    const resolved = applyTokens(template, subject, tokens);
    if (resolved) {
      prose = resolved;
      break;
    }
  }

  if (!prose) {
    const fallback = bank.find((t) => !t.includes('{recency}')) || bank[0];
    prose = applyTokens(fallback, subject, tokens) || fallback.replace(/\{[^}]+\}/g, subject);
  }

  const cta = CTAS[hash % CTAS.length];
  return { prose, cta };
}
