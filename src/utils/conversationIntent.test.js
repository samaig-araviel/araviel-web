import { describe, it, expect } from 'vitest';
import { hashString, summariseTitle, buildSubtitle, PROSE, CTAS } from './conversationIntent';

describe('hashString', () => {
  it('returns a stable unsigned 32-bit integer', () => {
    const h = hashString('hello');
    expect(Number.isInteger(h)).toBe(true);
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThan(2 ** 32);
    expect(hashString('hello')).toBe(h);
  });

  it('distinguishes similar inputs', () => {
    expect(hashString('abc')).not.toBe(hashString('abd'));
  });

  it('handles nullish input without throwing', () => {
    expect(() => hashString(undefined)).not.toThrow();
    expect(() => hashString(null)).not.toThrow();
  });
});

describe('summariseTitle', () => {
  it('trims whitespace and collapses spaces', () => {
    expect(summariseTitle('   hello   world  ')).toBe('hello world');
  });

  it('strips wrapping quotes and trailing punctuation', () => {
    expect(summariseTitle('"Launch email draft."')).toBe('Launch email draft');
    expect(summariseTitle('“Paris itinerary—”')).toBe('Paris itinerary');
  });

  it('truncates on a word boundary with an ellipsis', () => {
    const long = 'This is a very long conversation title that keeps going and going';
    const out = summariseTitle(long, 30);
    expect(out.endsWith('…')).toBe(true);
    expect(out.length).toBeLessThanOrEqual(31);
    expect(out).not.toMatch(/\s…$/);
  });

  it('defaults to a 36 character ceiling', () => {
    const long = 'a '.repeat(40).trim();
    expect(summariseTitle(long).length).toBeLessThanOrEqual(37);
  });

  it('returns empty string for nullish or non-string input', () => {
    expect(summariseTitle(undefined)).toBe('');
    expect(summariseTitle(null)).toBe('');
    expect(summariseTitle(42)).toBe('');
  });
});

describe('buildSubtitle', () => {
  const subject = 'launch email';

  it('returns a prose string containing the subject and a CTA from the shared bank', () => {
    const { prose, cta } = buildSubtitle(subject, 'conv-1');
    expect(prose).toContain(subject);
    expect(CTAS).toContain(cta);
  });

  it('is deterministic for the same seed + subject', () => {
    const a = buildSubtitle(subject, 'conv-42');
    const b = buildSubtitle(subject, 'conv-42');
    expect(a).toEqual(b);
  });

  it('varies across different seeds', () => {
    const seeds = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const proses = new Set(seeds.map((s) => buildSubtitle(subject, s).prose));
    expect(proses.size).toBeGreaterThan(1);
  });

  it('never renders an unresolved token', () => {
    for (const seed of ['x', 'y', 'z', '1', '2', '3']) {
      const { prose } = buildSubtitle(subject, seed);
      expect(prose).not.toMatch(/\{[^}]+\}/);
    }
  });

  it('reads as a complete sentence ending in a full stop', () => {
    for (const seed of ['1', '2', '3', '4', '5']) {
      const { prose } = buildSubtitle(subject, seed);
      expect(prose.trim().endsWith('.')).toBe(true);
    }
  });

  it('reads naturally for any kind of subject phrase', () => {
    const subjects = [
      'Group trip plan and budget',
      'Launch email',
      'Refactor auth middleware',
      'What is vector search?',
      'Paris itinerary for October',
      'Draft a launch email',
    ];
    for (const s of subjects) {
      for (let i = 0; i < PROSE.length; i += 1) {
        const { prose } = buildSubtitle(s, `seed-${i}`);
        expect(prose).toContain(s);
        expect(prose).not.toMatch(/[-\u2013\u2014]/);
      }
    }
  });
});

describe('PROSE bank', () => {
  it('exposes at least 5 universal variants', () => {
    expect(PROSE.length).toBeGreaterThanOrEqual(5);
  });

  it('every template contains {subject}', () => {
    for (const template of PROSE) {
      expect(template).toContain('{subject}');
    }
  });

  it('no template contains a hyphen, en dash, or em dash', () => {
    for (const template of PROSE) {
      expect(template).not.toMatch(/[-\u2013\u2014]/);
    }
  });

  it('every template ends with a full stop', () => {
    for (const template of PROSE) {
      expect(template.trim().endsWith('.')).toBe(true);
    }
  });

  it('treats {subject} as the object of a preposition for grammar safety', () => {
    // Each template should introduce the subject with a preposition
    // ("on", "to", "with", "about") so the line reads correctly
    // regardless of whether the title is a noun phrase, verb phrase
    // or question.
    const safeLeadIns = / (on|to|with|about) \{subject\}/;
    for (const template of PROSE) {
      expect(template).toMatch(safeLeadIns);
    }
  });
});

describe('CTAS bank', () => {
  it('exposes at least 4 unique CTAs', () => {
    expect(new Set(CTAS).size).toBe(CTAS.length);
    expect(CTAS.length).toBeGreaterThanOrEqual(4);
  });

  it('contains no dashes', () => {
    for (const cta of CTAS) {
      expect(cta).not.toMatch(/[-\u2013\u2014]/);
    }
  });
});
