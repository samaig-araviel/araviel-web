/**
 * File generation service — generates downloadable files from structured AI content.
 *
 * Supported formats:
 * - PDF, DOCX, XLSX, PPTX (via libraries)
 * - CSV, TXT, JSON, HTML, Markdown (native)
 *
 * Each generator takes a parsed file spec and returns a Blob.
 */

import { saveAs } from 'file-saver';

// ─── Format Registry ────────────────────────────────────────────────────────

const FORMAT_GENERATORS = {
  pdf: generatePDF,
  docx: generateDOCX,
  xlsx: generateXLSX,
  pptx: generatePPTX,
  csv: generateCSV,
  txt: generateTXT,
  json: generateJSON,
  html: generateHTML,
  md: generateMarkdown,
  markdown: generateMarkdown,
  xml: generateXML,
  sql: generateSQL,
  yaml: generateYAML,
  yml: generateYAML,
};

export const SUPPORTED_FORMATS = Object.keys(FORMAT_GENERATORS);

export const FORMAT_LABELS = {
  pdf: 'PDF Document',
  docx: 'Word Document',
  xlsx: 'Excel Spreadsheet',
  pptx: 'PowerPoint Presentation',
  csv: 'CSV Spreadsheet',
  txt: 'Text File',
  json: 'JSON File',
  html: 'HTML File',
  md: 'Markdown File',
  markdown: 'Markdown File',
  xml: 'XML File',
  sql: 'SQL File',
  yaml: 'YAML File',
  yml: 'YAML File',
};

export const FORMAT_ICONS = {
  pdf: 'pdf',
  docx: 'word',
  xlsx: 'excel',
  pptx: 'powerpoint',
  csv: 'excel',
  txt: 'text',
  json: 'code',
  html: 'code',
  md: 'text',
  markdown: 'text',
  xml: 'code',
  sql: 'code',
  yaml: 'code',
  yml: 'code',
};

/**
 * Parse and validate a file spec from the AI.
 */
export function parseFileSpec(specString) {
  try {
    const spec = typeof specString === 'string' ? JSON.parse(specString) : specString;
    if (!spec || !spec.filename || !spec.format) return null;
    const format = spec.format.toLowerCase();
    if (!FORMAT_GENERATORS[format]) return null;
    return { ...spec, format };
  } catch {
    return null;
  }
}

/**
 * Generate and download a file from a parsed spec.
 */
export async function generateAndDownload(spec) {
  const generator = FORMAT_GENERATORS[spec.format];
  if (!generator) throw new Error(`Unsupported format: ${spec.format}`);

  const blob = await generator(spec);
  saveAs(blob, spec.filename);
}

// ─── PDF Generator ──────────────────────────────────────────────────────────

async function generatePDF(spec) {
  const pdfMake = await import('pdfmake/build/pdfmake');
  // pdfmake needs fonts — use built-in Roboto
  const pdfFonts = await import('pdfmake/build/vfs_fonts');
  if (pdfFonts.pdfMake) {
    pdfMake.default.vfs = pdfFonts.pdfMake.vfs;
  } else if (pdfFonts.default?.pdfMake) {
    pdfMake.default.vfs = pdfFonts.default.pdfMake.vfs;
  }

  const content = buildPdfContent(spec);
  const docDefinition = {
    content,
    defaultStyle: {
      font: 'Roboto',
      fontSize: 11,
      lineHeight: 1.4,
    },
    styles: {
      title: { fontSize: 22, bold: true, margin: [0, 0, 0, 12] },
      subtitle: { fontSize: 14, color: '#666666', margin: [0, 0, 0, 20] },
      heading1: { fontSize: 18, bold: true, margin: [0, 18, 0, 8] },
      heading2: { fontSize: 15, bold: true, margin: [0, 14, 0, 6] },
      heading3: { fontSize: 13, bold: true, margin: [0, 10, 0, 4] },
      paragraph: { margin: [0, 0, 0, 8] },
      tableHeader: { bold: true, fillColor: '#f3f4f6', color: '#111827' },
      code: { font: 'Roboto', fontSize: 9.5, background: '#f5f5f5', margin: [0, 4, 0, 4] },
      listItem: { margin: [0, 2, 0, 2] },
    },
    pageMargins: [50, 50, 50, 50],
    info: {
      title: spec.title || spec.filename,
      creator: 'Araviel',
    },
  };

  return new Promise((resolve, reject) => {
    try {
      const pdf = pdfMake.default.createPdf(docDefinition);
      pdf.getBlob((blob) => resolve(blob));
    } catch (err) {
      reject(err);
    }
  });
}

