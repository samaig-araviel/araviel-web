import { useState, useEffect, useMemo } from 'react';
import {
  fetchConversationShare,
  createConversationShare,
  updateConversationShare,
  revokeConversationShare,
  rotateConversationShare,
} from '../../services/api';
import { CloseIcon, SparkleIcon, LinkIcon, RefreshIcon, CheckIcon, TrashIcon } from '../Icons';
import styles from './ShareModal.module.css';

/**
 * Format a past Date as a short relative label ("2 min ago", "yesterday",
 * "Mar 14"). Falls back to an absolute medium-format date for anything over a
 * week old so viewers always see a concrete timestamp.
 */
function formatRelativeTime(date) {
  const now = Date.now();
  const ms = now - date.getTime();
  if (!Number.isFinite(ms) || ms < 0) {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  const sec = Math.round(ms / 1000);
  if (sec < 45) return 'just now';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.round(hr / 24);
  if (day === 1) return 'yesterday';
  if (day < 7) return `${day} days ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Share modal.
 *
 * Renders one of three states, driven by whether an active share exists:
 *
 *   empty  — no active share; shows a primary "Create share link" CTA.
 *   ready  — share exists; shows URL, metadata, and Copy/Update/Rotate/Unshare
 *            actions. A contextual stale banner appears only when the
 *            conversation has new messages since the last snapshot.
 *   loading — initial fetch in-flight; shown briefly so we don't flash an
 *            incorrect empty state.
 *
 * We intentionally do NOT auto-create a share on open: creating a public link
 * is a deliberate action that should only happen when the user asks for it.
 * Reopening the modal for a conversation that already has a share will show
 * the existing link (the backend's partial unique index guarantees at most
 * one active share per conversation, so there's never ambiguity).
 *
 * `messages` is optional. When provided (i.e. we're viewing the conversation
 * being shared), the modal can detect new messages since the snapshot and
 * surface an "Update snapshot" hint. When omitted — e.g. sharing from the
 * sidebar or conversations list — the modal still works, just without that
 * contextual hint.
 */
export default function ShareModal({
  conversationId,
  conversationTitle,
  messages,
  onClose,
  onSuccess,
  onError,
}) {
  const [share, setShare] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [rotateConfirm, setRotateConfirm] = useState(false);

  const shareUrl = useMemo(() => {
    if (!share?.shareToken) return null;
    return `${window.location.origin}/share/${share.shareToken}`;
  }, [share]);

  const hasNewMessagesSinceShare = useMemo(() => {
    if (!share?.snapshotAt || !messages?.length) return false;
    const snapshotMs = new Date(share.snapshotAt).getTime();
    return messages.some((m) => {
      const raw = m.createdAt ?? m.timestamp;
      if (raw == null) return false;
      const t = typeof raw === 'number' ? raw : new Date(raw).getTime();
      return Number.isFinite(t) && t > snapshotMs;
    });
  }, [share, messages]);

  // Look up the existing share when the modal opens. We do not create one
  // automatically — creation is an explicit user action below.
  useEffect(() => {
    if (!conversationId) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const { share: existing } = await fetchConversationShare(conversationId);
        if (!cancelled) setShare(existing ?? null);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not check share status');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        // If the rotate-confirm prompt is open, ESC backs out of that first
        // rather than closing the whole modal — less surprising.
        if (rotateConfirm) setRotateConfirm(false);
        else onClose();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, rotateConfirm]);

  const handleCreate = async () => {
    if (isCreating || !conversationId) return;
    setIsCreating(true);
    setError(null);
    try {
      const created = await createConversationShare(conversationId);
      setShare(created);
      onSuccess?.('Share link created');
    } catch (err) {
      setError(err.message || 'Could not create share link');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2500);
      })
      .catch((err) => onError?.(err.message || 'Could not copy link'));
  };

  const handleUpdate = async () => {
    if (isUpdating || !conversationId) return;
    setIsUpdating(true);
    setError(null);
    try {
      const refreshed = await updateConversationShare(conversationId);
      setShare(refreshed);
      onSuccess?.('Snapshot updated');
    } catch (err) {
      setError(err.message || 'Could not update snapshot');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRotate = async () => {
    if (isRotating || !conversationId) return;
    setIsRotating(true);
    setError(null);
    try {
      const rotated = await rotateConversationShare(conversationId);
      setShare(rotated);
      setLinkCopied(false);
      setRotateConfirm(false);
      onSuccess?.('New link generated — the old one no longer works');
    } catch (err) {
      // If the DELETE succeeded but the POST failed, the server now has no
      // active share for this conversation. Clear local state so the UI
      // returns to the empty-state CTA, from which the user can retry cleanly.
      try {
        const { share: current } = await fetchConversationShare(conversationId);
        setShare(current ?? null);
      } catch {
        setShare(null);
      }
      setRotateConfirm(false);
      setError(err.message || 'Could not rotate share link');
    } finally {
      setIsRotating(false);
    }
  };

  const handleRevoke = async () => {
    if (isRevoking || !conversationId) return;
    setIsRevoking(true);
    setError(null);
    try {
      await revokeConversationShare(conversationId);
      onSuccess?.('Share link revoked');
      onClose();
    } catch (err) {
      setError(err.message || 'Could not revoke share link');
      setIsRevoking(false);
    }
  };

  const previewTitle = conversationTitle?.trim() || 'Araviel Conversation';
  const previewUrl = shareUrl ? shareUrl.replace(/^https?:\/\//, '') : '';
  const snapshotAt = share?.snapshotAt ? new Date(share.snapshotAt) : null;
  const snapshotRelative = snapshotAt ? formatRelativeTime(snapshotAt) : null;
  const viewCount = share?.viewCount ?? 0;
  const busy = isCreating || isUpdating || isRevoking || isRotating;

  return (
    <div className={styles.shareOverlay} onClick={onClose}>
      <div
        className={styles.shareModal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
      >
        <div className={styles.shareModalHeader}>
          <h3 id="share-modal-title">Share conversation</h3>
          <button className={styles.shareModalClose} onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <p className={styles.shareModalDesc}>
          {share
            ? 'Anyone with this link can view a read-only snapshot of this conversation. Update it to include new messages, or unshare to revoke access.'
            : 'Create a public link to share this conversation. Anyone with the link will see a read-only snapshot — no account needed.'}
        </p>

        {loading ? (
          <div className={styles.shareLoadingRow}>
            <span className={styles.shareSpinner} aria-hidden="true" />
            <span>Checking share status…</span>
          </div>
        ) : !share ? (
          <>
            {error && (
              <div className={styles.shareError} role="alert">
                {error}
              </div>
            )}
            <div className={styles.shareEmptyState}>
              <div className={styles.shareEmptyIcon} aria-hidden="true">
                <LinkIcon />
              </div>
              <p className={styles.shareEmptyText}>This conversation isn't shared yet.</p>
              <button
                type="button"
                className={`${styles.shareActionBtn} ${styles.sharePrimaryBtn}`}
                onClick={handleCreate}
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <span className={styles.shareSpinner} aria-hidden="true" />
                    <span>Creating link…</span>
                  </>
                ) : (
                  <>
                    <LinkIcon />
                    <span>Create share link</span>
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            {error && (
              <div className={styles.shareError} role="alert">
                {error}
              </div>
            )}

            <div className={styles.shareModalPreview}>
              <div className={styles.sharePreviewIcon}>
                <SparkleIcon />
              </div>
              <div className={styles.sharePreviewInfo}>
                <span className={styles.sharePreviewTitle} title={previewTitle}>
                  {previewTitle}
                </span>
                <span className={styles.sharePreviewUrl} title={shareUrl ?? ''}>
                  {previewUrl}
                </span>
                <span className={styles.shareSnapshotMeta}>
                  {snapshotRelative ? `Snapshot ${snapshotRelative}` : 'Snapshot ready'}
                  {viewCount > 0 && (
                    <>
                      <span className={styles.shareMetaDot} aria-hidden="true">
                        ·
                      </span>
                      {viewCount === 1 ? '1 view' : `${viewCount.toLocaleString()} views`}
                    </>
                  )}
                </span>
              </div>
            </div>

            {hasNewMessagesSinceShare && !rotateConfirm && (
              <div className={styles.shareStaleBanner} role="status">
                <div className={styles.shareStaleText}>
                  <strong>New messages since this snapshot.</strong>
                  <span>Update the link to include them, or leave it as-is.</span>
                </div>
                <button
                  type="button"
                  className={`${styles.shareActionBtn} ${styles.shareSecondaryBtn} ${styles.shareStaleAction}`}
                  onClick={handleUpdate}
                  disabled={busy}
                >
                  {isUpdating ? (
                    <>
                      <span className={styles.shareSpinner} aria-hidden="true" />
                      <span>Updating…</span>
                    </>
                  ) : (
                    <>
                      <RefreshIcon />
                      <span>Update snapshot</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {rotateConfirm ? (
              <div className={styles.shareRotateConfirm} role="alertdialog">
                <div className={styles.shareRotateText}>
                  <strong>Generate a new link?</strong>
                  <span>The current link will stop working for everyone who has it.</span>
                </div>
                <div className={styles.shareModalActionsGroup}>
                  <button
                    type="button"
                    className={`${styles.shareActionBtn} ${styles.shareSecondaryBtn}`}
                    onClick={() => setRotateConfirm(false)}
                    disabled={isRotating}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={`${styles.shareActionBtn} ${styles.shareDangerBtn}`}
                    onClick={handleRotate}
                    disabled={isRotating}
                  >
                    {isRotating ? (
                      <>
                        <span className={styles.shareSpinner} aria-hidden="true" />
                        <span>Rotating…</span>
                      </>
                    ) : (
                      <>
                        <RefreshIcon />
                        <span>Rotate link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.shareModalActions}>
                <button
                  type="button"
                  className={`${styles.shareActionBtn} ${styles.shareDangerBtn}`}
                  onClick={handleRevoke}
                  disabled={busy}
                >
                  {isRevoking ? (
                    <>
                      <span className={styles.shareSpinner} aria-hidden="true" />
                      <span>Unsharing…</span>
                    </>
                  ) : (
                    <>
                      <TrashIcon />
                      <span>Unshare</span>
                    </>
                  )}
                </button>

                <div className={styles.shareModalActionsGroup}>
                  <button
                    type="button"
                    className={`${styles.shareActionBtn} ${styles.shareSecondaryBtn}`}
                    onClick={() => setRotateConfirm(true)}
                    disabled={busy}
                    title="Invalidate the current link and generate a new one"
                  >
                    <RefreshIcon />
                    <span>Rotate link</span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.shareActionBtn} ${styles.shareCopyBtn} ${
                      linkCopied ? styles.copied : ''
                    }`}
                    onClick={handleCopyLink}
                    disabled={!shareUrl || busy}
                  >
                    {linkCopied ? (
                      <>
                        <CheckIcon />
                        <span>Link copied</span>
                      </>
                    ) : (
                      <>
                        <LinkIcon />
                        <span>Copy link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
