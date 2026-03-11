// Araviel API service layer
// In development, Vite proxies /api/* to the backend (avoids CORS).
// In production, use the env var or the production API URL directly.
const API_BASE =
  import.meta.env.VITE_ARAVIEL_API_BASE ||
  (import.meta.env.DEV ? '' : 'https://araviel-api.vercel.app');

/**
 * Fetch conversation list.
 * @param {number} limit
 * @param {number} offset
 * @param {object} [params]
 * @param {string} [params.projectId] - Filter by project ID
 * @returns {Promise<{ conversations: Array, total: number }>}
 */
export async function fetchConversations(limit = 20, offset = 0, params = {}) {
  const query = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (params.projectId) query.set('projectId', params.projectId);
  const res = await fetch(`${API_BASE}/api/conversations?${query}`);
  if (!res.ok) throw new Error(`Failed to fetch conversations: ${res.status}`);
  return res.json();
}

/**
 * Fetch messages for a conversation.
 * @param {string} conversationId
 * @param {number} limit
 * @param {number} offset
 * @returns {Promise<{ messages: Array }>}
 */
export async function fetchConversationMessages(conversationId, limit = 50, offset = 0) {
  const res = await fetch(
    `${API_BASE}/api/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`
  );
  if (!res.ok) throw new Error(`Failed to fetch messages: ${res.status}`);
  return res.json();
}

/**
 * Send a chat message via SSE streaming.
 * Returns the raw Response object so the caller can consume the ReadableStream.
 *
 * @param {object} payload
 * @param {string} payload.message
 * @param {string} [payload.conversationId]
 * @param {string} [payload.subConversationId]
 * @param {string} [payload.selectedModelId]
 * @param {boolean} [payload.webSearch]
 * @returns {Promise<Response>}
 */
export async function sendMessage(payload) {
  const body = {
    message: payload.message,
    userTier: 'free',
    modality: payload.modality || 'text',
  };
  if (payload.conversationId) body.conversationId = payload.conversationId;
  if (payload.subConversationId) body.subConversationId = payload.subConversationId;
  if (payload.selectedModelId) body.selectedModelId = payload.selectedModelId;
  if (payload.webSearch === true) body.webSearch = true;
  if (payload.webSearch === false) body.webSearch = false;
  if (payload.userLocation) body.userLocation = payload.userLocation;
  if (payload.tone) body.tone = payload.tone;
  if (payload.mood) body.mood = payload.mood;
  if (payload.autoStrategy && payload.autoStrategy !== 'default')
    body.autoStrategy = payload.autoStrategy;
  if (payload.weather) body.weather = payload.weather;
  if (payload.requestFollowUps) body.requestFollowUps = true;
  if (payload.extendedThinking) body.extendedThinking = true;
  if (payload.deepResearch) body.deepResearch = true;
  if (payload.googleThinking) body.googleThinking = true;
  if (payload.conversationHasImages) body.conversationHasImages = true;
  if (payload.importedConversationId) body.importedConversationId = payload.importedConversationId;
  if (payload.projectId) body.projectId = payload.projectId;

  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Chat request failed (${res.status}): ${text}`);
  }

  return res;
}

/**
 * Parse an SSE stream from a fetch Response.
 * Calls the handler for each parsed event { type, data }.
 *
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
          // Skip malformed JSON
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Create a sub-conversation.
 * @param {string} conversationId
 * @param {string} messageId
 * @param {string} highlightedText
 * @returns {Promise<object>}
 */
export async function createSubConversation(conversationId, messageId, highlightedText) {
  const res = await fetch(
    `${API_BASE}/api/conversations/${conversationId}/messages/${messageId}/sub-conversations`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ highlightedText }),
    }
  );
  if (!res.ok) throw new Error(`Failed to create sub-conversation: ${res.status}`);
  return res.json();
}

/**
 * Fetch sub-conversations for a message.
 * @param {string} conversationId
 * @param {string} messageId
 * @returns {Promise<{ subConversations: Array }>}
 */
export async function fetchSubConversations(conversationId, messageId) {
  const res = await fetch(
    `${API_BASE}/api/conversations/${conversationId}/messages/${messageId}/sub-conversations`
  );
  if (!res.ok) throw new Error(`Failed to fetch sub-conversations: ${res.status}`);
  return res.json();
}

/**
 * Fetch messages for a sub-conversation.
 * @param {string} subId
 * @param {number} limit
 * @param {number} offset
 * @returns {Promise<{ subConversation: object, messages: Array }>}
 */
export async function fetchSubConversationMessages(subId, limit = 50, offset = 0) {
  const res = await fetch(
    `${API_BASE}/api/sub-conversations/${subId}/messages?limit=${limit}&offset=${offset}`
  );
  if (!res.ok) throw new Error(`Failed to fetch sub-conversation messages: ${res.status}`);
  return res.json();
}

/**
 * Check API health.
 * @returns {Promise<{ status: string, services: object }>}
 */
export async function checkHealth() {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json();
}

/**
 * Update a conversation (title, project assignment, etc.).
 * @param {string} conversationId
 * @param {object} updates - { title?, project_id? }
 * @returns {Promise<object>}
 */
export async function updateConversation(conversationId, updates) {
  const res = await fetch(`${API_BASE}/api/conversations/${conversationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`Failed to update conversation: ${res.status}`);
  return res.json();
}

