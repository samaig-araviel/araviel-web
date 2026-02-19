import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectEffectiveTheme } from '../../store/slices/themeSlice';
import { setInputValue } from '../../store/slices/chatSlice';
import { getProviderLogo } from '../ProviderLogos';
import { PROVIDERS } from '../../data/models';
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
 * Response actions bar shown below each assistant message.
 * Left: model pill + preview pill
 * Right: like, dislike, copy, retry, share, sources
 */
function ResponseActions({ message, isDark }) {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);

  const provider = message.provider;
  const providerData = provider ? PROVIDERS[provider] : null;
  const LogoComponent = provider ? getProviderLogo(provider) : null;

  // Determine the display name for the provider
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
            className={styles.modelPillSmall}
            style={{
              backgroundColor: isDark ? providerData.accentBgDark : providerData.accentBg,
              color: isDark
                ? providerData.accentTextDark || providerData.accentColor
                : providerData.accentText,
            }}
          >
            <LogoComponent size={12} />
            <span>{displayName}</span>
          </div>
        )}
        <PreviewPill modelName={message.modelName} score={message.score} />
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
        <button className={styles.actionIcon} title="Retry" aria-label="Retry response">
          <RefreshIcon />
        </button>
        <button className={styles.actionIcon} title="Share" aria-label="Share response">
          <ShareIcon />
        </button>
        <button className={styles.actionIcon} title="Sources" aria-label="View sources">
          <SourcesIcon />
        </button>
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
 * A single message in the chat.
 */
function Message({
  message,
  isStreaming,
  streamedText,
  isDark,
  isLastAssistant,
  onFollowUpSelect,
}) {
  const isUser = message.role === 'user';
  const displayText = isStreaming ? streamedText : message.content;
  const provider = message.provider;
  const providerData = provider ? PROVIDERS[provider] : null;
  const LogoComponent = provider ? getProviderLogo(provider) : null;

  const followUps =
    !isUser && isLastAssistant && !isStreaming && message.content
      ? generateFollowUps(message.content)
      : [];

  return (
    <div className={`${styles.message} ${isUser ? styles.userMessage : styles.assistantMessage}`}>
      {!isUser && providerData && (
        <div className={styles.assistantHeader}>
          <div
            className={styles.providerPill}
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
                <span className={styles.scoreText}>Score: {(message.score * 100).toFixed(1)}</span>
              </>
            )}
          </div>
        </div>
      )}

      <div className={styles.messageContent}>
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <div className={styles.markdownContent}>
            {renderMarkdown(displayText)}
            {isStreaming && <span className={styles.cursor} />}
          </div>
        )}
      </div>

      {!isUser && !isStreaming && message.content && (
        <ResponseActions message={message} isDark={isDark} />
      )}

      {followUps.length > 0 && (
        <FollowUpSuggestions suggestions={followUps} onSelect={onFollowUpSelect} />
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
}) {
  const dispatch = useDispatch();
  const effectiveTheme = useSelector(selectEffectiveTheme);
  const isDark = effectiveTheme === 'dark';
  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  const handleFollowUpSelect = useCallback(
    (text) => {
      dispatch(setInputValue(text));
    },
    [dispatch]
  );

  // Auto-scroll to bottom only when user is near the bottom (within 200px).
  // Always scroll for new messages and timeline changes.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !bottomRef.current) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    const isNearBottom = distanceFromBottom < 200;

    if (isNearBottom) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, streamedText, isProcessing, timelineStages]);

  // Always scroll on new messages (user or assistant added)
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages.length]);

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
    </div>
  );
}
