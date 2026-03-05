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
 * @returns {Promise<{ conversations: Array, total: number }>}
 */
export async function fetchConversations(limit = 20, offset = 0) {
  const res = await fetch(`${API_BASE}/api/conversations?limit=${limit}&offset=${offset}`);
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
