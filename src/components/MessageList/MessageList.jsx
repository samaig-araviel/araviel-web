import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectEffectiveTheme } from '../../store/slices/themeSlice';
import { getProviderLogo } from '../ProviderLogos';
import { PROVIDERS } from '../../data/models';
import ThinkingTimeline from '../ThinkingTimeline/ThinkingTimeline';
import styles from './MessageList.module.css';

/**
 * Render basic markdown to React elements.
 * Handles: code blocks, inline code, bold, italic, horizontal rules, lists, paragraphs.
 */
function renderMarkdown(text) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
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
      elements.push(
        <div className={styles.codeBlock} key={key++}>
          {lang && <div className={styles.codeLang}>{lang}</div>}
          <pre>
            <code>{codeLines.join('\n')}</code>
          </pre>
        </div>
      );
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
 * A single message in the chat.
 */
function Message({ message, isStreaming, streamedText, isDark }) {
  const isUser = message.role === 'user';
  const displayText = isStreaming ? streamedText : message.content;
  const provider = message.provider;
  const providerData = provider ? PROVIDERS[provider] : null;
  const LogoComponent = provider ? getProviderLogo(provider) : null;

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
  const effectiveTheme = useSelector(selectEffectiveTheme);
  const isDark = effectiveTheme === 'dark';
  const bottomRef = useRef(null);
  const containerRef = useRef(null);

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

  // Determine where to insert the timeline:
  // - If last message is a streaming assistant msg, timeline goes before it
  // - Otherwise, timeline goes after all messages
  const timelineBeforeLastMsg = isLastAssistantStreaming;

  return (
    <div className={styles.messageList} ref={containerRef}>
      <div className={styles.messagesInner}>
        {messages.map((msg, index) => {
          const isLast = index === messages.length - 1;
          const shouldStream = isLast && isLastAssistantStreaming;

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
