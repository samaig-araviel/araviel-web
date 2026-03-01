import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectEffectiveTheme } from '../../store/slices/themeSlice';
import { setInputValue } from '../../store/slices/chatSlice';
import { getProviderLogo } from '../ProviderLogos';
import { PROVIDERS, MODELS, SPEED_TIERS, formatTokens } from '../../data/models';
import {
  createSubConversation,
  fetchSubConversations,
  fetchSubConversationMessages,
  sendMessage,
  consumeSSEStream,
} from '../../services/api';
import {
  CopyIcon,
  CheckIcon,
  ArrowRightIcon,
  SparkleIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  RefreshIcon,
  ShareIcon,
  SourcesIcon,
  FileDownIcon,
  FileTextIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  MessageCircleIcon,
  SendIcon,
  CloseIcon,
  ZapIcon,
  GlobeIcon,
  InfoIcon,
  MaximizeIcon,
  CodeIcon,
  EditIcon,
} from '../Icons';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import typescript from 'highlight.js/lib/languages/typescript';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import sql from 'highlight.js/lib/languages/sql';
import java from 'highlight.js/lib/languages/java';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import cpp from 'highlight.js/lib/languages/cpp';
import mermaid from 'mermaid';
import ThinkingTimeline from '../ThinkingTimeline/ThinkingTimeline';
import styles from './MessageList.module.css';

// Initialize mermaid with sensible defaults
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
});

// Register highlight.js languages
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('jsx', javascript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('py', python);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('tsx', typescript);
hljs.registerLanguage('css', css);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('shell', bash);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('java', java);
hljs.registerLanguage('go', go);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('rs', rust);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('c', cpp);

/**
 * Generate 4 follow-up suggestion prompts based on the assistant's response content.
 */
function generateFollowUps(content) {
  if (!content) return [];

  const lower = content.toLowerCase();

  // Coding responses
  if (/```/.test(content) && /function|const|let|var|def |class /.test(content)) {
    const suggestions = [
      'Can you add error handling and edge case coverage to this?',
      'How would I write unit tests for this implementation?',
      'Can you explain the time and space complexity of this approach?',
      'What are some alternative approaches to solve this?',
      'How would this look refactored using TypeScript?',
      'Can you add inline comments explaining each step?',
    ];
    return pickRandom(suggestions, 4);
  }

  // Analytical responses
  if (/analysis|findings|methodology|recommendations|pattern/i.test(lower)) {
    const suggestions = [
      'Can you go deeper on the key findings with examples?',
      'What data sources would strengthen this analysis?',
      'How would you visualize these insights for a presentation?',
      'What are the potential risks if we ignore these patterns?',
      'Can you break this into actionable next steps?',
      'How does this compare to industry benchmarks?',
    ];
    return pickRandom(suggestions, 4);
  }

  // Research responses
  if (/quantum|theory|research|history|science|overview/i.test(lower)) {
    const suggestions = [
      'What are the most recent breakthroughs in this area?',
      'Can you explain this in simpler terms for a beginner?',
      'What are the practical real-world applications?',
      'Who are the leading researchers or companies in this space?',
      'What are the open questions still being debated?',
      'How has this field evolved in the last decade?',
    ];
    return pickRandom(suggestions, 4);
  }

  // Creative responses
  if (/poem|haiku|verse|story|imagine|narrative/i.test(lower)) {
    const suggestions = [
      'Can you write another one with a different tone?',
      'What inspired the imagery in this piece?',
      'Can you create a longer version expanding on this theme?',
      'How would this change if written in a different style?',
      'Can you adapt this for a different audience?',
      'What literary techniques are at play here?',
    ];
    return pickRandom(suggestions, 4);
  }

  // Default follow-ups
  const defaults = [
    'Can you elaborate on this with more specific examples?',
    'What are the most common misconceptions about this?',
    'How would you apply this in a real-world scenario?',
    'What should I learn next to go deeper on this topic?',
    'Can you summarize the key takeaways?',
    'What are the counterarguments to this?',
  ];
  return pickRandom(defaults, 4);
}

function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

/**
 * Render basic markdown to React elements.
 * Handles: code blocks, inline code, bold, italic, horizontal rules, lists, images, links, paragraphs.
 */
function renderMarkdown(text) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  const images = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      const codeContent = codeLines.join('\n');
      if (lang === 'mermaid') {
        elements.push(<MermaidBlock key={key++} code={codeContent} />);
      } else {
        elements.push(<CodeBlock key={key++} lang={lang} code={codeContent} />);
      }
      continue;
    }

    // Image line: ![alt](url)
    const imgMatch = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (imgMatch) {
      images.push({ alt: imgMatch[1], src: imgMatch[2] });
      i++;
      continue;
    }

    // Markdown table: detect header row with pipes
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableRows = [];
      let hasValidSeparator = false;
      const startIdx = i;

      // Collect all contiguous pipe-delimited lines
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableRows.push(lines[i].trim());
        i++;
      }

      // Validate: need at least 2 rows, and 2nd row should be separator (| --- | --- |)
      if (tableRows.length >= 2) {
        const separatorRow = tableRows[1];
        hasValidSeparator = /^\|[\s:]*-{2,}[\s:]*\|/.test(separatorRow);
      }

      if (hasValidSeparator && tableRows.length >= 2) {
        const parseCells = (row) =>
          row
            .slice(1, -1) // remove leading/trailing pipes
            .split('|')
            .map((cell) => cell.trim());

        const headerCells = parseCells(tableRows[0]);
        // Parse alignment from separator row
        const alignCells = parseCells(tableRows[1]);
        const alignments = alignCells.map((cell) => {
          if (cell.startsWith(':') && cell.endsWith(':')) return 'center';
          if (cell.endsWith(':')) return 'right';
          return 'left';
        });
        const bodyRows = tableRows.slice(2).map(parseCells);

        elements.push(
          <div className={styles.tableWrapper} key={key++}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {headerCells.map((cell, ci) => (
                    <th key={ci} style={{ textAlign: alignments[ci] || 'left' }}>
                      {renderInline(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((row, ri) => (
                  <tr key={ri}>
                    {headerCells.map((_, ci) => (
                      <td key={ci} style={{ textAlign: alignments[ci] || 'left' }}>
                        {renderInline(row[ci] || '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }

      // Not a valid table — reset and let normal parsing handle it
      i = startIdx;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      elements.push(<hr className={styles.hr} key={key++} />);
      i++;
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Heading (# through ######)
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      // Map heading levels: 1→h3, 2→h4, 3→h5, 4-6→h6
      const Tag = level === 1 ? 'h3' : level === 2 ? 'h4' : level === 3 ? 'h5' : 'h6';
      const styleLevel = Math.min(level, 3);
      elements.push(
        <Tag className={styles[`heading${styleLevel}`]} key={key++}>
          {renderInline(headingMatch[2])}
        </Tag>
      );
      i++;
      continue;
    }

    // Blockquote (> text)
    if (line.trim().startsWith('> ') || line.trim() === '>') {
      const quoteLines = [];
      while (i < lines.length && (lines[i].trim().startsWith('> ') || lines[i].trim() === '>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      elements.push(
        <blockquote className={styles.blockquote} key={key++}>
          {quoteLines.map((ql, qi) =>
            ql === '' ? <br key={qi} /> : <p key={qi}>{renderInline(ql)}</p>
          )}
        </blockquote>
      );
      continue;
    }

    // Unordered list
    if (/^[-*]\s/.test(line.trim())) {
      const listItems = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^[-*]\s/, ''));
        i++;
      }
      elements.push(
        <ul className={styles.list} key={key++}>
          {listItems.map((item, idx) => (
            <li key={idx}>{renderInline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line.trim())) {
      const listItems = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^\d+\.\s/, ''));
        i++;
      }
      elements.push(
        <ol className={styles.orderedList} key={key++}>
          {listItems.map((item, idx) => (
            <li key={idx}>{renderInline(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p className={styles.paragraph} key={key++}>
        {renderInline(line)}
      </p>
    );
    i++;
  }

  // If images were found, prepend the image row
  if (images.length > 0) {
    elements.unshift(<ImageRow key="img-row" images={images} />);
  }

  return elements;
}

/**
 * Code block component with syntax highlighting and copy functionality.
 */
function CodeBlock({ lang, code }) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef(null);

  useEffect(() => {
    if (codeRef.current) {
      try {
        const langId = lang ? lang.toLowerCase() : null;
        const result =
          langId && hljs.getLanguage(langId)
            ? hljs.highlight(code, { language: langId })
            : hljs.highlightAuto(code);
        codeRef.current.innerHTML = result.value;
      } catch {
        codeRef.current.textContent = code;
      }
    }
  }, [code, lang]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <div className={styles.codeBlock}>
      <div className={styles.codeHeader}>
        {lang && <span className={styles.codeLang}>{lang}</span>}
        {!lang && <span />}
        <button
          className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
          onClick={handleCopy}
          title={copied ? 'Copied!' : 'Copy code'}
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <CheckIcon />
              <span>Copied</span>
            </>
          ) : (
            <>
              <CopyIcon />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre>
        <code ref={codeRef}>{code}</code>
      </pre>
    </div>
  );
}

/**
 * Mermaid diagram block — renders mermaid code as a visual diagram.
 */
function MermaidBlock({ code }) {
  const containerRef = useRef(null);
  const [svgContent, setSvgContent] = useState('');
  const [error, setError] = useState(null);
  const [showCode, setShowCode] = useState(false);
  const idRef = useRef(`mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
  const effectiveTheme = useSelector(selectEffectiveTheme);

  useEffect(() => {
    let cancelled = false;
    const renderDiagram = async () => {
      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: effectiveTheme === 'dark' ? 'dark' : 'default',
          securityLevel: 'loose',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        });
        const { svg } = await mermaid.render(idRef.current, code.trim());
        if (!cancelled) {
          setSvgContent(svg);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to render diagram');
          setSvgContent('');
        }
      }
    };
    renderDiagram();
    return () => {
      cancelled = true;
    };
  }, [code, effectiveTheme]);

  if (error) {
    return <CodeBlock lang="mermaid" code={code} />;
  }

  return (
    <div className={styles.mermaidBlock}>
      <div className={styles.mermaidHeader}>
        <span className={styles.mermaidLabel}>Diagram</span>
        <button
          className={styles.mermaidToggleCode}
          onClick={() => setShowCode(!showCode)}
        >
          {showCode ? 'Preview' : 'Code'}
        </button>
      </div>
      {showCode ? (
        <CodeBlock lang="mermaid" code={code} />
      ) : (
        <div
          ref={containerRef}
          className={styles.mermaidContent}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      )}
    </div>
  );
}

/**
 * Canvas-style code viewer — full-screen overlay for viewing code in a file-like view.
 */
