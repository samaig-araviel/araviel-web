/**
 * Chat-related type definitions
 */

export interface Attachment {
  id: string;
  name: string;
  size: string;
  type: string;
  url?: string;
}

export interface Message {
  id: string;
  type: 'query' | 'response';
  content: string;
  model?: ModelType;
  attachments?: Attachment[];
  timestamp: string;
}

export interface Chat {
  id: string;
  title: string;
  projectId: string | null;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export type ModelType =
  | 'Auto'
  | 'Claude'
  | 'ChatGPT'
  | 'Gemini'
  | 'Perplexity';

export interface ModelOption {
  id: ModelType;
  name: string;
  fullName: string;
  description: string;
  badge?: string;
  isPrimary?: boolean;
}

export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: 'Auto',
    name: 'Auto',
    fullName: 'Auto',
    description: 'AI Decision Engine routes to optimal model',
    badge: 'ADE',
  },
  {
    id: 'Claude',
    name: 'Claude',
    fullName: 'Claude Sonnet 4.5',
    description: 'Best for reasoning and complex tasks',
  },
  {
    id: 'ChatGPT',
    name: 'ChatGPT',
    fullName: 'ChatGPT 4',
    description: 'Excellent for creative and analytical work',
  },
  {
    id: 'Gemini',
    name: 'Gemini',
    fullName: 'Gemini 2.0 Pro',
    description: 'Great for research and multimodal tasks',
  },
  {
    id: 'Perplexity',
    name: 'Perplexity',
    fullName: 'Perplexity',
    description: 'Optimized for web search and research',
  },
];

export interface FeedbackType {
  type: 'positive' | 'negative';
  option: string | null;
  details: string;
  messageId: string;
  timestamp: string;
}

export interface ChatState {
  chats: Chat[];
  currentChatId: string | null;
  isStreaming: boolean;
  selectedModel: ModelType;
  streamingContent: string;
}
