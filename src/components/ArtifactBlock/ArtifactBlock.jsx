import { useMemo } from 'react';
import { EyeIcon, MaximizeIcon } from '../Icons';
import styles from './ArtifactBlock.module.css';

const TITLE_REGEX = /<title[^>]*>([\s\S]*?)<\/title>/i;
const H1_REGEX = /<h1[^>]*>([\s\S]*?)<\/h1>/i;
const TAG_STRIP_REGEX = /<[^>]+>/g;

function parseArtifactTitle(html) {
  const titleMatch = html.match(TITLE_REGEX);
  if (titleMatch) {
    const decoded = titleMatch[1].trim();
    if (decoded) return decoded.slice(0, 80);
  }
  const h1Match = html.match(H1_REGEX);
  if (h1Match) {
    const stripped = h1Match[1].replace(TAG_STRIP_REGEX, '').trim();
    if (stripped) return stripped.slice(0, 80);
  }
  return null;
}

export default function ArtifactBlock({ spec, isStreaming = false, onOpen }) {
  const meta = useMemo(() => {
    if (!spec || typeof spec !== 'string') return null;
    const trimmed = spec.trim();
    if (!trimmed) return null;
    return {
      title: parseArtifactTitle(trimmed) || 'Visual',
      lineCount: trimmed.split('\n').length,
    };
  }, [spec]);

  const interactive = typeof onOpen === 'function';

  if (!interactive && isStreaming) {
    return (
      <div className={styles.opener} data-state="streaming" aria-busy="true">
        <span className={styles.icon}>
          <span className={styles.spinner} />
        </span>
        <span className={styles.text}>
          <span className={styles.title}>{meta?.title || 'Building visual'}</span>
          <span className={styles.meta}>HTML · streaming</span>
        </span>
      </div>
    );
  }

  if (!meta) {
    return (
      <div className={styles.error}>
        <span>Could not render visual content</span>
      </div>
    );
  }

  const metaLabel = `HTML · ${meta.lineCount} ${meta.lineCount === 1 ? 'line' : 'lines'} · Visual`;

  return (
    <button
      type="button"
      className={styles.opener}
      onClick={interactive ? onOpen : undefined}
      disabled={!interactive}
      aria-label={`Open ${meta.title} in canvas`}
    >
      <span className={styles.icon}>
        <EyeIcon />
      </span>
      <span className={styles.text}>
        <span className={styles.title}>{meta.title}</span>
        <span className={styles.meta}>{metaLabel}</span>
      </span>
      <span className={styles.arrow}>
        <MaximizeIcon />
      </span>
    </button>
  );
}
