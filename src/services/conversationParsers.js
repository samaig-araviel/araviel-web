// ---------------------------------------------------------------------------
// Conversation Parsers
// Pure functions to transform provider-specific export formats into a
// normalised shape the import API expects.
//
// Normalised message:  { id, role, content, createdAt }
// Normalised conversation: { externalId, title, provider, providerName,
//                            messages, messageCount, createdAt, updatedAt }
// ---------------------------------------------------------------------------

// ── Helpers ─────────────────────────────────────────────────────────────────

function uid() {
  return crypto.randomUUID();
}

function toISO(value, fallback) {
  if (!value) return fallback || new Date().toISOString();
  if (typeof value === 'number') return new Date(value * 1000).toISOString();
  return value;
}

function coerceArray(data, ...keys) {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}

function nonEmpty(text) {
  return typeof text === 'string' && text.trim().length > 0;
}

// ── Claude ──────────────────────────────────────────────────────────────────

function extractClaudeMessageContent(msg) {
  // Prefer structured content blocks — only extract type:"text"
  if (Array.isArray(msg.content)) {
    const parts = msg.content
      .filter((b) => b.type === 'text' && nonEmpty(b.text))
      .map((b) => b.text);
    if (parts.length > 0) return parts.join('\n\n');
  }
  // Fallback to top-level text field
  return msg.text || '';
}

function parseClaudeMessages(chatMessages) {
  if (!Array.isArray(chatMessages)) return [];

  return chatMessages
    .filter((msg) => msg.sender === 'human' || msg.sender === 'assistant')
    .map((msg) => ({
      id: msg.uuid || uid(),
      role: msg.sender === 'human' ? 'user' : 'assistant',
      content: extractClaudeMessageContent(msg),
      createdAt: msg.created_at || new Date().toISOString(),
    }))
    .filter((m) => nonEmpty(m.content));
}

export function parseClaude(data) {
  const items = coerceArray(data, 'conversations');

  return items
    .map((conv) => {
      const messages = parseClaudeMessages(conv.chat_messages);
      if (messages.length === 0) return null;

      return {
        externalId: conv.uuid || conv.id || null,
        title: conv.name || conv.title || 'Untitled Conversation',
        provider: 'claude',
        providerName: 'Claude',
        messages,
        messageCount: messages.length,
        createdAt: toISO(conv.created_at),
        updatedAt: toISO(conv.updated_at),
      };
    })
    .filter(Boolean);
}

// ── ChatGPT ─────────────────────────────────────────────────────────────────

function parseChatGPTMessages(mapping) {
  if (!mapping || typeof mapping !== 'object') return [];

  const messages = [];
  for (const node of Object.values(mapping)) {
    const msg = node.message;
    if (!msg?.content?.parts) continue;

    const content = msg.content.parts.filter((p) => typeof p === 'string').join('\n');
    if (!nonEmpty(content)) continue;

    const authorRole = msg.author?.role;
    if (authorRole !== 'user' && authorRole !== 'assistant') continue;

    messages.push({
      id: msg.id || uid(),
      role: authorRole,
      content,
      createdAt: toISO(msg.create_time),
    });
  }
  return messages;
}

export function parseChatGPT(data) {
  const items = coerceArray(data, 'conversations');

  return items
    .map((conv) => {
      const messages = parseChatGPTMessages(conv.mapping);
      if (messages.length === 0) return null;

      return {
        externalId: conv.id || null,
        title: conv.title || 'Untitled Conversation',
        provider: 'chatgpt',
        providerName: 'ChatGPT',
        messages,
        messageCount: messages.length,
        createdAt: toISO(conv.create_time),
        updatedAt: toISO(conv.update_time),
      };
    })
    .filter(Boolean);
}

// ── Generic (Gemini, Perplexity, Grok, custom) ─────────────────────────────

function parseGenericMessages(rawMessages) {
  if (!Array.isArray(rawMessages)) return [];

  return rawMessages
    .map((msg) => {
      const role =
        msg.role === 'assistant' || msg.sender === 'assistant' || msg.sender === 'bot'
          ? 'assistant'
          : 'user';
      const content = msg.content || msg.text || msg.message || '';

      return {
        id: msg.id || msg.uuid || uid(),
        role,
        content,
        createdAt: toISO(msg.created_at || msg.createdAt || msg.timestamp),
      };
    })
    .filter((m) => nonEmpty(m.content));
}

export function parseGeneric(data, providerId, providerName) {
  const items = coerceArray(data, 'conversations', 'chats');

  return items
    .map((conv) => {
      const rawMsgs = conv.messages || conv.chat_messages || conv.conversation || [];
      const messages = parseGenericMessages(rawMsgs);
      if (messages.length === 0) return null;

      return {
        externalId: conv.id || conv.uuid || null,
        title: conv.title || conv.name || conv.topic || 'Untitled Conversation',
        provider: providerId,
        providerName,
        messages,
        messageCount: messages.length,
        createdAt: toISO(conv.created_at || conv.createdAt || conv.create_time),
        updatedAt: toISO(conv.updated_at || conv.updatedAt || conv.update_time),
      };
    })
    .filter(Boolean);
}

// ── Orchestrator ────────────────────────────────────────────────────────────

const PARSERS = {
  claude: (data) => parseClaude(data),
  chatgpt: (data) => parseChatGPT(data),
};

/**
 * Read a File, parse JSON, and return normalised conversations.
 *
 * @param {File} file
 * @param {string} providerId
 * @param {string} providerName
 * @returns {Promise<Array>} Normalised conversation objects
 */
export function parseConversationsFile(file, providerId, providerName) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      let data;
      try {
        data = JSON.parse(e.target.result);
      } catch {
        return reject(new Error("Unable to read this file. Please make sure it's a valid JSON export."));
      }

      try {
        const parser = PARSERS[providerId] || ((d) => parseGeneric(d, providerId, providerName));
        const conversations = parser(data);

        if (conversations.length === 0) {
          return reject(
            new Error('No conversations found in this file. Please check you selected the correct file.')
          );
        }

        resolve(conversations);
      } catch {
        reject(new Error('Failed to parse conversations. The file format may not be supported.'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read the file. Please try again.'));
    reader.readAsText(file);
  });
}
