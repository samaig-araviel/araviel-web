import { describe, it, expect } from 'vitest';
import { dedupeCitations, normalizeCitationUrl } from './dedupeCitations';

describe('normalizeCitationUrl', () => {
  it('returns empty string for empty or non-string input', () => {
    expect(normalizeCitationUrl('')).toBe('');
    expect(normalizeCitationUrl(null)).toBe('');
    expect(normalizeCitationUrl(undefined)).toBe('');
  });

  it('strips protocol and leading www.', () => {
    expect(normalizeCitationUrl('https://www.example.com/page')).toBe('example.com/page');
    expect(normalizeCitationUrl('http://example.com/page')).toBe('example.com/page');
  });

  it('strips trailing slashes on the path', () => {
    expect(normalizeCitationUrl('https://example.com/page/')).toBe('example.com/page');
    expect(normalizeCitationUrl('https://example.com/')).toBe('example.com');
  });

  it('lowercases the host but preserves path casing', () => {
    expect(normalizeCitationUrl('https://Example.COM/MyPage')).toBe('example.com/MyPage');
  });

  it('drops the fragment but keeps the query', () => {
    expect(normalizeCitationUrl('https://example.com/a?x=1#section')).toBe('example.com/a?x=1');
  });
});

describe('dedupeCitations', () => {
  it('returns an empty array for empty or invalid input', () => {
    expect(dedupeCitations([])).toEqual([]);
    expect(dedupeCitations(null)).toEqual([]);
    expect(dedupeCitations(undefined)).toEqual([]);
  });

  it('collapses exact-duplicate URLs to one entry', () => {
    const out = dedupeCitations([
      { url: 'https://example.com/a', title: 'A' },
      { url: 'https://example.com/a', title: 'A' },
      { url: 'https://example.com/a', title: 'A' },
    ]);
    expect(out).toHaveLength(1);
  });

  it('treats protocol, www, and trailing-slash variants as duplicates', () => {
    const out = dedupeCitations([
      { url: 'https://example.com/page', title: 'Example' },
      { url: 'http://www.example.com/page/', title: 'Example' },
      { url: 'https://EXAMPLE.com/page', title: 'Example' },
    ]);
    expect(out).toHaveLength(1);
  });

  it('preserves insertion order of first occurrence', () => {
    const out = dedupeCitations([
      { url: 'https://a.com', title: 'A' },
      { url: 'https://b.com', title: 'B' },
      { url: 'https://a.com', title: 'A' },
      { url: 'https://c.com', title: 'C' },
    ]);
    expect(out.map((c) => c.url)).toEqual(['https://a.com', 'https://b.com', 'https://c.com']);
  });

  it('upgrades the kept record with a snippet from a later duplicate', () => {
    const out = dedupeCitations([
      { url: 'https://example.com/a', title: 'A' },
      { url: 'https://example.com/a', title: 'A', snippet: 'extra' },
    ]);
    expect(out[0].snippet).toBe('extra');
  });

  it('skips records with missing or empty URLs', () => {
    const out = dedupeCitations([
      { url: '', title: 'empty' },
      { url: 'https://example.com/a', title: 'A' },
    ]);
    expect(out).toHaveLength(1);
  });

  it('collapses a highly inflated citation list', () => {
    const base = Array.from({ length: 12 }, (_, i) => ({
      url: `https://araveil.com/page-${i}`,
      title: 'Araveil',
    }));
    const inflated = Array(246)
      .fill(null)
      .flatMap(() => base);
    expect(inflated).toHaveLength(2952);
    const out = dedupeCitations(inflated);
    expect(out).toHaveLength(12);
  });

  it('does not mutate the input array', () => {
    const input = [
      { url: 'https://example.com/a', title: 'A' },
      { url: 'https://example.com/a', title: 'A' },
    ];
    const snapshot = JSON.parse(JSON.stringify(input));
    dedupeCitations(input);
    expect(input).toEqual(snapshot);
  });
});