/**
 * Delete a conversation and all its messages.
 * @param {string} conversationId
 * @returns {Promise<{ success: boolean }>}
 */
export async function deleteConversation(conversationId) {
  const res = await fetch(`${API_BASE}/api/conversations/${conversationId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete conversation: ${res.status}`);
  return res.json();
}

/**
 * Fetch a single conversation's metadata.
 * @param {string} conversationId
 * @returns {Promise<object>}
 */
export async function fetchConversation(conversationId) {
  const res = await fetch(`${API_BASE}/api/conversations/${conversationId}`);
  if (!res.ok) throw new Error(`Failed to fetch conversation: ${res.status}`);
  return res.json();
}

// ─── Imported Conversations ─────────────────────────────────────────────────

/**
 * Bulk import conversations from external providers.
 * @param {Array<object>} conversations
 * @returns {Promise<{ imported: number, skipped: number, conversations: Array }>}
 */
export async function importConversations(conversations) {
  const res = await fetch(`${API_BASE}/api/imported-conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversations }),
  });
  if (!res.ok) throw new Error(`Failed to import conversations: ${res.status}`);
  return res.json();
}

/**
 * Fetch imported conversations (metadata only, no messages).
 * @param {object} [params]
 * @param {string} [params.provider]
 * @param {boolean} [params.archived]
 * @param {boolean} [params.starred]
 * @returns {Promise<{ conversations: Array }>}
 */
export async function fetchImportedConversations(params = {}) {
  const query = new URLSearchParams();
  if (params.provider) query.set('provider', params.provider);
  if (params.archived !== undefined) query.set('archived', String(params.archived));
  if (params.starred !== undefined) query.set('starred', String(params.starred));
  const qs = query.toString();
  const res = await fetch(`${API_BASE}/api/imported-conversations${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error(`Failed to fetch imported conversations: ${res.status}`);
  return res.json();
}

/**
 * Fetch decrypted messages for an imported conversation.
 * @param {string} conversationId
 * @returns {Promise<{ messages: Array }>}
 */
export async function fetchImportedConversationMessages(conversationId) {
  const res = await fetch(`${API_BASE}/api/imported-conversations/${conversationId}/messages`);
  if (!res.ok) throw new Error(`Failed to fetch imported messages: ${res.status}`);
  return res.json();
}

/**
 * Update an imported conversation's metadata.
 * @param {string} conversationId
 * @param {object} updates - { title?, isStarred?, isArchived? }
 * @returns {Promise<object>}
 */
export async function updateImportedConversation(conversationId, updates) {
  const res = await fetch(`${API_BASE}/api/imported-conversations/${conversationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`Failed to update imported conversation: ${res.status}`);
  return res.json();
}

/**
 * Bulk update imported conversations.
 * @param {string[]} ids
 * @param {object} updates - { isStarred?, isArchived? }
 * @returns {Promise<{ updated: number }>}
 */
export async function bulkUpdateImportedConversations(ids, updates) {
  const res = await fetch(`${API_BASE}/api/imported-conversations/bulk`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids, updates }),
  });
  if (!res.ok) throw new Error(`Failed to bulk update imported conversations: ${res.status}`);
  return res.json();
}

/**
 * Soft-delete an imported conversation.
 * @param {string} conversationId
 * @returns {Promise<{ success: boolean }>}
 */
export async function deleteImportedConversation(conversationId) {
  const res = await fetch(`${API_BASE}/api/imported-conversations/${conversationId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete imported conversation: ${res.status}`);
  return res.json();
}

/**
 * Bulk soft-delete imported conversations.
 * @param {string[]} ids
 * @returns {Promise<{ deleted: number }>}
 */
export async function bulkDeleteImportedConversations(ids) {
  const res = await fetch(`${API_BASE}/api/imported-conversations/bulk`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error(`Failed to bulk delete imported conversations: ${res.status}`);
  return res.json();
}

// ─── Projects ───────────────────────────────────────────────────────────────

/**
 * Fetch all projects.
 * @returns {Promise<{ projects: Array }>}
 */
export async function fetchProjects() {
  const res = await fetch(`${API_BASE}/api/projects`);
  if (!res.ok) throw new Error(`Failed to fetch projects: ${res.status}`);
  return res.json();
}

/**
 * Create a new project.
 * @param {object} project - { name, description?, instructions? }
 * @returns {Promise<object>}
 */
export async function createProject(project) {
  const res = await fetch(`${API_BASE}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });
  if (!res.ok) throw new Error(`Failed to create project: ${res.status}`);
  return res.json();
}

/**
 * Update a project.
 * @param {string} projectId
 * @param {object} updates - { name?, description?, instructions?, is_archived?, is_starred? }
 * @returns {Promise<object>}
 */
export async function updateProject(projectId, updates) {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`Failed to update project: ${res.status}`);
  return res.json();
}

/**
 * Delete a project.
 * @param {string} projectId
 * @param {object} [options]
 * @param {boolean} [options.deleteConversations] - Also delete all conversations in this project
 * @returns {Promise<{ success: boolean }>}
 */
export async function deleteProject(projectId, options = {}) {
  const query = new URLSearchParams();
  if (options.deleteConversations) query.set('deleteConversations', 'true');
  const qs = query.toString();
  const res = await fetch(`${API_BASE}/api/projects/${projectId}${qs ? `?${qs}` : ''}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete project: ${res.status}`);
  return res.json();
}
