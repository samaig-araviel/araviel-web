import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectEffectiveTheme } from '../../store/slices/themeSlice';
import { setInputValue } from '../../store/slices/chatSlice';
import { getProviderLogo } from '../getProviderLogo';
import { PROVIDERS, MODELS, SPEED_TIERS, formatTokens } from '../../data/models';
import {
  createSubConversation,
  fetchSubConversations,
  fetchSubConversationMessages,
  sendMessage,
  consumeSSEStream,
  submitMessageFeedback,
  deleteSubConversation,
  updateSubConversation,
  reportSubConversation,
} from '../../services/api';
import { useToast } from '../Toast/Toast';
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
  StarIcon,
  FlagIcon,
  MoreVerticalIcon,
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
import AravielChart from '../AravielChart/AravielChart';
import TimelineBlock from '../TimelineBlock/TimelineBlock';
import ComparisonBlock from '../ComparisonBlock/ComparisonBlock';
import StepsBlock from '../StepsBlock/StepsBlock';
import FileBlock from '../FileBlock/FileBlock';
import WeatherCard from '../WeatherCard';
import { detectWeatherResponse, extractWeatherData } from '../WeatherCard/weatherParser';
import { generateAndDownload } from '../../services/fileGenerator';
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
 * Extract video info (provider, ID, thumbnail, embed URL) from a URL.
 * Returns null if the URL is not a recognized video link.
 */
function extractVideoInfo(url) {
  try {
    const u = new URL(url);

    // YouTube: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/shorts/ID
    if (u.hostname.includes('youtube.com') || u.hostname === 'youtu.be') {
      let videoId;
      if (u.hostname === 'youtu.be') {
        videoId = u.pathname.slice(1).split('/')[0];
      } else if (u.pathname === '/watch') {
        videoId = u.searchParams.get('v');
      } else if (u.pathname.startsWith('/embed/')) {
        videoId = u.pathname.split('/embed/')[1].split('/')[0];
      } else if (u.pathname.startsWith('/shorts/')) {
        videoId = u.pathname.split('/shorts/')[1].split('/')[0];
      }
      if (videoId) {
        return {
          provider: 'youtube',
          videoId,
          thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
          embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1`,
        };
      }
    }

    // Vimeo: vimeo.com/ID
    if (u.hostname.includes('vimeo.com')) {
      const match = u.pathname.match(/^\/(\d+)/);
      if (match) {
        return {
          provider: 'vimeo',
          videoId: match[1],
          thumbnailUrl: null,
          embedUrl: `https://player.vimeo.com/video/${match[1]}?autoplay=1`,
        };
      }
    }
  } catch {
    // invalid URL
  }
  return null;
}

/**
 * Render basic markdown to React elements.
 * Handles: code blocks, inline code, bold, italic, horizontal rules, lists, images, links, paragraphs.
 */
