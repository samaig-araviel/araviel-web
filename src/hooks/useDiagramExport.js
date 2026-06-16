import { useCallback, useState } from 'react';
import { saveAs } from 'file-saver';
import { useToast } from '../components/Toast/Toast';

const EXPORT_PIXEL_SCALE = 2;
const PDF_PAGE_WIDTH_PT = 595.28;
const PDF_PAGE_HEIGHT_PT = 841.89;
const PDF_PAGE_MARGIN_PT = 40;
const FALLBACK_DIAGRAM_WIDTH = 800;
const FALLBACK_DIAGRAM_HEIGHT = 600;

export function buildExportFilename(extension, now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(
    now.getHours()
  )}${pad(now.getMinutes())}`;
  return `diagram-${stamp}.${extension}`;
}

export function readSvgDimensions(svgElement) {
  const widthAttr = parseFloat(svgElement.getAttribute('width'));
  const heightAttr = parseFloat(svgElement.getAttribute('height'));
  if (
    Number.isFinite(widthAttr) &&
    Number.isFinite(heightAttr) &&
    widthAttr > 0 &&
    heightAttr > 0
  ) {
    return { width: widthAttr, height: heightAttr };
  }
  const viewBox = svgElement.getAttribute('viewBox');
  if (viewBox) {
    const parts = viewBox.split(/\s+|,/).map(Number);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      return { width: parts[2], height: parts[3] };
    }
  }
  return { width: FALLBACK_DIAGRAM_WIDTH, height: FALLBACK_DIAGRAM_HEIGHT };
}

async function rasterizeSvg(svgString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svg = doc.documentElement;
  if (!svg || svg.nodeName === 'parsererror') {
    throw new Error('Could not parse diagram SVG');
  }

  const { width, height } = readSvgDimensions(svg);
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));

  const serialized = new XMLSerializer().serializeToString(svg);
  const svgBlob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' });
  const objectUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load diagram image'));
      img.src = objectUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * EXPORT_PIXEL_SCALE);
    canvas.height = Math.round(height * EXPORT_PIXEL_SCALE);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return { canvas, width, height };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function canvasToPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('PNG encoding failed'))),
      'image/png'
    );
  });
}

async function getPdfMake() {
  const pdfMakeModule = await import('pdfmake/build/pdfmake');
  const pdfFontsModule = await import('pdfmake/build/vfs_fonts');
  const pdfMake = pdfMakeModule.default ?? pdfMakeModule;
  const fontVfs =
    pdfFontsModule.pdfMake?.vfs ??
    pdfFontsModule.default?.pdfMake?.vfs ??
    pdfFontsModule.default?.vfs;
  if (fontVfs) pdfMake.vfs = fontVfs;
  return pdfMake;
}

function fitToPage(width, height) {
  const maxWidth = PDF_PAGE_WIDTH_PT - PDF_PAGE_MARGIN_PT * 2;
  const maxHeight = PDF_PAGE_HEIGHT_PT - PDF_PAGE_MARGIN_PT * 2;
  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

function readSvgString(svgGetter) {
  if (typeof svgGetter === 'function') return svgGetter();
  if (typeof svgGetter === 'string') return svgGetter;
  return null;
}

export default function useDiagramExport(svgGetter) {
  const [isExporting, setIsExporting] = useState(false);
  const { showError } = useToast();

  const exportPng = useCallback(async () => {
    const svgString = readSvgString(svgGetter);
    if (!svgString) {
      showError('No diagram to export yet.');
      return;
    }
    setIsExporting(true);
    try {
      const { canvas } = await rasterizeSvg(svgString);
      const blob = await canvasToPngBlob(canvas);
      saveAs(blob, buildExportFilename('png'));
    } catch {
      showError('Could not export PNG. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [svgGetter, showError]);

  const exportPdf = useCallback(async () => {
    const svgString = readSvgString(svgGetter);
    if (!svgString) {
      showError('No diagram to export yet.');
      return;
    }
    setIsExporting(true);
    try {
      const { canvas, width, height } = await rasterizeSvg(svgString);
      const dataUri = canvas.toDataURL('image/png');
      const pdfMake = await getPdfMake();
      const fitted = fitToPage(width, height);

      const docDefinition = {
        content: [
          {
            image: dataUri,
            width: fitted.width,
            height: fitted.height,
            alignment: 'center',
          },
        ],
        pageMargins: [
          PDF_PAGE_MARGIN_PT,
          PDF_PAGE_MARGIN_PT,
          PDF_PAGE_MARGIN_PT,
          PDF_PAGE_MARGIN_PT,
        ],
        info: { title: 'Diagram', creator: 'Araviel' },
      };

      await new Promise((resolve, reject) => {
        try {
          pdfMake.createPdf(docDefinition).getBlob((blob) => {
            if (!blob) {
              reject(new Error('PDF encoding failed'));
              return;
            }
            saveAs(blob, buildExportFilename('pdf'));
            resolve();
          });
        } catch (err) {
          reject(err);
        }
      });
    } catch {
      showError('Could not export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [svgGetter, showError]);

  return { exportPng, exportPdf, isExporting };
}
