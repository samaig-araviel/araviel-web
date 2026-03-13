import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import hljs from 'highlight.js/lib/core';
import styles from './StepsBlock.module.css';

/**
 * Steps block — renders a numbered step-by-step guide from a JSON spec.
 * Expects `spec` to be a JSON string of an array:
 * [{ "title": "Step title", "description": "Details", "code": "npm install ..." }, ...]
 */
export default function StepsBlock({ spec }) {
  const items = useMemo(() => {
    try {
      const parsed = typeof spec === 'string' ? JSON.parse(spec) : spec;
      if (!Array.isArray(parsed)) return null;
      return parsed.filter((item) => item && item.title);
    } catch {
      return null;
    }
  }, [spec]);

  if (!items || items.length === 0) {
    return (
      <div className={styles.error}>
        <span>Could not parse steps data</span>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.headerLabel}>Steps</span>
        <span className={styles.headerCount}>{items.length} steps</span>
      </div>
      <div className={styles.steps}>
        {items.map((item, idx) => (
          <StepItem key={idx} item={item} index={idx} isLast={idx === items.length - 1} />
        ))}
      </div>
    </div>
  );
}

function StepItem({ item, index, isLast }) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef(null);

  useEffect(() => {
    if (codeRef.current && item.code) {
      try {
        const result = hljs.highlightAuto(item.code);
        codeRef.current.innerHTML = result.value;
      } catch {
        codeRef.current.textContent = item.code;
      }
    }
  }, [item.code]);

  const handleCopy = useCallback(() => {
    if (item.code) {
      navigator.clipboard.writeText(item.code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }, [item.code]);

  return (
    <div className={styles.step}>
      <div className={styles.stepMarker}>
        <div className={styles.stepNumber}>{index + 1}</div>
        {!isLast && <div className={styles.stepLine} />}
      </div>
      <div className={styles.stepContent}>
        <span className={styles.stepTitle}>{item.title}</span>
        {item.description && (
          <span className={styles.stepDescription}>{item.description}</span>
        )}
        {item.code && (
          <div className={styles.stepCode}>
            <button
              className={styles.stepCodeCopy}
              onClick={handleCopy}
              title={copied ? 'Copied!' : 'Copy'}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
            <pre>
              <code ref={codeRef}>{item.code}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
