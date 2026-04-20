import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';
import styles from './MarkdownTextarea.module.css';
import { tokenize, splitLink, markerWidth } from './tokenize';

/**
 * Render one tokenizer output as React children. Colour-only decoration keeps
 * the mirror character-aligned with the transparent textarea above it.
 *
 * @param {Array<{ type: string, text: string }>} tokens
 * @returns {import('react').ReactNode[]}
 */
function renderTokens(tokens) {
  return tokens.map((tok, i) => {
    const key = i;
    switch (tok.type) {
      case 'text':
      case 'fenceBody':
        return tok.type === 'fenceBody' ? (
          <span key={key} className={styles.fenceBody}>
            {tok.text}
          </span>
        ) : (
          tok.text
        );

      case 'marker':
      case 'fence':
        return (
          <span key={key} className={styles.muted}>
            {tok.text}
          </span>
        );

      case 'hr':
        return (
          <span key={key} className={styles.hr}>
            {tok.text}
          </span>
        );

      case 'bold':
      case 'italic':
      case 'strike': {
        const width = markerWidth(tok.type);
        const open = tok.text.slice(0, width);
        const content = tok.text.slice(width, tok.text.length - width);
        const close = tok.text.slice(tok.text.length - width);
        const className = tok.type === 'strike' ? styles.strike : undefined;
        return (
          <span key={key} className={className}>
            <span className={styles.muted}>{open}</span>
            {content}
            <span className={styles.muted}>{close}</span>
          </span>
        );
      }

      case 'code': {
        const content = tok.text.slice(1, -1);
        return (
          <span key={key} className={styles.code}>
            <span className={styles.muted}>`</span>
            {content}
            <span className={styles.muted}>`</span>
          </span>
        );
      }

      case 'link': {
        const parts = splitLink(tok.text);
        if (!parts) return tok.text;
        return (
          <span key={key}>
            <span className={styles.muted}>{parts.open}</span>
            <span className={styles.linkText}>{parts.label}</span>
            <span className={styles.muted}>{parts.mid}</span>
            <span className={styles.linkUrl}>{parts.url}</span>
            <span className={styles.muted}>{parts.close}</span>
          </span>
        );
      }

      default:
        return tok.text;
    }
  });
}

/**
 * MarkdownTextarea is a drop-in replacement for `<textarea>` that highlights
 * markdown syntax as the user types. It layers a transparent textarea over a
 * style-synced mirror; the textarea owns selection, caret, IME, and paste
 * behaviour, while the mirror paints token-aware colour decoration.
 *
 * Contract with callers:
 *   - Receives the same `className` the call site previously applied to its
 *     textarea. That class must declare font-family/size/line-height/padding
 *     and min/max height — we forward it to BOTH the mirror and the textarea
 *     so both layers size and flow identically.
 *   - Forwards the imperative textarea handle via `ref`, so existing code
 *     that calls `.focus()`, `.style.height = 'auto'`, or reads `.value`
 *     keeps working unchanged.
 *   - All other props (value, onChange, onKeyDown, placeholder, disabled,
 *     rows, aria-label, etc.) pass through to the underlying textarea.
 *
 * Accessibility: the mirror is marked `aria-hidden` so assistive tech only
 * sees the textarea. Spell-check and autocomplete remain native.
 */
const MarkdownTextarea = forwardRef(function MarkdownTextarea(props, ref) {
  const { value = '', className = '', onScroll, ...rest } = props;

  const textareaRef = useRef(null);
  const mirrorRef = useRef(null);

  useImperativeHandle(ref, () => textareaRef.current, []);

  const tokens = useMemo(() => tokenize(value), [value]);
  const rendered = useMemo(() => renderTokens(tokens), [tokens]);

  // Keep the mirror's scroll position in sync with the textarea so long
  // content stays aligned when the user scrolls the composer.
  const handleScroll = useCallback(
    (event) => {
      const mirror = mirrorRef.current;
      const textarea = textareaRef.current;
      if (mirror && textarea) {
        mirror.scrollTop = textarea.scrollTop;
        mirror.scrollLeft = textarea.scrollLeft;
      }
      if (onScroll) onScroll(event);
    },
    [onScroll]
  );

  // Re-sync scroll after any value change — auto-resize or external updates
  // can shift scrollTop by a fraction of a line.
  useLayoutEffect(() => {
    const mirror = mirrorRef.current;
    const textarea = textareaRef.current;
    if (mirror && textarea) {
      mirror.scrollTop = textarea.scrollTop;
    }
  }, [value]);

  const endsWithNewline = value.length > 0 && value.endsWith('\n');

  return (
    <div className={styles.wrap}>
      <div ref={mirrorRef} className={`${styles.mirror} ${className}`} aria-hidden="true">
        {rendered}
        {endsWithNewline && <span className={styles.trailingNewline} />}
      </div>
      <textarea
        {...rest}
        ref={textareaRef}
        value={value}
        onScroll={handleScroll}
        className={`${styles.textarea} ${className}`}
      />
    </div>
  );
});

export default MarkdownTextarea;
