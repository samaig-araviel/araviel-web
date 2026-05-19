import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createNewChat, selectHistoryState } from '../../store/slices/chatSlice';
import styles from './HistoryNoticeBanner.module.css';

/**
 * HistoryNoticeBanner — Inline notice rendered directly above the
 * message input box when the current conversation is long enough that
 * the backend is either about to summarize older messages or has
 * already done so. Mirrors the placement of the guest "out of usage"
 * banner so users encounter context-related prompts in a consistent
 * spot.
 *
 * Two states, driven by `chatSlice.historyState` (populated by the
 * routing SSE event and conversation GET):
 *  1. approachingLimit (not yet summarized)  — soft warning.
 *  2. summarized                              — firm notice + CTA to
 *                                              start a new conversation.
 *
 * When both flags are true the summarized state wins, since once a
 * summary exists the approaching-limit warning is moot.
 */
export default function HistoryNoticeBanner() {
  const dispatch = useDispatch();
  const historyState = useSelector(selectHistoryState);

  const handleStartNew = useCallback(() => {
    dispatch(createNewChat());
  }, [dispatch]);

  if (!historyState) return null;

  const { summarized, approachingLimit } = historyState;
  if (!summarized && !approachingLimit) return null;

  if (summarized) {
    return (
      <div className={styles.banner} role="status" data-variant="summarized">
        <div className={styles.text}>
          <strong>Earlier messages have been summarized.</strong>
          <span>
            Long conversations may lose some detail over time. Start a new conversation for the best
            context.
          </span>
        </div>
        <button type="button" className={styles.action} onClick={handleStartNew}>
          Start new chat
        </button>
      </div>
    );
  }

  return (
    <div className={styles.banner} role="status" data-variant="approaching">
      <div className={styles.text}>
        <strong>This conversation is getting long.</strong>
        <span>
          Older messages will soon be summarized to fit the context window. Consider starting a new
          conversation.
        </span>
      </div>
      <button type="button" className={styles.action} onClick={handleStartNew}>
        Start new chat
      </button>
    </div>
  );
}
