// Model registry for Araviel — organized by provider
// Data sourced from ADE (Araviel Decision Engine) model registry

// Access tiers
export const ACCESS_TIERS = {
  free: 'free',
  pro: 'pro',
};

export const PROVIDERS = {
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    shortName: 'Anthropic',
    logoChar: 'A',
    accentColor: '#d97706', // warm amber
    accentBg: '#fef3c7',
    accentBgDark: '#332b00',
    accentText: '#92400e',
    accentTextDark: '#fbbf24',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    shortName: 'OpenAI',
    logoChar: 'O',
    accentColor: '#38bdf8', // sky blue
    accentBg: '#e0f2fe',
    accentBgDark: '#0c2436',
    accentText: '#0369a1',
    accentTextDark: '#7dd3fc',
  },
  google: {
    id: 'google',
    name: 'Google',
    shortName: 'Google',
    logoChar: 'G',
    accentColor: '#22c55e', // green
    accentBg: '#dcfce7',
    accentBgDark: '#0a2618',
    accentText: '#15803d',
    accentTextDark: '#86efac',
  },
  perplexity: {
    id: 'perplexity',
    name: 'Perplexity',
    shortName: 'Perplexity',
    logoChar: 'P',
    accentColor: '#a78bfa', // violet
    accentBg: '#ede9fe',
    accentBgDark: '#1e1340',
    accentText: '#6d28d9',
    accentTextDark: '#c4b5fd',
  },
  xai: {
    id: 'xai',
    name: 'xAI',
    shortName: 'xAI',
    logoChar: 'X',
    accentColor: '#f43f5e', // rose
    accentBg: '#ffe4e6',
    accentBgDark: '#3b0d14',
    accentText: '#be123c',
    accentTextDark: '#fb7185',
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral',
    shortName: 'Mistral',
    logoChar: 'M',
    accentColor: '#f97316', // orange
    accentBg: '#fff7ed',
    accentBgDark: '#3b1a06',
    accentText: '#c2410c',
    accentTextDark: '#fdba74',
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    shortName: 'DeepSeek',
    logoChar: 'D',
    accentColor: '#06b6d4', // cyan
    accentBg: '#cffafe',
    accentBgDark: '#0b2a33',
    accentText: '#0e7490',
    accentTextDark: '#67e8f9',
  },
  stability: {
    id: 'stability',
    name: 'Stability AI',
    shortName: 'Stability',
    logoChar: 'S',
    accentColor: '#8b5cf6', // purple
    accentBg: '#f5f3ff',
    accentBgDark: '#1e1040',
    accentText: '#7c3aed',
    accentTextDark: '#a78bfa',
  },
  elevenlabs: {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    shortName: 'ElevenLabs',
    logoChar: 'E',
    accentColor: '#ec4899', // pink
    accentBg: '#fce7f3',
    accentBgDark: '#3b0d24',
    accentText: '#be185d',
    accentTextDark: '#f9a8d4',
  },
};

// Speed tier based on average latency
function getSpeedTier(latencyMs) {
  if (latencyMs <= 500) return 'fast';
  if (latencyMs <= 1500) return 'balanced';
  return 'powerful';
}

// Format token count for display
export function formatTokens(count) {
  if (count >= 1000000) return `${(count / 1000000).toFixed(count % 1000000 === 0 ? 0 : 1)}M`;
  if (count >= 1000) return `${Math.round(count / 1000)}K`;
  return `${count}`;
}

// Format price as $/M tokens
export function formatPricePerM(pricePerK) {
  const perM = pricePerK * 1000;
  if (perM < 0.01) return `$${perM.toFixed(4)}`;
  if (perM < 1) return `$${perM.toFixed(3)}`;
  return `$${perM.toFixed(2)}`;
}

