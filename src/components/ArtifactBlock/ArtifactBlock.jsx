import { useMemo, useId, useState } from 'react';
import DOMPurify from 'dompurify';
import styles from './ArtifactBlock.module.css';

/**
 * ArtifactBlock — renders model-generated HTML+CSS safely via DOMPurify.
 *
 * All JavaScript is stripped. Only safe HTML elements and CSS are rendered.
 * CSS is scoped to a unique wrapper class to prevent style leakage.
 *
 * Expects `spec` to be a raw HTML string (with optional <style> tags).
 */

const ALLOWED_TAGS = [
  'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  'strong', 'em', 'b', 'i', 'u', 'br', 'hr', 'wbr',
  'img', 'svg', 'path', 'circle', 'rect', 'ellipse', 'text', 'tspan',
  'g', 'line', 'polygon', 'polyline', 'defs', 'clippath', 'use',
  'lineargradient', 'radialgradient', 'stop',
  'style', 'section', 'header', 'footer', 'nav', 'main', 'article',
  'aside', 'figure', 'figcaption', 'details', 'summary',
  'sup', 'sub', 'abbr', 'small', 'mark', 'del', 'ins', 'blockquote',
  'pre', 'code', 'a',
];

const ALLOWED_ATTR = [
  'class', 'style', 'id', 'colspan', 'rowspan', 'alt', 'title',
  'href', 'target', 'rel',
  // SVG attributes
  'viewBox', 'viewbox', 'd', 'fill', 'stroke', 'stroke-width', 'stroke-linecap',
  'stroke-linejoin', 'stroke-dasharray', 'stroke-dashoffset',
  'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2',
  'width', 'height', 'transform', 'xmlns', 'xmlns:xlink',
  'font-size', 'text-anchor', 'dominant-baseline', 'alignment-baseline',
  'points', 'opacity', 'fill-opacity', 'stroke-opacity',
  'offset', 'stop-color', 'stop-opacity', 'gradientUnits', 'gradientTransform',
  'clip-path', 'clip-rule', 'fill-rule',
  'preserveAspectRatio', 'xlink:href',
  // Table attributes
  'scope', 'span',
];

const FORBID_TAGS = [
  'script', 'iframe', 'object', 'embed', 'form', 'input',
  'textarea', 'button', 'select', 'option', 'link', 'meta',
  'base', 'applet', 'frame', 'frameset', 'layer',
];

/**
 * Scope all CSS selectors in <style> blocks to a wrapper class.
 * This prevents artifact styles from leaking to the parent page.
 */
function scopeCSS(html, scopeClass) {
  return html.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (match, cssContent) => {
    const scoped = cssContent.replace(
      /([^{}@/][^{]*)\{/g,
      (ruleMatch, selector) => {
        const scopedSelectors = selector
          .split(',')
          .map((s) => {
            const trimmed = s.trim();
            if (!trimmed) return s;
            if (trimmed.startsWith('@')) return s;
            if (trimmed === ':root' || trimmed === 'html' || trimmed === 'body') {
              return ` .${scopeClass}`;
            }
            if (trimmed === '*') return ` .${scopeClass} *`;
            return ` .${scopeClass} ${trimmed}`;
          })
          .join(',');
        return `${scopedSelectors}{`;
      }
    );
    return `<style>${scoped}</style>`;
  });
}

function sanitizeHTML(html, scopeClass) {
  const scoped = scopeCSS(html, scopeClass);
  return DOMPurify.sanitize(scoped, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ADD_TAGS: ['style'],
    FORBID_TAGS,
    FORBID_ATTR: [
      'onerror', 'onload', 'onclick', 'ondblclick', 'onmousedown',
      'onmouseup', 'onmouseover', 'onmousemove', 'onmouseout',
      'onfocus', 'onblur', 'onsubmit', 'onchange', 'onkeydown',
      'onkeyup', 'onkeypress', 'oncontextmenu',
    ],
    ADD_URI_SAFE_ATTR: ['href'],
  });
}

export default function ArtifactBlock({ spec, isStreaming = false }) {
  const uniqueId = useId().replace(/:/g, '');
  const scopeClass = `artifact-scope-${uniqueId}`;
  const [showSource, setShowSource] = useState(false);

  const sanitized = useMemo(() => {
    if (!spec || typeof spec !== 'string' || spec.trim().length === 0) return null;
    return sanitizeHTML(spec.trim(), scopeClass);
  }, [spec, scopeClass]);

  if (!sanitized) {
    if (isStreaming) {
      return (
        <div className={styles.root}>
          <div className={styles.placeholder}>
            <div className={styles.placeholderPulse} />
            <span className={styles.placeholderText}>Building visual...</span>
          </div>
        </div>
      );
    }
    return (
      <div className={styles.error}>
        <span>Could not render visual content</span>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {showSource ? (
        <div className={styles.sourceView}>
          <pre className={styles.sourceCode}>{spec}</pre>
        </div>
      ) : (
        <div
          className={`${styles.artifactContent} ${scopeClass}`}
          dangerouslySetInnerHTML={{ __html: sanitized }}
        />
      )}
      <div className={styles.footer}>
        <button
          className={styles.sourceToggle}
          onClick={(e) => {
            e.stopPropagation();
            setShowSource(!showSource);
          }}
        >
          {showSource ? 'Show visual' : 'View source'}
        </button>
      </div>
    </div>
  );
}
