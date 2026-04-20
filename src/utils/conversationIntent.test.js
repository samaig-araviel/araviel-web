import { describe, it, expect } from 'vitest';
import {
  hashString,
  inferIntent,
  summariseTitle,
  buildSubtitle,
  PROSE,
  CTAS,
} from './conversationIntent';

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

describe('inferIntent', () => {
  it.each([
    ['Draft a launch email', 'writing'],
    ['Rewrite my bio', 'writing'],
    ['Compare vector databases', 'research'],
    ['What is vector search?', 'research'],
    ['Paris itinerary for October', 'planning'],
    ['Budget for wedding venue', 'planning'],
    ['Refactor auth middleware', 'coding'],
    ['Fix the typescript error in the API', 'coding'],
    ['Analyse quarterly revenue', 'analysis'],
    ['Breakdown the investor memo', 'analysis'],
    ['Generate a logo for the brand', 'image'],
    ['Midjourney prompt for wallpaper', 'image'],
  ])('classifies %p as %p', (text, intent) => {
    expect(inferIntent(text)).toBe(intent);
  });

  it('falls back to general for unknown topics', () => {
    expect(inferIntent('Weekend thoughts')).toBe('general');
    expect(inferIntent('')).toBe('general');
    expect(inferIntent(undefined)).toBe('general');
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
    const { prose, cta } = buildSubtitle('writing', subject, 'conv-1');
    expect(prose).toContain(subject);
    expect(CTAS).toContain(cta);
  });

  it('is deterministic for the same seed + subject', () => {
    const a = buildSubtitle('research', subject, 'conv-42');
    const b = buildSubtitle('research', subject, 'conv-42');
    expect(a).toEqual(b);
  });

  it('varies across different seeds for the same intent', () => {
    const seeds = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const proses = new Set(seeds.map((s) => buildSubtitle('writing', subject, s).prose));
    expect(proses.size).toBeGreaterThan(1);
  });

  it('never renders an unresolved token', () => {
    for (const intent of Object.keys(PROSE)) {
      for (const seed of ['x', 'y', 'z', '1', '2', '3']) {
        const { prose } = buildSubtitle(intent, subject, seed);
        expect(prose).not.toMatch(/\{[^}]+\}/);
      }
    }
  });

  it('always returns a sentence ending in a full stop', () => {
    for (const intent of Object.keys(PROSE)) {
      for (const seed of ['1', '2', '3', '4', '5']) {
        const { prose } = buildSubtitle(intent, subject, seed);
        expect(prose.trim().endsWith('.')).toBe(true);
      }
    }
  });

  it('unknown intent falls back to general without throwing', () => {
    const { prose } = buildSubtitle('nonsense', subject, 'seed');
    expect(prose).toContain(subject);
  });
});

describe('PROSE banks', () => {
  it('each intent has at least 12 variants', () => {
    for (const intent of Object.keys(PROSE)) {
      expect(PROSE[intent].length).toBeGreaterThanOrEqual(12);
    }
  });

  it('every template contains {subject}', () => {
    for (const intent of Object.keys(PROSE)) {
      for (const template of PROSE[intent]) {
        expect(template).toContain('{subject}');
      }
    }
  });

  it('no template contains a hyphen, en dash, or em dash', () => {
    for (const intent of Object.keys(PROSE)) {
      for (const template of PROSE[intent]) {
        expect(template).not.toMatch(/[-\u2013\u2014]/);
      }
    }
  });

  it('every template ends with a full stop', () => {
    for (const intent of Object.keys(PROSE)) {
      for (const template of PROSE[intent]) {
        expect(template.trim().endsWith('.')).toBe(true);
      }
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