function buildPdfContent(spec) {
  const content = [];
  if (spec.title) content.push({ text: spec.title, style: 'title' });
  if (spec.subtitle) content.push({ text: spec.subtitle, style: 'subtitle' });

  if (spec.content?.sections) {
    for (const section of spec.content.sections) {
      content.push(...pdfSection(section));
    }
  } else if (spec.content?.text) {
    content.push({ text: spec.content.text, style: 'paragraph' });
  } else if (typeof spec.content === 'string') {
    content.push({ text: spec.content, style: 'paragraph' });
  }

  return content;
}

function pdfSection(section) {
  switch (section.type) {
    case 'heading':
      return [{ text: section.text, style: `heading${section.level || 1}` }];

    case 'paragraph':
      return [{ text: section.text, style: 'paragraph' }];

    case 'table': {
      const body = [];
      if (section.headers) {
        body.push(section.headers.map((h) => ({ text: h, style: 'tableHeader' })));
      }
      if (section.rows) {
        for (const row of section.rows) {
          body.push(row.map((cell) => ({ text: String(cell ?? '') })));
        }
      }
      return [
        {
          table: {
            headerRows: section.headers ? 1 : 0,
            widths: Array(body[0]?.length || 1).fill('*'),
            body,
          },
          layout: 'lightHorizontalLines',
          margin: [0, 8, 0, 8],
        },
      ];
    }

    case 'list': {
      const list = (section.items || []).map((item) => ({ text: item, style: 'listItem' }));
      return section.ordered ? [{ ol: list, margin: [0, 4, 0, 8] }] : [{ ul: list, margin: [0, 4, 0, 8] }];
    }

    case 'code':
      return [
        {
          text: section.text || section.code,
          style: 'code',
          preserveLeadingSpaces: true,
        },
      ];

    case 'divider':
      return [{ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 500, y2: 0, lineColor: '#e5e7eb' }], margin: [0, 12, 0, 12] }];

    default:
      if (section.text) return [{ text: section.text, style: 'paragraph' }];
      return [];
  }
}

// ─── DOCX Generator ─────────────────────────────────────────────────────────

async function generateDOCX(spec) {
  const docx = await import('docx');
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    Table,
    TableRow,
    TableCell,
    WidthType,
    AlignmentType,
    BorderStyle,
  } = docx;

  const children = [];

  if (spec.title) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: spec.title, bold: true, size: 44, font: 'Calibri' })],
        spacing: { after: 200 },
      })
    );
  }

  if (spec.subtitle) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: spec.subtitle, size: 24, color: '666666', font: 'Calibri' })],
        spacing: { after: 300 },
      })
    );
  }

  const sections = spec.content?.sections || [];
  if (sections.length === 0 && spec.content?.text) {
    children.push(new Paragraph({ children: [new TextRun({ text: spec.content.text })] }));
  } else if (sections.length === 0 && typeof spec.content === 'string') {
    children.push(new Paragraph({ children: [new TextRun({ text: spec.content })] }));
  }

  for (const section of sections) {
    switch (section.type) {
      case 'heading': {
        const levelMap = { 1: HeadingLevel.HEADING_1, 2: HeadingLevel.HEADING_2, 3: HeadingLevel.HEADING_3 };
        children.push(
          new Paragraph({
            text: section.text,
            heading: levelMap[section.level] || HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 },
          })
        );
        break;
      }

      case 'paragraph':
        children.push(
          new Paragraph({
            children: [new TextRun({ text: section.text })],
            spacing: { after: 120 },
          })
        );
        break;

      case 'table': {
        const rows = [];
        if (section.headers) {
          rows.push(
            new TableRow({
              children: section.headers.map(
                (h) =>
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
                    shading: { fill: 'f3f4f6' },
                  })
              ),
            })
          );
        }
        for (const row of section.rows || []) {
          rows.push(
            new TableRow({
              children: row.map(
                (cell) =>
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: String(cell ?? '') })] })],
                  })
              ),
            })
          );
        }
        if (rows.length > 0) {
          children.push(
            new Table({
              rows,
              width: { size: 100, type: WidthType.PERCENTAGE },
            })
          );
        }
        break;
      }

      case 'list':
        for (let idx = 0; idx < (section.items || []).length; idx++) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: section.items[idx] })],
              bullet: section.ordered ? undefined : { level: 0 },
              numbering: section.ordered ? { reference: 'default-numbering', level: 0 } : undefined,
              spacing: { after: 60 },
            })
          );
        }
        break;

      case 'code':
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: section.text || section.code,
                font: 'Courier New',
                size: 20,
              }),
            ],
            spacing: { before: 120, after: 120 },
          })
        );
        break;

      default:
        if (section.text) {
          children.push(new Paragraph({ children: [new TextRun({ text: section.text })] }));
        }
    }
  }

  const doc = new Document({
    creator: 'Araviel',
    title: spec.title || spec.filename,
    sections: [{ children }],
    numbering: {
      config: [
        {
          reference: 'default-numbering',
          levels: [
            {
              level: 0,
              format: docx.LevelFormat?.DECIMAL || 'decimal',
              text: '%1.',
              alignment: AlignmentType.LEFT,
            },
          ],
        },
      ],
    },
  });

  const buffer = await Packer.toBlob(doc);
  return buffer;
}