export const MODELS = [
  // ===== ANTHROPIC =====
  {
    id: 'claude-opus-4-6',
    name: 'Claude Opus 4.6',
    provider: 'anthropic',
    tagline: 'Latest flagship with agent teams and adaptive thinking',
    description:
      'Latest flagship model with agent teams, adaptive thinking, and compaction. 1M context window. Released Feb 5, 2026.',
    speedTier: getSpeedTier(2000),
    pricing: { inputPerM: 5.0, outputPerM: 25.0 },
    context: { inputTokens: 200000, outputTokens: 64000 },
    capabilities: {
      vision: true,
      audio: false,
      extendedThinking: true,
      webSearch: false,
      functionCalling: true,
      streaming: true,
    },
    bestFor: ['Complex reasoning', 'Coding', 'Agentic workflows', 'Research & analysis'],
    badge: 'Flagship',
    accessTier: ACCESS_TIERS.pro,
  },
  {
    id: 'claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6',
    provider: 'anthropic',
    tagline: 'Near-Opus performance at a fraction of the cost',
    description:
      'Latest Sonnet with near-Opus performance at 1/5 the cost. New default model. 79.6% SWE-bench. Released Feb 17, 2026.',
    speedTier: getSpeedTier(950),
    pricing: { inputPerM: 3.0, outputPerM: 15.0 },
    context: { inputTokens: 200000, outputTokens: 64000 },
    capabilities: {
      vision: true,
      audio: false,
      extendedThinking: true,
      webSearch: false,
      functionCalling: true,
      streaming: true,
    },
    bestFor: ['Coding', 'Agentic tasks', 'Default model', 'Balanced workloads'],
    badge: 'New Default',
    accessTier: ACCESS_TIERS.pro,
  },
  {
    id: 'claude-opus-4-5-20251101',
    name: 'Claude Opus 4.5',
    provider: 'anthropic',
    tagline: 'Flagship intelligence for the hardest tasks',
    description:
      'Flagship model with state-of-the-art coding (80.9% SWE-bench), reasoning, and agentic capabilities.',
    speedTier: getSpeedTier(2000),
    pricing: { inputPerM: 5.0, outputPerM: 25.0 },
    context: { inputTokens: 200000, outputTokens: 64000 },
    capabilities: {
      vision: true,
      audio: false,
      extendedThinking: true,
      webSearch: false,
      functionCalling: true,
      streaming: true,
    },
    bestFor: ['Complex reasoning', 'Long-form coding', 'Agentic workflows', 'Research & analysis'],
    badge: null,
    accessTier: ACCESS_TIERS.pro,
  },
  {
    id: 'claude-sonnet-4-5-20250929',
    name: 'Claude Sonnet 4.5',
    provider: 'anthropic',
    tagline: 'Best for coding and agentic tasks',
    description:
      'Best coding model with industry-leading agent capabilities. Ideal balance of intelligence, speed, and cost.',
    speedTier: getSpeedTier(1000),
    pricing: { inputPerM: 3.0, outputPerM: 15.0 },
    context: { inputTokens: 200000, outputTokens: 64000 },
    capabilities: {
      vision: true,
      audio: false,
      extendedThinking: true,
      webSearch: false,
      functionCalling: true,
      streaming: true,
    },
    bestFor: ['Coding', 'Agentic tasks', 'Balanced workloads'],
    badge: 'Best for Coding',
    accessTier: ACCESS_TIERS.pro,
  },
  {
    id: 'claude-haiku-4-5-20251001',
    name: 'Claude Haiku 4.5',
    provider: 'anthropic',
    tagline: 'Near-frontier speed for everyday tasks',
    description:
      'Near-frontier fast model optimized for speed and cost. Ideal for high-volume, quick tasks.',
    speedTier: getSpeedTier(400),
    pricing: { inputPerM: 0.8, outputPerM: 4.0 },
    context: { inputTokens: 200000, outputTokens: 64000 },
    capabilities: {
      vision: true,
      audio: false,
      extendedThinking: false,
      webSearch: false,
      functionCalling: true,
      streaming: true,
    },
    bestFor: ['Real-time responses', 'High-volume tasks', 'Cost-efficient work'],
    badge: 'Fastest',
    accessTier: ACCESS_TIERS.free,
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude Haiku 3.5',
    provider: 'anthropic',
    tagline: 'Budget-friendly for simple tasks',
    description: 'Budget-friendly Claude model for simple tasks and high-volume classification.',
    speedTier: getSpeedTier(350),
    pricing: { inputPerM: 0.8, outputPerM: 4.0 },
    context: { inputTokens: 200000, outputTokens: 8192 },
    capabilities: {
      vision: true,
      audio: false,
      extendedThinking: false,
      webSearch: false,
      functionCalling: true,
      streaming: true,
    },
    bestFor: ['Classification', 'Extraction', 'Cost-sensitive workloads'],
    badge: 'Legacy',
    accessTier: ACCESS_TIERS.free,
  },

  // ===== OPENAI =====
  {
    id: 'gpt-5.2',
    name: 'GPT-5.2',
    provider: 'openai',
    tagline: "OpenAI's flagship reasoning model",
    description:
      'Flagship reasoning model for coding and agentic tasks. Configurable reasoning effort.',
    speedTier: getSpeedTier(2000),
    pricing: { inputPerM: 1.75, outputPerM: 14.0 },
    context: { inputTokens: 400000, outputTokens: 128000 },
    capabilities: {
      vision: true,
      audio: false,
      extendedThinking: true,
      webSearch: false,
      functionCalling: true,
      streaming: true,
    },
    bestFor: ['Coding', 'Agentic tasks', 'Complex analysis'],
    badge: 'Flagship',
    accessTier: ACCESS_TIERS.pro,
  },
  {
    id: 'gpt-5.2-pro',
    name: 'GPT-5.2 Pro',
    provider: 'openai',
    tagline: 'Maximum compute for the hardest problems',
    description:
      'Premium GPT-5.2 with more compute for harder problems. Best for research and cutting-edge applications.',
    speedTier: getSpeedTier(8000),
    pricing: { inputPerM: 21.0, outputPerM: 168.0 },
    context: { inputTokens: 400000, outputTokens: 128000 },
    capabilities: {
      vision: true,
      audio: false,
      extendedThinking: true,
      webSearch: false,
      functionCalling: true,
      streaming: true,
    },
    bestFor: ['Research', 'Frontier benchmarks', 'Hardest problems'],
    badge: 'Max Power',
    accessTier: ACCESS_TIERS.pro,
  },
  {
    id: 'gpt-5.1',
    name: 'GPT-5.1',
    provider: 'openai',
    tagline: 'Previous flagship reasoning model',
    description: 'Previous flagship reasoning model. Strong all-rounder superseded by GPT-5.2.',
    speedTier: getSpeedTier(2200),
    pricing: { inputPerM: 1.25, outputPerM: 10.0 },
    context: { inputTokens: 400000, outputTokens: 128000 },
    capabilities: {
      vision: true,
      audio: false,
      extendedThinking: true,
      webSearch: false,
      functionCalling: true,
      streaming: true,
    },
    bestFor: ['Coding', 'Analysis', 'Reasoning'],
    badge: null,
    accessTier: ACCESS_TIERS.pro,
  },
  {
    id: 'gpt-5',
    name: 'GPT-5',
    provider: 'openai',
    tagline: 'Original GPT-5 reasoning model',
    description: 'Original GPT-5 reasoning model. Superseded by GPT-5.1 and GPT-5.2.',
    speedTier: getSpeedTier(2400),
    pricing: { inputPerM: 1.25, outputPerM: 10.0 },
    context: { inputTokens: 400000, outputTokens: 128000 },
    capabilities: {
      vision: true,
      audio: false,
      extendedThinking: true,
      webSearch: false,
      functionCalling: true,
      streaming: true,
    },
    bestFor: ['Reasoning', 'Coding', 'General tasks'],
    badge: null,
    accessTier: ACCESS_TIERS.pro,
  },
  {
    id: 'gpt-5-mini',
    name: 'GPT-5 Mini',
    provider: 'openai',
    tagline: 'Fast, affordable reasoning for well-defined tasks',
    description: 'Fast, affordable reasoning model. Great balance of power and performance.',
    speedTier: getSpeedTier(800),
    pricing: { inputPerM: 0.25, outputPerM: 2.0 },
    context: { inputTokens: 400000, outputTokens: 128000 },
    capabilities: {
      vision: true,
      audio: false,
      extendedThinking: true,
      webSearch: false,
      functionCalling: true,
      streaming: true,
    },
    bestFor: ['Structured tasks', 'Cost-efficient reasoning', 'Quick responses'],
    badge: null,
    accessTier: ACCESS_TIERS.free,
  },
  {
    id: 'gpt-5-nano',
    name: 'GPT-5 Nano',
    provider: 'openai',
    tagline: 'Fastest and cheapest reasoning model',
    description:
      'Fastest, cheapest reasoning model. Excellent for summarization and classification.',
    speedTier: getSpeedTier(400),
    pricing: { inputPerM: 0.05, outputPerM: 0.4 },
    context: { inputTokens: 400000, outputTokens: 128000 },
    capabilities: {
      vision: true,
      audio: false,
      extendedThinking: true,
      webSearch: false,
      functionCalling: true,
      streaming: true,
    },
    bestFor: ['Summarization', 'Classification', 'High-throughput pipelines'],
    badge: 'Most Affordable',
    accessTier: ACCESS_TIERS.free,
  },
  {
    id: 'gpt-5.1-codex',
    name: 'GPT-5.1 Codex',
    provider: 'openai',
    tagline: 'Purpose-built for complex coding tasks',
    description:
      'Optimized for long-horizon agentic coding tasks. Best for complex code generation and multi-file changes.',
    speedTier: getSpeedTier(2500),
    pricing: { inputPerM: 1.25, outputPerM: 10.0 },
    context: { inputTokens: 400000, outputTokens: 128000 },
    capabilities: {
      vision: true,
      audio: false,
      extendedThinking: true,
      webSearch: false,
      functionCalling: true,
      streaming: true,
    },
    bestFor: ['Complex code generation', 'Multi-file refactors', 'Agentic coding'],
    badge: 'Best for Code',
    accessTier: ACCESS_TIERS.pro,
  },
  {
    id: 'gpt-5.1-codex-mini',
    name: 'GPT-5.1 Codex Mini',
    provider: 'openai',
    tagline: 'Fast coding assistance at low cost',
    description: 'Fast, cost-efficient coding model for quick edits and smaller code tasks.',
    speedTier: getSpeedTier(600),
    pricing: { inputPerM: 0.25, outputPerM: 2.0 },
    context: { inputTokens: 400000, outputTokens: 128000 },
    capabilities: {
      vision: true,
      audio: false,
      extendedThinking: true,
      webSearch: false,
      functionCalling: true,
      streaming: true,
    },
    bestFor: ['Code completion', 'Quick edits', 'Everyday development'],
    badge: null,
    accessTier: ACCESS_TIERS.free,
  },
  {
    id: 'gpt-4.1',
    name: 'GPT-4.1',
    provider: 'openai',
    tagline: 'Smartest non-reasoning model with 1M context',
    description:
      'Smartest non-reasoning model with 1M context window. Excellent instruction following.',
    speedTier: getSpeedTier(1500),
    pricing: { inputPerM: 2.0, outputPerM: 8.0 },
    context: { inputTokens: 1047576, outputTokens: 32768 },
    capabilities: {
      vision: true,
      audio: false,
      extendedThinking: false,
      webSearch: false,
      functionCalling: true,
      streaming: true,
    },
    bestFor: ['Long documents', 'Tool use', 'Instruction following'],
    badge: '1M Context',
    accessTier: ACCESS_TIERS.pro,
  },
  {
    id: 'gpt-4.1-mini',
    name: 'GPT-4.1 Mini',
    provider: 'openai',
    tagline: 'Fast and capable with 1M context',
    description: 'Fast version of GPT-4.1. Great starting point for most tasks.',
    speedTier: getSpeedTier(600),
    pricing: { inputPerM: 0.4, outputPerM: 1.6 },
    context: { inputTokens: 1047576, outputTokens: 32768 },
    capabilities: {
      vision: true,
      audio: false,
      extendedThinking: false,
      webSearch: false,
      functionCalling: true,
      streaming: true,
    },
    bestFor: ['General tasks', 'Cost-efficient work', 'Long documents'],
    badge: '1M Context',
    accessTier: ACCESS_TIERS.free,
  },
  {
    id: 'gpt-4.1-nano',
    name: 'GPT-4.1 Nano',
    provider: 'openai',
    tagline: 'Fastest GPT-4.1 for speed and cost',
    description: 'Fastest, most cost-efficient GPT-4.1 model for speed and price optimization.',
    speedTier: getSpeedTier(300),
    pricing: { inputPerM: 0.1, outputPerM: 1.4 },
    context: { inputTokens: 1047576, outputTokens: 32768 },
    capabilities: {
      vision: true,
      audio: false,
      extendedThinking: false,
      webSearch: false,
      functionCalling: true,
      streaming: true,
    },
    bestFor: ['Speed-critical tasks', 'High-volume pipelines', 'Cost optimization'],
    badge: null,
    accessTier: ACCESS_TIERS.free,
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    tagline: 'Versatile multimodal with native audio',
    description:
      'Versatile multimodal model with native audio I/O. Best for text, image, and audio processing.',
    speedTier: getSpeedTier(1000),
    pricing: { inputPerM: 2.5, outputPerM: 10.0 },
    context: { inputTokens: 128000, outputTokens: 16384 },
    capabilities: {
      vision: true,
      audio: true,
      extendedThinking: false,
      webSearch: false,
      functionCalling: true,
      streaming: true,
    },
    bestFor: ['Voice apps', 'Multimodal tasks', 'Creative work'],
    badge: 'Audio',
    accessTier: ACCESS_TIERS.pro,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    tagline: 'Fast multimodal at budget pricing',
    description: 'Fast, affordable multimodal model with audio support.',
    speedTier: getSpeedTier(500),
    pricing: { inputPerM: 0.15, outputPerM: 0.6 },
    context: { inputTokens: 128000, outputTokens: 16384 },
    capabilities: {
      vision: true,
      audio: true,
      extendedThinking: false,
      webSearch: false,
      functionCalling: true,
      streaming: true,
    },
    bestFor: ['Budget multimodal', 'Voice features', 'Fast responses'],
    badge: 'Audio',
    accessTier: ACCESS_TIERS.free,
  },
  {
    id: 'o3',
    name: 'o3',
    provider: 'openai',
    tagline: 'Reasoning model for complex problems',
    description: 'Reasoning model for complex analytical tasks. Excels at math and science.',
    speedTier: getSpeedTier(3000),
    pricing: { inputPerM: 2.0, outputPerM: 8.0 },
    context: { inputTokens: 200000, outputTokens: 100000 },
    capabilities: {
      vision: true,
      audio: false,
      extendedThinking: true,
      webSearch: false,
      functionCalling: true,
      streaming: true,
    },
    bestFor: ['Math & science', 'Formal reasoning', 'Complex analysis'],
    badge: null,
    accessTier: ACCESS_TIERS.pro,
  },
  {
    id: 'o3-pro',
    name: 'o3 Pro',
    provider: 'openai',
    tagline: 'Max-compute reasoning for research',
    description: 'Premium reasoning model with more compute. For the hardest research problems.',
    speedTier: getSpeedTier(10000),
    pricing: { inputPerM: 20.0, outputPerM: 80.0 },
    context: { inputTokens: 200000, outputTokens: 100000 },
    capabilities: {
      vision: true,
      audio: false,
      extendedThinking: true,
      webSearch: false,
      functionCalling: true,
      streaming: true,
    },
    bestFor: ['Research', 'Mathematical proofs', 'Frontier problems'],
    badge: null,
    accessTier: ACCESS_TIERS.pro,
  },
  {
    id: 'o4-mini',
    name: 'o4-mini',
    provider: 'openai',
    tagline: 'Efficient reasoning at moderate cost',
    description:
      'Fast, cost-efficient reasoning model. Superseded by GPT-5 mini but still available.',
    speedTier: getSpeedTier(1200),
    pricing: { inputPerM: 1.1, outputPerM: 4.4 },
    context: { inputTokens: 200000, outputTokens: 100000 },
    capabilities: {
      vision: true,
      audio: false,
      extendedThinking: true,
      webSearch: false,
      functionCalling: true,
      streaming: true,
    },
    bestFor: ['Structured reasoning', 'Cost-efficient analysis'],
    badge: null,
    accessTier: ACCESS_TIERS.free,
  },

  // ===== GOOGLE =====
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    tagline: "Google's most capable multimodal model",
    description: 'Most capable Gemini model with extended thinking and multimodal excellence.',
    speedTier: getSpeedTier(2000),
    pricing: { inputPerM: 1.25, outputPerM: 10.0 },
    context: { inputTokens: 1048576, outputTokens: 65536 },
    capabilities: {
      vision: true,
      audio: true,
      extendedThinking: false,
      webSearch: false,
      functionCalling: true,
      streaming: true,
    },
    bestFor: ['Long documents', 'Multimodal tasks', 'Translation', 'Research'],
    badge: 'Flagship',
    accessTier: ACCESS_TIERS.pro,
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    tagline: 'Fast and capable with 1M context',
    description:
      'Fast, efficient Gemini model. Excellent cost-performance ratio with multilingual strength.',
    speedTier: getSpeedTier(500),
    pricing: { inputPerM: 0.075, outputPerM: 0.3 },
    context: { inputTokens: 1048576, outputTokens: 65536 },
    capabilities: {
      vision: true,
      audio: true,
      extendedThinking: false,
      webSearch: false,
      functionCalling: true,
      streaming: true,
    },
    bestFor: ['Fast responses', 'Multimodal tasks', 'Long documents'],
    badge: 'Best Value',
    accessTier: ACCESS_TIERS.free,
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash-Lite',
    provider: 'google',
    tagline: 'Lightweight for cost-sensitive workloads',
    description: 'Lightweight Gemini model for cost-sensitive high-volume applications.',
    speedTier: getSpeedTier(300),
    pricing: { inputPerM: 0.025, outputPerM: 0.1 },
    context: { inputTokens: 1048576, outputTokens: 65536 },
    capabilities: {
      vision: true,
      audio: false,
      extendedThinking: false,
      webSearch: false,
      functionCalling: true,
      streaming: true,
    },
    bestFor: ['High-volume pipelines', 'Cost optimization', 'Simple tasks'],
    badge: null,
    accessTier: ACCESS_TIERS.free,
  },

  // ===== PERPLEXITY =====
  {
    id: 'sonar-pro',
    name: 'Perplexity Sonar Pro',
    provider: 'perplexity',
    tagline: 'Deep research with live web access',
    description:
      'Advanced search-augmented model for in-depth research and analysis with real-time web access.',
    speedTier: getSpeedTier(3000),
    pricing: { inputPerM: 3.0, outputPerM: 15.0 },
    context: { inputTokens: 200000, outputTokens: 8000 },
    capabilities: {
      vision: false,
      audio: false,
      extendedThinking: false,
      webSearch: true,
      functionCalling: true,
      streaming: true,
    },
    bestFor: ['Research', 'Fact-checking', 'Current events', 'Market analysis'],
    badge: 'Web Search',
    accessTier: ACCESS_TIERS.pro,
  },
  {
    id: 'sonar',
    name: 'Perplexity Sonar',
    provider: 'perplexity',
    tagline: 'Fast research with real-time web access',
    description:
      'Fast search-augmented model for quick research and fact-checking with web access.',
    speedTier: getSpeedTier(1500),
    pricing: { inputPerM: 1.0, outputPerM: 1.0 },
    context: { inputTokens: 128000, outputTokens: 8000 },
    capabilities: {
      vision: false,
      audio: false,
      extendedThinking: false,
      webSearch: true,
      functionCalling: true,
      streaming: true,
    },
    bestFor: ['Quick fact-checking', 'Lightweight research', 'Current events'],
    badge: 'Web Search',
    accessTier: ACCESS_TIERS.free,
  },

  // ===== XAI =====
  {
    id: 'grok-3',
    name: 'Grok 3',
    provider: 'xai',
    tagline: 'xAI flagship with real-time web access',
    description:
      'xAI flagship model with real-time web access, strong reasoning, and conversational style.',
    speedTier: getSpeedTier(1200),
    pricing: { inputPerM: 3.0, outputPerM: 15.0 },
    context: { inputTokens: 131072, outputTokens: 32768 },
    capabilities: {
      vision: true,
      audio: false,
      extendedThinking: false,
      webSearch: true,
      functionCalling: true,
      streaming: true,
    },
    bestFor: ['Research', 'Real-time analysis', 'Coding', 'Conversational AI'],
    badge: 'Web Search',
    accessTier: ACCESS_TIERS.pro,
  },
  {
    id: 'grok-3-mini',
    name: 'Grok 3 Mini',
    provider: 'xai',
    tagline: 'Fast xAI model with web access',
    description:
      'Fast, efficient xAI model with web access for quick research and conversational tasks.',
    speedTier: getSpeedTier(400),
    pricing: { inputPerM: 0.6, outputPerM: 4.0 },
    context: { inputTokens: 131072, outputTokens: 32768 },
    capabilities: {
      vision: false,
      audio: false,
      extendedThinking: false,
      webSearch: true,
      functionCalling: true,
      streaming: true,
    },
    bestFor: ['Quick research', 'Fast responses', 'Fact-checking'],
    badge: 'Web Search',
    accessTier: ACCESS_TIERS.free,
  },

  // ===== MISTRAL =====
  {
    id: 'mistral-large',
    name: 'Mistral Large',
    provider: 'mistral',
    tagline: 'Flagship multilingual coding model',
    description:
      'Flagship Mistral model with excellent multilingual capabilities and strong coding performance.',
    speedTier: getSpeedTier(900),
    pricing: { inputPerM: 2.0, outputPerM: 6.0 },
    context: { inputTokens: 131072, outputTokens: 32768 },
    capabilities: {
      vision: true,
      audio: false,
      extendedThinking: false,
      webSearch: false,
      functionCalling: true,
      streaming: true,
    },
    bestFor: ['Multilingual tasks', 'Coding', 'Translation'],
    badge: 'Flagship',
    accessTier: ACCESS_TIERS.pro,
  },
  {
    id: 'mistral-small',
    name: 'Mistral Small',
    provider: 'mistral',
    tagline: 'Fast multilingual for low-latency tasks',
    description:
      'Fast, efficient Mistral model optimized for low-latency tasks with strong multilingual support.',
    speedTier: getSpeedTier(300),
    pricing: { inputPerM: 0.2, outputPerM: 0.6 },
    context: { inputTokens: 131072, outputTokens: 32768 },
    capabilities: {
      vision: false,
      audio: false,
      extendedThinking: false,
      webSearch: false,
      functionCalling: true,
      streaming: true,
    },
    bestFor: ['Fast multilingual', 'Low-latency tasks', 'Translation'],
    badge: null,
    accessTier: ACCESS_TIERS.free,
  },

  // ===== DEEPSEEK =====
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'deepseek',
    tagline: 'Open-source reasoning at very low cost',
    description:
      'Open-source reasoning model with exceptional math, science, and coding capabilities at very low cost.',
    speedTier: getSpeedTier(2500),
    pricing: { inputPerM: 0.55, outputPerM: 2.19 },
    context: { inputTokens: 131072, outputTokens: 65536 },
    capabilities: {
      vision: false,
      audio: false,
      extendedThinking: true,
      webSearch: false,
      functionCalling: true,
      streaming: true,
    },
    bestFor: ['Math & science', 'Coding', 'Cost-efficient reasoning'],
    badge: 'Open Source',
    accessTier: ACCESS_TIERS.free,
  },

  // ===== GENERATION MODELS =====
  {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    provider: 'openai',
    tagline: 'State-of-the-art image generation',
    description:
      'State-of-the-art image generation model. Creates high-quality images from text descriptions.',
    speedTier: getSpeedTier(8000),
    pricing: { inputPerM: 40.0, outputPerM: 80.0 },
    context: { inputTokens: 4000, outputTokens: 1 },
    capabilities: {
      vision: false,
      audio: false,
      extendedThinking: false,
      webSearch: false,
      functionCalling: false,
      streaming: false,
      imageGeneration: true,
    },
    bestFor: ['Image creation', 'Visual design', 'Creative projects'],
    badge: 'Image Gen',
    accessTier: ACCESS_TIERS.pro,
  },
  {
    id: 'imagen-3',
    name: 'Imagen 3',
    provider: 'google',
    tagline: 'Photorealistic image generation',
    description:
      'Google DeepMind image generation with photorealistic quality and excellent text rendering.',
    speedTier: getSpeedTier(6000),
    pricing: { inputPerM: 40.0, outputPerM: 60.0 },
    context: { inputTokens: 4000, outputTokens: 1 },
    capabilities: {
      vision: false,
      audio: false,
      extendedThinking: false,
      webSearch: false,
      functionCalling: false,
      streaming: false,
      imageGeneration: true,
    },
    bestFor: ['Photorealistic images', 'Text rendering', 'Visual content'],
    badge: 'Image Gen',
    accessTier: ACCESS_TIERS.pro,
  },
  {
    id: 'stable-diffusion-3.5',
    name: 'Stable Diffusion 3.5',
    provider: 'stability',
    tagline: 'Open-source artistic image generation',
    description:
      'Open-source image generation with fine control over artistic style and composition.',
    speedTier: getSpeedTier(5000),
    pricing: { inputPerM: 30.0, outputPerM: 50.0 },
    context: { inputTokens: 4000, outputTokens: 1 },
    capabilities: {
      vision: false,
      audio: false,
      extendedThinking: false,
      webSearch: false,
      functionCalling: false,
      streaming: false,
      imageGeneration: true,
    },
    bestFor: ['Artistic images', 'Style control', 'Creative design'],
    badge: 'Image Gen',
    accessTier: ACCESS_TIERS.pro,
  },
  {
    id: 'sora',
    name: 'Sora',
    provider: 'openai',
    tagline: 'Cinematic video generation from text',
    description:
      'OpenAI video generation model. Creates high-quality videos from text with cinematic quality.',
    speedTier: getSpeedTier(30000),
    pricing: { inputPerM: 100.0, outputPerM: 200.0 },
    context: { inputTokens: 4000, outputTokens: 1 },
    capabilities: {
      vision: false,
      audio: false,
      extendedThinking: false,
      webSearch: false,
      functionCalling: false,
      streaming: false,
      videoGeneration: true,
    },
    bestFor: ['Video creation', 'Cinematic content', 'Visual storytelling'],
    badge: 'Video Gen',
    accessTier: ACCESS_TIERS.pro,
  },
  {
    id: 'veo-2',
    name: 'Veo 2',
    provider: 'google',
    tagline: 'High-fidelity video with realistic physics',
    description:
      'Google DeepMind video generation with high-fidelity output and realistic physics.',
    speedTier: getSpeedTier(25000),
    pricing: { inputPerM: 80.0, outputPerM: 150.0 },
    context: { inputTokens: 4000, outputTokens: 1 },
    capabilities: {
      vision: false,
      audio: false,
      extendedThinking: false,
      webSearch: false,
      functionCalling: false,
      streaming: false,
      videoGeneration: true,
    },
    bestFor: ['Video creation', 'Realistic physics', 'High-fidelity video'],
    badge: 'Video Gen',
    accessTier: ACCESS_TIERS.pro,
  },
  {
    id: 'openai-tts',
    name: 'OpenAI TTS',
    provider: 'openai',
    tagline: 'Natural-sounding text-to-speech',
    description:
      'High-quality text-to-speech model with natural-sounding voices and multiple voice options.',
    speedTier: getSpeedTier(500),
    pricing: { inputPerM: 15.0, outputPerM: 15.0 },
    context: { inputTokens: 4096, outputTokens: 1 },
    capabilities: {
      vision: false,
      audio: true,
      extendedThinking: false,
      webSearch: false,
      functionCalling: false,
      streaming: true,
      tts: true,
    },
    bestFor: ['Voice narration', 'Accessibility', 'Audio content'],
    badge: 'TTS',
    accessTier: ACCESS_TIERS.pro,
  },
  {
    id: 'elevenlabs-v3',
    name: 'ElevenLabs v3',
    provider: 'elevenlabs',
    tagline: 'Ultra-realistic voice synthesis',
    description:
      'Premium voice synthesis with ultra-realistic speech, voice cloning, and emotional expression.',
    speedTier: getSpeedTier(600),
    pricing: { inputPerM: 30.0, outputPerM: 30.0 },
    context: { inputTokens: 4096, outputTokens: 1 },
    capabilities: {
      vision: false,
      audio: true,
      extendedThinking: false,
      webSearch: false,
      functionCalling: false,
      streaming: true,
      tts: true,
    },
    bestFor: ['Voice cloning', 'Emotional speech', 'Premium audio'],
    badge: 'TTS',
    accessTier: ACCESS_TIERS.pro,
  },
];

