import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import MessageList from '../MessageList/MessageList';
import { fetchSharedConversation } from '../../services/api';
import { selectEffectiveTheme } from '../../store/slices/themeSlice';
import { ArrowRightIcon } from '../Icons';
import styles from './SharedConversationView.module.css';

/**
 * Public, read-only view of a shared conversation. Rendered OUTSIDE the authed
 * <App /> shell so unauthenticated visitors don't see the sidebar, the guest
 * gate, or any of the owner's private data.
 *
 * Responsibilities:
 *  - Fetch the shared conversation snapshot from GET /api/shares/:token.
 *  - Render messages via the existing MessageList with `readOnly` so no
 *    feedback / retry / sub-conversation / edit controls appear.
 *  - Set a noindex meta tag so search engines don't crawl shared pages.
 *  - Show a clean 404 if the share was revoked or never existed.
 *
 * State is intentionally local — no Redux for the share payload — so we don't
 * pollute the authed chat slice with another user's data.
 */
export default function SharedConversationView() {
  const { token } = useParams();
  const effectiveTheme = useSelector(selectEffectiveTheme);
  const [share, setShare] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ok' | 'not-found' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  // Apply the active theme to <html> so CSS vars resolve. We don't mutate
  // Redux — just echo whatever theme the visitor already has selected.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  }, [effectiveTheme]);

  // Inject a robots noindex meta tag while this page is mounted, then remove
  // it on unmount so it doesn't leak into other routes. This matches the
  // X-Robots-Tag header the API also sets.
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);

    const prevTitle = document.title;
    document.title = 'Shared conversation · Araviel';

    return () => {
      if (meta.parentNode) meta.parentNode.removeChild(meta);
      document.title = prevTitle;
    };
  }, []);

  // Fetch once per token, aborting if the component unmounts mid-request so we
  // never call setState after unmount.
  const lastTokenRef = useRef(null);
  useEffect(() => {
    if (!token || lastTokenRef.current === token) return;
    lastTokenRef.current = token;

    const controller = new AbortController();
    setStatus('loading');
    setShare(null);
    setErrorMsg('');

    fetchSharedConversation(token, { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        setShare(data);
        setStatus('ok');
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err?.name === 'AbortError') return;
        if (err?.code === 'SHARE_NOT_FOUND') {
          setStatus('not-found');
          return;
        }
        setStatus('error');
        setErrorMsg(err?.message || 'Failed to load shared conversation');
      });

    return () => controller.abort();
  }, [token]);

  // MessageList expects each assistant message to carry a `provider` key so it
  // can render the model pill. The public API returns `model: { provider, name }`
  // — normalise once so MessageList renders without defensive checks.
  const messages = useMemo(() => {
    if (!share?.messages) return [];
    return share.messages.map((m) => ({
      ...m,
      createdAt: m.createdAt,
      provider: m.model?.provider ?? null,
      modelName: m.model?.name ?? null,
    }));
  }, [share]);

  const snapshotDateStr = useMemo(() => {
    if (!share?.snapshotAt) return null;
    try {
      const d = new Date(share.snapshotAt);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return null;
    }
  }, [share]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.brand} aria-label="Araviel home">
          <span className={styles.brandMark}>A</span>
          <span className={styles.brandText}>Araviel</span>
        </Link>
        <Link to="/" className={styles.ctaLink}>
          <span>Start your own chat</span>
          <ArrowRightIcon />
        </Link>
      </header>

      <main className={styles.main}>
        {status === 'loading' && (
          <div className={styles.centered}>
            <div className={styles.spinner} />
          </div>
        )}

        {status === 'not-found' && (
          <div className={styles.centered}>
            <div className={styles.emptyState}>
              <h1 className={styles.emptyTitle}>Conversation unavailable</h1>
              <p className={styles.emptyBody}>
                This shared link is no longer active. The owner may have unshared it, or the link
                may be invalid.
              </p>
              <Link to="/" className={styles.emptyCta}>
                Go to Araviel
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className={styles.centered}>
            <div className={styles.emptyState}>
              <h1 className={styles.emptyTitle}>Something went wrong</h1>
              <p className={styles.emptyBody}>{errorMsg}</p>
            </div>
          </div>
        )}

        {status === 'ok' && share && (
          <div className={styles.conversation}>
            <div className={styles.conversationHeader}>
              <h1 className={styles.conversationTitle}>{share.title || 'Shared conversation'}</h1>
              {snapshotDateStr && (
                <p className={styles.conversationMeta}>
                  Shared via Araviel · Snapshot from {snapshotDateStr}
                </p>
              )}
            </div>

            <div className={styles.messageListWrapper}>
              <MessageList
                messages={messages}
                isProcessing={false}
                timelineStages={null}
                timelineFading={false}
                modelName={null}
                provider={null}
                isStreaming={false}
                streamedText=""
                onRetry={null}
                onSessionExpired={() => {}}
                onAlternateModelRequest={() => {}}
                onSubConvPanelToggle={() => {}}
                onCodePanelToggle={() => {}}
                onSourcesPanelToggle={() => {}}
                focusInput={() => {}}
                currentChatId={share.shareToken}
                webSearchEnabled={false}
                onSendMessage={() => {}}
                readOnly
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
