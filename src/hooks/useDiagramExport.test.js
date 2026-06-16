import { describe, it, expect } from 'vitest';
import { buildExportFilename, readSvgDimensions } from './useDiagramExport';

function svgElementFrom(markup) {
  return new DOMParser().parseFromString(markup, 'image/svg+xml').documentElement;
}

describe('buildExportFilename', () => {
  it('formats a stamp from the supplied date', () => {
    const now = new Date(2025, 1, 7, 9, 4);
    expect(buildExportFilename('png', now)).toBe('diagram-2025-02-07-0904.png');
  });

  it('preserves the requested extension', () => {
    const now = new Date(2024, 11, 31, 23, 59);
    expect(buildExportFilename('pdf', now)).toBe('diagram-2024-12-31-2359.pdf');
  });
});

describe('readSvgDimensions', () => {
  it('uses numeric width and height attributes when present', () => {
    const svg = svgElementFrom('<svg width="200" height="120"></svg>');
    expect(readSvgDimensions(svg)).toEqual({ width: 200, height: 120 });
  });

  it('falls back to viewBox when width/height are missing', () => {
    const svg = svgElementFrom('<svg viewBox="0 0 320 180"></svg>');
    expect(readSvgDimensions(svg)).toEqual({ width: 320, height: 180 });
  });

  it('returns a sensible default when nothing is set', () => {
    const svg = svgElementFrom('<svg></svg>');
    expect(readSvgDimensions(svg)).toEqual({ width: 800, height: 600 });
  });

  it('ignores width/height when they are not finite positives', () => {
    const svg = svgElementFrom('<svg width="0" height="-10" viewBox="0 0 100 50"></svg>');
    expect(readSvgDimensions(svg)).toEqual({ width: 100, height: 50 });
  });
});
