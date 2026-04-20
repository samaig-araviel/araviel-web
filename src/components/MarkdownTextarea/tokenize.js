/**
 * Tokenize markdown text for the in-composer syntax-highlight mirror.
 *
 * Returns a flat list of `{ type, text }` tokens. Consumers render each token
 * with a CSS class to visually distinguish markers (#, **, `, etc.) from their
 * content. Whitespace — including the newlines between lines — is preserved
 * exactly in the token stream so `white-space: pre-wrap` rendering matches the
 * source textarea character for character.
 *
 * Design constraint: this tokenizer is lenient — unclosed markers (e.g. `**foo`
 * with no closing `**`) fall through as plain text, so the user sees their
 * in-progress typing without a premature highlight.
 */

// Block-level patterns (anchored to line start).
const FENCE_RE = /^```/;
const HEADING_RE = /^(#{1,6})(\s+)(.*)$/;
const UL_RE = /^([-*+])(\s+)(.*)$/;
const OL_RE = /^(\d+\.)(\s+)(.*)$/;
const BQ_RE = /^(>)(\s?)(.*)$/;
const HR_RE = /^(?:---|\*\*\*|___)\s*$/;

// Inline patterns. Order matters: code first so *foo* inside `code` isn't
// mistaken for italic. Each pattern is self-contained (no line crossings)
// and requires a closing marker — unclosed tokens stay as plain text.
const INLINE_RE =
  /(`[^`\n]+?`|\*\*[^*\n]+?\*\*|__[^_\n]+?__|\*[^*\n]+?\*|(?<![A-Za-z0-9_])_[^_\n]+?_(?![A-Za-z0-9_])|~~[^~\n]+?~~|\[[^\]\n]+?\]\([^)\n]+?\))/;

/**
 * Classify a single inline match into its token type.
 * @param {string} s - A string matched by INLINE_RE.
 * @returns {'code'|'bold'|'italic'|'strike'|'link'}
 */
function classifyInline(s) {
  if (s.startsWith('`')) return 'code';
  if (s.startsWith('**') || s.startsWith('__')) return 'bold';
  if (s.startsWith('~~')) return 'strike';
  if (s.startsWith('[')) return 'link';
  return 'italic';
}

/**
 * Tokenize inline content (a single line, no newlines inside).
 * @param {string} line
 * @returns {Array<{ type: string, text: string }>}
 */
function tokenizeInline(line) {
  if (!line) return [];
  const parts = line.split(INLINE_RE);
  const out = [];
  for (const part of parts) {
    if (!part) continue;
    if (INLINE_RE.test(part) && part.length >= 2) {
      out.push({ type: classifyInline(part), text: part });
    } else {
      out.push({ type: 'text', text: part });
    }
  }
  return out;
}

/**
 * Append `\n` to the last token's text (folding newlines into the preceding
 * token keeps the token list short and preserves `white-space: pre-wrap`).
 * If the last token is a marker (which shouldn't absorb trailing whitespace,
 * e.g. an HR line), push a dedicated text token instead.
 * @param {Array<{ type: string, text: string }>} tokens
 */
function appendNewline(tokens) {
  if (tokens.length === 0) {
    tokens.push({ type: 'text', text: '\n' });
    return;
  }
  const last = tokens[tokens.length - 1];
  if (last.type === 'text') {
    last.text += '\n';
  } else {
    tokens.push({ type: 'text', text: '\n' });
  }
}

/**
 * Tokenize a full markdown source string.
 * @param {string} text
 * @returns {Array<{ type: string, text: string }>}
 */
export function tokenize(text) {
  if (!text) return [];
  const lines = text.split('\n');
  const tokens = [];
  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isLast = i === lines.length - 1;

    if (FENCE_RE.test(line)) {
      tokens.push({ type: 'fence', text: line });
      inFence = !inFence;
      if (!isLast) appendNewline(tokens);
      continue;
    }

    if (inFence) {
      if (line.length > 0) tokens.push({ type: 'fenceBody', text: line });
      if (!isLast) appendNewline(tokens);
      continue;
    }

    if (HR_RE.test(line)) {
      tokens.push({ type: 'hr', text: line });
      if (!isLast) appendNewline(tokens);
      continue;
    }

    const heading = HEADING_RE.exec(line);
    if (heading) {
      tokens.push({ type: 'marker', text: heading[1] + heading[2] });
      tokens.push(...tokenizeInline(heading[3]));
      if (!isLast) appendNewline(tokens);
      continue;
    }

    const ul = UL_RE.exec(line);
    if (ul) {
      tokens.push({ type: 'marker', text: ul[1] + ul[2] });
      tokens.push(...tokenizeInline(ul[3]));
      if (!isLast) appendNewline(tokens);
      continue;
    }

    const ol = OL_RE.exec(line);
    if (ol) {
      tokens.push({ type: 'marker', text: ol[1] + ol[2] });
      tokens.push(...tokenizeInline(ol[3]));
      if (!isLast) appendNewline(tokens);
      continue;
    }

    const bq = BQ_RE.exec(line);
    if (bq) {
      tokens.push({ type: 'marker', text: bq[1] + bq[2] });
      tokens.push(...tokenizeInline(bq[3]));
      if (!isLast) appendNewline(tokens);
      continue;
    }

    tokens.push(...tokenizeInline(line));
    if (!isLast) appendNewline(tokens);
  }

  return tokens;
}

/**
 * Split a `[text](url)` token into its five structural parts so the renderer
 * can style them differently (markers muted, link text accented, url faint).
 * @param {string} raw - The full `[text](url)` literal.
 * @returns {{ open: string, label: string, mid: string, url: string, close: string } | null}
 */
export function splitLink(raw) {
  const m = /^(\[)([^\]\n]+?)(\]\()([^)\n]+?)(\))$/.exec(raw);
  if (!m) return null;
  return { open: m[1], label: m[2], mid: m[3], url: m[4], close: m[5] };
}

/**
 * Return the marker width for inline tokens so the renderer can slice content
 * out of bracketed spans without reparsing (e.g. `**foo**` → marker=2).
 * @param {string} type
 * @returns {number}
 */
export function markerWidth(type) {
  switch (type) {
    case 'code':
      return 1;
    case 'italic':
      return 1;
    case 'bold':
    case 'strike':
      return 2;
    default:
      return 0;
  }
}