// ─── XLSX Generator ─────────────────────────────────────────────────────────

async function generateXLSX(spec) {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.default.Workbook();
  workbook.creator = 'Araviel';
  workbook.created = new Date();

  const sheets = spec.content?.sheets || [spec.content];
  for (const sheetSpec of sheets) {
    const name = sheetSpec?.name || spec.title || 'Sheet1';
    const ws = workbook.addWorksheet(name.slice(0, 31)); // Excel 31 char limit

    const headers = sheetSpec?.headers || [];
    const rows = sheetSpec?.rows || [];

    if (headers.length > 0) {
      const headerRow = ws.addRow(headers);
      headerRow.font = { bold: true, size: 11 };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F4F6' },
      };
      headerRow.border = {
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      };
    }

    for (const row of rows) {
      ws.addRow(Array.isArray(row) ? row : Object.values(row));
    }

    // Auto-fit column widths
    ws.columns.forEach((col) => {
      let maxLen = 10;
      col.eachCell({ includeEmpty: false }, (cell) => {
        const len = String(cell.value ?? '').length;
        if (len > maxLen) maxLen = len;
      });
      col.width = Math.min(maxLen + 2, 50);
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

// ─── PPTX Generator ─────────────────────────────────────────────────────────

async function generatePPTX(spec) {
  const PptxGenJS = await import('pptxgenjs');
  const pptx = new PptxGenJS.default();
  pptx.author = 'Araviel';
  pptx.title = spec.title || spec.filename;

  const slides = spec.content?.slides || [];

  if (slides.length === 0) {
    // Auto-generate a title slide + content slide from flat content
    const titleSlide = pptx.addSlide();
    titleSlide.addText(spec.title || 'Presentation', {
      x: 0.5,
      y: 1.5,
      w: 9,
      h: 1.5,
      fontSize: 36,
      bold: true,
      color: '111827',
      align: 'center',
    });
    if (spec.subtitle) {
      titleSlide.addText(spec.subtitle, {
        x: 0.5,
        y: 3.2,
        w: 9,
        h: 0.8,
        fontSize: 18,
        color: '6B7280',
        align: 'center',
      });
    }
  }

  for (const slideSpec of slides) {
    const slide = pptx.addSlide();

    if (slideSpec.title) {
      slide.addText(slideSpec.title, {
        x: 0.5,
        y: 0.3,
        w: 9,
        h: 0.8,
        fontSize: 28,
        bold: true,
        color: '111827',
      });
    }

    if (slideSpec.content) {
      const yStart = slideSpec.title ? 1.3 : 0.5;
      if (typeof slideSpec.content === 'string') {
        slide.addText(slideSpec.content, {
          x: 0.5,
          y: yStart,
          w: 9,
          h: 4,
          fontSize: 16,
          color: '374151',
          valign: 'top',
          lineSpacing: 26,
        });
      } else if (Array.isArray(slideSpec.content)) {
        // Bullet points
        const bullets = slideSpec.content.map((item) => ({
          text: item,
          options: { fontSize: 16, color: '374151', bullet: true, indentLevel: 0 },
        }));
        slide.addText(bullets, {
          x: 0.5,
          y: yStart,
          w: 9,
          h: 4,
          valign: 'top',
          lineSpacing: 28,
        });
      }
    }

    if (slideSpec.notes) {
      slide.addNotes(slideSpec.notes);
    }

    // Table on slide
    if (slideSpec.table) {
      const tableRows = [];
      if (slideSpec.table.headers) {
        tableRows.push(
          slideSpec.table.headers.map((h) => ({
            text: h,
            options: { bold: true, fill: { color: 'F3F4F6' }, color: '111827' },
          }))
        );
      }
      for (const row of slideSpec.table.rows || []) {
        tableRows.push(row.map((cell) => ({ text: String(cell ?? '') })));
      }
      if (tableRows.length > 0) {
        const yTable = slideSpec.title ? 1.3 : 0.5;
        slide.addTable(tableRows, {
          x: 0.5,
          y: yTable,
          w: 9,
          fontSize: 12,
          border: { type: 'solid', pt: 0.5, color: 'D1D5DB' },
        });
      }
    }
  }

  const blob = await pptx.write({ outputType: 'blob' });
  return new Blob([blob], {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  });
}

// ─── Plain-text generators ──────────────────────────────────────────────────

function generateCSV(spec) {
  let csv = '';
  const data = spec.content?.sheets?.[0] || spec.content;
  const headers = data?.headers || [];
  const rows = data?.rows || [];

  if (headers.length > 0) {
    csv += headers.map(csvEscape).join(',') + '\n';
  }

  for (const row of rows) {
    const cells = Array.isArray(row) ? row : Object.values(row);
    csv += cells.map((c) => csvEscape(String(c ?? ''))).join(',') + '\n';
  }

  return new Blob([csv], { type: 'text/csv;charset=utf-8' });
}

function csvEscape(value) {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

function generateTXT(spec) {
  let text = '';
  if (spec.title) text += spec.title + '\n' + '='.repeat(spec.title.length) + '\n\n';
  if (spec.subtitle) text += spec.subtitle + '\n\n';

  if (spec.content?.sections) {
    for (const section of spec.content.sections) {
      switch (section.type) {
        case 'heading':
          text += '\n' + section.text + '\n' + '-'.repeat(section.text.length) + '\n\n';
          break;
        case 'paragraph':
          text += section.text + '\n\n';
          break;
        case 'table':
          if (section.headers) text += section.headers.join('\t') + '\n';
          for (const row of section.rows || []) text += row.join('\t') + '\n';
          text += '\n';
          break;
        case 'list':
          (section.items || []).forEach((item, i) => {
            text += section.ordered ? `${i + 1}. ${item}\n` : `- ${item}\n`;
          });
          text += '\n';
          break;
        case 'code':
          text += (section.text || section.code) + '\n\n';
          break;
        default:
          if (section.text) text += section.text + '\n\n';
      }
    }
  } else if (spec.content?.text) {
    text += spec.content.text;
  } else if (typeof spec.content === 'string') {
    text += spec.content;
  }

  return new Blob([text.trimEnd()], { type: 'text/plain;charset=utf-8' });
}

function generateJSON(spec) {
  const data = spec.content?.data ?? spec.content;
  const json = JSON.stringify(data, null, 2);
  return new Blob([json], { type: 'application/json;charset=utf-8' });
}

function generateHTML(spec) {
  let html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n';
  html += `<title>${escapeHtml(spec.title || spec.filename)}</title>\n`;
  html += '<style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#1f2937;line-height:1.6}h1{font-size:2em;border-bottom:2px solid #e5e7eb;padding-bottom:8px}h2{font-size:1.5em;margin-top:1.5em}h3{font-size:1.2em}table{border-collapse:collapse;width:100%;margin:1em 0}th,td{padding:8px 12px;border:1px solid #d1d5db;text-align:left}th{background:#f3f4f6;font-weight:600}pre{background:#f9fafb;padding:12px;border-radius:6px;overflow-x:auto;font-size:14px}code{font-family:"SF Mono",Consolas,monospace}ul,ol{padding-left:1.5em}blockquote{margin:1em 0;padding:8px 16px;border-left:3px solid #d1d5db;color:#6b7280}</style>\n';
  html += '</head>\n<body>\n';

  if (spec.title) html += `<h1>${escapeHtml(spec.title)}</h1>\n`;
  if (spec.subtitle) html += `<p style="color:#6b7280;font-size:1.1em">${escapeHtml(spec.subtitle)}</p>\n`;

  if (spec.content?.sections) {
    for (const section of spec.content.sections) {
      html += htmlSection(section);
    }
  } else if (spec.content?.text) {
    html += `<p>${escapeHtml(spec.content.text)}</p>\n`;
  } else if (typeof spec.content === 'string') {
    html += `<p>${escapeHtml(spec.content)}</p>\n`;
  }

  html += '</body>\n</html>';
  return new Blob([html], { type: 'text/html;charset=utf-8' });
}

function htmlSection(section) {
  switch (section.type) {
    case 'heading':
      return `<h${section.level || 2}>${escapeHtml(section.text)}</h${section.level || 2}>\n`;
    case 'paragraph':
      return `<p>${escapeHtml(section.text)}</p>\n`;
    case 'table': {
      let t = '<table>\n';
      if (section.headers) {
        t += '<thead><tr>' + section.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('') + '</tr></thead>\n';
      }
      t += '<tbody>\n';
      for (const row of section.rows || []) {
        t += '<tr>' + row.map((c) => `<td>${escapeHtml(String(c ?? ''))}</td>`).join('') + '</tr>\n';
      }
      t += '</tbody></table>\n';
      return t;
    }
    case 'list': {
      const tag = section.ordered ? 'ol' : 'ul';
      return `<${tag}>\n${(section.items || []).map((i) => `<li>${escapeHtml(i)}</li>`).join('\n')}\n</${tag}>\n`;
    }
    case 'code':
      return `<pre><code>${escapeHtml(section.text || section.code)}</code></pre>\n`;
    default:
      return section.text ? `<p>${escapeHtml(section.text)}</p>\n` : '';
  }
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function generateMarkdown(spec) {
  let md = '';
  if (spec.title) md += `# ${spec.title}\n\n`;
  if (spec.subtitle) md += `*${spec.subtitle}*\n\n`;

  if (spec.content?.sections) {
    for (const section of spec.content.sections) {
      switch (section.type) {
        case 'heading':
          md += '#'.repeat(section.level || 2) + ' ' + section.text + '\n\n';
          break;
        case 'paragraph':
          md += section.text + '\n\n';
          break;
        case 'table':
          if (section.headers) {
            md += '| ' + section.headers.join(' | ') + ' |\n';
            md += '| ' + section.headers.map(() => '---').join(' | ') + ' |\n';
          }
          for (const row of section.rows || []) {
            md += '| ' + row.map((c) => String(c ?? '')).join(' | ') + ' |\n';
          }
          md += '\n';
          break;
        case 'list':
          (section.items || []).forEach((item, i) => {
            md += section.ordered ? `${i + 1}. ${item}\n` : `- ${item}\n`;
          });
          md += '\n';
          break;
        case 'code':
          md += '```' + (section.language || '') + '\n' + (section.text || section.code) + '\n```\n\n';
          break;
        case 'divider':
          md += '---\n\n';
          break;
        default:
          if (section.text) md += section.text + '\n\n';
      }
    }
  } else if (spec.content?.text) {
    md += spec.content.text;
  } else if (typeof spec.content === 'string') {
    md += spec.content;
  }

  return new Blob([md.trimEnd()], { type: 'text/markdown;charset=utf-8' });
}

function generateXML(spec) {
  const content = typeof spec.content === 'string' ? spec.content : JSON.stringify(spec.content, null, 2);
  return new Blob([content], { type: 'application/xml;charset=utf-8' });
}

function generateSQL(spec) {
  const content = typeof spec.content === 'string' ? spec.content : (spec.content?.text || '');
  return new Blob([content], { type: 'application/sql;charset=utf-8' });
}

function generateYAML(spec) {
  const content = typeof spec.content === 'string' ? spec.content : (spec.content?.text || '');
  return new Blob([content], { type: 'text/yaml;charset=utf-8' });
}
