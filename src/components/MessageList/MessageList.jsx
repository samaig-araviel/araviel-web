import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectEffectiveTheme } from '../../store/slices/themeSlice';
import { setInputValue } from '../../store/slices/chatSlice';
import { getProviderLogo } from '../ProviderLogos';
import { PROVIDERS, MODELS } from '../../data/models';
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
} from '../Icons';
import ThinkingTimeline from '../ThinkingTimeline/ThinkingTimeline';
import styles from './MessageList.module.css';

/**
 * Generate 2 follow-up suggestion prompts based on the assistant's response content.
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
    return pickRandom(suggestions, 2);
  }

  // Analytical responses
  if (/analysis|findings|methodology|recommendations|pattern/i.test(lower)) {
    const suggestions = [
      'Can you go deeper on the key findings with examples?',
      'What data sources would strengthen this analysis?',
      'How would you visualize these insights for a presentation?',
      'What are the potential risks if we ignore these patterns?',
    ];
    return pickRandom(suggestions, 2);
  }

  // Research responses
  if (/quantum|theory|research|history|science|overview/i.test(lower)) {
    const suggestions = [
      'What are the most recent breakthroughs in this area?',
      'Can you explain this in simpler terms for a beginner?',
      'What are the practical real-world applications?',
      'Who are the leading researchers or companies in this space?',
    ];
    return pickRandom(suggestions, 2);
  }

  // Creative responses
  if (/poem|haiku|verse|story|imagine|narrative/i.test(lower)) {
    const suggestions = [
      'Can you write another one with a different tone?',
      'What inspired the imagery in this piece?',
      'Can you create a longer version expanding on this theme?',
      'How would this change if written in a different style?',
    ];
    return pickRandom(suggestions, 2);
  }

  // Default follow-ups
  const defaults = [
    'Can you elaborate on this with more specific examples?',
    'What are the most common misconceptions about this?',
    'How would you apply this in a real-world scenario?',
    'What should I learn next to go deeper on this topic?',
  ];
  return pickRandom(defaults, 2);
}

function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

/**
 * Render basic markdown to React elements.
 * Handles: code blocks, inline code, bold, italic, horizontal rules, lists, paragraphs.
 */
function renderMarkdown(text, onCopyCode) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let i = 0;
  let key = 0;
  let codeBlockIndex = 0;

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
      const blockIdx = codeBlockIndex++;
      elements.push(<CodeBlock key={key++} lang={lang} code={codeContent} index={blockIdx} />);
      continue;
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

    // Heading (## or ###)
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const Tag = level === 1 ? 'h3' : level === 2 ? 'h4' : 'h5';
      elements.push(
        <Tag className={styles[`heading${level}`]} key={key++}>
          {renderInline(headingMatch[2])}
        </Tag>
      );
      i++;
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

  return elements;
}

/**
 * Code block component with copy functionality.
 */
