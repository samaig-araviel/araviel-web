/**
 * Detect and parse a GitHub-Flavoured Markdown table starting at `lines[startIdx]`.
 *
 * Tolerant of LLM output quirks (Perplexity, ChatGPT, Claude all emit at least one):
 *   - Blank lines between rows are skipped.
 *   - Separator cells accept one or more dashes (`-`, `--`, `---`, …) with
 *     optional leading/trailing colon for alignment.
 *   - Leading and trailing pipes on a row are optional.
 *   - Body rows shorter than the header are padded with empty cells; longer
 *     rows are truncated to the header width.
 *
 * Returns `null` if no valid table starts at `startIdx`. Otherwise returns
 * `{ headers, rows, alignments, endIdx }` where `endIdx` is the line index
 * immediately after the last consumed row.
 *
 * @param {string[]} lines
 * @param {number} startIdx
 * @returns {{
 *   headers: string[],
 *   rows: string[][],
 *   alignments: Array<'left' | 'center' | 'right'>,
 *   endIdx: number,
 * } | null}
 */
export function parseMarkdownTable(lines, startIdx) {
  const isPipeLine = (raw) => raw.includes('|');
  const isSeparatorCell = (cell) => /^:?-+:?$/.test(cell.trim());

  const splitRow = (raw) => {
    let s = raw.trim();
    if (s.startsWith('|')) s = s.slice(1);
    if (s.endsWith('|')) s = s.slice(0, -1);
    return s.split('|').map((cell) => cell.trim());
  };

  const candidateIndices = [];
  let blankRun = 0;
  for (let i = startIdx; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed === '') {
      blankRun++;
      if (blankRun >= 2) break;
      continue;
    }
    if (!isPipeLine(trimmed)) break;
    candidateIndices.push(i);
    blankRun = 0;
  }

  if (candidateIndices.length < 2) return null;

  let separatorRow = -1;
  for (let k = 1; k < candidateIndices.length; k++) {
    const cells = splitRow(lines[candidateIndices[k]]);
    if (cells.length > 0 && cells.every(isSeparatorCell)) {
      separatorRow = k;
      break;
    }
  }
  if (separatorRow < 1) return null;

  const headers = splitRow(lines[candidateIndices[separatorRow - 1]]);
  const separatorCells = splitRow(lines[candidateIndices[separatorRow]]);
  if (separatorCells.length !== headers.length) return null;

  const alignments = separatorCells.map((cell) => {
    const trimmed = cell.trim();
    const leftMarker = trimmed.startsWith(':');
    const rightMarker = trimmed.endsWith(':');
    if (leftMarker && rightMarker) return 'center';
    if (rightMarker) return 'right';
    return 'left';
  });

  const rows = candidateIndices.slice(separatorRow + 1).map((idx) => {
    const cells = splitRow(lines[idx]);
    while (cells.length < headers.length) cells.push('');
    return cells.slice(0, headers.length);
  });

  return {
    headers,
    rows,
    alignments,
    endIdx: candidateIndices[candidateIndices.length - 1] + 1,
  };
}
