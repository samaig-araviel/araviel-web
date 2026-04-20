import { describe, it, expect } from 'vitest';
import { tokenize, splitLink, markerWidth } from './tokenize';

/**
 * Concatenate token text back to source — the tokenizer must be lossless so
 * the mirror aligns with the textarea character-for-character.
 */
const reassemble = (tokens) => tokens.map((t) => t.text).join('');

describe('tokenize()', () => {
  it('returns an empty list for empty input', () => {
    expect(tokenize('')).toEqual([]);
  });

  it('is lossless — reassembled tokens equal the source', () => {
    const samples = [
      'plain text',
      '# Heading\n\nBody with **bold** and *italic*.',
      '- one\n- two\n- three',
      '> quoted\n> second line',
      '```js\nconst x = 1;\n```',
      'See [docs](https://example.com) for more.',
      'Mix `code` and **bold** and _italic_ on one line.',
    ];
    for (const s of samples) {
      expect(reassemble(tokenize(s))).toBe(s);
    }
  });

  it('marks headings with a marker token', () => {
    const tokens = tokenize('# Hello');
    expect(tokens[0]).toEqual({ type: 'marker', text: '# ' });
    expect(tokens[1]).toEqual({ type: 'text', text: 'Hello' });
  });

  it('handles H1 through H6', () => {
    for (let level = 1; level <= 6; level++) {
      const hashes = '#'.repeat(level);
      const tokens = tokenize(`${hashes} Title`);
      expect(tokens[0].type).toBe('marker');
      expect(tokens[0].text).toBe(`${hashes} `);
    }
  });

  it('does NOT treat 7+ hashes as a heading', () => {
    const tokens = tokenize('####### not a heading');
    expect(tokens.find((t) => t.type === 'marker')).toBeUndefined();
  });

  it('tokenizes bold with **', () => {
    const tokens = tokenize('say **hello** world');
    const bold = tokens.find((t) => t.type === 'bold');
    expect(bold).toEqual({ type: 'bold', text: '**hello**' });
  });

  it('tokenizes bold with __', () => {
    const tokens = tokenize('__strong__');
    expect(tokens).toContainEqual({ type: 'bold', text: '__strong__' });
  });

  it('tokenizes italic with *', () => {
    const tokens = tokenize('*em*');
    expect(tokens).toContainEqual({ type: 'italic', text: '*em*' });
  });

  it('tokenizes italic with _ but NOT inside words (snake_case)', () => {
    const tokens = tokenize('my_variable_name');
    expect(tokens.every((t) => t.type === 'text')).toBe(true);
  });

  it('tokenizes standalone italic with _', () => {
    const tokens = tokenize('it is _emphasized_ here');
    expect(tokens).toContainEqual({ type: 'italic', text: '_emphasized_' });
  });

  it('tokenizes inline code', () => {
    const tokens = tokenize('run `npm install` first');
    expect(tokens).toContainEqual({ type: 'code', text: '`npm install`' });
  });

  it('tokenizes strikethrough', () => {
    const tokens = tokenize('~~gone~~');
    expect(tokens).toContainEqual({ type: 'strike', text: '~~gone~~' });
  });

  it('tokenizes links', () => {
    const tokens = tokenize('see [docs](https://example.com)');
    expect(tokens).toContainEqual({
      type: 'link',
      text: '[docs](https://example.com)',
    });
  });

  it('leaves unclosed bold as plain text', () => {
    const tokens = tokenize('**unclosed bold');
    expect(tokens).toEqual([{ type: 'text', text: '**unclosed bold' }]);
  });

  it('leaves unclosed inline code as plain text', () => {
    const tokens = tokenize('`unclosed');
    expect(tokens).toEqual([{ type: 'text', text: '`unclosed' }]);
  });

  it('does NOT highlight inline tokens inside a code fence', () => {
    const tokens = tokenize('```\nconst **not_bold** = 1;\n```');
    const fenceBody = tokens.find((t) => t.type === 'fenceBody');
    expect(fenceBody).toBeDefined();
    expect(fenceBody.text).toBe('const **not_bold** = 1;');
    // No bold/italic tokens from inside the fence.
    expect(tokens.some((t) => t.type === 'bold' || t.type === 'italic')).toBe(false);
  });

  it('handles code fence with language', () => {
    const tokens = tokenize('```js\nconst x = 1;\n```');
    expect(tokens[0]).toEqual({ type: 'fence', text: '```js' });
    expect(tokens.find((t) => t.type === 'fenceBody')).toEqual({
      type: 'fenceBody',
      text: 'const x = 1;',
    });
  });

  it('tokenizes unordered list markers', () => {
    const tokens = tokenize('- item one\n* item two\n+ item three');
    const markers = tokens.filter((t) => t.type === 'marker');
    expect(markers.map((m) => m.text)).toEqual(['- ', '* ', '+ ']);
  });

  it('tokenizes ordered list markers', () => {
    const tokens = tokenize('1. first\n2. second\n10. tenth');
    const markers = tokens.filter((t) => t.type === 'marker');
    expect(markers.map((m) => m.text)).toEqual(['1. ', '2. ', '10. ']);
  });

  it('tokenizes blockquotes', () => {
    const tokens = tokenize('> quoted text');
    expect(tokens[0]).toEqual({ type: 'marker', text: '> ' });
  });

  it('tokenizes horizontal rules', () => {
    expect(tokenize('---')).toEqual([{ type: 'hr', text: '---' }]);
    expect(tokenize('***')).toEqual([{ type: 'hr', text: '***' }]);
    expect(tokenize('___')).toEqual([{ type: 'hr', text: '___' }]);
  });

  it('preserves trailing newlines', () => {
    const tokens = tokenize('hello\n');
    expect(reassemble(tokens)).toBe('hello\n');
  });

  it('preserves empty lines', () => {
    const tokens = tokenize('a\n\nb');
    expect(reassemble(tokens)).toBe('a\n\nb');
  });

  it('combines heading + inline markup', () => {
    const tokens = tokenize('# Title with **bold**');
    expect(tokens[0]).toEqual({ type: 'marker', text: '# ' });
    expect(tokens).toContainEqual({ type: 'bold', text: '**bold**' });
  });

  it('does not misfire on a lone asterisk', () => {
    const tokens = tokenize('2 * 3 = 6');
    expect(tokens).toEqual([{ type: 'text', text: '2 * 3 = 6' }]);
  });
});

describe('splitLink()', () => {
  it('splits a well-formed link into parts', () => {
    expect(splitLink('[docs](https://example.com)')).toEqual({
      open: '[',
      label: 'docs',
      mid: '](',
      url: 'https://example.com',
      close: ')',
    });
  });

  it('returns null for malformed links', () => {
    expect(splitLink('[broken')).toBeNull();
    expect(splitLink('no-brackets')).toBeNull();
  });
});

describe('markerWidth()', () => {
  it('returns correct widths for inline types', () => {
    expect(markerWidth('code')).toBe(1);
    expect(markerWidth('italic')).toBe(1);
    expect(markerWidth('bold')).toBe(2);
    expect(markerWidth('strike')).toBe(2);
    expect(markerWidth('text')).toBe(0);
  });
});