function CodeBlock({ lang, code, index }) {
  const [copied, setCopied] = useState(false);

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
        <code>{code}</code>
      </pre>
    </div>
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

    // Plain text up to next special char
    match = remaining.match(/^[^`*]+/);
    if (match) {
      parts.push(match[0]);
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Single special char (not part of a pattern)
    parts.push(remaining[0]);
    remaining = remaining.slice(1);
  }

  return parts.length === 1 ? parts[0] : parts;
}

/**
 * Preview mode pill with hover tooltip showing ADE reasoning.
 */
function PreviewPill({ modelName, score }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const scoreDisplay = score ? (score * 100).toFixed(1) : null;

  return (
    <div
      className={styles.previewPillWrapper}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setShowTooltip(!showTooltip)}
    >
      <span className={styles.previewPill}>
        <span className={styles.previewDot} />
        Preview
      </span>
      {showTooltip && (
        <div className={styles.previewTooltip}>
          <div className={styles.previewTooltipContent}>
            <span className={styles.previewTooltipLabel}>ADE Routing</span>
            <span className={styles.previewTooltipModel}>
              {modelName}
              {scoreDisplay && <span className={styles.previewTooltipScore}>{scoreDisplay}%</span>}
            </span>
            <span className={styles.previewTooltipDesc}>Response generated in preview mode</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Sources pill shown when the response has sources.
 */
function SourcesPill({ sources }) {
  if (!sources || sources.length === 0) return null;

  return (
    <span className={styles.sourcesPill}>
      <SourcesIcon />
      <span>Sources</span>
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
          {isManualSelection ? 'Manual selection' : 'Powered by ADE'}
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
function ModelPillDropdown({ message, isDark, position, onClose, onSelectAlternate }) {
  const dropdownRef = useRef(null);
  const providerData = message.provider ? PROVIDERS[message.provider] : null;
  const LogoComponent = message.provider ? getProviderLogo(message.provider) : null;
  const alternates = message.alternateModels || [];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    // Delay listener slightly to avoid closing immediately from the opening click
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

        <p className={styles.altConfirmDesc}>Re-generate this response using a different model?</p>

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
            Switch & regenerate
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Generate a mock sub-conversation response based on highlighted text and user question.
 */
function generateSubResponse(highlightedText, question) {
  const lower = question.toLowerCase();
  const term = highlightedText.trim();

  if (/what|meaning|define|explain/i.test(lower)) {
    return `**${term}** refers to a concept that plays a key role in this context. In simple terms, it describes the underlying mechanism or principle being discussed.\n\nThe key thing to understand is that ${term.toLowerCase()} operates as a foundational element — other concepts in this domain build upon it. Think of it as one of the core building blocks that makes the broader system work.\n\nWould you like me to go deeper on any specific aspect?`;
  }

  if (/why|reason|purpose/i.test(lower)) {
    return `The reason **${term}** is important here comes down to its role in the broader system.\n\nIt serves as a critical link between the high-level goals and the practical implementation. Without it, the approach described would lack a key structural element.\n\nIn practice, ${term.toLowerCase()} helps ensure that the overall solution remains coherent and maintainable as complexity grows.`;
  }

  if (/how|work|implement/i.test(lower)) {
    return `Here is how **${term}** works at a high level:\n\n1. **Input phase** — It receives the relevant data or signals from the surrounding context\n2. **Processing** — It applies the core logic or transformation specific to its role\n3. **Output** — The result feeds into the next stage of the pipeline\n\nThe elegance of this approach is in its composability — each piece handles one concern well, and they combine cleanly.`;
  }

  if (/example|show|demo/i.test(lower)) {
    return `Here is a practical example of **${term}** in action:\n\nImagine you have a system that needs to process incoming requests efficiently. ${term} would be the component responsible for coordinating between the input layer and the processing layer.\n\nA concrete scenario: when a user submits a query, ${term.toLowerCase()} ensures the right handler picks it up, processes it correctly, and returns a well-formed response — all without the caller needing to know the internal details.`;
  }

  return `Great question about **${term}**.\n\nThis is a nuanced topic with several layers worth exploring. At its core, ${term.toLowerCase()} represents a pattern that balances simplicity with power — it is straightforward enough to understand quickly, but flexible enough to handle complex scenarios.\n\nThe most important thing to remember is that ${term.toLowerCase()} does not exist in isolation. It interacts with the surrounding concepts to create something greater than the sum of its parts.\n\nFeel free to ask a follow-up if you want to explore a specific angle.`;
}

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
 * Sub-conversation dialog — a mini chatbot popup for discussing highlighted text.
 */
function SubConversationDialog({ subConversation, onSend, onCancel, onDone, isSending }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [subConversation.messages.length]);

  // Close on escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onCancel]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;
    onSend(input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const truncatedHighlight =
    subConversation.highlightedText.length > 40
      ? subConversation.highlightedText.slice(0, 40) + '...'
      : subConversation.highlightedText;

  return (
    <div className={styles.subConvOverlay} onClick={onCancel}>
      <div className={styles.subConvDialog} ref={dialogRef} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.subConvHeader}>
          <div className={styles.subConvHeaderLeft}>
            <MessageCircleIcon />
            <span className={styles.subConvHeaderTitle}>Sub-conversation</span>
          </div>
          <button className={styles.subConvCloseBtn} onClick={onCancel} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        {/* Highlighted text context */}
        <div className={styles.subConvContext}>
          <span className={styles.subConvContextLabel}>Discussing:</span>
          <span className={styles.subConvContextText}>"{truncatedHighlight}"</span>
        </div>

        {/* Messages */}
        <div className={styles.subConvMessages}>
          {subConversation.messages.map((msg, idx) => (
            <div
              key={idx}
              className={`${styles.subConvMessage} ${
                msg.role === 'user' ? styles.subConvMessageUser : styles.subConvMessageAssistant
              }`}
            >
              {msg.role === 'user' ? (
                <div className={styles.subConvUserBubble}>{msg.content}</div>
              ) : (
                <div className={styles.subConvAssistantBubble}>{renderMarkdown(msg.content)}</div>
              )}
            </div>
          ))}
          {isSending && (
            <div className={`${styles.subConvMessage} ${styles.subConvMessageAssistant}`}>
              <div className={styles.subConvAssistantBubble}>
                <div className={styles.subConvTyping}>
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form className={styles.subConvInputRow} onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            className={styles.subConvInput}
            placeholder={`Ask about "${truncatedHighlight}"...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
          />
          <button
            type="submit"
            className={styles.subConvSendBtn}
            disabled={!input.trim() || isSending}
            aria-label="Send"
          >
            <SendIcon />
          </button>
        </form>

        {/* Footer buttons */}
        <div className={styles.subConvFooter}>
          <button className={styles.subConvCancelBtn} onClick={onCancel}>
            Cancel
          </button>
          <button className={styles.subConvDoneBtn} onClick={onDone}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Horizontal scrollable pills showing saved sub-conversations.
 */
function SubConversationPills({ subConversations, onOpen }) {
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
            sc.highlightedText.length > 10
              ? sc.highlightedText.slice(0, 10) + '...'
              : sc.highlightedText;
          return (
            <button
              key={sc.id}
              className={styles.subConvPill}
              onClick={() => onOpen(sc.id)}
              title={sc.highlightedText}
            >
              <MessageCircleIcon />
              <span>{truncated}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Response actions bar shown below each assistant message.
 * Left: model pill + preview pill + sources pill
 * Right: like, dislike, copy, retry, share
 */
function ResponseActions({ message, isDark, onRetry, userPrompt, onSelectAlternate }) {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [showShareDropdown, setShowShareDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  const provider = message.provider;
  const providerData = provider ? PROVIDERS[provider] : null;
  const LogoComponent = provider ? getProviderLogo(provider) : null;

  const hasAlternates = message.alternateModels && message.alternateModels.length > 0;

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
        {providerData && LogoComponent && (
          <div
            className={styles.modelPillSmallWrapper}
            onClick={() => setShowModelDropdown(!showModelDropdown)}
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
              />
            )}
          </div>
        )}
        <PreviewPill modelName={message.modelName} score={message.score} />
        <SourcesPill sources={message.sources} />
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
        <SparkleIcon />
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
 * Collapsible thinking block shown before assistant responses (Claude-style).
 * Shows routing + thinking stages with a dotted timeline.
 */
function ThinkingBlock({ thinkingData, modelName, provider }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const effectiveTheme = useSelector(selectEffectiveTheme);
  const isDark = effectiveTheme === 'dark';

  if (!thinkingData) return null;

  const { routingDuration, thinkingDuration, totalDuration } = thinkingData;
  const providerData = provider ? PROVIDERS[provider] : null;
  const LogoComponent = provider ? getProviderLogo(provider) : null;

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
        <span className={styles.thinkingToggleLabel}>Thought for {totalDuration}s</span>
      </button>

      {isExpanded && (
        <div className={styles.thinkingDetails}>
          <div className={styles.thinkingStage}>
            <div className={styles.thinkingDotLine}>
              <span className={styles.thinkingStageDot} />
              <span className={styles.thinkingVerticalLine} />
            </div>
            <div className={styles.thinkingStageContent}>
              <span className={styles.thinkingStageLabel}>Routing to optimal model</span>
              <span className={styles.thinkingStageDuration}>{routingDuration}s</span>
            </div>
          </div>

          <div className={styles.thinkingStage}>
            <div className={styles.thinkingDotLine}>
              <span className={styles.thinkingStageDot} />
              <span className={styles.thinkingVerticalLine} />
            </div>
            <div className={styles.thinkingStageContent}>
              <span className={styles.thinkingStageLabel}>
                Thinking with{' '}
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

          <div className={`${styles.thinkingStage} ${styles.thinkingStageLast}`}>
            <div className={styles.thinkingDotLine}>
              <span className={styles.thinkingStageDot} />
            </div>
            <div className={styles.thinkingStageContent}>
              <span className={styles.thinkingStageLabel}>Writing response</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * User prompt component with distinctive styling and collapse/expand for long messages.
 */
function UserPrompt({ content }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentRef = useRef(null);
  const [isLong, setIsLong] = useState(false);
  const LINE_LIMIT = 10;

  useEffect(() => {
    const lineCount = (content || '').split('\n').length;
    setIsLong(lineCount > LINE_LIMIT);
  }, [content]);

  // Calculate collapsed height based on line count
  const collapsedStyle = !isExpanded && isLong ? { maxHeight: `${LINE_LIMIT * 1.65}em` } : {};

  return (
    <div className={styles.userPromptCard}>
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
  onFollowUpSelect,
  onRetry,
  onAlternateModelRequest,
  userPrompt,
}) {
  const isUser = message.role === 'user';
  const displayText = isStreaming ? streamedText : message.content;
  const provider = message.provider;
  const providerData = provider ? PROVIDERS[provider] : null;
  const LogoComponent = provider ? getProviderLogo(provider) : null;
  const [showHeaderDropdown, setShowHeaderDropdown] = useState(false);
  const [pendingAlternate, setPendingAlternate] = useState(null);
  const hasAlternates = message.alternateModels && message.alternateModels.length > 0;

  // Sub-conversation state
  const [subConversations, setSubConversations] = useState([]);
  const [activeSubConvId, setActiveSubConvId] = useState(null);
  const [showSubConvDialog, setShowSubConvDialog] = useState(false);
  const [selectionTooltip, setSelectionTooltip] = useState(null);
  const [isSendingSubMsg, setIsSendingSubMsg] = useState(false);
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
  const handleAskAraviel = useCallback(() => {
    if (!selectionTooltip?.text) return;

    const newSubConv = {
      id: `subconv-${Date.now()}`,
      highlightedText: selectionTooltip.text,
      messages: [],
    };

    setSubConversations((prev) => [...prev, newSubConv]);
    setActiveSubConvId(newSubConv.id);
    setShowSubConvDialog(true);
    setSelectionTooltip(null);

    // Clear the text selection
    window.getSelection()?.removeAllRanges();
  }, [selectionTooltip]);

  // Send a message in the active sub-conversation
  const handleSubConvSend = useCallback(
    (text) => {
      if (!activeSubConvId) return;

      // Add user message
      setSubConversations((prev) =>
        prev.map((sc) =>
          sc.id === activeSubConvId
            ? { ...sc, messages: [...sc.messages, { role: 'user', content: text }] }
            : sc
        )
      );

      // Simulate assistant response
      setIsSendingSubMsg(true);
      const activeConv = subConversations.find((sc) => sc.id === activeSubConvId);
      const highlightedText = activeConv?.highlightedText || '';

      setTimeout(() => {
        const response = generateSubResponse(highlightedText, text);
        setSubConversations((prev) =>
          prev.map((sc) =>
            sc.id === activeSubConvId
              ? { ...sc, messages: [...sc.messages, { role: 'assistant', content: response }] }
              : sc
          )
        );
        setIsSendingSubMsg(false);
      }, 600 + Math.random() * 800);
    },
    [activeSubConvId, subConversations]
  );

  // Open existing sub-conversation pill
  const handleOpenSubConv = useCallback((id) => {
    setActiveSubConvId(id);
    setShowSubConvDialog(true);
  }, []);

  // Close dialog via Cancel
  const handleSubConvCancel = useCallback(() => {
    const activeConv = subConversations.find((sc) => sc.id === activeSubConvId);
    // If the sub-conversation has no messages, remove it
    if (activeConv && activeConv.messages.length === 0) {
      setSubConversations((prev) => prev.filter((sc) => sc.id !== activeSubConvId));
    }
    setShowSubConvDialog(false);
    setActiveSubConvId(null);
  }, [activeSubConvId, subConversations]);

  // Close dialog via Done
  const handleSubConvDone = useCallback(() => {
    const activeConv = subConversations.find((sc) => sc.id === activeSubConvId);
    // If the sub-conversation has no messages, remove it
    if (activeConv && activeConv.messages.length === 0) {
      setSubConversations((prev) => prev.filter((sc) => sc.id !== activeSubConvId));
    }
    setShowSubConvDialog(false);
    setActiveSubConvId(null);
  }, [activeSubConvId, subConversations]);

  const activeSubConversation = subConversations.find((sc) => sc.id === activeSubConvId);

  const followUps =
    !isUser && isLastAssistant && !isStreaming && message.content
      ? generateFollowUps(message.content)
      : [];

  return (
    <div
      className={`${styles.message} ${isUser ? styles.userMessage : styles.assistantMessage}`}
      style={{ position: 'relative' }}
    >
      {!isUser && providerData && (
        <div className={styles.assistantHeader}>
          <div
            className={styles.providerPillWrapper}
            onClick={() => setShowHeaderDropdown(!showHeaderDropdown)}
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
              />
            )}
          </div>
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

      {!isUser && !isStreaming && message.thinkingData && (
        <ThinkingBlock
          thinkingData={message.thinkingData}
          modelName={message.modelName}
          provider={message.provider}
        />
      )}

      <div className={styles.messageContent} onMouseUp={handleMouseUp}>
        {isUser ? (
          <UserPrompt content={message.content} />
        ) : (
          <div className={styles.markdownContent} ref={markdownContentRef}>
            {renderMarkdown(displayText)}
            {isStreaming && <span className={styles.cursor} />}
          </div>
        )}
      </div>

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
        />
      )}

      {/* Sub-conversation pills — between response actions and follow-ups */}
      {!isUser && !isStreaming && message.content && (
        <SubConversationPills subConversations={subConversations} onOpen={handleOpenSubConv} />
      )}

      {followUps.length > 0 && (
        <FollowUpSuggestions suggestions={followUps} onSelect={onFollowUpSelect} />
      )}

      {/* Sub-conversation dialog */}
      {showSubConvDialog && activeSubConversation && (
        <SubConversationDialog
          subConversation={activeSubConversation}
          onSend={handleSubConvSend}
          onCancel={handleSubConvCancel}
          onDone={handleSubConvDone}
          isSending={isSendingSubMsg}
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
}) {
  const dispatch = useDispatch();
  const effectiveTheme = useSelector(selectEffectiveTheme);
  const isDark = effectiveTheme === 'dark';
  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [shouldPulse, setShouldPulse] = useState(false);
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
    },
    [dispatch]
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
                onFollowUpSelect={handleFollowUpSelect}
                onRetry={onRetry}
                onAlternateModelRequest={onAlternateModelRequest}
                userPrompt={userPrompt}
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
