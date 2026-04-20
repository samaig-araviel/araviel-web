import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectConversations, selectInputValue } from '../../store/slices/chatSlice';
import { fetchConversationMessages } from '../../services/api';
import { buildSubtitle, inferIntent, summariseTitle } from '../../utils/conversationIntent';
import styles from './DynamicSubtitle.module.css';

const STALE_WINDOW_MS = 48 * 60 * 60 * 1000;
const UNTITLED = 'New conversation';

function pickCandidate(conversations) {
  if (!Array.isArray(conversations) || conversations.length === 0) return null;
  const cutoff = Date.now() - STALE_WINDOW_MS;
  let best = null;
  let bestTime = 0;
  for (const c of conversations) {
    if (!c || c.isArchived || c.isReported) continue;
    const ts = new Date(c.updatedAt ?? c.createdAt).getTime();
    if (!Number.isFinite(ts) || ts < cutoff) continue;
    if (ts > bestTime) {
      best = c;
      bestTime = ts;
    }
  }
  return best;
}

/**
 * Homepage subtitle that reflects the user's most recent conversation.
 * Renders nothing when there is no candidate within the staleness window.
 * When the main input is focused or has content, the line dims but stays
 * in the DOM so the layout doesn't shift.
 */
export default function DynamicSubtitle({ onOpen, isInputActive = false }) {
  const conversations = useSelector(selectConversations);
  const inputValue = useSelector(selectInputValue);

  const candidate = useMemo(() => pickCandidate(conversations), [conversations]);

  const isUntitled = candidate?.title === UNTITLED;
  const [firstMessageByConvId, setFirstMessageByConvId] = useState({});

  useEffect(() => {
    if (!candidate || !isUntitled) return undefined;
    const id = candidate.id;
    if (firstMessageByConvId[id] !== undefined) return undefined;

    let cancelled = false;
    fetchConversationMessages(id, 1, 0)
      .then((data) => {
        if (cancelled) return;
        const msgs = Array.isArray(data?.messages) ? data.messages : [];
        const firstUser = msgs.find((m) => m?.role === 'user') || msgs[0];
        const content = firstUser && typeof firstUser.content === 'string' ? firstUser.content : '';
        setFirstMessageByConvId((prev) => ({ ...prev, [id]: content }));
      })
      .catch(() => {
        if (cancelled) return;
        setFirstMessageByConvId((prev) => ({ ...prev, [id]: '' }));
      });

    return () => {
      cancelled = true;
    };
  }, [candidate, isUntitled, firstMessageByConvId]);

  const dimmedState = isInputActive || inputValue.trim().length > 0;

  // Latch the built sentence so it doesn't flicker between renders if the
  // conversation list is re-sorted with the same leader.
  const cacheRef = useRef({ key: null, prose: '', cta: '' });

  if (!candidate) return null;

  const sourceText = isUntitled ? firstMessageByConvId[candidate.id] : candidate.title;
  if (isUntitled && sourceText === undefined) return null; // still loading
  if (isUntitled && !sourceText) return null; // empty conversation — nothing to reference

  const subject = summariseTitle(sourceText);
  if (!subject) return null;

  const intent = inferIntent(sourceText);
  const cacheKey = `${candidate.id}::${intent}::${subject}`;
  let prose;
  let cta;
  if (cacheRef.current.key === cacheKey) {
    ({ prose, cta } = cacheRef.current);
  } else {
    const updatedAt = candidate.updatedAt ? new Date(candidate.updatedAt) : null;
    const built = buildSubtitle(intent, subject, candidate.id, { updatedAt });
    prose = built.prose;
    cta = built.cta;
    cacheRef.current = { key: cacheKey, prose, cta };
  }

  const classes = `${styles.line} ${dimmedState ? styles.dimmed : ''}`.trim();

  return (
    <p className={classes} aria-hidden={dimmedState ? 'true' : undefined}>
      <span className={styles.prose}>{prose} </span>
      <button
        type="button"
        className={styles.cta}
        onClick={() => onOpen?.(candidate.id)}
        tabIndex={dimmedState ? -1 : 0}
        aria-hidden={dimmedState ? 'true' : undefined}
        aria-label={`${cta}: ${subject}`}
      >
        {cta}
      </button>
    </p>
  );
}