// Get all unique providers in display order
export const PROVIDER_ORDER = [
  'anthropic',
  'openai',
  'google',
  'perplexity',
  'xai',
  'mistral',
  'deepseek',
  'stability',
  'elevenlabs',
];

// Get models grouped by provider
export function getModelsByProvider(modelList) {
  const source = modelList || MODELS;
  const grouped = {};
  for (const providerId of PROVIDER_ORDER) {
    const providerModels = source.filter((m) => m.provider === providerId);
    if (providerModels.length > 0) {
      grouped[providerId] = providerModels;
    }
  }
  return grouped;
}

// Speed tier display info
export const SPEED_TIERS = {
  fast: { label: 'Fast', description: 'Under 500ms avg. response' },
  balanced: { label: 'Balanced', description: '500ms–1.5s avg. response' },
  powerful: { label: 'Powerful', description: 'Over 1.5s avg. response (deep reasoning)' },
};

// ===== Tier-based access helpers =====

// Get the current user's tier from localStorage (defaults to 'free')
export function getUserTier() {
  return localStorage.getItem('araviel-user-tier') || ACCESS_TIERS.free;
}

// Get models available for a specific access tier
export function getModelsForTier(tier) {
  if (tier === ACCESS_TIERS.pro) {
    return MODELS;
  }
  return MODELS.filter((m) => m.accessTier === ACCESS_TIERS.free);
}

// Check if a specific model is accessible for a tier
export function isModelAccessible(modelId, tier) {
  const model = MODELS.find((m) => m.id === modelId);
  if (!model) return false;
  if (tier === ACCESS_TIERS.pro) return true;
  return model.accessTier === ACCESS_TIERS.free;
}

// Check if a model is an image generation model
export function isImageGenerationModel(modelId) {
  const model = MODELS.find((m) => m.id === modelId);
  return model?.capabilities?.imageGeneration === true;
}

// Get pro-only models (for upgrade prompts)
export function getProOnlyModels() {
  return MODELS.filter((m) => m.accessTier === ACCESS_TIERS.pro);
}
