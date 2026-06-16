import { useEffect, useRef, useState } from 'react';
import useDiagramExport from '../../hooks/useDiagramExport';
import { DownloadIcon } from '../Icons';
import styles from './DiagramExportMenu.module.css';

export default function DiagramExportMenu({ svgGetter, disabled = false }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const { exportPng, exportPdf, isExporting } = useDiagramExport(svgGetter);

  useEffect(() => {
    if (!open) return undefined;
    const handleClick = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const runExport = (action) => async () => {
    setOpen(false);
    await action();
  };

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((value) => !value)}
        disabled={disabled || isExporting}
        aria-label="Download diagram"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Download"
      >
        {isExporting ? <span className={styles.spinner} aria-hidden="true" /> : <DownloadIcon />}
      </button>
      {open && (
        <ul className={styles.menu} role="menu">
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className={styles.item}
              onClick={runExport(exportPng)}
            >
              <span className={styles.itemLabel}>Download as PNG</span>
              <span className={styles.itemHint}>High-res image</span>
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className={styles.item}
              onClick={runExport(exportPdf)}
            >
              <span className={styles.itemLabel}>Download as PDF</span>
              <span className={styles.itemHint}>Single page, A4</span>
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
