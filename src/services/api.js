/**
 * Araviel API service layer.
 *
 * Every function here is a thin wrapper around `apiFetch` — the shared
 * request helper handles auth headers, request IDs, structured logging,
 * and mapping non-OK responses onto the typed `ServiceError` hierarchy.
 * Adding a new endpoint is a one-line change.
 */

import { apiFetch, API_BASE } from '../lib/apiClient';
import { getAuthHeaders } from './authHeaders';
import { AuthExpiredError, ServiceError } from '../lib/errors';
import { logger, generateRequestId } from '../lib/logger';

// ─── Conversations ───────────────────────────────────────────────────────────

/**
 * Fetch conversation list.
 * @param {number} limit
 * @param {number} offset
 * @param {object} [params]
 * @param {string} [params.projectId]
 * @returns {Promise<{ conversations: Array, total: number }>}
 */
export function fetchConversations(limit = 20, offset = 0, params = {}) {
  const query = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (params.projectId) query.set('projectId', params.projectId);
  return apiFetch(`/api/conversations?${query}`, { errorContext: 'conversations.list' });
}

/**
 * Fetch messages for a conversation.
 * @param {string} conversationId
 * @param {number} limit
 * @param {number} offset
 * @returns {Promise<{ messages: Array }>}
 */
export function fetchConversationMessages(conversationId, limit = 50, offset = 0) {
  return apiFetch(`/api/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`, {
    errorContext: 'conversations.messages',
  });
}

/**
 * Send a chat message via SSE streaming. Returns the raw Response so the
 * caller can consume the ReadableStream — this is the one endpoint that
 * does not pass through JSON parsing.
 *
 * @param {object} payload
 * @returns {Promise<Response>}
 */
export async function sendMessage(payload) {
  const body = {
    message: payload.message,
    userTier: payload.userTier || 'free',
    modality: payload.modality || 'text',
  };
  if (payload.imageQuality) body.imageQuality = payload.imageQuality;
  if (payload.conversationId) body.conversationId = payload.conversationId;
  if (payload.subConversationId) body.subConversationId = payload.subConversationId;
  if (payload.selectedModelId) body.selectedModelId = payload.selectedModelId;
  if (payload.webSearch === true) body.webSearch = true;
  if (payload.webSearch === false) body.webSearch = false;
  if (payload.userLocation) body.userLocation = payload.userLocation;
  if (payload.tone) body.tone = payload.tone;
  if (payload.mood) body.mood = payload.mood;
  if (payload.autoStrategy && payload.autoStrategy !== 'default') {
    body.autoStrategy = payload.autoStrategy;
  }
  if (payload.weather) body.weather = payload.weather;
  if (payload.requestFollowUps) body.requestFollowUps = true;
  if (payload.extendedThinking) body.extendedThinking = true;
  if (payload.deepResearch) body.deepResearch = true;
  if (payload.googleThinking) body.googleThinking = true;
  if (payload.conversationHasImages) body.conversationHasImages = true;
  if (payload.importedConversationId) body.importedConversationId = payload.importedConversationId;
  if (payload.projectId) body.projectId = payload.projectId;
  if (payload.images && payload.images.length > 0) body.images = payload.images;

  // Chat uses SSE, so we need the raw Response. We keep the legacy
  // `fetch` path here (rather than `apiFetch` with `parse: false`) so the
  // error mapping can preserve the `AUTH_EXPIRED` code that callers rely on.
  const requestId = generateRequestId();
  const headers = new Headers(await getAuthHeaders());
  headers.set('Content-Type', 'application/json');
  headers.set('X-Request-Id', requestId);

  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    if (res.status === 401) {
      throw new AuthExpiredError({ requestId });
    }
    const err = new ServiceError({
      userMessage:
        'We could not reach the model. Please try again — if this keeps happening, switch models from the selector.',
      technicalMessage: text || `Chat request failed (${res.status})`,
      status: res.status,
      requestId,
    });
    logger.error('Chat request failed', err, { route: 'chat', requestId });
    throw err;
  }

  return res;
}

/**
 * Parse an SSE stream from a fetch Response.
 * @param {Response} response
 * @param {(event: { type: string, data: object }) => void} onEvent
 * @param {AbortSignal} [signal]
 */