function renderMarkdown(text, isStreaming = false) {
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
      } else if (lang === 'chart' || lang === 'araviel-chart') {
        elements.push(<AravielChart key={key++} spec={codeContent} isStreaming={isStreaming} />);
      } else if (lang === 'timeline') {
        elements.push(<TimelineBlock key={key++} spec={codeContent} isStreaming={isStreaming} />);
      } else if (lang === 'comparison') {
        elements.push(<ComparisonBlock key={key++} spec={codeContent} isStreaming={isStreaming} />);
      } else if (lang === 'steps') {
        elements.push(<StepsBlock key={key++} spec={codeContent} isStreaming={isStreaming} />);
      } else if (lang === 'file') {
        elements.push(<FileBlock key={key++} spec={codeContent} isStreaming={isStreaming} />);
      } else if (lang === 'json' || lang === '') {
        // Auto-detect chart specs in json/untagged code blocks
        let isChartSpec = false;
        try {
          const parsed = JSON.parse(codeContent);
          const chartTypes = [
            'line',
            'area',
            'bar',
            'candlestick',
            'pie',
            'donut',
            'composed',
            'scatter',
          ];
          if (parsed && chartTypes.includes(parsed.type) && Array.isArray(parsed.data)) {
            isChartSpec = true;
          }
        } catch {
          // not valid JSON — render as code block
        }
        if (isChartSpec) {
          elements.push(<AravielChart key={key++} spec={codeContent} isStreaming={isStreaming} />);
        } else {
          elements.push(<CodeBlock key={key++} lang={lang} code={codeContent} />);
        }
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
      // Detect note/warning/disclaimer blockquotes
      const firstLine = quoteLines[0] || '';
      const isNote =
        /^(\*\*\s*)?(Note|Warning|Disclaimer|Important|Caution|Please note|Caveat)\b/i.test(
          firstLine
        ) || /^[\u26A0\uFE0F\u2139\uFE0F\u2757\uFE0F]/.test(firstLine);
      const quoteClass = isNote
        ? `${styles.blockquote} ${styles.blockquoteNote}`
        : styles.blockquote;
      elements.push(
        <blockquote className={quoteClass} key={key++}>
          {isNote && (
            <span className={styles.blockquoteIcon} aria-hidden="true">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </span>
          )}
          <div className={styles.blockquoteContent}>
            {quoteLines.map((ql, qi) =>
              ql === '' ? <br key={qi} /> : <p key={qi}>{renderInline(ql)}</p>
            )}
          </div>
        </blockquote>
      );
      continue;
    }

    // Unordered list (supports nested sub-items indented with 2+ spaces/tab)
    if (/^[-*]\s/.test(line.trim())) {
      const items = [];
      while (i < lines.length) {
        const raw = lines[i];
        // Top-level bullet
        if (/^[-*]\s/.test(raw.trim()) && /^[-*]\s/.test(raw)) {
          items.push({ text: raw.trim().replace(/^[-*]\s/, ''), children: [] });
          i++;
          continue;
        }
        // Indented sub-bullet (2+ spaces or tab before the dash/star)
        if (/^(\s{2,}|\t)[-*]\s/.test(raw)) {
          const subText = raw.trim().replace(/^[-*]\s/, '');
          if (items.length > 0) {
            items[items.length - 1].children.push(subText);
          } else {
            items.push({ text: subText, children: [] });
          }
          i++;
          continue;
        }
        break;
      }
      elements.push(
        <ul className={styles.list} key={key++}>
          {items.map((item, idx) => (
            <li key={idx} className={item.children.length > 0 ? styles.listItemWithSub : undefined}>
              {renderInline(item.text)}
              {item.children.length > 0 && (
                <ul className={styles.subList}>
                  {item.children.map((child, ci) => (
                    <li key={ci}>{renderInline(child)}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list (supports nested sub-items)
    if (/^\d+\.\s/.test(line.trim())) {
      const items = [];
      while (i < lines.length) {
        const raw = lines[i];
        // Top-level numbered item
        if (/^\d+\.\s/.test(raw.trim()) && /^\d+\.\s/.test(raw)) {
          items.push({ text: raw.trim().replace(/^\d+\.\s/, ''), children: [] });
          i++;
          continue;
        }
        // Indented sub-item (numbered or bulleted)
        if (/^(\s{2,}|\t)(\d+\.\s|[-*]\s)/.test(raw)) {
          const subText = raw.trim().replace(/^(\d+\.\s|[-*]\s)/, '');
          if (items.length > 0) {
            items[items.length - 1].children.push(subText);
          } else {
            items.push({ text: subText, children: [] });
          }
          i++;
          continue;
        }
        break;
      }
      elements.push(
        <ol className={styles.orderedList} key={key++}>
          {items.map((item, idx) => (
            <li key={idx} className={item.children.length > 0 ? styles.listItemWithSub : undefined}>
              {renderInline(item.text)}
              {item.children.length > 0 && (
                <ul className={styles.subList}>
                  {item.children.map((child, ci) => (
                    <li key={ci}>{renderInline(child)}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Detect standalone headings: short lines that look like section titles
    // Heuristic: line is short, not ending with common sentence punctuation,
    // followed by a list, paragraph, or empty line + content
    {
      const trimmed = line.trim();
      // Strip bold markers for length/pattern check
      const stripped = trimmed.replace(/^\*\*(.+)\*\*$/, '$1').replace(/^__(.+)__$/, '$1');
      const isShortLine = stripped.length <= 80 && stripped.length >= 2;
      const endsLikeSentence = /[.!?,;:)\]}"']$/.test(stripped);
      const looksLikeTitle = isShortLine && !endsLikeSentence;
      // Check next non-empty line exists and is a list or paragraph (not another short heading)
      let nextContentIdx = i + 1;
      while (nextContentIdx < lines.length && lines[nextContentIdx].trim() === '') nextContentIdx++;
      const nextLine = nextContentIdx < lines.length ? lines[nextContentIdx].trim() : '';
      const nextIsList = /^[-*]\s/.test(nextLine) || /^\d+\.\s/.test(nextLine);
      const nextIsContent = nextLine.length > 0;

      if (looksLikeTitle && nextIsContent && (nextIsList || nextLine.length > stripped.length)) {
        elements.push(
          <p className={styles.inferredHeading} key={key++}>
            {renderInline(stripped)}
          </p>
        );
        i++;
        continue;
      }
    }

    // Regular paragraph
    elements.push(
      <p className={styles.paragraph} key={key++}>
        {renderInline(line)}
      </p>
    );

    // Check for video URLs in this line and add inline preview cards
    // Handles both markdown links [text](url) and bare URLs
    {
      const videoSeen = new Set();
      // Extract URLs from markdown links first
      const mdLinkRe = /\[[^\]]+\]\((https?:\/\/[^)]+)\)/g;
      let vm;
      while ((vm = mdLinkRe.exec(line)) !== null) {
        if (!videoSeen.has(vm[1]) && extractVideoInfo(vm[1])) {
          videoSeen.add(vm[1]);
          elements.push(<VideoPreview key={`vid-${key++}`} url={vm[1]} />);
        }
      }
      // Then bare URLs (Set prevents duplicates)
      const bareRe = /https?:\/\/[^\s<>)\]]+/g;
      let bm;
      while ((bm = bareRe.exec(line)) !== null) {
        if (!videoSeen.has(bm[0]) && extractVideoInfo(bm[0])) {
          videoSeen.add(bm[0]);
          elements.push(<VideoPreview key={`vid-${key++}`} url={bm[0]} />);
        }
      }
    }

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
        <button className={styles.mermaidToggleCode} onClick={() => setShowCode(!showCode)}>
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
 * Extract a meaningful display name from a code block by parsing its content.
 * Tries class/component/function declarations, then export names, then falls back.
 */
function extractCodeBlockName(code, lang) {
  // Try class declaration
  const classMatch = code.match(/(?:export\s+(?:default\s+)?)?(?:abstract\s+)?class\s+(\w+)/);
  if (classMatch) return classMatch[1];

  // Try interface/type declaration (TypeScript)
  const interfaceMatch = code.match(/(?:export\s+)?(?:interface|type)\s+(\w+)/);
  if (interfaceMatch) return interfaceMatch[1];

  // Try React component (function declaration)
  const funcComponentMatch = code.match(/(?:export\s+(?:default\s+)?)?function\s+([A-Z]\w*)/);
  if (funcComponentMatch) return funcComponentMatch[1];

  // Try arrow function component: const Name = () => or const Name: FC =
  const arrowComponentMatch = code.match(/(?:export\s+(?:default\s+)?)?const\s+([A-Z]\w*)\s*[=:]/);
  if (arrowComponentMatch) return arrowComponentMatch[1];

  // Try regular function declaration
  const funcMatch = code.match(/(?:export\s+(?:default\s+)?)?function\s+(\w+)/);
  if (funcMatch) return funcMatch[1];

  // Try module.exports pattern
  const moduleExportMatch = code.match(
    /module\.exports\s*=\s*(?:mongoose\.model\(\s*['"](\w+)['"]|(\w+))/
  );
  if (moduleExportMatch) return moduleExportMatch[1] || moduleExportMatch[2];

  // Try export default
  const exportDefaultMatch = code.match(/export\s+default\s+(\w+)/);
  if (exportDefaultMatch) return exportDefaultMatch[1];

  // Try const/let/var assignment at top level (first meaningful one)
  const varMatch = code.match(/^(?:export\s+)?(?:const|let|var)\s+(\w+)/m);
  if (varMatch) return varMatch[1];

  // Try Java/Go/Rust patterns: public class Name, func Name, fn Name, struct Name
  const javaClassMatch = code.match(/(?:public\s+)?class\s+(\w+)/);
  if (javaClassMatch) return javaClassMatch[1];

  const goFuncMatch = code.match(/func\s+(?:\([^)]*\)\s+)?(\w+)/);
  if (goFuncMatch) return goFuncMatch[1];

  const rustMatch = code.match(/(?:pub\s+)?(?:fn|struct|enum|trait)\s+(\w+)/);
  if (rustMatch) return rustMatch[1];

  // Try Python: class Name or def name
  const pyMatch = code.match(/(?:class|def)\s+(\w+)/);
  if (pyMatch) return pyMatch[1];

  // Try package/namespace declaration as last resort
  const packageMatch = code.match(/package\s+([\w.]+)/);
  if (packageMatch) {
    const parts = packageMatch[1].split('.');
    return parts[parts.length - 1];
  }

  return null;
}

/**
 * Extract code blocks from message text with smart naming.
 * Also captures markdown heading context above each code block.
 */
function extractCodeBlocksWithNames(text) {
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  const blocks = [];
  let m;
  while ((m = codeBlockRegex.exec(text)) !== null) {
    const lang = m[1] || '';
    const code = m[2];
    if (lang === 'chart' || lang === 'araviel-chart' || lang === 'mermaid' || lang === 'timeline' || lang === 'comparison' || lang === 'steps' || lang === 'file') continue;
    if (lang === 'json' || lang === '') {
      try {
        const parsed = JSON.parse(code);
        const chartTypes = [
          'line',
          'area',
          'bar',
          'candlestick',
          'pie',
          'donut',
          'composed',
          'scatter',
        ];
        if (parsed && chartTypes.includes(parsed.type) && Array.isArray(parsed.data)) continue;
      } catch {
        /* not chart spec */
      }
    }

    // Look for markdown heading or bold label before this code block
    const textBefore = text.slice(0, m.index);
    let contextName = null;

    // Check for heading like "### Controller (src/controllers/userController.js)"
    const headingMatch = textBefore.match(
      /(?:^|\n)#{1,4}\s+(?:\d+\.\s+)?(?:\*\*)?([^\n*#]+?)(?:\*\*)?(?:\s*\([^)]*\))?\s*$/
    );
    if (headingMatch) {
      contextName = headingMatch[1].trim();
    }

    // Check for bold label like "**Controller** (src/...)" or "**src/controllers/userController.js**"
    if (!contextName) {
      const boldMatch = textBefore.match(/\*\*([^*]+)\*\*(?:\s*\([^)]*\))?\s*$/);
      if (boldMatch) {
        const label = boldMatch[1].trim();
        // If it's a file path, use the filename
        if (label.includes('/')) {
          const parts = label.split('/');
          contextName = parts[parts.length - 1].replace(/\.\w+$/, '');
        } else {
          contextName = label;
        }
      }
    }

    // Extract name from code content
    const codeName = extractCodeBlockName(code, lang);

    // Build the display name with priority: code-extracted > context > fallback
    const name = codeName || contextName || null;

    blocks.push({ lang, code, name });
  }
  return blocks;
}

/**
 * Code side panel — Claude-style right-side panel for viewing code in a file-like view.
 * Features a collapsible left sidebar with file tree navigation.
 */
function CodeSidePanel({ codeBlocks, onClose, onWidthChange }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(codeBlocks.length > 1);
  const [panelWidth, setPanelWidth] = useState(null); // null = use CSS default
  const codeRef = useRef(null);
  const panelRef = useRef(null);
  const isDraggingRef = useRef(false);

  const MIN_WIDTH = 380;
  const MAX_WIDTH_PERCENT = 0.8;

  const activeBlock = codeBlocks[activeIdx];

  // Reset active index when codeBlocks change
  useEffect(() => {
    setActiveIdx(0);
    setCopied(false);
    setSidebarOpen(codeBlocks.length > 1);
  }, [codeBlocks]);

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

  // Drag-to-resize handler
  const handleResizeStart = useCallback(
    (e) => {
      e.preventDefault();
      isDraggingRef.current = true;
      const startX = e.clientX;
      const startWidth = panelRef.current
        ? panelRef.current.getBoundingClientRect().width
        : MIN_WIDTH;

      const handleMouseMove = (moveEvent) => {
        if (!isDraggingRef.current) return;
        const delta = startX - moveEvent.clientX;
        const maxWidth = window.innerWidth * MAX_WIDTH_PERCENT;
        const newWidth = Math.min(maxWidth, Math.max(MIN_WIDTH, startWidth + delta));
        setPanelWidth(newWidth);
        if (onWidthChange) onWidthChange(newWidth);
      };

      const handleMouseUp = () => {
        isDraggingRef.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [onWidthChange]
  );

  const handleCopy = useCallback(() => {
    if (!activeBlock) return;
    navigator.clipboard.writeText(activeBlock.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [activeBlock]);

  if (!codeBlocks || codeBlocks.length === 0) return null;

  const lineCount = activeBlock.code.split('\n').length;
  const activeName =
    activeBlock.name || (activeBlock.lang ? activeBlock.lang : `Block ${activeIdx + 1}`);
  const activeLang = activeBlock.lang ? activeBlock.lang.toUpperCase() : 'CODE';

  const panelStyle = panelWidth
    ? { width: `${panelWidth}px`, maxWidth: '80vw', minWidth: `${MIN_WIDTH}px` }
    : {};

  return createPortal(
    <div className={styles.codeSidePanel} ref={panelRef} style={panelStyle}>
      {/* Resize handle on the left edge */}
      <div className={styles.codeSidePanelResizeHandle} onMouseDown={handleResizeStart}>
        <div className={styles.codeSidePanelResizeGrip}>
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className={styles.codeSidePanelLayout}>
        {/* Left sidebar — file tree */}
        <div
          className={`${styles.codeSidePanelSidebar} ${
            sidebarOpen ? styles.codeSidePanelSidebarOpen : ''
          }`}
        >
          <div className={styles.codeSidePanelSidebarHeader}>
            <span className={styles.codeSidePanelSidebarTitle}>Files</span>
            <span className={styles.codeSidePanelSidebarCount}>{codeBlocks.length}</span>
          </div>
          <div className={styles.codeSidePanelSidebarList}>
            {codeBlocks.map((block, idx) => {
              const blockName = block.name || (block.lang ? block.lang : `Block ${idx + 1}`);
              const blockLang = block.lang ? block.lang.toUpperCase() : 'CODE';
              const blockLines = block.code.split('\n').length;
              const isActive = idx === activeIdx;

              return (
                <button
                  key={idx}
                  className={`${styles.codeSidePanelFileItem} ${
                    isActive ? styles.codeSidePanelFileItemActive : ''
                  }`}
                  onClick={() => {
                    setActiveIdx(idx);
                    setCopied(false);
                  }}
                  title={blockName}
                >
                  <div className={styles.codeSidePanelFileIcon}>
                    <CodeIcon />
                  </div>
                  <div className={styles.codeSidePanelFileInfo}>
                    <span className={styles.codeSidePanelFileName}>{blockName}</span>
                    <span className={styles.codeSidePanelFileMeta}>
                      {blockLang} · {blockLines} lines
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main content area */}
        <div className={styles.codeSidePanelMain}>
          {/* Header */}
          <div className={styles.codeSidePanelHeader}>
            <div className={styles.codeSidePanelHeaderLeft}>
              {codeBlocks.length > 1 && (
                <button
                  className={`${styles.codeSidePanelSidebarToggle} ${
                    sidebarOpen ? styles.codeSidePanelSidebarToggleOpen : ''
                  }`}
                  onClick={() => setSidebarOpen((v) => !v)}
                  title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                  aria-label="Toggle file sidebar"
                >
                  <ChevronRightIcon />
                </button>
              )}
              <span className={styles.codeSidePanelTitle}>{activeName}</span>
              <span className={styles.codeSidePanelLangBadge}>{activeLang}</span>
            </div>
            <div className={styles.codeSidePanelHeaderActions}>
              <button
                className={`${styles.codeSidePanelCopyBtn} ${
                  copied ? styles.codeSidePanelCopied : ''
                }`}
                onClick={handleCopy}
                title={copied ? 'Copied!' : 'Copy code'}
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button className={styles.codeSidePanelCloseBtn} onClick={onClose} aria-label="Close">
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Code area with line numbers */}
          <div className={styles.codeSidePanelCodeArea}>
            <div className={styles.codeSidePanelLineNumbers}>
              {activeBlock.code.split('\n').map((_, idx) => (
                <span key={idx}>{idx + 1}</span>
              ))}
            </div>
            <pre className={styles.codeSidePanelPre}>
              <code ref={codeRef}>{activeBlock.code}</code>
            </pre>
          </div>

          {/* Footer info */}
          <div className={styles.codeSidePanelFooter}>
            <span>{lineCount} lines</span>
            {codeBlocks.length > 1 && (
              <span>
                {activeIdx + 1} of {codeBlocks.length} files
              </span>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * Button shown below response content that opens the code side panel.
 */
function CodeCanvasButton({ codeBlocks, onClick }) {
  if (!codeBlocks || codeBlocks.length === 0) return null;

  const totalLines = codeBlocks.reduce((sum, b) => sum + b.code.split('\n').length, 0);

  // For single block, show the name; for multiple, list first few names
  let title;
  let meta;
  if (codeBlocks.length === 1) {
    title = codeBlocks[0].name || codeBlocks[0].lang || 'Code';
    meta = `${
      codeBlocks[0].lang ? codeBlocks[0].lang.toUpperCase() + ' · ' : ''
    }${totalLines} lines`;
  } else {
    const names = codeBlocks.slice(0, 3).map((b) => b.name || b.lang || 'Code');
    title = names.join(', ') + (codeBlocks.length > 3 ? ` +${codeBlocks.length - 3}` : '');
    meta = `${codeBlocks.length} files · ${totalLines} lines`;
  }

  return (
    <button className={styles.canvasOpenBtn} onClick={onClick}>
      <div className={styles.canvasOpenBtnLeft}>
        <span className={styles.canvasOpenBtnIcon}>
          <CodeIcon />
        </span>
        <div className={styles.canvasOpenBtnText}>
          <span className={styles.canvasOpenBtnTitle}>{title}</span>
          <span className={styles.canvasOpenBtnMeta}>{meta}</span>
        </div>
      </div>
      <span className={styles.canvasOpenBtnArrow}>
        <MaximizeIcon />
      </span>
    </button>
  );
}

/**
 * Single inline image block — mirrors GeneratedImageBlock style with hover
 * overlay showing download & expand actions.
 */
function InlineImageBlock({ src, alt, onClick }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (e) => {
    e.stopPropagation();
    if (downloading) return;
    setDownloading(true);
    const filename = `araviel-${(alt || 'image')
      .slice(0, 40)
      .replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.png`;
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(src, '_blank', 'noopener,noreferrer');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className={styles.generatedImageBlock}>
      <div className={styles.generatedImageFrame} onClick={onClick}>
        <img src={src} alt={alt || 'Image'} className={styles.generatedImageImg} loading="lazy" />
        <div className={styles.generatedImageOverlay}>
          <div className={styles.generatedImageOverlayInner}>
            {alt && <span className={styles.generatedImageModel}>{alt}</span>}
            <div className={styles.generatedImageOverlayActions}>
              <button
                className={styles.generatedImageSaveBtn}
                onClick={handleDownload}
                title={downloading ? 'Saving...' : 'Save image'}
                aria-label="Save image"
                disabled={downloading}
              >
                <FileDownIcon />
              </button>
              <button
                className={styles.generatedImageExpandBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
                title="View full size"
                aria-label="Expand image"
              >
                <MaximizeIcon />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Horizontal image row shown when response contains markdown images.
 * Renders images directly with action overlays. Multiple images show
 * in a horizontal scroll with a "View all" button that opens the gallery panel.
 */
function ImageRow({ images }) {
  const [showGallery, setShowGallery] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(null);

  const openImage = (idx) => {
    setLightboxIdx(idx);
  };

  const openGallery = () => {
    if (window.innerWidth <= 768) {
      setLightboxIdx(0);
    } else {
      setShowGallery(true);
    }
  };

  return (
    <>
      <div className={styles.inlineImagesRow}>
        <div className={styles.inlineImagesScroll}>
          {images.map((img, idx) => (
            <InlineImageBlock
              key={idx}
              src={img.src}
              alt={img.alt}
              onClick={() => openImage(idx)}
            />
          ))}
        </div>
        {images.length > 1 && (
          <button className={styles.inlineImagesViewAll} onClick={openGallery}>
            <svg
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
            <span>View all {images.length} images</span>
          </button>
        )}
      </div>
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
 * Generated image block — renders an AI-generated image with a sleek
 * ChatGPT-style transparent hover overlay showing model & save icon.
 */
function useImageDownload() {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(
    async (e, imgData) => {
      if (e) e.stopPropagation();
      if (downloading || !imgData?.url) return;
      setDownloading(true);
      const filename = `araviel-${(imgData.prompt || 'generated')
        .slice(0, 40)
        .replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.png`;
      try {
        const response = await fetch(imgData.url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } catch {
        try {
          const blob = await new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;
              canvas.getContext('2d').drawImage(img, 0, 0);
              canvas.toBlob(
                (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
                'image/png'
              );
            };
            img.onerror = reject;
            img.src = imgData.url;
          });
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        } catch {
          window.open(imgData.url, '_blank', 'noopener,noreferrer');
        }
      } finally {
        setDownloading(false);
      }
    },
    [downloading]
  );

  return { downloading, handleDownload };
}

function GeneratedImageBlock({ imageData, allImages, imageIndex }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { downloading, handleDownload } = useImageDownload();

  if (!imageData || !imageData.url) return null;

  return (
    <>
      <div className={styles.generatedImageBlock}>
        <div className={styles.generatedImageFrame} onClick={() => setLightboxOpen(true)}>
          <img
            src={imageData.url}
            alt={imageData.prompt || imageData.model || 'Generated image'}
            className={styles.generatedImageImg}
            loading="lazy"
          />
          {/* Transparent bottom overlay — visible on hover */}
          <div className={styles.generatedImageOverlay}>
            <div className={styles.generatedImageOverlayInner}>
              {imageData.model && (
                <span className={styles.generatedImageModel}>{imageData.model}</span>
              )}
              <div className={styles.generatedImageOverlayActions}>
                <button
                  className={styles.generatedImageSaveBtn}
                  onClick={(e) => handleDownload(e, imageData)}
                  title={downloading ? 'Saving...' : 'Save image'}
                  aria-label="Save image"
                  disabled={downloading}
                >
                  <FileDownIcon />
                </button>
                <button
                  className={styles.generatedImageExpandBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxOpen(true);
                  }}
                  title="View full size"
                  aria-label="Expand image"
                >
                  <MaximizeIcon />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {lightboxOpen &&
        createPortal(
          <GeneratedImageLightbox
            images={allImages || [imageData]}
            initialIndex={imageIndex || 0}
            onClose={() => setLightboxOpen(false)}
          />,
          document.body
        )}
    </>
  );
}

/**
 * Premium fullscreen lightbox with gallery sidebar — shows all generated images
 * from the conversation as scrollable thumbnails on the left, selected image large
 * in the center, with model badge, prompt text, and save action.
 */
function GeneratedImageLightbox({ images, initialIndex, onClose }) {
  const [activeIndex, setActiveIndex] = useState(initialIndex || 0);
  const { downloading, handleDownload } = useImageDownload();
  const thumbListRef = useRef(null);
  const activeThumbRef = useRef(null);

  const activeImage = images[activeIndex] || images[0];
  const providerData = activeImage?.provider ? PROVIDERS[activeImage.provider] : null;

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        setActiveIndex((prev) => (prev < images.length - 1 ? prev + 1 : prev));
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, images.length]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (activeThumbRef.current) {
      activeThumbRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeIndex]);

  if (!activeImage) return null;

  return (
    <div className={styles.genLightboxOverlay} onClick={onClose}>
      <div className={styles.genLightboxContainer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.genLightboxTopBar}>
          <div className={styles.genLightboxTopLeft}>
            {activeImage.model && (
              <span
                className={styles.genLightboxModelBadge}
                style={providerData ? { borderColor: providerData.accentColor + '40' } : undefined}
              >
                {providerData && (
                  <span
                    className={styles.genLightboxModelDot}
                    style={{ background: providerData.accentColor }}
                  />
                )}
                {activeImage.model}
              </span>
            )}
          </div>
          <div className={styles.genLightboxTopRight}>
            <button
              className={styles.genLightboxActionBtn}
              onClick={(e) => handleDownload(e, activeImage)}
              disabled={downloading}
              title="Save image"
            >
              <FileDownIcon />
              <span>{downloading ? 'Saving...' : 'Save'}</span>
            </button>
            <button className={styles.genLightboxCloseBtn} onClick={onClose} aria-label="Close">
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className={styles.genLightboxMain}>
          {/* Thumbnail sidebar — only shown when multiple images */}
          {images.length > 1 && (
            <div className={styles.genLightboxSidebar} ref={thumbListRef}>
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  ref={idx === activeIndex ? activeThumbRef : null}
                  className={`${styles.genLightboxThumb} ${
                    idx === activeIndex ? styles.genLightboxThumbActive : ''
                  }`}
                  onClick={() => setActiveIndex(idx)}
                  aria-label={`View image ${idx + 1}`}
                >
                  <img src={img.url} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}

          {/* Main image area */}
          <div className={styles.genLightboxBody}>
            <img
              key={activeIndex}
              src={activeImage.url}
              alt={activeImage.prompt || activeImage.model || 'Generated image'}
              className={styles.genLightboxImg}
            />
          </div>
        </div>

        <div className={styles.genLightboxFooter}>
          {activeImage.prompt && <p className={styles.genLightboxPrompt}>{activeImage.prompt}</p>}
          <div className={styles.genLightboxMeta}>
            {activeImage.size && <span>{activeImage.size}</span>}
            {images.length > 1 && (
              <span>
                {activeIndex + 1} of {images.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline video preview card — shows a thumbnail with play overlay.
 * Clicking swaps the thumbnail for an embedded iframe player.
 */
function VideoPreview({ url }) {
  const [playing, setPlaying] = useState(false);
  const [vimeoThumb, setVimeoThumb] = useState(null);
  const info = useMemo(() => extractVideoInfo(url), [url]);

  useEffect(() => {
    if (info && info.provider === 'vimeo' && !info.thumbnailUrl) {
      let cancelled = false;
      fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}&width=320`)
        .then((r) => r.json())
        .then((data) => {
          if (!cancelled && data.thumbnail_url) setVimeoThumb(data.thumbnail_url);
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }
  }, [url, info]);

  if (!info) return null;

  const thumbnailUrl = info.thumbnailUrl || vimeoThumb;
  const providerLabel = info.provider === 'youtube' ? 'YouTube' : 'Vimeo';

  if (playing) {
    return (
      <div className={styles.videoPreview}>
        <div className={styles.videoEmbedWrapper}>
          <iframe
            className={styles.videoEmbed}
            src={info.embedUrl}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            title={`${providerLabel} video`}
          />
        </div>
      </div>
    );
  }

  return (
    <button className={styles.videoPreview} onClick={() => setPlaying(true)}>
      {thumbnailUrl ? (
        <img
          className={styles.videoThumbnail}
          src={thumbnailUrl}
          alt={`${providerLabel} video thumbnail`}
          loading="lazy"
        />
      ) : (
        <div className={styles.videoThumbnailPlaceholder} />
      )}
      <div className={styles.videoPlayOverlay}>
        <svg className={styles.videoPlayIcon} viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
      <span className={styles.videoProviderBadge}>{providerLabel}</span>
    </button>
  );
}

/**
 * Inline link component with hover tooltip showing the URL.
 */
function InlineLink({ href, children, variant = 'pill' }) {
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
        className={variant === 'full' ? styles.inlineLinkFull : styles.inlineLink}
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

    // Markdown link [text](url) — rendered with underline style
    match = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (match) {
      parts.push(
        <InlineLink key={key++} href={match[2]} variant="full">
          {match[1]}
        </InlineLink>
      );
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Auto-detect bare URLs — rendered as citation pill
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
        <InlineLink key={key++} href={url} variant="pill">
          {displayText}
        </InlineLink>
      );
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Parenthesized source reference like (barita.com) — render as citation pill
    match = remaining.match(/^\(([a-zA-Z0-9][\w.-]*\.[a-z]{2,}(?:\/[^\s)]*)?)\)/);
    if (match) {
      const domain = match[1];
      const url = domain.startsWith('http') ? domain : `https://${domain}`;
      parts.push(
        <InlineLink key={key++} href={url} variant="pill">
          {domain.replace(/^www\./, '')}
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

    // Strikethrough
    match = remaining.match(/^~~(.+?)~~/);
    if (match) {
      parts.push(
        <del key={key++} style={{ opacity: 0.6 }}>
          {match[1]}
        </del>
      );
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Plain text up to next special char or URL start
    match = remaining.match(/^[^`*~\[(h]+/);
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

    // Check for '(' that isn't a domain reference
    if (remaining[0] === '(' && !remaining.match(/^\([a-zA-Z0-9][\w.-]*\.[a-z]{2,}/)) {
      parts.push(remaining[0]);
      remaining = remaining.slice(1);
      continue;
    }

    // Check for '~' that isn't strikethrough
    if (remaining[0] === '~' && !remaining.match(/^~~.+?~~/)) {
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
 * Stream timeout notice with Continue / Retry action buttons.
 */
function StreamTimeoutNotice({ onContinue, onRetry }) {
  return (
    <div className={styles.streamTimeoutNotice}>
      <div className={styles.streamTimeoutContent}>
        <svg
          className={styles.streamTimeoutIcon}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span className={styles.streamTimeoutText}>
          Response may have been cut short due to timeout.
        </span>
      </div>
      <div className={styles.streamTimeoutActions}>
        {onContinue && (
          <button className={styles.streamTimeoutContinueBtn} onClick={onContinue}>
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
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Continue
          </button>
        )}
        {onRetry && (
          <button className={styles.streamTimeoutRetryBtn} onClick={onRetry}>
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
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Retry
          </button>
        )}
      </div>
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
 * Share dropdown with multiple export format options.
 * Converts message content to structured sections for rich file generation.
 */
function ShareDropdown({ message, onClose }) {
  const dropdownRef = useRef(null);
  const [generating, setGenerating] = useState(null);

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

  const exportAs = useCallback(
    async (format) => {
      setGenerating(format);
      try {
        const sections = parseMessageToSections(message.content);
        const timestamp = new Date().toISOString().slice(0, 10);
        const spec = {
          filename: `response-${timestamp}.${format}`,
          format,
          title: message.modelName ? `${message.modelName} Response` : 'Response',
          subtitle: 'Generated via Araviel',
          content: { sections },
        };

        // For spreadsheet formats, extract tables from the content
        if (format === 'xlsx' || format === 'csv') {
          const tables = extractTablesFromContent(message.content);
          if (tables.length > 0) {
            spec.content = {
              sheets: tables.map((t, i) => ({
                name: t.title || `Sheet${i + 1}`,
                headers: t.headers,
                rows: t.rows,
              })),
            };
          }
        }

        await generateAndDownload(spec);
        onClose();
      } catch (err) {
        console.error(`Export as ${format} failed:`, err);
      } finally {
        setGenerating(null);
      }
    },
    [message, onClose]
  );

  const formats = [
    { format: 'pdf', label: 'PDF Document', icon: FileDownIcon },
    { format: 'docx', label: 'Word Document', icon: FileTextIcon },
    { format: 'xlsx', label: 'Excel Spreadsheet', icon: FileTextIcon },
    { format: 'txt', label: 'Plain Text', icon: FileTextIcon },
    { format: 'md', label: 'Markdown', icon: FileTextIcon },
    { format: 'html', label: 'HTML Page', icon: CodeIcon },
  ];

  return (
    <div className={styles.shareDropdown} ref={dropdownRef}>
      {formats.map(({ format, label, icon: Icon }) => (
        <button
          key={format}
          className={styles.shareDropdownItem}
          onClick={() => exportAs(format)}
          disabled={generating !== null}
        >
          {generating === format ? (
            <span className={styles.shareSpinner} />
          ) : (
            <Icon />
          )}
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Parse raw message markdown into structured sections for file generation.
 */
function parseMessageToSections(content) {
  if (!content) return [{ type: 'paragraph', text: '' }];

  const lines = content.split('\n');
  const sections = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines
    if (line.trim() === '') {
      i++;
      continue;
    }

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
      // Skip special blocks (chart, mermaid, file, timeline, comparison, steps)
      if (!['chart', 'araviel-chart', 'mermaid', 'file', 'timeline', 'comparison', 'steps'].includes(lang)) {
        sections.push({ type: 'code', text: codeLines.join('\n'), language: lang || undefined });
      }
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      sections.push({ type: 'heading', text: headingMatch[2], level: headingMatch[1].length });
      i++;
      continue;
    }

    // Table
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableRows = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableRows.push(lines[i].trim());
        i++;
      }
      if (tableRows.length >= 2 && /^\|[\s:]*-{2,}/.test(tableRows[1])) {
        const parseCells = (row) => row.slice(1, -1).split('|').map((c) => c.trim());
        sections.push({
          type: 'table',
          headers: parseCells(tableRows[0]),
          rows: tableRows.slice(2).map(parseCells),
        });
        continue;
      }
      // Not a valid table, fall through
      i -= tableRows.length;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      sections.push({ type: 'divider' });
      i++;
      continue;
    }

    // Unordered list
    if (/^[-*]\s/.test(line.trim())) {
      const items = [];
      while (i < lines.length && /^(\s*[-*]\s)/.test(lines[i])) {
        items.push(lines[i].trim().replace(/^[-*]\s/, ''));
        i++;
      }
      sections.push({ type: 'list', items, ordered: false });
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line.trim())) {
      const items = [];
      while (i < lines.length && /^(\s*\d+\.\s)/.test(lines[i])) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, ''));
        i++;
      }
      sections.push({ type: 'list', items, ordered: true });
      continue;
    }

    // Paragraph (collect consecutive non-empty, non-special lines)
    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith('```') &&
      !lines[i].match(/^#{1,6}\s/) &&
      !(lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) &&
      !/^---+$/.test(lines[i].trim()) &&
      !/^[-*]\s/.test(lines[i].trim()) &&
      !/^\d+\.\s/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      // Strip markdown bold/italic for clean text in files
      const text = paraLines
        .join(' ')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1');
      sections.push({ type: 'paragraph', text });
    }
  }

  return sections.length > 0 ? sections : [{ type: 'paragraph', text: content }];
}

/**
 * Extract markdown tables from content for spreadsheet export.
 */
function extractTablesFromContent(content) {
  if (!content) return [];
  const tables = [];
  const lines = content.split('\n');
  let i = 0;

  while (i < lines.length) {
    if (lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
      const tableRows = [];
      const startIdx = i;
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableRows.push(lines[i].trim());
        i++;
      }
      if (tableRows.length >= 2 && /^\|[\s:]*-{2,}/.test(tableRows[1])) {
        const parseCells = (row) => row.slice(1, -1).split('|').map((c) => c.trim());
        // Look for a heading above the table
        let title = null;
        for (let j = startIdx - 1; j >= Math.max(0, startIdx - 3); j--) {
          const hMatch = lines[j].match(/^#{1,6}\s+(.+)/);
          if (hMatch) { title = hMatch[1]; break; }
          const boldMatch = lines[j].match(/^\*\*(.+)\*\*/);
          if (boldMatch) { title = boldMatch[1]; break; }
        }
        tables.push({
          title,
          headers: parseCells(tableRows[0]),
          rows: tableRows.slice(2).map(parseCells),
        });
        continue;
      }
      i = startIdx + 1;
    } else {
      i++;
    }
  }
  return tables;
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
function SubConvResponseActions({ msg, conversationId }) {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(msg.feedback === 'like');
  const [disliked, setDisliked] = useState(msg.feedback === 'dislike');

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleLike = async () => {
    const was = liked;
    const newFeedback = was ? null : 'like';
    setLiked(!was);
    setDisliked(false);
    if (conversationId && msg.id) {
      try {
        await submitMessageFeedback(conversationId, msg.id, newFeedback);
      } catch {
        setLiked(was);
      }
    }
  };

  const handleDislike = async () => {
    const was = disliked;
    const newFeedback = was ? null : 'dislike';
    setDisliked(!was);
    setLiked(false);
    if (conversationId && msg.id) {
      try {
        await submitMessageFeedback(conversationId, msg.id, newFeedback);
      } catch {
        setDisliked(was);
      }
    }
  };

  return (
    <div className={styles.subConvActions}>
      <button
        className={`${styles.subConvActionBtn} ${liked ? styles.subConvActionBtnActive : ''}`}
        onClick={handleLike}
        title="Like"
        aria-label="Like"
      >
        <ThumbsUpIcon />
      </button>
      <button
        className={`${styles.subConvActionBtn} ${disliked ? styles.subConvActionBtnActive : ''}`}
        onClick={handleDislike}
        title="Dislike"
        aria-label="Dislike"
      >
        <ThumbsDownIcon />
      </button>
      <button
        className={`${styles.subConvActionBtn} ${copied ? styles.subConvActionBtnCopied : ''}`}
        onClick={handleCopy}
        title={copied ? 'Copied!' : 'Copy'}
        aria-label="Copy"
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
    </div>
  );
}

function SubConvModelBadge({ msg, isDark }) {
  const provider = msg.provider;
  if (!provider) return null;
  const providerData = PROVIDERS[provider];
  if (!providerData) return null;
  const LogoComponent = getProviderLogo(provider);
  const displayName =
    provider === 'anthropic'
      ? 'Claude'
      : provider === 'openai'
      ? 'OpenAI'
      : provider === 'google'
      ? 'Gemini'
      : provider === 'perplexity'
      ? 'Perplexity'
      : providerData.name || provider;

  return (
    <div
      className={styles.subConvModelBadge}
      style={{
        backgroundColor: isDark ? providerData.accentBgDark : providerData.accentBg,
        color: isDark
          ? providerData.accentTextDark || providerData.accentColor
          : providerData.accentText,
      }}
    >
      <LogoComponent size={10} />
      <span>{displayName}</span>
      {msg.webSearchUsed && (
        <span className={styles.subConvWebBadge} title="Used web search">
          🔍
        </span>
      )}
    </div>
  );
}

function SubConversationPanel({
  subConversation,
  onSend,
  onClose,
  isSending,
  streamingText,
  thinkingStatus,
  conversationId,
  isDark,
  onStar,
  onReport,
  onDelete,
}) {
  const [input, setInput] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const messagesEndRef = useRef(null);
  const panelRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
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

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        if (showMenu) {
          setShowMenu(false);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose, showMenu]);

  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

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

  const finalizedMessages = subConversation.messages;
  const showStreaming = isSending || (thinkingStatus && thinkingStatus !== 'idle');

  return (
    <>
      <div className={styles.subConvOverlay} onClick={onClose} />
      <div className={styles.subConvPanel} ref={panelRef}>
        <div className={styles.subConvPanelFadeTop} />

        {/* Header */}
        <div className={styles.subConvPanelHeader}>
          <div className={styles.subConvPanelHeaderTop}>
            <span className={styles.subConvHeaderTitle}>Sub Conversation</span>
            <div className={styles.subConvHeaderActions}>
              <div className={styles.subConvMenuWrapper} ref={menuRef}>
                <button
                  className={styles.subConvMenuBtn}
                  onClick={() => setShowMenu((v) => !v)}
                  aria-label="Actions"
                >
                  <MoreVerticalIcon />
                </button>
                {showMenu && (
                  <div className={styles.subConvMenuDropdown}>
                    <button
                      className={styles.subConvMenuItem}
                      onClick={() => {
                        setShowMenu(false);
                        onStar && onStar(subConversation.id);
                      }}
                    >
                      <StarIcon filled={subConversation.isStarred} />
                      <span>{subConversation.isStarred ? 'Unstar' : 'Star'}</span>
                    </button>
                    <button
                      className={`${styles.subConvMenuItem} ${
                        subConversation.isReported ? styles.subConvMenuItemReported : ''
                      }`}
                      onClick={() => {
                        setShowMenu(false);
                        onReport && onReport(subConversation.id);
                      }}
                    >
                      <FlagIcon />
                      <span>{subConversation.isReported ? 'Unreport' : 'Report'}</span>
                    </button>
                    <div className={styles.subConvMenuDivider} />
                    <button
                      className={`${styles.subConvMenuItem} ${styles.subConvMenuItemDanger}`}
                      onClick={() => {
                        setShowMenu(false);
                        onDelete && onDelete(subConversation.id);
                      }}
                    >
                      <CloseIcon />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
              <button className={styles.subConvCloseBtn} onClick={onClose} aria-label="Close panel">
                <CloseIcon />
              </button>
            </div>
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
              key={msg.id || idx}
              className={`${styles.subConvMsg} ${
                msg.role === 'user' ? styles.subConvMsgUser : styles.subConvMsgAssistant
              }`}
            >
              {msg.role === 'user' ? (
                <div className={styles.subConvUserCard}>{msg.content}</div>
              ) : (
                <div className={styles.subConvAssistantContent}>
                  <SubConvModelBadge msg={msg} isDark={isDark} />
                  <div className={styles.subConvMarkdown}>{renderMarkdown(msg.content)}</div>
                  {msg.citations && msg.citations.length > 0 && (
                    <div className={styles.subConvCitations}>
                      {msg.citations.map((src, i) => (
                        <a
                          key={i}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.subConvCitationLink}
                          title={src.title || src.url}
                        >
                          {src.title || src.url}
                        </a>
                      ))}
                    </div>
                  )}
                  <SubConvResponseActions msg={msg} conversationId={conversationId} />
                </div>
              )}
            </div>
          ))}
          {thinkingStatus && thinkingStatus !== 'idle' && (
            <div className={styles.subConvMsg}>
              <SubConvThinkingTimeline status={thinkingStatus} />
            </div>
          )}
          {streamingText && (
            <div className={`${styles.subConvMsg} ${styles.subConvMsgAssistant}`}>
              <div className={styles.subConvAssistantContent}>
                <div className={styles.subConvMarkdown}>
                  {renderMarkdown(streamingText, true)}
                  <span className={styles.subConvCursor} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.subConvPanelFadeBottom} />

        {/* Input */}
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
function SubConversationPills({ subConversations, onOpen, onDelete, activeSubConvId }) {
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
                {sc.isStarred && <StarIcon filled />}
                {sc.isReported && <FlagIcon />}
                {!sc.isStarred && !sc.isReported && <MessageCircleIcon />}
                <span>{truncated}</span>
              </button>
              {onDelete && (
                <button
                  className={styles.subConvPillDelete}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(sc.id);
                  }}
                  title="Delete sub-conversation"
                  aria-label="Delete"
                >
                  <CloseIcon />
                </button>
              )}
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
  conversationId,
}) {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(message.feedback === 'like');
  const [disliked, setDisliked] = useState(message.feedback === 'dislike');
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

  const handleLike = async () => {
    const wasLiked = liked;
    const newFeedback = wasLiked ? null : 'like';
    setLiked(!wasLiked);
    setDisliked(false);
    if (conversationId && message.id) {
      try {
        await submitMessageFeedback(conversationId, message.id, newFeedback);
      } catch {
        setLiked(wasLiked);
      }
    }
  };

  const handleDislike = async () => {
    const wasDisliked = disliked;
    const newFeedback = wasDisliked ? null : 'dislike';
    setDisliked(!wasDisliked);
    setLiked(false);
    if (conversationId && message.id) {
      try {
        await submitMessageFeedback(conversationId, message.id, newFeedback);
      } catch {
        setDisliked(wasDisliked);
      }
    }
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
function QuestionCard({ questions, onComplete, onDismiss }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [customText, setCustomText] = useState('');
  const [isCustomActive, setIsCustomActive] = useState(false);
  const customInputRef = useRef(null);
  const total = questions.length;
  const current = questions[currentIdx];

  const handleSelectOption = useCallback(
    (option) => {
      setIsCustomActive(false);
      setCustomText('');
      setAnswers((prev) => ({ ...prev, [currentIdx]: option }));
    },
    [currentIdx]
  );

  const handleCustomFocus = useCallback(() => {
    setIsCustomActive(true);
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[currentIdx];
      return next;
    });
  }, [currentIdx]);

  const handleCustomChange = useCallback(
    (e) => {
      const val = e.target.value;
      setCustomText(val);
      if (val.trim()) {
        setAnswers((prev) => ({ ...prev, [currentIdx]: val.trim() }));
      } else {
        setAnswers((prev) => {
          const next = { ...prev };
          delete next[currentIdx];
          return next;
        });
      }
    },
    [currentIdx]
  );

  const handleNext = useCallback(() => {
    if (currentIdx < total - 1) {
      setCurrentIdx((i) => i + 1);
      setCustomText('');
      setIsCustomActive(false);
    } else {
      // Last question — bundle and send
      const pairs = questions
        .map((q, i) => (answers[i] ? `Q: ${q.question}\nA: ${answers[i]}` : null))
        .filter(Boolean);
      if (pairs.length > 0) {
        onComplete(pairs.join('\n\n'));
      }
    }
  }, [currentIdx, total, questions, answers, onComplete]);

  const handlePrev = useCallback(() => {
    if (currentIdx > 0) {
      setCurrentIdx((i) => i - 1);
      setCustomText('');
      setIsCustomActive(false);
    }
  }, [currentIdx]);

  const handleSkip = useCallback(() => {
    if (currentIdx < total - 1) {
      setCurrentIdx((i) => i + 1);
      setCustomText('');
      setIsCustomActive(false);
    } else {
      // Skip last question — submit whatever we have
      const pairs = questions
        .map((q, i) => (answers[i] ? `Q: ${q.question}\nA: ${answers[i]}` : null))
        .filter(Boolean);
      if (pairs.length > 0) {
        onComplete(pairs.join('\n\n'));
      } else {
        onDismiss();
      }
    }
  }, [currentIdx, total, questions, answers, onComplete, onDismiss]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && answers[currentIdx]) {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleSkip();
      }
    },
    [answers, currentIdx, handleNext, handleSkip]
  );

  const selectedAnswer = answers[currentIdx];
  const isLastQuestion = currentIdx === total - 1;
  const hasAnswer = !!selectedAnswer;

  if (!current) return null;

  return (
    <div className={styles.questionCard} onKeyDown={handleKeyDown} tabIndex={-1}>
      <div className={styles.questionCardHeader}>
        <span className={styles.questionText}>{current.question}</span>
        <div className={styles.questionNav}>
          {total > 1 && (
            <span className={styles.questionCounter}>
              {currentIdx + 1} of {total}
            </span>
          )}
          <button className={styles.questionDismiss} onClick={onDismiss} aria-label="Dismiss">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M10.5 3.5L3.5 10.5M3.5 3.5l7 7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className={styles.questionOptions}>
        {current.options.map((option, idx) => (
          <button
            key={idx}
            className={`${styles.questionOption} ${selectedAnswer === option && !isCustomActive ? styles.questionOptionSelected : ''}`}
            onClick={() => handleSelectOption(option)}
          >
            <span className={styles.questionOptionNumber}>{idx + 1}</span>
            <span className={styles.questionOptionLabel}>{option}</span>
            {selectedAnswer === option && !isCustomActive && (
              <svg className={styles.questionOptionCheck} width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M11.5 4L5.5 10L2.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        ))}

        <div className={`${styles.questionCustom} ${isCustomActive ? styles.questionCustomActive : ''}`}>
          <svg className={styles.questionCustomIcon} width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path
              d="M9.1 1.4a1.4 1.4 0 0 1 2 2L4 10.5l-2.7.7.7-2.7L9.1 1.4z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            ref={customInputRef}
            className={styles.questionCustomInput}
            type="text"
            placeholder="Something else"
            value={customText}
            onFocus={handleCustomFocus}
            onChange={handleCustomChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && customText.trim()) {
                e.preventDefault();
                e.stopPropagation();
                handleNext();
              }
            }}
          />
        </div>
      </div>

      <div className={styles.questionCardFooter}>
        <div className={styles.questionNavButtons}>
          {total > 1 && currentIdx > 0 && (
            <button className={styles.questionNavBtn} onClick={handlePrev}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M7.5 2.5L4 6l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          {total > 1 && currentIdx < total - 1 && (
            <button className={styles.questionNavBtn} onClick={handleNext} disabled={!hasAnswer}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
        <div className={styles.questionActions}>
          <button className={styles.questionSkipBtn} onClick={handleSkip}>
            Skip
          </button>
          {hasAnswer && (
            <button className={styles.questionSubmitBtn} onClick={handleNext}>
              {isLastQuestion || total === 1 ? 'Send' : 'Continue'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SuggestionsList({ suggestions, onSelect }) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className={styles.suggestionsList}>
      <div className={styles.suggestionsHeader}>
        <span>Suggestions</span>
      </div>
      <div className={styles.suggestionsItems}>
        {suggestions.map((suggestion, idx) => (
          <button key={idx} className={styles.suggestionItem} onClick={() => onSelect(suggestion)}>
            <span className={styles.suggestionText}>{suggestion}</span>
            <ArrowRightIcon />
          </button>
        ))}
      </div>
    </div>
  );
}

function FollowUpSection({ followUps, questions, onFollowUpSelect, onQuestionsComplete, onQuestionsDismiss }) {
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    if (onQuestionsDismiss) onQuestionsDismiss();
  }, [onQuestionsDismiss]);

  const hasQuestions = !dismissed && questions && questions.length > 0;
  const hasSuggestions = followUps && followUps.length > 0;

  if (!hasQuestions && !hasSuggestions) return null;

  return (
    <div className={styles.followUpSection}>
      {hasQuestions && (
        <QuestionCard
          questions={questions}
          onComplete={onQuestionsComplete}
          onDismiss={handleDismiss}
        />
      )}
      {hasSuggestions && (
        <SuggestionsList suggestions={followUps} onSelect={onFollowUpSelect} />
      )}
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
          className={`${styles.userPromptActionBtn} ${
            copied ? styles.userPromptActionBtnActive : ''
          }`}
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
  onQuestionsSend,
  onRetry,
  onAlternateModelRequest,
  userPrompt,
  onSubConvPanelToggle,
  subConvPanelOwnerId,
  onSetSubConvPanelOwner,
  currentChatId,
  assistantIndex,
  onEditPrompt,
  onOpenCodePanel,
  webSearchEnabled,
}) {
  const isUser = message.role === 'user';
  const displayText = isStreaming ? streamedText : message.content;
  const provider = message.provider;
  const providerData = provider ? PROVIDERS[provider] : null;
  const LogoComponent = provider ? getProviderLogo(provider) : null;
  const [showHeaderDropdown, setShowHeaderDropdown] = useState(false);
  const [pendingAlternate, setPendingAlternate] = useState(null);
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
  const { showError } = useToast();

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
    const ref = subConvStreamRef.current;
    return () => {
      if (ref) clearTimeout(ref);
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
          isStarred: sc.isStarred || false,
          isReported: sc.isReported || false,
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
      let routingInfo = {};
      let citationSources = null;
      let doneInfo = {};

      try {
        const response = await sendMessage({
          message: text,
          conversationId: currentChatId || undefined,
          subConversationId: activeSubConvId,
          webSearch: webSearchEnabled === true ? true : undefined,
        });

        await consumeSSEStream(response, (event) => {
          const { type, data } = event;

          if (type === 'routing') {
            routingInfo = {
              modelName: data.modelName || data.model,
              provider: data.provider,
              modelId: data.modelId,
              webSearchUsed: data.webSearchUsed || false,
              messageId: data.messageId,
            };
          } else if (type === 'thinking') {
            // Still thinking
          } else if (type === 'delta') {
            setSubConvThinkingStatus('streaming');
            accumulatedContent += data.content || '';
            setSubConvStreamText(accumulatedContent);
          } else if (type === 'citations') {
            citationSources = data.sources || data.citations;
          } else if (type === 'done') {
            doneInfo = {
              messageId: data.messageId,
              usage: data.usage,
              costUsd: data.costUsd,
              latencyMs: data.latencyMs,
            };
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

      // Finalize: add rich assistant message and reset streaming state
      const finalContent = accumulatedContent || '*No response received*';
      setSubConvStreamText('');
      setSubConvThinkingStatus('idle');
      setIsSendingSubMsg(false);
      setSubConversations((prev) =>
        prev.map((sc) =>
          sc.id === activeSubConvId
            ? {
                ...sc,
                messages: [
                  ...sc.messages,
                  {
                    role: 'assistant',
                    content: finalContent,
                    id: doneInfo.messageId || routingInfo.messageId,
                    modelName: routingInfo.modelName,
                    provider: routingInfo.provider,
                    modelId: routingInfo.modelId,
                    webSearchUsed: routingInfo.webSearchUsed,
                    citations: citationSources,
                    feedback: null,
                    usage: doneInfo.usage,
                  },
                ],
              }
            : sc
        )
      );
    },
    [activeSubConvId, currentChatId, webSearchEnabled]
  );

  // Open existing sub-conversation pill — fetch messages from API
  const handleOpenSubConv = useCallback(
    async (id) => {
      setActiveSubConvId(id);
      setShowSubConvPanel(true);
      if (onSubConvPanelToggle) onSubConvPanelToggle(true);

      // Try to load messages from backend (with rich fields)
      try {
        const data = await fetchSubConversationMessages(id);
        if (data.messages && data.messages.length > 0) {
          const mappedMsgs = data.messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
            id: msg.id,
            modelName: msg.modelUsed || msg.modelName,
            provider: msg.provider,
            modelId: msg.modelId,
            webSearchUsed: msg.webSearchUsed || false,
            citations: msg.citations || msg.sources || null,
            feedback: msg.feedback || null,
            usage: msg.usage || null,
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

  // Toggle star on a sub-conversation
  const handleStarSubConv = useCallback(
    async (id) => {
      const sc = subConversations.find((s) => s.id === id);
      if (!sc) return;
      const newVal = !sc.isStarred;
      setSubConversations((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isStarred: newVal } : s))
      );
      try {
        await updateSubConversation(id, { is_starred: newVal });
      } catch {
        setSubConversations((prev) =>
          prev.map((s) => (s.id === id ? { ...s, isStarred: !newVal } : s))
        );
        showError('Could not update star. Try again.');
      }
    },
    [subConversations, showError]
  );

  // Toggle report on a sub-conversation
  const handleReportSubConv = useCallback(
    async (id) => {
      const sc = subConversations.find((s) => s.id === id);
      if (!sc) return;
      const newVal = !sc.isReported;
      setSubConversations((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isReported: newVal } : s))
      );
      try {
        if (newVal) {
          await reportSubConversation(id, 'other', '');
        } else {
          await updateSubConversation(id, { is_reported: false });
        }
      } catch {
        setSubConversations((prev) =>
          prev.map((s) => (s.id === id ? { ...s, isReported: !newVal } : s))
        );
        showError('Could not update report. Try again.');
      }
    },
    [subConversations, showError]
  );

  // Request to delete a sub-conversation (shows confirmation)
  const handleRequestDeleteSubConv = useCallback((id) => {
    setPendingDeleteId(id);
  }, []);

  // Confirm delete — now calls API
  const handleConfirmDeleteSubConv = useCallback(async () => {
    if (!pendingDeleteId) return;
    // If deleting the active one, close the panel
    if (pendingDeleteId === activeSubConvId) {
      setShowSubConvPanel(false);
      setActiveSubConvId(null);
      if (onSubConvPanelToggle) onSubConvPanelToggle(false);
    }
    const idToDelete = pendingDeleteId;
    setSubConversations((prev) => prev.filter((sc) => sc.id !== idToDelete));
    setPendingDeleteId(null);
    try {
      await deleteSubConversation(idToDelete);
    } catch {
      // Already removed from UI — acceptable since the sub-conv is gone locally
    }
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

  const hasGeneratedImages = message.generatedImages && message.generatedImages.length > 0;

  // Follow-ups and questions are AI-generated and provided by the backend.
  const followUps = useMemo(() => {
    if (!isUser && isLastAssistant && !isStreaming && message.followUps?.length > 0) {
      return message.followUps.slice(0, 3);
    }
    return [];
  }, [isUser, isLastAssistant, isStreaming, message.followUps]);

  const questions = useMemo(() => {
    if (!isUser && isLastAssistant && !isStreaming && message.questions?.length > 0) {
      return message.questions;
    }
    return [];
  }, [isUser, isLastAssistant, isStreaming, message.questions]);

  // Detect weather responses and extract structured data for rich rendering
  const weatherData = useMemo(() => {
    if (isUser || isStreaming || !displayText) return null;
    if (!detectWeatherResponse(displayText)) return null;
    return extractWeatherData(displayText);
  }, [isUser, isStreaming, displayText]);

  return (
    <div
      className={`${styles.message} ${isUser ? styles.userMessage : styles.assistantMessage}`}
      style={{ position: 'relative' }}
    >
      {!isUser && message.webSearchUsed && !isStreaming && (
        <div className={styles.assistantHeader}>
          <WebSearchBadgeWithSources
            isAutoDetected={message.webSearchAutoDetected}
            citations={message.citations}
          />
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
        ) : weatherData ? (
          <div className={styles.markdownContent} ref={markdownContentRef}>
            <WeatherCard
              weatherData={weatherData}
              isDark={isDark}
              renderMarkdown={renderMarkdown}
            />
          </div>
        ) : (
          <div className={styles.markdownContent} ref={markdownContentRef}>
            {renderMarkdown(
              // Strip image markdown when generatedImages already handles rendering,
              // to prevent duplicate images (one from markdown, one from GeneratedImageBlock).
              // Matches both "![Generated image](url)" and "![Generated image: prompt](url)".
              message.generatedImages && message.generatedImages.length > 0
                ? displayText.replace(/^!\[Generated image[^\]]*\]\([^)]+\)\s*$/gm, '').trim()
                : displayText,
              isStreaming
            )}
            {isStreaming && <span className={styles.cursor} />}
          </div>
        )}
      </div>

      {/* Generated images — rendered below the message text */}
      {!isUser && message.generatedImages && message.generatedImages.length > 0 && (
        <div className={styles.generatedImagesSection}>
          {message.generatedImages.map((img, idx) => (
            <GeneratedImageBlock
              key={img.id || idx}
              imageData={img}
              allImages={message.generatedImages}
              imageIndex={idx}
            />
          ))}
        </div>
      )}

      {/* Code panel button — shown below response when code blocks exist */}
      {!isUser &&
        !isStreaming &&
        displayText &&
        (() => {
          const blocks = extractCodeBlocksWithNames(displayText);
          if (blocks.length === 0) return null;
          return (
            <CodeCanvasButton
              codeBlocks={blocks}
              onClick={() => onOpenCodePanel && onOpenCodePanel(blocks)}
            />
          );
        })()}

      {/* Error card */}
      {!isUser && message.error && (
        <ErrorCard error={message.error} onRetry={onRetry} userPrompt={userPrompt} />
      )}

      {/* Stream timeout notice */}
      {!isUser && !isStreaming && message.streamTimeout && (
        <StreamTimeoutNotice
          onContinue={
            onRetry && userPrompt
              ? () =>
                  onRetry('Continue from where you left off. Do not repeat what was already said.')
              : null
          }
          onRetry={onRetry && userPrompt ? () => onRetry(userPrompt) : null}
        />
      )}

      {/* Text selection tooltip */}
      {selectionTooltip && !isUser && (
        <SelectionTooltip position={selectionTooltip} onAsk={handleAskAraviel} />
      )}

      {!isUser && !isStreaming && (message.content || hasGeneratedImages) && (
        <ResponseActions
          message={message}
          isDark={isDark}
          onRetry={onRetry}
          userPrompt={userPrompt}
          onSelectAlternate={(alt) => setPendingAlternate(alt)}
          assistantIndex={assistantIndex}
          conversationId={currentChatId}
        />
      )}

      {/* Sub-conversation pills */}
      {!isUser && !isStreaming && message.content && (
        <SubConversationPills
          subConversations={subConversations}
          onOpen={handleOpenSubConv}
          onDelete={handleRequestDeleteSubConv}
          activeSubConvId={showSubConvPanel ? activeSubConvId : null}
        />
      )}

      {(followUps.length > 0 || questions.length > 0) && (
        <FollowUpSection
          followUps={followUps}
          questions={questions}
          onFollowUpSelect={onFollowUpSelect}
          onQuestionsComplete={onQuestionsSend}
          onQuestionsDismiss={() => {}}
        />
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
          conversationId={currentChatId}
          isDark={isDark}
          onStar={handleStarSubConv}
          onReport={handleReportSubConv}
          onDelete={handleRequestDeleteSubConv}
        />
      )}

      {/* Sub-conversation delete confirmation */}
      {pendingDeleteConv && (
        <DeleteSubConvDialog
          highlightedText={pendingDeleteConv.highlightedText}
          onConfirm={handleConfirmDeleteSubConv}
          onCancel={handleCancelDeleteSubConv}
        />
      )}
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
  onCodePanelToggle,
  focusInput,
  currentChatId,
  webSearchEnabled,
  onSendMessage,
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

  // Code side panel state (lifted up so it persists across messages)
  const [codePanelBlocks, setCodePanelBlocks] = useState(null);
  const prevChatIdRef = useRef(currentChatId);

  // Close code panel and sub-conversation panel when switching chats
  useEffect(() => {
    if (prevChatIdRef.current !== currentChatId) {
      setCodePanelBlocks(null);
      setSubConvPanelOwnerId(null);
      if (onCodePanelToggle) onCodePanelToggle(false);
      if (onSubConvPanelToggle) onSubConvPanelToggle(false);
      document.documentElement.style.removeProperty('--code-panel-width');
      prevChatIdRef.current = currentChatId;
    }
  }, [currentChatId, onCodePanelToggle, onSubConvPanelToggle]);

  const handleOpenCodePanel = useCallback(
    (blocks) => {
      setCodePanelBlocks(blocks);
      if (onCodePanelToggle) onCodePanelToggle(true);
    },
    [onCodePanelToggle]
  );

  const handleCloseCodePanel = useCallback(() => {
    setCodePanelBlocks(null);
    if (onCodePanelToggle) onCodePanelToggle(false);
    // Reset custom width CSS var
    document.documentElement.style.removeProperty('--code-panel-width');
  }, [onCodePanelToggle]);

  const handleCodePanelWidthChange = useCallback((width) => {
    document.documentElement.style.setProperty('--code-panel-width', `${width}px`);
  }, []);

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

  const handleQuestionsSend = useCallback(
    (text) => {
      if (onSendMessage && text) {
        onSendMessage(text, { addUserMessage: true });
      }
    },
    [onSendMessage]
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
                onQuestionsSend={handleQuestionsSend}
                onRetry={onRetry}
                onAlternateModelRequest={onAlternateModelRequest}
                userPrompt={userPrompt}
                onSubConvPanelToggle={onSubConvPanelToggle}
                subConvPanelOwnerId={subConvPanelOwnerId}
                onSetSubConvPanelOwner={setSubConvPanelOwnerId}
                currentChatId={currentChatId}
                assistantIndex={assistantIndices.get(index) ?? -1}
                onEditPrompt={handleEditPrompt}
                onOpenCodePanel={handleOpenCodePanel}
                webSearchEnabled={webSearchEnabled}
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

      {/* Code side panel — Claude-style right panel */}
      {codePanelBlocks && codePanelBlocks.length > 0 && (
        <CodeSidePanel
          codeBlocks={codePanelBlocks}
          onClose={handleCloseCodePanel}
          onWidthChange={handleCodePanelWidthChange}
        />
      )}
    </div>
  );
}
