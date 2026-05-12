import { describe, it, expect } from 'vitest';
import { parseMarkdownTable } from './parseMarkdownTable';

const linesOf = (s) => s.split('\n');

describe('parseMarkdownTable', () => {
  it('parses a strict GFM table', () => {
    const lines = linesOf(
      ['| Name | Age |', '| --- | --- |', '| Ada | 36 |', '| Lin | 28 |'].join('\n')
    );
    const table = parseMarkdownTable(lines, 0);
    expect(table).not.toBeNull();
    expect(table.headers).toEqual(['Name', 'Age']);
    expect(table.rows).toEqual([
      ['Ada', '36'],
      ['Lin', '28'],
    ]);
    expect(table.alignments).toEqual(['left', 'left']);
    expect(table.endIdx).toBe(4);
  });

  it('tolerates blank lines between rows (the Perplexity case)', () => {
    const lines = linesOf(
      [
        '| Departure (BST) | Arrival (PDT) | Notes |',
        '',
        '|:-|:-|:-|',
        '',
        '| 23:40 PM May 25 | 01:20 AM May 26 | Very early morning |',
        '',
        '| 23:50 PM May 25 | 01:30 AM May 26 | Latest practical |',
      ].join('\n')
    );
    const table = parseMarkdownTable(lines, 0);
    expect(table).not.toBeNull();
    expect(table.headers).toEqual(['Departure (BST)', 'Arrival (PDT)', 'Notes']);
    expect(table.rows).toHaveLength(2);
    expect(table.rows[0]).toEqual(['23:40 PM May 25', '01:20 AM May 26', 'Very early morning']);
    expect(table.alignments).toEqual(['left', 'left', 'left']);
  });

  it('accepts single-dash separator cells', () => {
    const lines = linesOf(['| A | B |', '| - | - |', '| 1 | 2 |'].join('\n'));
    const table = parseMarkdownTable(lines, 0);
    expect(table).not.toBeNull();
    expect(table.rows).toEqual([['1', '2']]);
  });

  it('parses alignment markers correctly', () => {
    const lines = linesOf(['| L | C | R |', '|:--|:-:|--:|', '| 1 | 2 | 3 |'].join('\n'));
    const table = parseMarkdownTable(lines, 0);
    expect(table.alignments).toEqual(['left', 'center', 'right']);
  });

  it('accepts rows without leading/trailing pipes', () => {
    const lines = linesOf(['Name | Age', '--- | ---', 'Ada | 36'].join('\n'));
    const table = parseMarkdownTable(lines, 0);
    expect(table).not.toBeNull();
    expect(table.headers).toEqual(['Name', 'Age']);
    expect(table.rows).toEqual([['Ada', '36']]);
  });

  it('pads short rows and truncates over-long rows to the header width', () => {
    const lines = linesOf(
      ['| A | B | C |', '| - | - | - |', '| 1 | 2 |', '| 1 | 2 | 3 | 4 |'].join('\n')
    );
    const table = parseMarkdownTable(lines, 0);
    expect(table.rows).toEqual([
      ['1', '2', ''],
      ['1', '2', '3'],
    ]);
  });

  it('returns null for non-table content with a stray pipe', () => {
    const lines = linesOf(['This sentence | contains a pipe.', 'Plain follow-up line.'].join('\n'));
    expect(parseMarkdownTable(lines, 0)).toBeNull();
  });

  it('returns null when the separator row is missing', () => {
    const lines = linesOf(['| A | B |', '| 1 | 2 |', '| 3 | 4 |'].join('\n'));
    expect(parseMarkdownTable(lines, 0)).toBeNull();
  });

  it('returns null when separator column count does not match the header', () => {
    const lines = linesOf(['| A | B | C |', '| - | - |', '| 1 | 2 | 3 |'].join('\n'));
    expect(parseMarkdownTable(lines, 0)).toBeNull();
  });

  it('stops at two consecutive blank lines', () => {
    const lines = linesOf(['| A | B |', '| - | - |', '| 1 | 2 |', '', '', '| 3 | 4 |'].join('\n'));
    const table = parseMarkdownTable(lines, 0);
    expect(table.rows).toEqual([['1', '2']]);
    expect(table.endIdx).toBe(3);
  });

  it('reports endIdx pointing just past the last row, ignoring trailing blank lines', () => {
    const lines = linesOf(['| A |', '| - |', '| 1 |', ''].join('\n'));
    const table = parseMarkdownTable(lines, 0);
    expect(table.endIdx).toBe(3);
  });
});