export async function consumeSSEStream(response, onEvent, signal) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      if (signal?.aborted) {
        reader.cancel();
        break;
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        try {
          const parsed = JSON.parse(trimmed.slice(6));
          onEvent(parsed);
        } catch {
          // Skip malformed JSON chunks; the stream itself is still valid.
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ─── Sub-conversations ──────────────────────────────────────────────────────

/**
 * Create a sub-conversation.
 * @param {string} conversationId
 * @param {string} messageId
 * @param {string} highlightedText
 */
export function createSubConversation(conversationId, messageId, highlightedText) {
  return apiFetch(`/api/conversations/${conversationId}/messages/${messageId}/sub-conversations`, {
    method: 'POST',
    json: { highlightedText },
    errorContext: 'sub-conversations.create',
  });
}

/**
 * Fetch sub-conversations for a message.
 */
export function fetchSubConversations(conversationId, messageId) {
  return apiFetch(`/api/conversations/${conversationId}/messages/${messageId}/sub-conversations`, {
    errorContext: 'sub-conversations.list',
  });
}

/**
 * Fetch messages for a sub-conversation.
 */
export function fetchSubConversationMessages(subId, limit = 50, offset = 0) {
  return apiFetch(`/api/sub-conversations/${subId}/messages?limit=${limit}&offset=${offset}`, {
    errorContext: 'sub-conversations.messages',
  });
}

// ─── Health ─────────────────────────────────────────────────────────────────

/** Check API health. */
export function checkHealth() {
  return apiFetch('/api/health', { auth: false, errorContext: 'health' });
}

// ─── Conversation operations ────────────────────────────────────────────────

export function updateConversation(conversationId, updates) {
  return apiFetch(`/api/conversations/${conversationId}`, {
    method: 'PATCH',
    json: updates,
    errorContext: 'conversations.update',
  });
}

export function deleteConversation(conversationId) {
  return apiFetch(`/api/conversations/${conversationId}`, {
    method: 'DELETE',
    errorContext: 'conversations.delete',
  });
}

export function fetchConversation(conversationId) {
  return apiFetch(`/api/conversations/${conversationId}`, {
    errorContext: 'conversations.get',
  });
}

// ─── Conversation actions ───────────────────────────────────────────────────

/**
 * Report a conversation.
 * @param {string} conversationId
 * @param {string} reason
 * @param {string} [details]
 */
export function reportConversation(conversationId, reason, details) {
  return apiFetch(`/api/conversations/${conversationId}/report`, {
    method: 'POST',
    json: { reason, details: details || undefined },
    errorContext: 'conversations.report',
  });
}

/**
 * Submit feedback (like/dislike) for a message.
 * @param {string} conversationId
 * @param {string} messageId
 * @param {"like" | "dislike" | null} feedback
 * @param {string[]} [details]
 * @param {string} [comment]
 */
export function submitMessageFeedback(conversationId, messageId, feedback, details, comment) {
  const body = { feedback };
  if (details) body.details = details;
  if (comment) body.comment = comment;
  return apiFetch(`/api/conversations/${conversationId}/messages/${messageId}/feedback`, {
    method: 'POST',
    json: body,
    errorContext: 'conversations.feedback',
  });
}

// ─── Conversation sharing ───────────────────────────────────────────────────

/**
 * @typedef {Object} Share
 * @property {string} shareToken
 * @property {string} conversationId
 * @property {string} snapshotAt
 * @property {string} createdAt
 * @property {string|null} titleSnapshot
 * @property {number} viewCount
 */

/** Fetch the active share for a conversation (owner-only). */
export function fetchConversationShare(conversationId) {
  return apiFetch(`/api/conversations/${conversationId}/share`, {
    errorContext: 'share.get',
  });
}

/** Create a share link. If one already exists, the snapshot is refreshed. */
export function createConversationShare(conversationId) {
  return apiFetch(`/api/conversations/${conversationId}/share`, {
    method: 'POST',
    errorContext: 'share.create',
  });
}

/** Refresh the snapshot on an existing share. */
export function updateConversationShare(conversationId) {
  return apiFetch(`/api/conversations/${conversationId}/share`, {
    method: 'PATCH',
    errorContext: 'share.update',
  });
}

/** Revoke the active share for a conversation. */
export function revokeConversationShare(conversationId) {
  return apiFetch(`/api/conversations/${conversationId}/share`, {
    method: 'DELETE',
    errorContext: 'share.revoke',
  });
}

/**
 * Rotate the share link: revoke + create a new one so the previous URL is
 * invalidated.
 */
export async function rotateConversationShare(conversationId) {
  await revokeConversationShare(conversationId);
  return createConversationShare(conversationId);
}

/** List all active shares for the authenticated user. */
export function listMyShares() {
  return apiFetch('/api/shares', { errorContext: 'shares.list' });
}

/**
 * Fetch a public shared conversation by token. Does NOT send auth headers.
 * Preserves the `SHARE_NOT_FOUND` code so the SharedConversationView can
 * render its dedicated empty state.
 * @param {string} shareToken
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function fetchSharedConversation(shareToken, options = {}) {
  try {
    return await apiFetch(`/api/shares/${shareToken}`, {
      auth: false,
      signal: options.signal,
      errorContext: 'share.public',
    });
  } catch (err) {
    if (err instanceof ServiceError && err.status === 404) {
      const notFound = new ServiceError({
        userMessage: 'This share link is no longer active.',
        technicalMessage: 'Shared conversation not found',
        status: 404,
        code: 'SHARE_NOT_FOUND',
        requestId: err.requestId,
      });
      throw notFound;
    }
    throw err;
  }
}

// ─── Sub-conversation actions ───────────────────────────────────────────────

export function deleteSubConversation(subId) {
  return apiFetch(`/api/sub-conversations/${subId}`, {
    method: 'DELETE',
    errorContext: 'sub-conversations.delete',
  });
}

export function updateSubConversation(subId, updates) {
  return apiFetch(`/api/sub-conversations/${subId}`, {
    method: 'PATCH',
    json: updates,
    errorContext: 'sub-conversations.update',
  });
}

export function reportSubConversation(subId, reason, details) {
  return apiFetch(`/api/sub-conversations/${subId}/report`, {
    method: 'POST',
    json: { reason, details: details || undefined },
    errorContext: 'sub-conversations.report',
  });
}

// ─── Imported conversations ─────────────────────────────────────────────────

export function importConversations(conversations) {
  return apiFetch('/api/imported-conversations', {
    method: 'POST',
    json: { conversations },
    errorContext: 'imported.import',
  });
}

export function fetchImportedConversations(params = {}) {
  const query = new URLSearchParams();
  if (params.provider) query.set('provider', params.provider);
  if (params.archived !== undefined) query.set('archived', String(params.archived));
  if (params.starred !== undefined) query.set('starred', String(params.starred));
  const qs = query.toString();
  return apiFetch(`/api/imported-conversations${qs ? `?${qs}` : ''}`, {
    errorContext: 'imported.list',
  });
}

export function fetchImportedConversationMessages(conversationId) {
  return apiFetch(`/api/imported-conversations/${conversationId}/messages`, {
    errorContext: 'imported.messages',
  });
}

export function updateImportedConversation(conversationId, updates) {
  return apiFetch(`/api/imported-conversations/${conversationId}`, {
    method: 'PATCH',
    json: updates,
    errorContext: 'imported.update',
  });
}

export function bulkUpdateImportedConversations(ids, updates) {
  return apiFetch('/api/imported-conversations/bulk', {
    method: 'PATCH',
    json: { ids, updates },
    errorContext: 'imported.bulkUpdate',
  });
}

export function deleteImportedConversation(conversationId) {
  return apiFetch(`/api/imported-conversations/${conversationId}`, {
    method: 'DELETE',
    errorContext: 'imported.delete',
  });
}

export function bulkDeleteImportedConversations(ids) {
  return apiFetch('/api/imported-conversations/bulk', {
    method: 'DELETE',
    json: { ids },
    errorContext: 'imported.bulkDelete',
  });
}

// ─── Projects ───────────────────────────────────────────────────────────────

export function fetchProjects() {
  return apiFetch('/api/projects', { errorContext: 'projects.list' });
}

export function createProject(project) {
  return apiFetch('/api/projects', {
    method: 'POST',
    json: project,
    errorContext: 'projects.create',
  });
}

// ─── Search ─────────────────────────────────────────────────────────────────

export function searchConversations(query, limit = 20) {
  const params = new URLSearchParams({ search: query, limit: String(limit) });
  return apiFetch(`/api/conversations?${params}`, {
    errorContext: 'search.conversations',
  });
}

export function searchProjects(query) {
  const params = new URLSearchParams({ search: query });
  return apiFetch(`/api/projects?${params}`, { errorContext: 'search.projects' });
}

export function searchImages(query, limit = 12) {
  const params = new URLSearchParams({ search: query, limit: String(limit) });
  return apiFetch(`/api/images?${params}`, { errorContext: 'search.images' });
}

export function updateProject(projectId, updates) {
  return apiFetch(`/api/projects/${projectId}`, {
    method: 'PATCH',
    json: updates,
    errorContext: 'projects.update',
  });
}

export function deleteProject(projectId, options = {}) {
  const query = new URLSearchParams();
  if (options.deleteConversations) query.set('deleteConversations', 'true');
  const qs = query.toString();
  return apiFetch(`/api/projects/${projectId}${qs ? `?${qs}` : ''}`, {
    method: 'DELETE',
    errorContext: 'projects.delete',
  });
}
