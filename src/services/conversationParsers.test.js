import { describe, it, expect } from 'vitest';
import { parseConversationsFile } from './conversationParsers';

// Helper to create a mock File
function createJsonFile(data, name = 'export.json') {
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  return new File([blob], name, { type: 'application/json' });
}

describe('conversationParsers', () => {
  describe('Claude format', () => {
    it('parses Claude conversations', async () => {
      const data = [
        {
          uuid: 'conv-1',
          name: 'Test Conversation',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T01:00:00Z',
          chat_messages: [
            {
              uuid: 'msg-1',
              sender: 'human',
              content: [{ type: 'text', text: 'Hello' }],
              created_at: '2024-01-01T00:00:00Z',
            },
            {
              uuid: 'msg-2',
              sender: 'assistant',
              text: 'Hi there!',
              created_at: '2024-01-01T00:01:00Z',
            },
          ],
        },
      ];

      const file = createJsonFile(data);
      const result = await parseConversationsFile(file, 'claude', 'Claude');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Conversation');
      expect(result[0].provider).toBe('claude');
      expect(result[0].providerName).toBe('Claude');
      expect(result[0].messages).toHaveLength(2);
      expect(result[0].messages[0].role).toBe('user');
      expect(result[0].messages[0].content).toBe('Hello');
      expect(result[0].messages[1].role).toBe('assistant');
      expect(result[0].messages[1].content).toBe('Hi there!');
    });

    it('filters out empty messages', async () => {
      const data = [
        {
          uuid: 'conv-1',
          name: 'Test',
          chat_messages: [
            { uuid: 'msg-1', sender: 'human', content: [{ type: 'text', text: '' }] },
            { uuid: 'msg-2', sender: 'assistant', text: 'Response' },
          ],
        },
      ];

      const file = createJsonFile(data);
      const result = await parseConversationsFile(file, 'claude', 'Claude');

      expect(result[0].messages).toHaveLength(1);
      expect(result[0].messages[0].content).toBe('Response');
    });

    it('skips conversations with no valid messages', async () => {
      const data = [
        {
          uuid: 'conv-1',
          name: 'Empty',
          chat_messages: [
            { uuid: 'msg-1', sender: 'system', text: 'System message' },
          ],
        },
        {
          uuid: 'conv-2',
          name: 'Valid',
          chat_messages: [
            { uuid: 'msg-2', sender: 'human', text: 'Hello' },
          ],
        },
      ];

      const file = createJsonFile(data);
      const result = await parseConversationsFile(file, 'claude', 'Claude');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Valid');
    });

    it('handles conversations wrapped in an object', async () => {
      const data = {
        conversations: [
          {
            uuid: 'conv-1',
            name: 'Wrapped',
            chat_messages: [{ uuid: 'msg-1', sender: 'human', text: 'Test' }],
          },
        ],
      };

      const file = createJsonFile(data);
      const result = await parseConversationsFile(file, 'claude', 'Claude');

      expect(result).toHaveLength(1);
    });
  });

  describe('ChatGPT format', () => {
    it('parses ChatGPT conversations', async () => {
      const data = [
        {
          id: 'chatgpt-conv-1',
          title: 'ChatGPT Chat',
          create_time: 1704067200,
          update_time: 1704070800,
          mapping: {
            node1: {
              message: {
                id: 'msg-1',
                author: { role: 'user' },
                content: { parts: ['Hello from ChatGPT'] },
                create_time: 1704067200,
              },
            },
            node2: {
              message: {
                id: 'msg-2',
                author: { role: 'assistant' },
                content: { parts: ['Hello!'] },
                create_time: 1704067260,
              },
            },
          },
        },
      ];

      const file = createJsonFile(data);
      const result = await parseConversationsFile(file, 'chatgpt', 'ChatGPT');

      expect(result).toHaveLength(1);
      expect(result[0].provider).toBe('chatgpt');
      expect(result[0].title).toBe('ChatGPT Chat');
      expect(result[0].messages.length).toBeGreaterThanOrEqual(1);
    });

    it('ignores system messages in ChatGPT format', async () => {
      const data = [
        {
          id: 'conv-1',
          title: 'Test',
          mapping: {
            node1: {
              message: {
                id: 'msg-1',
                author: { role: 'system' },
                content: { parts: ['System prompt'] },
              },
            },
            node2: {
              message: {
                id: 'msg-2',
                author: { role: 'user' },
                content: { parts: ['User message'] },
              },
            },
          },
        },
      ];

      const file = createJsonFile(data);
      const result = await parseConversationsFile(file, 'chatgpt', 'ChatGPT');

      expect(result[0].messages).toHaveLength(1);
      expect(result[0].messages[0].role).toBe('user');
    });
  });

  describe('Generic format', () => {
    it('parses generic conversations', async () => {
      const data = [
        {
          id: 'gen-1',
          title: 'Generic Chat',
          messages: [
            { id: 'msg-1', role: 'user', content: 'Hello' },
            { id: 'msg-2', role: 'assistant', content: 'Hi' },
          ],
        },
      ];

      const file = createJsonFile(data);
      const result = await parseConversationsFile(file, 'gemini', 'Gemini');

      expect(result).toHaveLength(1);
      expect(result[0].provider).toBe('gemini');
      expect(result[0].providerName).toBe('Gemini');
      expect(result[0].messages).toHaveLength(2);
    });

    it('handles sender field mapped to bot as assistant', async () => {
      const data = [
        {
          id: 'gen-1',
          title: 'Bot Chat',
          messages: [
            { id: 'msg-1', sender: 'bot', content: 'I am a bot' },
          ],
        },
      ];

      const file = createJsonFile(data);
      const result = await parseConversationsFile(file, 'other', 'Other');

      expect(result[0].messages[0].role).toBe('assistant');
    });

    it('uses text or message fields as fallback content', async () => {
      const data = [
        {
          id: 'gen-1',
          title: 'Fallback',
          messages: [
            { id: 'msg-1', role: 'user', text: 'Via text field' },
            { id: 'msg-2', role: 'assistant', message: 'Via message field' },
          ],
        },
      ];

      const file = createJsonFile(data);
      const result = await parseConversationsFile(file, 'other', 'Other');

      expect(result[0].messages[0].content).toBe('Via text field');
      expect(result[0].messages[1].content).toBe('Via message field');
    });
  });

  describe('Error handling', () => {
    it('rejects with error for invalid JSON', async () => {
      const file = new File(['not json'], 'bad.json', { type: 'application/json' });

      await expect(parseConversationsFile(file, 'claude', 'Claude')).rejects.toThrow(
        /valid JSON/
      );
    });

    it('rejects when no conversations found', async () => {
      const file = createJsonFile([]);

      await expect(parseConversationsFile(file, 'claude', 'Claude')).rejects.toThrow(
        /No conversations found/
      );
    });

    it('rejects when file has conversations with no valid messages', async () => {
      const data = [
        {
          uuid: 'conv-1',
          name: 'Empty',
          chat_messages: [],
        },
      ];

      const file = createJsonFile(data);

      await expect(parseConversationsFile(file, 'claude', 'Claude')).rejects.toThrow(
        /No conversations found/
      );
    });
  });

  describe('messageCount', () => {
    it('sets correct messageCount on parsed conversations', async () => {
      const data = [
        {
          uuid: 'conv-1',
          name: 'Count Test',
          chat_messages: [
            { uuid: 'msg-1', sender: 'human', text: 'One' },
            { uuid: 'msg-2', sender: 'assistant', text: 'Two' },
            { uuid: 'msg-3', sender: 'human', text: 'Three' },
          ],
        },
      ];

      const file = createJsonFile(data);
      const result = await parseConversationsFile(file, 'claude', 'Claude');

      expect(result[0].messageCount).toBe(3);
    });
  });

  describe('externalId and timestamps', () => {
    it('preserves externalId from source', async () => {
      const data = [
        {
          uuid: 'unique-ext-id',
          name: 'ID Test',
          chat_messages: [{ sender: 'human', text: 'Test' }],
        },
      ];

      const file = createJsonFile(data);
      const result = await parseConversationsFile(file, 'claude', 'Claude');

      expect(result[0].externalId).toBe('unique-ext-id');
    });

    it('uses default title when none provided', async () => {
      const data = [
        {
          chat_messages: [{ sender: 'human', text: 'Test' }],
        },
      ];

      const file = createJsonFile(data);
      const result = await parseConversationsFile(file, 'claude', 'Claude');

      expect(result[0].title).toBe('Untitled Conversation');
    });
  });
});
