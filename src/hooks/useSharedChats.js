import { useState, useEffect, useCallback, useRef } from 'react';
import { listMyShares, revokeConversationShare } from '../services/api';

/**
 * Manages the authenticated user's active share links — the single source of
 * truth for the dedicated /shared page, the Conversations "Shared" tab, and
 * the Settings > Data & privacy stub.
 *
 * `enabled` lets callers defer the network request until the surface that
 * needs the data is actually visible (e.g. only fetch when the Conversations
 * "Shared" tab is opened).
 */
export default function useSharedChats({ enabled = true } = {}) {
  const [shares, setShares] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const load = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const data = await listMyShares();
      if (controller.signal.aborted) return;
      setShares(Array.isArray(data?.shares) ? data.shares : []);
    } catch (err) {
      if (controller.signal.aborted) return;
      setShares((current) => current ?? []);
      setError(err?.userMessage || err?.message || 'Failed to load shared chats');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    load();
    return () => abortRef.current?.abort();
  }, [enabled, load]);

  const unshare = useCallback(async (conversationId) => {
    if (!conversationId) {
      return { ok: false, error: 'Missing conversation id' };
    }
    let snapshot;
    setShares((current) => {
      snapshot = current;
      return (current || []).filter((s) => s.conversationId !== conversationId);
    });
    try {
      await revokeConversationShare(conversationId);
      return { ok: true };
    } catch (err) {
      setShares(snapshot);
      return {
        ok: false,
        error: err?.userMessage || err?.message || 'Could not unshare conversation',
      };
    }
  }, []);

  const unshareMany = useCallback(async (conversationIds) => {
    const ids = (conversationIds || []).filter(Boolean);
    if (ids.length === 0) return { ok: true, failures: [] };
    let snapshot;
    const idSet = new Set(ids);
    setShares((current) => {
      snapshot = current;
      return (current || []).filter((s) => !idSet.has(s.conversationId));
    });
    const failures = [];
    await Promise.all(
      ids.map((id) =>
        revokeConversationShare(id).catch(() => {
          failures.push(id);
        })
      )
    );
    if (failures.length > 0) {
      const failedSet = new Set(failures);
      const restored = (snapshot || []).filter((s) => failedSet.has(s.conversationId));
      setShares((current) => {
        const seen = new Set((current || []).map((s) => s.shareToken));
        const merged = [...(current || [])];
        for (const item of restored) {
          if (!seen.has(item.shareToken)) merged.push(item);
        }
        return merged;
      });
    }
    return { ok: failures.length === 0, failures };
  }, []);

  return {
    shares,
    loading,
    error,
    refetch: load,
    unshare,
    unshareMany,
  };
}
