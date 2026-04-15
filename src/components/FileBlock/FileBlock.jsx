import { useState, useMemo, useCallback } from 'react';
import {
  parseFileSpec,
  generateAndDownload,
  FORMAT_LABELS,
  FORMAT_ICONS,
  SUPPORTED_FORMATS,
} from '../../services/fileGenerator';
import { logger } from '../../lib/logger';
import styles from './FileBlock.module.css';

/**
 * FileBlock — renders a file download card from a ```file JSON spec.
 * Shows file icon, name, format, size estimate, and a download button.
 * Generates the actual file client-side on click.
 */
export default function FileBlock({ spec, isStreaming = false }) {
  const [status, setStatus] = useState('idle'); // idle | generating | done | error
  const [errorMsg, setErrorMsg] = useState('');

  const parsed = useMemo(() => parseFileSpec(spec), [spec]);

  const handleDownload = useCallback(async () => {
    if (!parsed) return;
    setStatus('generating');
    setErrorMsg('');
    try {
      await generateAndDownload(parsed);
      setStatus('done');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      logger.error('File generation failed', err, {
        route: 'file.generate',
        format: parsed?.format,
      });
      setErrorMsg(err?.userMessage || 'We could not generate that file. Please try again.');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    }
  }, [parsed]);

  if (!parsed) {
    if (isStreaming) {
      return (
        <div className={styles.card}>
          <div className={styles.cardInner}>
            <div className={`${styles.icon} ${styles.icon_text}`} style={{ opacity: 0.4 }}>
              <FileTypeIcon type="text" />
            </div>
            <div className={styles.info}>
              <span className={styles.filename} style={{ opacity: 0.5 }}>
                Generating file...
              </span>
              <span className={styles.meta}>Preparing download</span>
            </div>
            <div className={styles.action}>
              <div className={styles.spinner}>
                <SpinnerIcon />
              </div>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className={styles.errorCard}>
        <span className={styles.errorText}>Could not parse file specification</span>
      </div>
    );
  }

  const formatLabel = FORMAT_LABELS[parsed.format] || parsed.format.toUpperCase();
  const iconType = FORMAT_ICONS[parsed.format] || 'text';
  const ext = parsed.filename.split('.').pop()?.toUpperCase() || parsed.format.toUpperCase();

  return (
    <div className={styles.card}>
      <div className={styles.cardInner} onClick={status === 'idle' ? handleDownload : undefined}>
        <div className={`${styles.icon} ${styles[`icon_${iconType}`]}`}>
          <FileTypeIcon type={iconType} />
          <span className={styles.iconBadge}>{ext}</span>
        </div>
        <div className={styles.info}>
          <span className={styles.filename}>{parsed.filename}</span>
          <span className={styles.meta}>
            {formatLabel}
            {parsed.title && parsed.title !== parsed.filename && <> &middot; {parsed.title}</>}
          </span>
        </div>
        <div className={styles.action}>
          {status === 'idle' && (
            <button className={styles.downloadBtn} onClick={handleDownload} title="Download file">
              <DownloadIcon />
              <span>Download</span>
            </button>
          )}
          {status === 'generating' && (
            <div className={styles.spinner}>
              <SpinnerIcon />
              <span>Generating...</span>
            </div>
          )}
          {status === 'done' && (
            <div className={styles.success}>
              <CheckIcon />
              <span>Downloaded</span>
            </div>
          )}
          {status === 'error' && (
            <button className={styles.retryBtn} onClick={handleDownload} title="Retry download">
              <span>Retry</span>
            </button>
          )}
        </div>
      </div>
      {status === 'error' && errorMsg && <div className={styles.errorBanner}>{errorMsg}</div>}
    </div>
  );
}

// ─── Icons ──────────────────────────────────────────────────────────────────

function FileTypeIcon({ type }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {type === 'pdf' && (
        <>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="15" x2="15" y2="15" />
          <line x1="9" y1="11" x2="15" y2="11" />
        </>
      )}
      {type === 'word' && (
        <>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="13" x2="15" y2="13" />
          <line x1="9" y1="17" x2="13" y2="17" />
        </>
      )}
      {type === 'excel' && (
        <>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <rect x="8" y="11" width="8" height="8" rx="1" />
          <line x1="12" y1="11" x2="12" y2="19" />
          <line x1="8" y1="15" x2="16" y2="15" />
        </>
      )}
      {type === 'powerpoint' && (
        <>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <rect x="7" y="11" width="10" height="7" rx="1" />
        </>
      )}
      {(type === 'text' || type === 'code') && (
        <>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          {type === 'code' ? (
            <>
              <polyline points="8 16 10 14 8 12" />
              <line x1="13" y1="16" x2="16" y2="16" />
            </>
          ) : (
            <>
              <line x1="9" y1="13" x2="15" y2="13" />
              <line x1="9" y1="17" x2="12" y2="17" />
            </>
          )}
        </>
      )}
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      className={styles.spinnerSvg}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M12 2a10 10 0 0110 10" />
    </svg>
  );
}