function CodeCanvasViewer({ codeBlocks, onClose }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const codeRef = useRef(null);

  const activeBlock = codeBlocks[activeIdx];

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  useEffect(() => {
    if (codeRef.current && activeBlock) {
      try {
        const langId = activeBlock.lang ? activeBlock.lang.toLowerCase() : null;
        const result =
          langId && hljs.getLanguage(langId)
            ? hljs.highlight(activeBlock.code, { language: langId })
            : hljs.highlightAuto(activeBlock.code);
        codeRef.current.innerHTML = result.value;
      } catch {
        codeRef.current.textContent = activeBlock.code;
      }
    }
  }, [activeBlock]);

  const handleCopy = useCallback(() => {
    if (!activeBlock) return;
    navigator.clipboard.writeText(activeBlock.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [activeBlock]);

  if (!codeBlocks || codeBlocks.length === 0) return null;

  const lineCount = activeBlock.code.split('\n').length;

  return createPortal(
    <div className={styles.canvasOverlay} onClick={onClose}>
      <div className={styles.canvasPanel} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.canvasHeader}>
          <div className={styles.canvasHeaderLeft}>
            <CodeIcon />
            <span className={styles.canvasTitle}>{activeBlock.lang || 'Code'}</span>
            <span className={styles.canvasLineCount}>{lineCount} lines</span>
          </div>
          <div className={styles.canvasHeaderActions}>
            {codeBlocks.length > 1 && (
              <div className={styles.canvasTabs}>
                {codeBlocks.map((block, idx) => (
                  <button
                    key={idx}
                    className={`${styles.canvasTab} ${
                      idx === activeIdx ? styles.canvasTabActive : ''
                    }`}
                    onClick={() => {
                      setActiveIdx(idx);
                      setCopied(false);
                    }}
                  >
                    {block.lang || `Block ${idx + 1}`}
                  </button>
                ))}
              </div>
            )}
            <button
              className={styles.canvasCopyBtn}
              onClick={handleCopy}
              title={copied ? 'Copied!' : 'Copy code'}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button className={styles.canvasCloseBtn} onClick={onClose} aria-label="Close">
              <CloseIcon />
            </button>
          </div>
        </div>
        {/* Code area with line numbers */}
        <div className={styles.canvasCodeArea}>
          <div className={styles.canvasLineNumbers}>
            {activeBlock.code.split('\n').map((_, idx) => (
              <span key={idx}>{idx + 1}</span>
            ))}
          </div>
          <pre className={styles.canvasCodePre}>
            <code ref={codeRef}>{activeBlock.code}</code>
          </pre>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * Button shown below response content that opens the canvas code viewer.
 */
function CodeCanvasButton({ codeBlocks, onClick }) {
  if (!codeBlocks || codeBlocks.length === 0) return null;

  const totalLines = codeBlocks.reduce((sum, b) => sum + b.code.split('\n').length, 0);
  const label =
    codeBlocks.length === 1
      ? `${codeBlocks[0].lang || 'Code'}`
      : `${codeBlocks.length} code blocks`;

  return (
    <button className={styles.canvasOpenBtn} onClick={onClick}>
      <div className={styles.canvasOpenBtnLeft}>
        <span className={styles.canvasOpenBtnIcon}>
          <CodeIcon />
        </span>
        <div className={styles.canvasOpenBtnText}>
          <span className={styles.canvasOpenBtnTitle}>{label}</span>
          <span className={styles.canvasOpenBtnMeta}>{totalLines} lines</span>
        </div>
      </div>
      <span className={styles.canvasOpenBtnArrow}>
        <MaximizeIcon />
      </span>
    </button>
  );
}

/**
 * Horizontal scrollable image row shown when response contains images.
 * Clicking a single image opens a lightbox. "View all" opens the side gallery panel.
 */
function ImageRow({ images }) {
  const [showGallery, setShowGallery] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(null);

  const handleClick = () => {
    if (window.innerWidth <= 768) {
      setLightboxIdx(0);
    } else {
      setShowGallery(true);
    }
  };

  return (
    <>
      <button className={styles.imagesPill} onClick={handleClick}>
        <svg
          className={styles.imagesPillIcon}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
        <span className={styles.imagesPillCount}>
          {images.length} image{images.length !== 1 ? 's' : ''}
        </span>
        <span className={styles.imagesPillAction}>View images</span>
        <svg
          className={styles.imagesPillChevron}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
      {showGallery && <ImageGalleryPanel images={images} onClose={() => setShowGallery(false)} />}
      {lightboxIdx !== null &&
        createPortal(
          <ImageLightbox
            images={images}
            startIndex={lightboxIdx}
            onClose={() => setLightboxIdx(null)}
          />,
          document.body
        )}
    </>
  );
}

/**
 * Lightbox popup for viewing a single image.
 * Shows the image large with prev/next navigation.
 */
function ImageLightbox({ images, startIndex, onClose }) {
  const [currentIdx, setCurrentIdx] = useState(startIndex);
  const img = images[currentIdx];

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIdx > 0) setCurrentIdx((i) => i - 1);
      if (e.key === 'ArrowRight' && currentIdx < images.length - 1) setCurrentIdx((i) => i + 1);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, currentIdx, images.length]);

  return (
    <div className={styles.lightboxOverlay} onClick={onClose}>
      <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.lightboxClose} onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>
        <div className={styles.lightboxImageWrap}>
          {images.length > 1 && currentIdx > 0 && (
            <button
              className={`${styles.lightboxNav} ${styles.lightboxNavLeft}`}
              onClick={() => setCurrentIdx((i) => i - 1)}
              aria-label="Previous"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          <img
            src={img.src}
            alt={img.alt || `Image ${currentIdx + 1}`}
            className={styles.lightboxImg}
          />
          {images.length > 1 && currentIdx < images.length - 1 && (
            <button
              className={`${styles.lightboxNav} ${styles.lightboxNavRight}`}
              onClick={() => setCurrentIdx((i) => i + 1)}
              aria-label="Next"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </div>
        {img.alt && <p className={styles.lightboxCaption}>{img.alt}</p>}
        {images.length > 1 && (
          <span className={styles.lightboxCounter}>
            {currentIdx + 1} / {images.length}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Right-side gallery panel — mirrors the sub-conversation panel design.
 * Shows all images in a clean 2-column grid.
 */
function ImageGalleryPanel({ images, onClose }) {
  const [lightboxIdx, setLightboxIdx] = useState(null);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && lightboxIdx === null) onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose, lightboxIdx]);

  return createPortal(
    <>
      <div className={styles.imageGalleryOverlay} onClick={onClose} />
      <div className={styles.imageGalleryPanel}>
        <div className={styles.imageGalleryDragHandle}>
          <span className={styles.imageGalleryDragBar} />
        </div>
        <div className={styles.imageGalleryPanelFadeTop} />
        <div className={styles.imageGalleryHeader}>
          <div className={styles.imageGalleryHeaderLeft}>
            <span className={styles.imageGalleryTitle}>Images</span>
            <span className={styles.imageGalleryBadge}>{images.length}</span>
          </div>
          <button className={styles.imageGalleryClose} onClick={onClose} aria-label="Close gallery">
            <CloseIcon />
          </button>
        </div>
        <div className={styles.imageGalleryGrid}>
          {images.map((img, idx) => (
            <button
              key={idx}
              className={styles.imageGalleryItem}
              onClick={() => setLightboxIdx(idx)}
            >
              <img
                src={img.src}
                alt={img.alt || `Image ${idx + 1}`}
                className={styles.imageGalleryImg}
                loading="lazy"
              />
              {img.alt && <span className={styles.imageGalleryCaption}>{img.alt}</span>}
            </button>
          ))}
        </div>
      </div>
      {lightboxIdx !== null && (
        <ImageLightbox
          images={images}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </>,
    document.body
  );
}

/**
 * Inline link component with hover tooltip showing the URL.
 */
function InlineLink({ href, children }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const linkRef = useRef(null);
  const timerRef = useRef(null);

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => {
      if (linkRef.current) {
        const rect = linkRef.current.getBoundingClientRect();
        setTooltipPos({ x: rect.left, y: rect.top });
      }
      setShowTooltip(true);
    }, 400);
  };

  const handleMouseLeave = () => {
    clearTimeout(timerRef.current);
    setShowTooltip(false);
  };

  // Basic safety check for URLs
  const isSafe = /^https?:\/\//i.test(href);

  return (
    <span className={styles.inlineLinkWrapper} ref={linkRef}>
      <a
        href={isSafe ? href : '#'}
        className={styles.inlineLink}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => {
          if (!isSafe) e.preventDefault();
        }}
      >
        {children}
      </a>
      {showTooltip && (
        <span
          className={styles.linkTooltip}
          style={{
            position: 'fixed',
            left: tooltipPos.x,
            top: tooltipPos.y - 36,
          }}
        >
          <span className={styles.linkTooltipUrl}>
            {href.length > 60 ? href.slice(0, 60) + '...' : href}
          </span>
        </span>
      )}
    </span>
  );
}

/**
 * Render inline markdown: bold, italic, inline code, links.
 */
function renderInline(text) {
  if (!text) return text;

  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Inline code
    let match = remaining.match(/^`([^`]+)`/);
    if (match) {
      parts.push(
        <code className={styles.inlineCode} key={key++}>
          {match[1]}
        </code>
      );
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Markdown link [text](url)
    match = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (match) {
      parts.push(
        <InlineLink key={key++} href={match[2]}>
          {match[1]}
        </InlineLink>
      );
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Auto-detect bare URLs
    match = remaining.match(/^(https?:\/\/[^\s<>)\]]+)/);
    if (match) {
      const url = match[1];
      // Extract a display name from the hostname
      let displayText;
      try {
        displayText = new URL(url).hostname.replace(/^www\./, '');
      } catch {
        displayText = url;
      }
      parts.push(
        <InlineLink key={key++} href={url}>
          {displayText}
        </InlineLink>
      );
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Bold + italic
    match = remaining.match(/^\*\*\*(.+?)\*\*\*/);
    if (match) {
      parts.push(
        <strong key={key++}>
          <em>{match[1]}</em>
        </strong>
      );
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Bold
    match = remaining.match(/^\*\*(.+?)\*\*/);
    if (match) {
      parts.push(<strong key={key++}>{match[1]}</strong>);
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Italic
    match = remaining.match(/^\*(.+?)\*/);
    if (match) {
      parts.push(<em key={key++}>{match[1]}</em>);
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Plain text up to next special char or URL start
    match = remaining.match(/^[^`*\[h]+/);
    if (match) {
      parts.push(match[0]);
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Check for 'h' that isn't the start of a URL, or '[' that isn't a link
    if (
      (remaining[0] === 'h' && !remaining.match(/^https?:\/\//)) ||
      (remaining[0] === '[' && !remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/))
    ) {
      parts.push(remaining[0]);
      remaining = remaining.slice(1);
      continue;
    }

    // Single special char (not part of a pattern)
    parts.push(remaining[0]);
    remaining = remaining.slice(1);
  }

  return parts.length === 1 ? parts[0] : parts;
}

/**
 * Citations display — collapsible sources section below the response.
 * Collapsed by default, showing a summary pill with source count.
 */
function CitationsDisplay({ citations }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!citations || citations.length === 0) return null;

  return (
    <div className={styles.citationsSection}>
      <button
        className={`${styles.citationsToggle} ${isExpanded ? styles.citationsToggleOpen : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className={styles.citationsToggleLeft}>
          <SourcesIcon />
          <span>
            {citations.length} source{citations.length !== 1 ? 's' : ''}
          </span>
        </span>
        <span
          className={`${styles.citationsChevron} ${isExpanded ? styles.citationsChevronOpen : ''}`}
        >
          <ChevronDownIcon />
        </span>
      </button>
      {isExpanded && (
        <div className={styles.citationsList}>
          {citations.map((citation, idx) => {
            let favicon = '';
            let hostname = '';
            try {
              const url = new URL(citation.url);
              hostname = url.hostname.replace(/^www\./, '');
              favicon = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=16`;
            } catch {
              // skip favicon
            }
            return (
              <a
                key={idx}
                href={citation.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.citationPill}
              >
                <span className={styles.citationNumber}>{idx + 1}</span>
                {favicon && <img src={favicon} alt="" className={styles.citationFavicon} />}
                <div className={styles.citationInfo}>
                  <span className={styles.citationTitle}>{citation.title || citation.url}</span>
                  {hostname && <span className={styles.citationDomain}>{hostname}</span>}
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Usage stats inline — shows info icon to the left of the model pill in the actions bar.
 * On click, opens a floating tooltip with model, tokens, cost, latency details.
 */
function UsageFooterInline({ message, isDark }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!showTooltip) return;
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowTooltip(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTooltip]);

  // Build useful rows: model, tokens, cost, speed
  const rows = [];
  if (message.modelName) rows.push({ label: 'Model', value: message.modelName });
  if (message.usage) {
    const { inputTokens, outputTokens } = message.usage;
    if (inputTokens != null) {
      rows.push({ label: 'Input', value: `${inputTokens.toLocaleString()} tokens` });
    }
    if (outputTokens != null) {
      rows.push({ label: 'Output', value: `${outputTokens.toLocaleString()} tokens` });
    }
    if (inputTokens != null && outputTokens != null) {
      rows.push({
        label: 'Total',
        value: `${(inputTokens + outputTokens).toLocaleString()} tokens`,
      });
    }
  }
  if (message.costUsd != null) {
    rows.push({ label: 'Cost', value: `$${message.costUsd.toFixed(4)}` });
  }
  if (message.latencyMs != null) {
    const seconds = message.latencyMs / 1000;
    rows.push({
      label: 'Speed',
      value: seconds < 1 ? `${message.latencyMs}ms` : `${seconds.toFixed(1)}s`,
    });
  }
  if (message.provider) {
    const providerNames = {
      anthropic: 'Anthropic',
      openai: 'OpenAI',
      google: 'Google',
      perplexity: 'Perplexity',
      xai: 'xAI',
      mistral: 'Mistral',
      deepseek: 'DeepSeek',
    };
    rows.push({ label: 'Provider', value: providerNames[message.provider] || message.provider });
  }

  // Always show the info icon (even without data, show at least a placeholder)
  const hasData = rows.length > 0;

  return (
    <div className={styles.usageInline} ref={wrapperRef}>
      <button
        className={`${styles.usageToggle} ${showTooltip ? styles.usageToggleActive : ''}`}
        onClick={() => hasData && setShowTooltip(!showTooltip)}
        title={hasData ? 'Response details' : 'No details available'}
      >
        <InfoIcon />
      </button>
      {showTooltip && hasData && (
        <div className={styles.usageTooltip}>
          <div className={styles.usageTooltipArrow} />
          <div className={styles.usageTooltipBody}>
            <div className={styles.usageTooltipTitle}>Response details</div>
            {rows.map((row, idx) => (
              <div key={idx} className={styles.usageTooltipRow}>
                <span className={styles.usageTooltipLabel}>{row.label}</span>
                <span className={styles.usageTooltipValue}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Model info popup — shown when clicking the model name in the upgrade hint.
 * Shows full model details, why it's recommended, and Pro tier info.
 */
function ModelInfoPopup({ model, reason, onClose, isDark }) {
  const popupRef = useRef(null);
  const providerData = model?.provider ? PROVIDERS[model.provider] : null;
  const LogoComponent = model?.provider ? getProviderLogo(model.provider) : null;
  const speedInfo = model?.speedTier ? SPEED_TIERS[model.speedTier] : null;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
    }, 10);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!model) return null;

  const accentColor = providerData?.accentColor || '#d4a574';
  const accentBg = isDark ? providerData?.accentBgDark : providerData?.accentBg;
  const accentText = isDark
    ? providerData?.accentTextDark || providerData?.accentColor
    : providerData?.accentText;

  // Gather capabilities for display
  const capabilities = [];
  if (model.capabilities) {
    if (model.capabilities.vision) capabilities.push('Vision');
    if (model.capabilities.audio) capabilities.push('Audio');
    if (model.capabilities.extendedThinking) capabilities.push('Extended Thinking');
    if (model.capabilities.webSearch) capabilities.push('Web Search');
    if (model.capabilities.functionCalling) capabilities.push('Function Calling');
    if (model.capabilities.streaming) capabilities.push('Streaming');
  }

  return createPortal(
    <div className={styles.modelInfoOverlay}>
      <div className={styles.modelInfoPopup} ref={popupRef}>
        {/* Header with provider branding */}
        <div className={styles.modelInfoHeader} style={{ borderBottomColor: accentColor + '20' }}>
          <div className={styles.modelInfoHeaderLeft}>
            {providerData && LogoComponent && (
              <span
                className={styles.modelInfoLogo}
                style={{ backgroundColor: accentBg, color: accentText }}
              >
                <LogoComponent size={18} />
              </span>
            )}
            <div className={styles.modelInfoHeaderText}>
              <span className={styles.modelInfoName}>{model.name}</span>
              <span className={styles.modelInfoTagline}>{model.tagline}</span>
            </div>
          </div>
          <button className={styles.modelInfoClose} onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        {/* Why this model — no icon, clean text */}
        {reason && (
          <div className={styles.modelInfoReason}>
            <span>{reason}</span>
          </div>
        )}

        {/* Description */}
        <p className={styles.modelInfoDesc}>{model.description}</p>

        {/* Stats grid */}
        <div className={styles.modelInfoStats}>
          {speedInfo && (
            <div className={styles.modelInfoStat}>
              <span className={styles.modelInfoStatLabel}>Speed</span>
              <span className={styles.modelInfoStatValue}>{speedInfo.label}</span>
            </div>
          )}
          {model.context && (
            <div className={styles.modelInfoStat}>
              <span className={styles.modelInfoStatLabel}>Context</span>
              <span className={styles.modelInfoStatValue}>
                {formatTokens(model.context.inputTokens)}
              </span>
            </div>
          )}
          {model.pricing && (
            <div className={styles.modelInfoStat}>
              <span className={styles.modelInfoStatLabel}>Input</span>
              <span className={styles.modelInfoStatValue}>${model.pricing.inputPerM}/M</span>
            </div>
          )}
          {model.pricing && (
            <div className={styles.modelInfoStat}>
              <span className={styles.modelInfoStatLabel}>Output</span>
              <span className={styles.modelInfoStatValue}>${model.pricing.outputPerM}/M</span>
            </div>
          )}
        </div>

        {/* Capabilities */}
        {capabilities.length > 0 && (
          <div className={styles.modelInfoCapabilities}>
            <span className={styles.modelInfoBestForLabel}>Capabilities</span>
            <div className={styles.modelInfoBestForTags}>
              {capabilities.map((cap, idx) => (
                <span
                  key={idx}
                  className={styles.modelInfoTag}
                  style={{ backgroundColor: accentBg, color: accentText }}
                >
                  {cap}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Best for */}
        {model.bestFor && model.bestFor.length > 0 && (
          <div className={styles.modelInfoBestFor}>
            <span className={styles.modelInfoBestForLabel}>Best for</span>
            <div className={styles.modelInfoBestForTags}>
              {model.bestFor.map((tag, idx) => (
                <span
                  key={idx}
                  className={styles.modelInfoTag}
                  style={{ backgroundColor: accentBg, color: accentText }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Pro tier CTA */}
        <div className={styles.modelInfoProSection}>
          <div className={styles.modelInfoProBadge}>
            <span>Available with Araviel Pro</span>
          </div>
          <p className={styles.modelInfoProDesc}>
            Get access to {model.name} and all premium models with faster responses, higher limits,
            and priority routing.
          </p>
          <div className={styles.modelInfoProPricing}>
            <span className={styles.modelInfoProPrice}>$20</span>
            <span className={styles.modelInfoProPeriod}>/month</span>
          </div>
          <button
            className={styles.modelInfoProBtn}
            style={{
              background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}cc 100%)`,
            }}
          >
            Upgrade to Pro
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * Upgrade hint — subtle inline banner shown after the response completes.
 * Model name is clickable to open a detailed model info popup.
 */
function UpgradeHint({ upgradeHint }) {
  const [dismissed, setDismissed] = useState(false);
  const [showModelInfo, setShowModelInfo] = useState(false);
  const effectiveTheme = useSelector(selectEffectiveTheme);
  const isDark = effectiveTheme === 'dark';

  if (!upgradeHint || !upgradeHint.recommendedModel || dismissed) return null;

  const modelName = upgradeHint.recommendedModel.name;
  const modelId = upgradeHint.recommendedModel.id;
  const reason =
    upgradeHint.reason ||
    upgradeHint.recommendedModel.reasoning ||
    `This model would provide a more detailed and accurate response for your query.`;

  // Look up the full model data
  const fullModel = MODELS.find((m) => m.id === modelId || m.name === modelName);
  const providerData = fullModel?.provider ? PROVIDERS[fullModel.provider] : null;
  const accentColor = providerData?.accentColor || '#d4a574';

  return (
    <>
      <div className={styles.upgradeBanner}>
        <div className={styles.upgradeBannerContent}>
          <button
            className={styles.upgradeBannerInfoBtn}
            onClick={() => setShowModelInfo(true)}
            title="Learn more about this model"
          >
            <InfoIcon />
          </button>
          <span className={styles.upgradeBannerText}>
            A better answer is possible with{' '}
            <button
              className={styles.upgradeBannerModelLink}
              onClick={() => setShowModelInfo(true)}
              style={{ color: accentColor }}
            >
              {modelName}
            </button>
          </span>
        </div>
        <div className={styles.upgradeBannerActions}>
          <button className={styles.upgradeBannerButton}>Upgrade</button>
          <button
            className={styles.upgradeBannerDismiss}
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
          >
            <CloseIcon />
          </button>
        </div>
      </div>
      {showModelInfo && fullModel && (
        <ModelInfoPopup
          model={fullModel}
          reason={reason}
          onClose={() => setShowModelInfo(false)}
          isDark={isDark}
        />
      )}
    </>
  );
}

/**
 * Searching the web indicator — shown during tool_use events.
 */
function WebSearchIndicator() {
  return (
    <div className={styles.webSearchIndicator}>
      <GlobeIcon />
      <span>Searching the web</span>
      <span className={styles.webSearchDots}>
        <span className={styles.webSearchDot} />
        <span className={styles.webSearchDot} />
        <span className={styles.webSearchDot} />
      </span>
    </div>
  );
}

/**
 * Clickable "Searched the web" badge with dropdown showing sources.
 */
function WebSearchBadgeWithSources({ isAutoDetected, citations }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  const hasSources = citations && citations.length > 0;

  return (
    <div className={styles.webSearchBadgeWrapper} ref={wrapperRef}>
      <button
        className={`${styles.webSearchBadge} ${isAutoDetected ? styles.webSearchBadgeAuto : ''} ${
          hasSources ? styles.webSearchBadgeClickable : ''
        } ${isOpen ? styles.webSearchBadgeOpen : ''}`}
        onClick={() => hasSources && setIsOpen(!isOpen)}
      >
        <GlobeIcon />
        <span>{isAutoDetected ? 'Searched the web (auto)' : 'Searched the web'}</span>
        {hasSources && (
          <>
            <span className={styles.webSearchBadgeCount}>{citations.length}</span>
            <span
              className={`${styles.webSearchBadgeChevron} ${
                isOpen ? styles.webSearchBadgeChevronOpen : ''
              }`}
            >
              <ChevronDownIcon />
            </span>
          </>
        )}
      </button>
      {isOpen && hasSources && (
        <div className={styles.webSearchSourcesDropdown}>
          {citations.map((citation, idx) => {
            let favicon = '';
            let hostname = '';
            try {
              const url = new URL(citation.url);
              hostname = url.hostname.replace(/^www\./, '');
              favicon = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=16`;
            } catch {
              // skip
            }
            return (
              <a
                key={idx}
                href={citation.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.webSearchSourceItem}
              >
                {favicon && <img src={favicon} alt="" className={styles.webSearchSourceFavicon} />}
                <div className={styles.webSearchSourceInfo}>
                  <span className={styles.webSearchSourceTitle}>{citation.title || hostname}</span>
                  {hostname && <span className={styles.webSearchSourceDomain}>{hostname}</span>}
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Error card displayed inline below messages.
 */
function ErrorCard({ error, onRetry, userPrompt }) {
  if (!error) return null;

  const isFatal = error.code !== 'PROVIDER_RETRY';

  if (!isFatal) {
    return (
      <div className={styles.providerRetryNotice}>
        <span>Switching to backup model...</span>
      </div>
    );
  }

  return (
    <div className={styles.errorCard}>
      <div className={styles.errorCardContent}>
        <span className={styles.errorCardMessage}>{error.message || 'Something went wrong'}</span>
        {error.suggestedPlatforms && error.suggestedPlatforms.length > 0 && (
          <div className={styles.errorSuggestedPlatforms}>
            {error.suggestedPlatforms.map((platform, idx) => (
              <span key={idx} className={styles.errorPlatformChip}>
                {platform}
              </span>
            ))}
          </div>
        )}
      </div>
      {onRetry && userPrompt && (
        <button className={styles.errorRetryBtn} onClick={() => onRetry(userPrompt)}>
          Try again
        </button>
      )}
    </div>
  );
}

/**
 * Stream timeout notice.
 */
function StreamTimeoutNotice() {
  return (
    <div className={styles.streamTimeoutNotice}>
      Response may have been cut short due to timeout.
    </div>
  );
}

/**
 * Sources pill shown when the response has sources — styled with count and favicons.
 */
function SourcesPill({ sources }) {
  if (!sources || sources.length === 0) return null;

  // Extract favicons from first few sources
  const faviconUrls = sources
    .slice(0, 3)
    .map((s) => {
      try {
        const url = new URL(s.url);
        return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=16`;
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  return (
    <span className={styles.sourcesPill}>
      {faviconUrls.length > 0 && (
        <span className={styles.sourcesPillFavicons}>
          {faviconUrls.map((url, idx) => (
            <img key={idx} src={url} alt="" className={styles.sourcesPillFavicon} />
          ))}
        </span>
      )}
      <span>
        {sources.length} source{sources.length !== 1 ? 's' : ''}
      </span>
    </span>
  );
}

/**
 * Share dropdown with PDF and TXT export options.
 */
function ShareDropdown({ message, onClose }) {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const downloadAsTxt = () => {
    const content = `${message.modelName || 'Assistant'} Response\n${'='.repeat(40)}\n\n${
      message.content
    }`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `response-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onClose();
  };

  const downloadAsPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const htmlContent = message.content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br/>');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Response - ${message.modelName || 'Assistant'}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; line-height: 1.7; color: #1a1a1a; max-width: 720px; margin: 0 auto; }
          h1 { font-size: 18px; color: #666; border-bottom: 1px solid #eee; padding-bottom: 12px; margin-bottom: 24px; }
          .meta { font-size: 12px; color: #999; margin-bottom: 24px; }
          .content { font-size: 15px; }
        </style>
      </head>
      <body>
        <h1>${message.modelName || 'Assistant'} Response</h1>
        <div class="meta">Generated via Araviel</div>
        <div class="content">${htmlContent}</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
    onClose();
  };

  return (
    <div className={styles.shareDropdown} ref={dropdownRef}>
      <button className={styles.shareDropdownItem} onClick={downloadAsPdf}>
        <FileDownIcon />
        <span>Export as PDF</span>
      </button>
      <button className={styles.shareDropdownItem} onClick={downloadAsTxt}>
        <FileTextIcon />
        <span>Export as TXT</span>
      </button>
    </div>
  );
}

/**
 * Model reasoning tooltip shown on hover/click of the model pill header.
 */
function ModelReasoningTooltip({
  reasoning,
  modelName,
  score,
  isManualSelection,
  position = 'below',
}) {
  const scoreDisplay = score ? (score * 100).toFixed(1) : null;

  return (
    <div
      className={`${styles.reasoningTooltip} ${
        position === 'above' ? styles.reasoningTooltipAbove : ''
      }`}
    >
      <div className={styles.reasoningTooltipContent}>
        <div className={styles.reasoningTooltipHeader}>
          <span className={styles.reasoningTooltipLabel}>Why {modelName}?</span>
          {scoreDisplay && <span className={styles.reasoningTooltipScore}>{scoreDisplay}%</span>}
        </div>
        <p className={styles.reasoningTooltipText}>{reasoning}</p>
        <span className={styles.reasoningTooltipFooter}>
          {isManualSelection ? 'Manual selection' : 'Araviel routing'}
        </span>
      </div>
    </div>
  );
}

/**
 * Convert a 0-1 score into a user-friendly fit label.
 */
function getFitLabel(score) {
  if (score == null) return null;
  const pct = score > 1 ? score : score * 100;
  if (pct >= 95) return 'Excellent fit';
  if (pct >= 88) return 'Great fit';
  if (pct >= 80) return 'Good fit';
  if (pct >= 70) return 'Decent fit';
  return 'Possible fit';
}

/**
 * Get estimated cost display string from model pricing.
 */
function getEstimatedCost(modelId) {
  const model = MODELS.find((m) => m.id === modelId);
  if (!model || !model.pricing) return null;
  // Estimate for a typical ~1K input / ~2K output response
  const inputCost = (model.pricing.inputPerM * 1) / 1000;
  const outputCost = (model.pricing.outputPerM * 2) / 1000;
  const totalCent = (inputCost + outputCost) * 100;
  if (totalCent < 0.1) return '< 0.1¢';
  if (totalCent < 1) return `~${totalCent.toFixed(1)}¢`;
  return `~${totalCent.toFixed(1)}¢`;
}

/**
 * Dropdown shown when clicking a model pill — lists the current model and alternates.
 */
function ModelPillDropdown({ message, isDark, position, onClose, onSelectAlternate, triggerRef }) {
  const dropdownRef = useRef(null);
  const providerData = message.provider ? PROVIDERS[message.provider] : null;
  const LogoComponent = message.provider ? getProviderLogo(message.provider) : null;
  const alternates = message.alternateModels || [];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        (!triggerRef?.current || !triggerRef.current.contains(e.target))
      ) {
        onClose();
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose, triggerRef]);

  const fitLabel = getFitLabel(message.score);

  return (
    <div
      className={`${styles.modelDropdown} ${position === 'above' ? styles.modelDropdownAbove : ''}`}
      ref={dropdownRef}
    >
      {/* Current / chosen model */}
      <div className={styles.modelDropdownSection}>
        <span className={styles.modelDropdownSectionLabel}>Responded with</span>
        <div className={styles.modelDropdownItem + ' ' + styles.modelDropdownItemCurrent}>
          <div className={styles.modelDropdownItemLeft}>
            {providerData && LogoComponent && (
              <span
                className={styles.modelDropdownLogo}
                style={{
                  backgroundColor: isDark ? providerData.accentBgDark : providerData.accentBg,
                  color: isDark
                    ? providerData.accentTextDark || providerData.accentColor
                    : providerData.accentText,
                }}
              >
                <LogoComponent size={13} />
              </span>
            )}
            <div className={styles.modelDropdownItemInfo}>
              <span className={styles.modelDropdownItemName}>{message.modelName}</span>
              {message.reasoning && (
                <span className={styles.modelDropdownItemReason}>{message.reasoning}</span>
              )}
            </div>
          </div>
          {fitLabel && (
            <span className={styles.modelDropdownFit + ' ' + styles.modelDropdownFitCurrent}>
              {fitLabel}
            </span>
          )}
        </div>
      </div>

      {/* Alternate models */}
      {alternates.length > 0 && (
        <div className={styles.modelDropdownSection}>
          <span className={styles.modelDropdownSectionLabel}>Try another model</span>
          {alternates.map((alt) => {
            const altProviderData = alt.provider ? PROVIDERS[alt.provider] : null;
            const AltLogo = alt.provider ? getProviderLogo(alt.provider) : null;
            const altFit = getFitLabel(alt.score);
            const altCost = getEstimatedCost(alt.modelId);
            return (
              <button
                key={alt.modelId}
                className={styles.modelDropdownItem + ' ' + styles.modelDropdownItemAlt}
                onClick={() => {
                  onClose();
                  onSelectAlternate(alt);
                }}
              >
                <div className={styles.modelDropdownItemLeft}>
                  {altProviderData && AltLogo && (
                    <span
                      className={styles.modelDropdownLogo}
                      style={{
                        backgroundColor: isDark
                          ? altProviderData.accentBgDark
                          : altProviderData.accentBg,
                        color: isDark
                          ? altProviderData.accentTextDark || altProviderData.accentColor
                          : altProviderData.accentText,
                      }}
                    >
                      <AltLogo size={13} />
                    </span>
                  )}
                  <div className={styles.modelDropdownItemInfo}>
                    <span className={styles.modelDropdownItemName}>{alt.modelName}</span>
                    {alt.reasoning && (
                      <span className={styles.modelDropdownItemReason}>{alt.reasoning}</span>
                    )}
                  </div>
                </div>
                <div className={styles.modelDropdownItemRight}>
                  {altFit && <span className={styles.modelDropdownFit}>{altFit}</span>}
                  {altCost && <span className={styles.modelDropdownCost}>{altCost}</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Confirmation dialog shown when user selects an alternate model.
 */
function AlternateModelConfirmDialog({
  alternateModel,
  currentModelName,
  isDark,
  onConfirm,
  onCancel,
}) {
  const altProviderData = alternateModel.provider ? PROVIDERS[alternateModel.provider] : null;
  const AltLogo = alternateModel.provider ? getProviderLogo(alternateModel.provider) : null;
  const altCost = getEstimatedCost(alternateModel.modelId);
  const altFit = getFitLabel(alternateModel.score);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onCancel]);

  return (
    <div className={styles.altConfirmOverlay} onClick={onCancel}>
      <div className={styles.altConfirmDialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.altConfirmHeader}>
          <ZapIcon />
          <span>Switch model</span>
        </div>

        <p className={styles.altConfirmDesc}>
          Generate a new response with a different model so you can compare?
        </p>

        <div className={styles.altConfirmModelCard}>
          <div className={styles.altConfirmModelCardLeft}>
            {altProviderData && AltLogo && (
              <span
                className={styles.altConfirmModelLogo}
                style={{
                  backgroundColor: isDark ? altProviderData.accentBgDark : altProviderData.accentBg,
                  color: isDark
                    ? altProviderData.accentTextDark || altProviderData.accentColor
                    : altProviderData.accentText,
                }}
              >
                <AltLogo size={16} />
              </span>
            )}
            <div className={styles.altConfirmModelInfo}>
              <span className={styles.altConfirmModelName}>{alternateModel.modelName}</span>
              {alternateModel.reasoning && (
                <span className={styles.altConfirmModelReason}>{alternateModel.reasoning}</span>
              )}
            </div>
          </div>
          <div className={styles.altConfirmModelMeta}>
            {altFit && <span className={styles.altConfirmFit}>{altFit}</span>}
            {altCost && <span className={styles.altConfirmCost}>Est. {altCost} per response</span>}
          </div>
        </div>

        <div className={styles.altConfirmActions}>
          <button className={styles.altConfirmCancelBtn} onClick={onCancel}>
            Cancel
          </button>
          <button className={styles.altConfirmGoBtn} onClick={onConfirm}>
            <ZapIcon />
            Switch & generate
          </button>
        </div>
      </div>
    </div>
  );
}

// generateSubResponse removed — sub-conversations now use the real backend API

/**
 * Tooltip shown near text selection prompting user to ask Araviel about the highlighted text.
 */
function SelectionTooltip({ position, onAsk }) {
  return (
    <div
      className={styles.selectionTooltip}
      style={{ top: position.y, left: position.x }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <button className={styles.selectionTooltipBtn} onClick={onAsk}>
        <SparkleIcon />
        <span>Ask Araviel</span>
      </button>
    </div>
  );
}

/**
 * Mini thinking timeline for sub-conversation responses.
 */
function SubConvThinkingTimeline({ status }) {
  return (
    <div className={styles.subConvTimeline}>
      <div
        className={`${styles.subConvTimelineStage} ${
          status === 'thinking' ? styles.subConvTimelineActive : styles.subConvTimelineComplete
        }`}
      >
        <span
          className={
            status === 'thinking' ? styles.subConvTimelinePulse : styles.subConvTimelineCheck
          }
        >
          {status !== 'thinking' && (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </span>
        <span>Thinking...</span>
      </div>
      {status === 'streaming' && (
        <div className={`${styles.subConvTimelineStage} ${styles.subConvTimelineActive}`}>
          <span className={styles.subConvTimelinePulse} />
          <span>Writing response...</span>
        </div>
      )}
    </div>
  );
}

/**
 * Sub-conversation panel — a right-side panel for discussing highlighted text.
 * Renders as a floating card on the right side, styled to feel like part of the page.
 */
function SubConversationPanel({
  subConversation,
  onSend,
  onClose,
  isSending,
  streamingText,
  thinkingStatus,
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    // Focus input after panel slide-in animation
    const timer = setTimeout(() => {
      if (textareaRef.current) textareaRef.current.focus();
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [subConversation.messages.length, streamingText]);

  // Close on escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Auto-resize textarea
  const autoResize = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;
    onSend(input.trim());
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const truncatedHighlight =
    subConversation.highlightedText.length > 60
      ? subConversation.highlightedText.slice(0, 60) + '...'
      : subConversation.highlightedText;

  // Build the list of finalized messages (excluding the one being streamed)
  const finalizedMessages = subConversation.messages;
  const showStreaming = isSending || (thinkingStatus && thinkingStatus !== 'idle');

  return (
    <>
      <div className={styles.subConvOverlay} onClick={onClose} />
      <div className={styles.subConvPanel} ref={panelRef}>
        {/* Top fade */}
        <div className={styles.subConvPanelFadeTop} />

        {/* Header */}
        <div className={styles.subConvPanelHeader}>
          <div className={styles.subConvPanelHeaderTop}>
            <span className={styles.subConvHeaderTitle}>Sub Conversation</span>
            <button className={styles.subConvCloseBtn} onClick={onClose} aria-label="Close panel">
              <CloseIcon />
            </button>
          </div>
          <div className={styles.subConvPanelSubheader} title={subConversation.highlightedText}>
            <SparkleIcon />
            <span>{truncatedHighlight}</span>
          </div>
        </div>

        {/* Messages */}
        <div className={styles.subConvMessages}>
          {finalizedMessages.length === 0 && !showStreaming && (
            <div className={styles.subConvEmpty}>
              <div className={styles.subConvEmptyIcon}>
                <SparkleIcon />
              </div>
              <p className={styles.subConvEmptyTitle}>Start a conversation</p>
              <p className={styles.subConvEmptyDesc}>
                Ask anything about the highlighted text below
              </p>
            </div>
          )}
          {finalizedMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`${styles.subConvMsg} ${
                msg.role === 'user' ? styles.subConvMsgUser : styles.subConvMsgAssistant
              }`}
            >
              {msg.role === 'user' ? (
                <div className={styles.subConvUserCard}>{msg.content}</div>
              ) : (
                <div className={styles.subConvAssistantContent}>
                  <div className={styles.subConvMarkdown}>{renderMarkdown(msg.content)}</div>
                </div>
              )}
            </div>
          ))}
          {/* Thinking timeline + streaming response */}
          {thinkingStatus && thinkingStatus !== 'idle' && (
            <div className={styles.subConvMsg}>
              <SubConvThinkingTimeline status={thinkingStatus} />
            </div>
          )}
          {streamingText && (
            <div className={`${styles.subConvMsg} ${styles.subConvMsgAssistant}`}>
              <div className={styles.subConvAssistantContent}>
                <div className={styles.subConvMarkdown}>
                  {renderMarkdown(streamingText)}
                  <span className={styles.subConvCursor} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom fade */}
        <div className={styles.subConvPanelFadeBottom} />

        {/* Input — matches main chatbox design */}
        <div className={styles.subConvInputSection}>
          <form className={styles.subConvInputContainer} onSubmit={handleSubmit}>
            <div className={styles.subConvInputWrapper}>
              <textarea
                ref={textareaRef}
                className={styles.subConvTextarea}
                placeholder="Ask about this..."
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  autoResize();
                }}
                onKeyDown={handleKeyDown}
                disabled={isSending}
                rows={1}
              />
              <div className={styles.subConvInputActions}>
                <button
                  type="submit"
                  className={`${styles.subConvSubmitBtn} ${
                    input.trim() ? styles.subConvSubmitBtnActive : ''
                  }`}
                  disabled={!input.trim() || isSending}
                  aria-label="Send"
                >
                  <SendIcon />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

/**
 * Confirmation dialog for deleting a sub-conversation.
 */
function DeleteSubConvDialog({ highlightedText, onConfirm, onCancel }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onCancel]);

  const truncated =
    highlightedText.length > 30 ? highlightedText.slice(0, 30) + '...' : highlightedText;

  return (
    <div className={styles.deleteSubConvOverlay} onClick={onCancel}>
      <div className={styles.deleteSubConvDialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.deleteSubConvIcon}>
          <MessageCircleIcon />
        </div>
        <h3 className={styles.deleteSubConvTitle}>Remove this conversation?</h3>
        <p className={styles.deleteSubConvDesc}>
          The sub-conversation about <strong>"{truncated}"</strong> and all its messages will be
          permanently removed.
        </p>
        <div className={styles.deleteSubConvActions}>
          <button className={styles.deleteSubConvCancelBtn} onClick={onCancel}>
            Keep it
          </button>
          <button className={styles.deleteSubConvConfirmBtn} onClick={onConfirm}>
            Yes, remove
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Horizontal scrollable pills showing saved sub-conversations.
 */
function SubConversationPills({ subConversations, onOpen, activeSubConvId }) {
  if (!subConversations || subConversations.length === 0) return null;

  return (
    <div className={styles.subConvPills}>
      <div className={styles.subConvPillsHeader}>
        <MessageCircleIcon />
        <span>Sub-conversations</span>
      </div>
      <div className={styles.subConvPillsTrack}>
        {subConversations.map((sc) => {
          const truncated =
            sc.highlightedText.length > 14
              ? sc.highlightedText.slice(0, 14) + '...'
              : sc.highlightedText;
          const isActive = sc.id === activeSubConvId;
          return (
            <div
              key={sc.id}
              className={`${styles.subConvPill} ${isActive ? styles.subConvPillActive : ''}`}
            >
              <button
                className={styles.subConvPillBtn}
                onClick={() => onOpen(sc.id)}
                title={sc.highlightedText}
              >
                <MessageCircleIcon />
                <span>{truncated}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Inline sources dropdown — pill in the actions bar that expands to show citations.
 */
function InlineSourcesDropdown({ citations }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!isExpanded) return;
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsExpanded(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsExpanded(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isExpanded]);

  if (!citations || citations.length === 0) return null;

  return (
    <div className={styles.inlineSourcesWrapper} ref={wrapperRef}>
      <button
        className={`${styles.inlineSourcesPill} ${isExpanded ? styles.inlineSourcesPillOpen : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <SourcesIcon />
        <span>
          {citations.length} source{citations.length !== 1 ? 's' : ''}
        </span>
        <span
          className={`${styles.inlineSourcesChevron} ${
            isExpanded ? styles.inlineSourcesChevronOpen : ''
          }`}
        >
          <ChevronDownIcon />
        </span>
      </button>
      {isExpanded && (
        <div className={styles.inlineSourcesDropdown}>
          {citations.map((citation, idx) => {
            let favicon = '';
            let hostname = '';
            try {
              const url = new URL(citation.url);
              hostname = url.hostname.replace(/^www\./, '');
              favicon = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=16`;
            } catch {
              // skip favicon
            }
            return (
              <a
                key={idx}
                href={citation.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.inlineSourceItem}
              >
                <span className={styles.inlineSourceNumber}>{idx + 1}</span>
                {favicon && <img src={favicon} alt="" className={styles.inlineSourceFavicon} />}
                <div className={styles.inlineSourceInfo}>
                  <span className={styles.inlineSourceTitle}>{citation.title || citation.url}</span>
                  {hostname && <span className={styles.inlineSourceDomain}>{hostname}</span>}
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Upgrade pill — warm glowing pill shown in the actions bar.
 * Clicking opens a delightful upgrade popup with model info and upgrade CTA.
 */
function UpgradePill({ upgradeHint }) {
  const [showPopup, setShowPopup] = useState(false);
  const effectiveTheme = useSelector(selectEffectiveTheme);
  const isDark = effectiveTheme === 'dark';

  if (!upgradeHint || !upgradeHint.recommendedModel) return null;

  const modelName = upgradeHint.recommendedModel.name;
  const modelId = upgradeHint.recommendedModel.id;
  const reason =
    upgradeHint.reason ||
    upgradeHint.recommendedModel.reasoning ||
    `This model would provide a more detailed and accurate response for your query.`;
  const fullModel = MODELS.find((m) => m.id === modelId || m.name === modelName);
  const providerData = fullModel?.provider ? PROVIDERS[fullModel.provider] : null;
  const accentColor = providerData?.accentColor || '#d4a574';

  return (
    <>
      <button
        className={styles.upgradePill}
        onClick={() => setShowPopup(true)}
        title={`Try ${modelName} — Upgrade to Pro`}
        style={{ '--upgrade-accent': accentColor }}
      >
        <span className={styles.upgradePillLabel}>Go Pro</span>
      </button>
      {showPopup && fullModel && (
        <UpgradePopup
          model={fullModel}
          reason={reason}
          onClose={() => setShowPopup(false)}
          isDark={isDark}
        />
      )}
    </>
  );
}

/**
 * Delightful upgrade popup — shown when clicking the upgrade pill.
 * Elegant card with model branding, warm Araviel aesthetics, and compelling CTA.
 */
function UpgradePopup({ model, reason, onClose, isDark }) {
  const popupRef = useRef(null);
  const providerData = model?.provider ? PROVIDERS[model.provider] : null;
  const LogoComponent = model?.provider ? getProviderLogo(model.provider) : null;
  const speedInfo = model?.speedTier ? SPEED_TIERS[model.speedTier] : null;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
    }, 10);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!model) return null;

  const accentColor = providerData?.accentColor || '#d4a574';
  const accentBg = isDark ? providerData?.accentBgDark : providerData?.accentBg;
  const accentText = isDark
    ? providerData?.accentTextDark || providerData?.accentColor
    : providerData?.accentText;

  const features = [
    { label: 'All premium models', desc: 'Access every model in the catalog' },
    { label: 'Priority routing', desc: 'Faster queue times and optimized paths' },
    { label: 'Higher limits', desc: 'Extended usage with generous quotas' },
  ];

  return createPortal(
    <div className={styles.upgradeOverlay} onClick={onClose}>
      <div className={styles.upgradePopup} ref={popupRef} onClick={(e) => e.stopPropagation()}>
        {/* Header with warm gradient and model branding */}
        <div
          className={styles.upgradePopupHeader}
          style={{
            '--popup-accent': accentColor,
            '--popup-accent-bg': accentBg,
            '--popup-accent-text': accentText,
          }}
        >
          <div className={styles.upgradePopupHeaderGlow} />
          <div className={styles.upgradePopupHeaderContent}>
            <div className={styles.upgradePopupBrand}>
              {providerData && LogoComponent && (
                <span
                  className={styles.upgradePopupLogo}
                  style={{ backgroundColor: accentBg, color: accentText }}
                >
                  <LogoComponent size={22} />
                </span>
              )}
              <div className={styles.upgradePopupModelInfo}>
                <span className={styles.upgradePopupModelName}>{model.name}</span>
                {model.tagline && (
                  <span className={styles.upgradePopupTagline}>{model.tagline}</span>
                )}
              </div>
            </div>
            <button className={styles.upgradePopupClose} onClick={onClose} aria-label="Close">
              <CloseIcon />
            </button>
          </div>

          {/* Recommended reason */}
          {reason && (
            <div className={styles.upgradePopupReason}>
              <SparkleIcon />
              <span>{reason}</span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className={styles.upgradePopupBody}>
          {/* Stats row */}
          <div className={styles.upgradePopupStats}>
            {speedInfo && (
              <div className={styles.upgradePopupStat}>
                <span className={styles.upgradePopupStatValue}>{speedInfo.label}</span>
                <span className={styles.upgradePopupStatLabel}>Speed</span>
              </div>
            )}
            {model.context && (
              <div className={styles.upgradePopupStat}>
                <span className={styles.upgradePopupStatValue}>
                  {formatTokens(model.context.inputTokens)}
                </span>
                <span className={styles.upgradePopupStatLabel}>Context</span>
              </div>
            )}
            {model.badge && (
              <div className={styles.upgradePopupStat}>
                <span className={styles.upgradePopupStatValue} style={{ color: accentColor }}>
                  {model.badge}
                </span>
                <span className={styles.upgradePopupStatLabel}>Tier</span>
              </div>
            )}
          </div>

          {/* Best for tags */}
          {model.bestFor && model.bestFor.length > 0 && (
            <div className={styles.upgradePopupTags}>
              {model.bestFor.map((tag, idx) => (
                <span
                  key={idx}
                  className={styles.upgradePopupTag}
                  style={{ backgroundColor: accentBg, color: accentText }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Pro features list */}
          <div className={styles.upgradePopupFeatures}>
            {features.map((feat, idx) => (
              <div key={idx} className={styles.upgradePopupFeature}>
                <span className={styles.upgradePopupFeatureCheck}>
                  <CheckIcon />
                </span>
                <span className={styles.upgradePopupFeatureLabel}>{feat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA footer */}
        <div className={styles.upgradePopupFooter}>
          <div className={styles.upgradePopupPricing}>
            <span className={styles.upgradePopupPrice}>$20</span>
            <span className={styles.upgradePopupPeriod}>/month</span>
          </div>
          <button
            className={styles.upgradePopupBtn}
            style={{
              '--btn-accent': accentColor,
            }}
          >
            <SparkleIcon />
            Upgrade to Pro
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * Response actions bar shown below each assistant message.
 * Left: upgrade pill (intermittent) + info icon + model pill + sources dropdown
 * Right: like, dislike, copy, retry, share
 */
function ResponseActions({
  message,
  isDark,
  onRetry,
  userPrompt,
  onSelectAlternate,
  assistantIndex,
}) {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [showShareDropdown, setShowShareDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const modelPillRef = useRef(null);

  const provider = message.provider;
  const providerData = provider ? PROVIDERS[provider] : null;
  const LogoComponent = provider ? getProviderLogo(provider) : null;

  const hasAlternates = message.alternateModels && message.alternateModels.length > 0;
  const citations = message.sources || message.citations;

  // Always show upgrade pill when hint is available (left of info icon)
  const showUpgrade = !!message.upgradeHint;

  const getProviderDisplayName = () => {
    if (!provider) return null;
    if (provider === 'anthropic') return 'Claude';
    if (provider === 'openai') return 'OpenAI';
    if (provider === 'google') return 'Gemini';
    if (provider === 'perplexity') return 'Perplexity';
    return providerData?.name || provider;
  };

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [message.content]);

  const handleRetryClick = useCallback(() => {
    if (onRetry && userPrompt) {
      onRetry(userPrompt);
    }
  }, [onRetry, userPrompt]);

  const handleLike = () => {
    setLiked(!liked);
    if (disliked) setDisliked(false);
  };

  const handleDislike = () => {
    setDisliked(!disliked);
    if (liked) setLiked(false);
  };

  const displayName = getProviderDisplayName();

  return (
    <div className={styles.responseActions}>
      <div className={styles.responseActionsLeft}>
        {showUpgrade && <UpgradePill upgradeHint={message.upgradeHint} />}
        <UsageFooterInline message={message} isDark={isDark} />
        {providerData && LogoComponent && (
          <div
            className={styles.modelPillSmallWrapper}
            ref={modelPillRef}
            onClick={() => setShowModelDropdown((prev) => !prev)}
          >
            <div
              className={`${styles.modelPillSmall} ${
                hasAlternates ? styles.modelPillSmallClickable : ''
              }`}
              style={{
                backgroundColor: isDark ? providerData.accentBgDark : providerData.accentBg,
                color: isDark
                  ? providerData.accentTextDark || providerData.accentColor
                  : providerData.accentText,
              }}
            >
              <LogoComponent size={12} />
              <span>{displayName}</span>
              {hasAlternates && (
                <span className={styles.modelPillChevron}>
                  <ChevronDownIcon />
                </span>
              )}
            </div>
            {showModelDropdown && (
              <ModelPillDropdown
                message={message}
                isDark={isDark}
                position="above"
                onClose={() => setShowModelDropdown(false)}
                onSelectAlternate={onSelectAlternate}
                triggerRef={modelPillRef}
              />
            )}
          </div>
        )}
        <InlineSourcesDropdown citations={citations} />
      </div>

      <div className={styles.responseActionsRight}>
        <button
          className={`${styles.actionIcon} ${liked ? styles.actionIconActive : ''}`}
          onClick={handleLike}
          title="Like"
          aria-label="Like response"
        >
          <ThumbsUpIcon />
        </button>
        <button
          className={`${styles.actionIcon} ${disliked ? styles.actionIconActive : ''}`}
          onClick={handleDislike}
          title="Dislike"
          aria-label="Dislike response"
        >
          <ThumbsDownIcon />
        </button>
        <button
          className={`${styles.actionIcon} ${copied ? styles.actionIconCopied : ''}`}
          onClick={handleCopy}
          title={copied ? 'Copied!' : 'Copy'}
          aria-label="Copy response"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
        <button
          className={styles.actionIcon}
          onClick={handleRetryClick}
          title="Retry"
          aria-label="Retry response"
        >
          <RefreshIcon />
        </button>
        <div className={styles.shareActionWrapper}>
          <button
            className={styles.actionIcon}
            onClick={() => setShowShareDropdown(!showShareDropdown)}
            title="Share"
            aria-label="Share response"
          >
            <ShareIcon />
          </button>
          {showShareDropdown && (
            <ShareDropdown message={message} onClose={() => setShowShareDropdown(false)} />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Follow-up suggestions component shown after assistant responses.
 */
function FollowUpSuggestions({ suggestions, onSelect }) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className={styles.followUps}>
      <div className={styles.followUpsHeader}>
        <span>Follow up</span>
      </div>
      <div className={styles.followUpsList}>
        {suggestions.map((suggestion, idx) => (
          <button key={idx} className={styles.followUpItem} onClick={() => onSelect(suggestion)}>
            <span className={styles.followUpText}>{suggestion}</span>
            <ArrowRightIcon />
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Collapsible thinking block shown before assistant responses.
 * Shows routing + thinking + web search stages with a clean timeline.
 * Persists at the top of the response so users can always expand it.
 */
function ThinkingBlock({
  thinkingData,
  thinkingContent,
  modelName,
  provider,
  webSearchUsed,
  webSearchSources,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showWebSources, setShowWebSources] = useState(false);
  const effectiveTheme = useSelector(selectEffectiveTheme);
  const isDark = effectiveTheme === 'dark';

  if (!thinkingData && !thinkingContent) return null;

  const routingDuration = thinkingData?.routingDuration || '0.0';
  const thinkingDuration = thinkingData?.thinkingDuration || '0.0';
  const totalDuration = thinkingData?.totalDuration || '0.0';
  const providerData = provider ? PROVIDERS[provider] : null;
  const LogoComponent = provider ? getProviderLogo(provider) : null;

  // Build a summary label for the toggle
  const stepsCount = 2 + (webSearchUsed ? 1 : 0);
  const summaryLabel = `Thought for ${totalDuration}s`;

  return (
    <div className={styles.thinkingBlock}>
      <button
        className={styles.thinkingToggle}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className={styles.thinkingToggleIcon}>
          {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
        </span>
        <span className={styles.thinkingToggleLabel}>{summaryLabel}</span>
        <span className={styles.thinkingStepCount}>{stepsCount} steps</span>
      </button>

      {isExpanded && (
        <div className={styles.thinkingDetails}>
          {/* Stage 1: Routing */}
          <div className={styles.thinkingStage}>
            <div className={styles.thinkingDotLine}>
              <span className={styles.thinkingStageDotComplete} />
              <span className={styles.thinkingVerticalLine} />
            </div>
            <div className={styles.thinkingStageContent}>
              <span className={styles.thinkingStageLabel}>Routed to optimal model</span>
              <span className={styles.thinkingStageDuration}>{routingDuration}s</span>
            </div>
          </div>

          {/* Stage 2: Web search (if used) */}
          {webSearchUsed && (
            <div className={styles.thinkingStage}>
              <div className={styles.thinkingDotLine}>
                <span className={styles.thinkingStageDotComplete} />
                <span className={styles.thinkingVerticalLine} />
              </div>
              <div className={styles.thinkingStageContent}>
                <button
                  className={styles.thinkingStageWebSearch}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowWebSources(!showWebSources);
                  }}
                >
                  <GlobeIcon />
                  <span>Searched the web</span>
                  <span className={styles.thinkingStageChevron}>
                    {showWebSources ? <ChevronDownIcon /> : <ChevronRightIcon />}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Web search sources detail */}
          {showWebSources && webSearchSources && webSearchSources.length > 0 && (
            <div className={styles.thinkingWebSources}>
              {webSearchSources.map((source, idx) => {
                let hostname = '';
                let favicon = '';
                try {
                  const url = new URL(source.url);
                  hostname = url.hostname.replace(/^www\./, '');
                  favicon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=16`;
                } catch {
                  /* ignore */
                }
                return (
                  <a
                    key={idx}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.thinkingWebSourceItem}
                  >
                    {favicon && (
                      <img src={favicon} alt="" className={styles.thinkingWebSourceFavicon} />
                    )}
                    <span className={styles.thinkingWebSourceTitle}>
                      {source.title || hostname}
                    </span>
                    {hostname && <span className={styles.thinkingWebSourceDomain}>{hostname}</span>}
                  </a>
                );
              })}
            </div>
          )}

          {/* Stage 3: Thinking */}
          <div className={styles.thinkingStage}>
            <div className={styles.thinkingDotLine}>
              <span className={styles.thinkingStageDotComplete} />
              <span className={styles.thinkingVerticalLine} />
            </div>
            <div className={styles.thinkingStageContent}>
              <span className={styles.thinkingStageLabel}>
                Thought with{' '}
                {providerData && LogoComponent ? (
                  <span
                    className={styles.thinkingModelBadge}
                    style={{
                      backgroundColor: isDark ? providerData.accentBgDark : providerData.accentBg,
                      color: isDark
                        ? providerData.accentTextDark || providerData.accentColor
                        : providerData.accentText,
                    }}
                  >
                    <LogoComponent size={11} />
                    {modelName}
                  </span>
                ) : (
                  modelName
                )}
              </span>
              <span className={styles.thinkingStageDuration}>{thinkingDuration}s</span>
            </div>
          </div>

          {/* Real thinking content from the AI */}
          {thinkingContent && (
            <div className={styles.thinkingContentBlock}>
              <div className={styles.thinkingContentText}>{thinkingContent}</div>
            </div>
          )}

          {/* Stage 4: Response written */}
          <div className={`${styles.thinkingStage} ${styles.thinkingStageLast}`}>
            <div className={styles.thinkingDotLine}>
              <span className={styles.thinkingStageDotComplete} />
            </div>
            <div className={styles.thinkingStageContent}>
              <span className={styles.thinkingStageLabel}>Wrote response</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * User prompt component with distinctive styling and collapse/expand for long messages.
 * Includes hover actions: copy and edit (sends content back to input).
 */
function UserPrompt({ content, onEdit }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const contentRef = useRef(null);
  const [isLong, setIsLong] = useState(false);
  const LINE_LIMIT = 10;

  useEffect(() => {
    const lineCount = (content || '').split('\n').length;
    setIsLong(lineCount > LINE_LIMIT);
  }, [content]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [content]);

  const handleEdit = useCallback(() => {
    if (onEdit) onEdit(content);
  }, [content, onEdit]);

  // Calculate collapsed height based on line count
  const collapsedStyle = !isExpanded && isLong ? { maxHeight: `${LINE_LIMIT * 1.65}em` } : {};

  return (
    <div className={styles.userPromptCard}>
      <div className={styles.userPromptActions}>
        <button
          className={`${styles.userPromptActionBtn} ${copied ? styles.userPromptActionBtnActive : ''}`}
          onClick={handleCopy}
          title={copied ? 'Copied!' : 'Copy'}
          aria-label="Copy prompt"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
        <button
          className={styles.userPromptActionBtn}
          onClick={handleEdit}
          title="Edit prompt"
          aria-label="Edit prompt"
        >
          <EditIcon />
        </button>
      </div>
      <div
        ref={contentRef}
        className={`${styles.userPromptText} ${
          !isExpanded && isLong ? styles.userPromptCollapsed : ''
        }`}
        style={collapsedStyle}
      >
        {content}
      </div>
      {isLong && (
        <button
          className={styles.userPromptToggle}
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
        >
          <span>{isExpanded ? 'See less' : 'See more'}</span>
          <span
            className={`${styles.userPromptToggleIcon} ${
              isExpanded ? styles.userPromptToggleIconFlipped : ''
            }`}
          >
            <ChevronDownIcon />
          </span>
        </button>
      )}
    </div>
  );
}

/**
 * A single message in the chat.
 */
function Message({
  message,
  isStreaming,
  streamedText,
  isDark,
  isLastAssistant,
  hideThinking,
  onFollowUpSelect,
  onRetry,
  onAlternateModelRequest,
  userPrompt,
  onSubConvPanelToggle,
  subConvPanelOwnerId,
  onSetSubConvPanelOwner,
  currentChatId,
  assistantIndex,
  onEditPrompt,
}) {
  const isUser = message.role === 'user';
  const displayText = isStreaming ? streamedText : message.content;
  const provider = message.provider;
  const providerData = provider ? PROVIDERS[provider] : null;
  const LogoComponent = provider ? getProviderLogo(provider) : null;
  const [showHeaderDropdown, setShowHeaderDropdown] = useState(false);
  const [pendingAlternate, setPendingAlternate] = useState(null);
  const [showCodeCanvas, setShowCodeCanvas] = useState(false);
  const hasAlternates = message.alternateModels && message.alternateModels.length > 0;
  const headerPillRef = useRef(null);

  // Sub-conversation state
  const [subConversations, setSubConversations] = useState([]);
  const [activeSubConvId, setActiveSubConvId] = useState(null);
  const [showSubConvPanel, setShowSubConvPanel] = useState(false);
  const [selectionTooltip, setSelectionTooltip] = useState(null);
  const [isSendingSubMsg, setIsSendingSubMsg] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [subConvThinkingStatus, setSubConvThinkingStatus] = useState('idle'); // idle | thinking | streaming
  const [subConvStreamText, setSubConvStreamText] = useState('');
  const subConvStreamRef = useRef(null);
  const markdownContentRef = useRef(null);
  const tooltipTimeoutRef = useRef(null);

  // Handle text selection within the assistant message content
  const handleMouseUp = useCallback(() => {
    if (isUser || isStreaming) return;

    // Small delay to let the selection settle
    if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    tooltipTimeoutRef.current = setTimeout(() => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (!text || text.length < 2) {
        setSelectionTooltip(null);
        return;
      }

      // Check the selection is within this message's markdown content
      const contentEl = markdownContentRef.current;
      if (!contentEl) return;

      const range = selection.getRangeAt(0);
      if (!contentEl.contains(range.commonAncestorContainer)) {
        setSelectionTooltip(null);
        return;
      }

      const rect = range.getBoundingClientRect();
      const containerRect = contentEl.closest(`.${styles.message}`)?.getBoundingClientRect();
      if (!containerRect) return;

      setSelectionTooltip({
        text,
        x: rect.left + rect.width / 2 - containerRect.left,
        y: rect.top - containerRect.top - 8,
      });
    }, 10);
  }, [isUser, isStreaming]);

  // Dismiss tooltip when clicking outside or when selection clears
  useEffect(() => {
    if (!selectionTooltip) return;

    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || !selection.toString().trim()) {
        setSelectionTooltip(null);
      }
    };

    const handleMouseDown = (e) => {
      // Don't dismiss if clicking the tooltip itself
      if (e.target.closest(`.${styles.selectionTooltip}`)) return;
      setSelectionTooltip(null);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [selectionTooltip]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    };
  }, []);

  // Start a new sub-conversation from highlighted text
  const handleAskAraviel = useCallback(async () => {
    if (!selectionTooltip?.text) return;

    const highlightedText = selectionTooltip.text;
    setSelectionTooltip(null);
    window.getSelection()?.removeAllRanges();

    // If we have a currentChatId and message id, create via API
    if (currentChatId && message.id) {
      try {
        const subConv = await createSubConversation(currentChatId, message.id, highlightedText);
        const newSubConv = {
          id: subConv.id,
          highlightedText: subConv.highlightedText,
          messages: [],
        };
        setSubConversations((prev) => [...prev, newSubConv]);
        setActiveSubConvId(newSubConv.id);
        setShowSubConvPanel(true);
        if (onSubConvPanelToggle) onSubConvPanelToggle(true);
        return;
      } catch {
        // Fall through to local-only creation
      }
    }

    // Fallback: local-only sub-conversation
    const newSubConv = {
      id: `subconv-${Date.now()}`,
      highlightedText,
      messages: [],
    };
    setSubConversations((prev) => [...prev, newSubConv]);
    setActiveSubConvId(newSubConv.id);
    setShowSubConvPanel(true);
    if (onSubConvPanelToggle) onSubConvPanelToggle(true);
  }, [selectionTooltip, onSubConvPanelToggle, currentChatId, message.id]);

  // Cleanup streaming on unmount
  useEffect(() => {
    return () => {
      if (subConvStreamRef.current) clearTimeout(subConvStreamRef.current);
    };
  }, []);

  // Load existing sub-conversations for this message from the API
  useEffect(() => {
    if (isUser || !currentChatId || !message.id || isStreaming) return;
    // Only fetch if we don't already have sub-conversations loaded
    if (subConversations.length > 0) return;

    let cancelled = false;
    (async () => {
      try {
        const data = await fetchSubConversations(currentChatId, message.id);
        if (cancelled || !data.subConversations?.length) return;
        const mapped = data.subConversations.map((sc) => ({
          id: sc.id,
          highlightedText: sc.highlightedText,
          messages: [], // loaded on demand when opened
        }));
        setSubConversations(mapped);
      } catch {
        // Silently fail
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentChatId, message.id, isUser, isStreaming]); // eslint-disable-line react-hooks/exhaustive-deps

  // Send a message in the active sub-conversation via real SSE
  const handleSubConvSend = useCallback(
    async (text) => {
      if (!activeSubConvId) return;

      // Add user message locally
      setSubConversations((prev) =>
        prev.map((sc) =>
          sc.id === activeSubConvId
            ? { ...sc, messages: [...sc.messages, { role: 'user', content: text }] }
            : sc
        )
      );

      setIsSendingSubMsg(true);
      setSubConvThinkingStatus('thinking');
      setSubConvStreamText('');

      let accumulatedContent = '';

      try {
        const response = await sendMessage({
          message: text,
          conversationId: currentChatId || undefined,
          subConversationId: activeSubConvId,
        });

        await consumeSSEStream(response, (event) => {
          const { type, data } = event;

          if (type === 'routing') {
            // Sub-conv routing done, move to thinking/streaming phase
          } else if (type === 'thinking') {
            // Still thinking
          } else if (type === 'delta') {
            setSubConvThinkingStatus('streaming');
            accumulatedContent += data.content || '';
            setSubConvStreamText(accumulatedContent);
          } else if (type === 'done') {
            // Finalize
          } else if (type === 'error') {
            if (data.code !== 'PROVIDER_RETRY') {
              accumulatedContent += `\n\n*Error: ${data.message}*`;
              setSubConvStreamText(accumulatedContent);
            }
          }
        });
      } catch (err) {
        accumulatedContent = accumulatedContent || `*Error: ${err.message || 'Connection failed'}*`;
      }

      // Finalize: add assistant message and reset streaming state
      const finalContent = accumulatedContent || '*No response received*';
      setSubConvStreamText('');
      setSubConvThinkingStatus('idle');
      setIsSendingSubMsg(false);
      setSubConversations((prev) =>
        prev.map((sc) =>
          sc.id === activeSubConvId
            ? { ...sc, messages: [...sc.messages, { role: 'assistant', content: finalContent }] }
            : sc
        )
      );
    },
    [activeSubConvId, currentChatId]
  );

  // Open existing sub-conversation pill — fetch messages from API
  const handleOpenSubConv = useCallback(
    async (id) => {
      setActiveSubConvId(id);
      setShowSubConvPanel(true);
      if (onSubConvPanelToggle) onSubConvPanelToggle(true);

      // Try to load messages from backend
      try {
        const data = await fetchSubConversationMessages(id);
        if (data.messages && data.messages.length > 0) {
          const mappedMsgs = data.messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          }));
          setSubConversations((prev) =>
            prev.map((sc) => (sc.id === id ? { ...sc, messages: mappedMsgs } : sc))
          );
        }
      } catch {
        // Use whatever local messages we have
      }
    },
    [onSubConvPanelToggle]
  );

  // Close panel
  const handleCloseSubConvPanel = useCallback(() => {
    const activeConv = subConversations.find((sc) => sc.id === activeSubConvId);
    // If the sub-conversation has no messages, remove it
    if (activeConv && activeConv.messages.length === 0) {
      setSubConversations((prev) => prev.filter((sc) => sc.id !== activeSubConvId));
    }
    setShowSubConvPanel(false);
    setActiveSubConvId(null);
    if (onSubConvPanelToggle) onSubConvPanelToggle(false);
  }, [activeSubConvId, subConversations, onSubConvPanelToggle]);

  // Request to delete a sub-conversation (shows confirmation)
  const handleRequestDeleteSubConv = useCallback((id) => {
    setPendingDeleteId(id);
  }, []);

  // Confirm delete
  const handleConfirmDeleteSubConv = useCallback(() => {
    if (!pendingDeleteId) return;
    // If deleting the active one, close the panel
    if (pendingDeleteId === activeSubConvId) {
      setShowSubConvPanel(false);
      setActiveSubConvId(null);
      if (onSubConvPanelToggle) onSubConvPanelToggle(false);
    }
    setSubConversations((prev) => prev.filter((sc) => sc.id !== pendingDeleteId));
    setPendingDeleteId(null);
  }, [pendingDeleteId, activeSubConvId, onSubConvPanelToggle]);

  // Cancel delete
  const handleCancelDeleteSubConv = useCallback(() => {
    setPendingDeleteId(null);
  }, []);

  // If another message took ownership of the panel, close ours
  useEffect(() => {
    if (showSubConvPanel && subConvPanelOwnerId !== null && subConvPanelOwnerId !== message.id) {
      setShowSubConvPanel(false);
      setActiveSubConvId(null);
    }
  }, [subConvPanelOwnerId, showSubConvPanel, message.id]);

  // Register this message as the panel owner when it opens
  useEffect(() => {
    if (showSubConvPanel && onSetSubConvPanelOwner) {
      onSetSubConvPanelOwner(message.id);
    }
  }, [showSubConvPanel, message.id, onSetSubConvPanelOwner]);

  const activeSubConversation = subConversations.find((sc) => sc.id === activeSubConvId);
  const pendingDeleteConv = subConversations.find((sc) => sc.id === pendingDeleteId);

  // Memoize follow-ups so they don't regenerate on every render (which causes jitter)
  const followUps = useMemo(() => {
    if (!isUser && isLastAssistant && !isStreaming && message.content) {
      return generateFollowUps(message.content);
    }
    return [];
  }, [isUser, isLastAssistant, isStreaming, message.content]);

  return (
    <div
      className={`${styles.message} ${isUser ? styles.userMessage : styles.assistantMessage}`}
      style={{ position: 'relative' }}
    >
      {!isUser && providerData && (
        <div className={styles.assistantHeader}>
          <div
            className={styles.providerPillWrapper}
            ref={headerPillRef}
            onClick={() => setShowHeaderDropdown((prev) => !prev)}
          >
            <div
              className={`${styles.providerPill} ${
                hasAlternates ? styles.providerPillClickable : ''
              }`}
              style={{
                backgroundColor: isDark ? providerData.accentBgDark : providerData.accentBg,
                color: isDark
                  ? providerData.accentTextDark || providerData.accentColor
                  : providerData.accentText,
              }}
            >
              <LogoComponent size={14} />
              <span>{message.modelName || providerData.name}</span>
              {message.score && (
                <>
                  <span className={styles.pillDivider}>&#183;</span>
                  <span className={styles.scoreText}>
                    {getFitLabel(message.score) || 'Matched'}
                  </span>
                </>
              )}
              {hasAlternates && (
                <span className={styles.providerPillChevron}>
                  <ChevronDownIcon />
                </span>
              )}
            </div>
            {showHeaderDropdown && (
              <ModelPillDropdown
                message={message}
                isDark={isDark}
                position="below"
                onClose={() => setShowHeaderDropdown(false)}
                onSelectAlternate={(alt) => setPendingAlternate(alt)}
                triggerRef={headerPillRef}
              />
            )}
          </div>
          {message.webSearchUsed && !isStreaming && (
            <WebSearchBadgeWithSources
              isAutoDetected={message.webSearchAutoDetected}
              citations={message.citations}
            />
          )}
        </div>
      )}

      {/* Alternate model confirmation dialog */}
      {pendingAlternate && (
        <AlternateModelConfirmDialog
          alternateModel={pendingAlternate}
          currentModelName={message.modelName}
          isDark={isDark}
          onConfirm={() => {
            const alt = pendingAlternate;
            setPendingAlternate(null);
            if (onAlternateModelRequest && userPrompt) {
              onAlternateModelRequest(userPrompt, alt);
            }
          }}
          onCancel={() => setPendingAlternate(null)}
        />
      )}

      {!isUser &&
        !isStreaming &&
        !hideThinking &&
        (message.thinkingData || message.thinkingContent) && (
          <ThinkingBlock
            thinkingData={message.thinkingData}
            thinkingContent={message.thinkingContent}
            modelName={message.modelName}
            provider={message.provider}
            webSearchUsed={message.webSearchUsed}
            webSearchSources={message.sources || message.citations}
          />
        )}

      {/* Web search indicator during tool_use */}
      {!isUser && isStreaming && message.toolUse && message.toolUse.tool === 'web_search' && (
        <WebSearchIndicator />
      )}

      {/* Provider retry notice */}
      {!isUser && message.providerRetry && isStreaming && (
        <div className={styles.providerRetryNotice}>
          <span>Switching to backup model...</span>
        </div>
      )}

      <div className={styles.messageContent} onMouseUp={handleMouseUp}>
        {isUser ? (
          <UserPrompt content={message.content} onEdit={onEditPrompt} />
        ) : (
          <div className={styles.markdownContent} ref={markdownContentRef}>
            {renderMarkdown(displayText)}
            {isStreaming && <span className={styles.cursor} />}
          </div>
        )}
      </div>

      {/* Code canvas button — shown below response when code blocks exist */}
      {!isUser &&
        !isStreaming &&
        displayText &&
        (() => {
          const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
          const blocks = [];
          let m;
          while ((m = codeBlockRegex.exec(displayText)) !== null) {
            blocks.push({ lang: m[1] || '', code: m[2] });
          }
          if (blocks.length === 0) return null;
          return (
            <>
              <CodeCanvasButton codeBlocks={blocks} onClick={() => setShowCodeCanvas(true)} />
              {showCodeCanvas && (
                <CodeCanvasViewer codeBlocks={blocks} onClose={() => setShowCodeCanvas(false)} />
              )}
            </>
          );
        })()}

      {/* Error card */}
      {!isUser && message.error && (
        <ErrorCard error={message.error} onRetry={onRetry} userPrompt={userPrompt} />
      )}

      {/* Stream timeout notice */}
      {!isUser && !isStreaming && message.streamTimeout && <StreamTimeoutNotice />}

      {/* Text selection tooltip */}
      {selectionTooltip && !isUser && (
        <SelectionTooltip position={selectionTooltip} onAsk={handleAskAraviel} />
      )}

      {!isUser && !isStreaming && message.content && (
        <ResponseActions
          message={message}
          isDark={isDark}
          onRetry={onRetry}
          userPrompt={userPrompt}
          onSelectAlternate={(alt) => setPendingAlternate(alt)}
          assistantIndex={assistantIndex}
        />
      )}

      {/* Sub-conversation pills */}
      {!isUser && !isStreaming && message.content && (
        <SubConversationPills
          subConversations={subConversations}
          onOpen={handleOpenSubConv}
          activeSubConvId={showSubConvPanel ? activeSubConvId : null}
        />
      )}

      {followUps.length > 0 && (
        <FollowUpSuggestions suggestions={followUps} onSelect={onFollowUpSelect} />
      )}

      {/* Sub-conversation panel (right side) */}
      {showSubConvPanel && activeSubConversation && subConvPanelOwnerId === message.id && (
        <SubConversationPanel
          subConversation={activeSubConversation}
          onSend={handleSubConvSend}
          onClose={handleCloseSubConvPanel}
          isSending={isSendingSubMsg}
          streamingText={subConvStreamText}
          thinkingStatus={subConvThinkingStatus}
        />
      )}

      {/* Delete sub-conversation not supported by backend */}
    </div>
  );
}

/**
 * MessageList renders the full conversation including thinking timeline.
 */
export default function MessageList({
  messages,
  isProcessing,
  timelineStages,
  timelineFading,
  modelName,
  provider,
  isStreaming,
  streamedText,
  onRetry,
  onAlternateModelRequest,
  onSubConvPanelToggle,
  focusInput,
  currentChatId,
}) {
  const dispatch = useDispatch();
  const effectiveTheme = useSelector(selectEffectiveTheme);
  const isDark = effectiveTheme === 'dark';
  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [shouldPulse, setShouldPulse] = useState(false);
  const [subConvPanelOwnerId, setSubConvPanelOwnerId] = useState(null);
  const userScrolledDuringStreamRef = useRef(false);
  const wasStreamingRef = useRef(false);

  // Track scroll position → show/hide scroll-to-bottom button.
  // Detect user-initiated scrolling during streaming via wheel/touch events only
  // (these never fire from programmatic scrolls).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      const isNearBottom = distanceFromBottom <= 50;
      setShowScrollToBottom(!isNearBottom);
      if (isNearBottom) setShouldPulse(false);
    };

    const handleUserScroll = () => {
      userScrolledDuringStreamRef.current = true;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    container.addEventListener('wheel', handleUserScroll, { passive: true });
    container.addEventListener('touchmove', handleUserScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('wheel', handleUserScroll);
      container.removeEventListener('touchmove', handleUserScroll);
    };
  }, []);

  // Handle streaming start/end transitions for smart auto-scroll
  useEffect(() => {
    // Streaming just started → reset scroll tracking
    if (isStreaming && !wasStreamingRef.current) {
      userScrolledDuringStreamRef.current = false;
    }

    // Streaming just ended → conditionally scroll or pulse
    if (!isStreaming && wasStreamingRef.current) {
      const container = containerRef.current;
      if (container) {
        const distanceFromBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight;
        const isNearBottom = distanceFromBottom <= 150;

        if (!userScrolledDuringStreamRef.current || isNearBottom) {
          // User didn't interact with scroll OR is still near bottom → smooth scroll
          if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
          }
        } else {
          // User scrolled away during streaming → pulse the scroll-to-bottom button
          setShouldPulse(true);
        }
      }
    }

    wasStreamingRef.current = isStreaming;
  }, [isStreaming]);

  // Scroll to bottom on new messages (user sends or assistant message added) and reset
  useEffect(() => {
    userScrolledDuringStreamRef.current = false;
    setShouldPulse(false);
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages.length]);

  const handleFollowUpSelect = useCallback(
    (text) => {
      dispatch(setInputValue(text));
      if (focusInput) focusInput();
    },
    [dispatch, focusInput]
  );

  const handleEditPrompt = useCallback(
    (text) => {
      dispatch(setInputValue(text));
      if (focusInput) focusInput();
    },
    [dispatch, focusInput]
  );

  const scrollToBottom = useCallback(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
    setShouldPulse(false);
  }, []);

  if (messages.length === 0 && !isProcessing) return null;

  const lastMsg = messages[messages.length - 1];
  const isLastAssistantStreaming = isStreaming && lastMsg && lastMsg.role === 'assistant';

  // Find the index of the last assistant message
  let lastAssistantIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant') {
      lastAssistantIdx = i;
      break;
    }
  }

  // Determine where to insert the timeline:
  // - If last message is a streaming assistant msg, timeline goes before it
  // - Otherwise, timeline goes after all messages
  const timelineBeforeLastMsg = isLastAssistantStreaming;

  // Pre-compute assistant indices for upgrade pill intermittent display
  const assistantIndices = new Map();
  let aIdx = 0;
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].role === 'assistant') {
      assistantIndices.set(i, aIdx);
      aIdx++;
    }
  }

  return (
    <div className={styles.messageList} ref={containerRef}>
      {/* Top fade gradient */}
      <div className={styles.topFade} />

      <div className={styles.messagesInner}>
        {messages.map((msg, index) => {
          const isLast = index === messages.length - 1;
          const shouldStream = isLast && isLastAssistantStreaming;
          const isLastAssistant = index === lastAssistantIdx && !isProcessing;

          // Find the user prompt that preceded this assistant message
          let userPrompt = null;
          if (msg.role === 'assistant') {
            for (let j = index - 1; j >= 0; j--) {
              if (messages[j].role === 'user') {
                userPrompt = messages[j].content;
                break;
              }
            }
          }

          return (
            <div key={msg.id || index}>
              {/* Insert timeline before the streaming assistant message */}
              {isLast && timelineBeforeLastMsg && isProcessing && timelineStages && (
                <div className={styles.timelineWrapper}>
                  <ThinkingTimeline
                    stages={timelineStages}
                    modelName={modelName}
                    provider={provider}
                    fading={timelineFading}
                  />
                </div>
              )}
              <Message
                message={msg}
                isStreaming={shouldStream}
                streamedText={shouldStream ? streamedText : msg.content}
                isDark={isDark}
                isLastAssistant={isLastAssistant}
                hideThinking={isLast && isProcessing && msg.role === 'assistant'}
                onFollowUpSelect={handleFollowUpSelect}
                onRetry={onRetry}
                onAlternateModelRequest={onAlternateModelRequest}
                userPrompt={userPrompt}
                onSubConvPanelToggle={onSubConvPanelToggle}
                subConvPanelOwnerId={subConvPanelOwnerId}
                onSetSubConvPanelOwner={setSubConvPanelOwnerId}
                currentChatId={currentChatId}
                assistantIndex={assistantIndices.get(index) ?? -1}
                onEditPrompt={handleEditPrompt}
              />
            </div>
          );
        })}

        {/* Timeline after all messages (routing/thinking phase, no assistant msg yet) */}
        {!timelineBeforeLastMsg && isProcessing && timelineStages && (
          <div className={styles.timelineWrapper}>
            <ThinkingTimeline
              stages={timelineStages}
              modelName={modelName}
              provider={provider}
              fading={timelineFading}
            />
          </div>
        )}

        <div ref={bottomRef} className={styles.scrollAnchor} />
      </div>

      {/* Scroll-to-bottom floating button */}
      <div className={styles.scrollToBottomAnchor}>
        {showScrollToBottom && (
          <button
            className={`${styles.scrollToBottom} ${shouldPulse ? styles.scrollToBottomPulse : ''}`}
            onClick={scrollToBottom}
            aria-label="Scroll to bottom"
          >
            <ChevronDownIcon />
          </button>
        )}
      </div>
    </div>
  );
}
