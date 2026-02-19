// Model registry for Araviel — organized by provider
// Data sourced from ADE (Araviel Decision Engine) model registry

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
    id: 'claude-opus-4-5-20251101',
    name: 'Claude Opus 4.5',
    provider: 'anthropic',
    tagline: 'Flagship intelligence for the hardest tasks',
    description:
      'The most capable Claude model yet. Leads on coding (80.9% SWE-bench), reasoning, and long-horizon agentic tasks. Extended thinking mode for deep analysis. 67% more cost-efficient than its predecessor.',
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
    badge: 'Flagship',
  },
  {
    id: 'claude-sonnet-4-5-20250929',
    name: 'Claude Sonnet 4.5',
    provider: 'anthropic',
    tagline: 'Best for coding and agentic tasks',
    description:
      'Industry-leading agentic capabilities with an ideal balance of intelligence, speed, and cost. Supports 1M token context in beta. The go-to for most coding workflows.',
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
  },
  {
    id: 'claude-haiku-4-5-20251001',
    name: 'Claude Haiku 4.5',
    provider: 'anthropic',
    tagline: 'Near-frontier speed for everyday tasks',
    description:
      'The fastest Claude model with near-frontier intelligence. Matches Sonnet 4 on coding benchmarks (73.3% SWE-bench) and excels at computer-use tasks. Perfect for high-volume, latency-sensitive applications.',
    speedTier: getSpeedTier(350),
    pricing: { inputPerM: 1.0, outputPerM: 5.0 },
    context: { inputTokens: 200000, outputTokens: 64000 },
    capabilities: {
      vision: true,
      audio: false,
      extendedThinking: true,
      webSearch: false,
      functionCalling: true,
      streaming: true,
    },
    bestFor: ['Real-time responses', 'High-volume tasks', 'Computer use'],
    badge: 'Fastest',
  },
  {
    id: 'claude-opus-4-1-20250805',
    name: 'Claude Opus 4.1',
    provider: 'anthropic',
    tagline: 'Specialized for agentic and complex tasks',
    description:
      'Built for agentic workflows, real-world coding, and multi-step reasoning (74.5% SWE-bench). Drop-in upgrade from Opus 4 with improved instruction following.',
    speedTier: getSpeedTier(2200),
    pricing: { inputPerM: 15.0, outputPerM: 75.0 },
    context: { inputTokens: 200000, outputTokens: 32000 },
    capabilities: {
      vision: true,
      audio: false,
      extendedThinking: true,
      webSearch: false,
      functionCalling: true,
      streaming: true,
    },
    bestFor: ['Agentic tasks', 'Complex coding', 'Multi-step reasoning'],
    badge: null,
  },
  {
    id: 'claude-opus-4-20250514',
    name: 'Claude Opus 4',
    provider: 'anthropic',
    tagline: 'Original Claude 4 flagship',
    description:
      'The original Claude 4 flagship model with Level 3 safety classification. Strong reasoning and coding capabilities across a wide range of tasks.',
    speedTier: getSpeedTier(2400),
    pricing: { inputPerM: 15.0, outputPerM: 75.0 },
    context: { inputTokens: 200000, outputTokens: 32000 },
    capabilities: {
      vision: true,
      audio: false,
      extendedThinking: true,
      webSearch: false,
      functionCalling: true,
      streaming: true,
    },
    bestFor: ['Reasoning', 'Coding', 'Complex analysis'],
    badge: null,
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    tagline: 'Balanced performance for most workflows',
    description:
      'A reliable all-rounder with strong coding and reasoning. The default choice for most users. Supports 1M token context in beta.',
    speedTier: getSpeedTier(1200),
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
    bestFor: ['General tasks', 'Coding', 'Writing'],
    badge: null,
  },
  {
    id: 'claude-3-7-sonnet-20250219',
    name: 'Claude Sonnet 3.7',
    provider: 'anthropic',
    tagline: 'Hybrid fast and deep reasoning',
    description:
      'A hybrid reasoning model that blends fast conversational responses with deeper analysis on demand. Legacy model — still highly performant for most tasks.',
    speedTier: getSpeedTier(1400),
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
    bestFor: ['Mixed workloads', 'Conversational AI', 'Analysis'],
    badge: 'Legacy',
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude Haiku 3.5',
    provider: 'anthropic',
    tagline: 'Fast and reliable for high-volume work',
    description:
      'Built for speed and reliability at scale. Ideal for content moderation, real-time responses, and high-throughput pipelines.',
    speedTier: getSpeedTier(400),
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
    bestFor: ['Content moderation', 'Real-time chat', 'High-volume tasks'],
    badge: 'Legacy',
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude Haiku 3',
    provider: 'anthropic',
    tagline: 'Budget-friendly for simple tasks',
    description:
      'The most affordable Claude model. Best for simple classification, extraction, and ultra-high-volume workloads where cost is the top priority.',
    speedTier: getSpeedTier(300),
    pricing: { inputPerM: 0.25, outputPerM: 1.25 },
    context: { inputTokens: 200000, outputTokens: 4096 },
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
  },

  // ===== OPENAI =====
  {
    id: 'gpt-5.2',
    name: 'GPT-5.2',
    provider: 'openai',
    tagline: "OpenAI's flagship reasoning model",
    description:
      'The best all-around model from OpenAI. Configurable reasoning effort for coding, analysis, and agentic tasks. Massive 400K context window with 128K output.',
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
  },
  {
    id: 'gpt-5.2-pro',
    name: 'GPT-5.2 Pro',
    provider: 'openai',
    tagline: 'Maximum compute for the hardest problems',
    description:
      'Premium reasoning with more compute allocated for harder problems. Best for cutting-edge research, competitive benchmarks, and tasks that demand the absolute best.',
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
  },
  {
    id: 'gpt-5.1',
    name: 'GPT-5.1',
    provider: 'openai',
    tagline: 'Previous flagship reasoning model',
    description:
      'A highly capable reasoning model superseded by GPT-5.2 but still widely available. Strong coding and analytical performance at a slightly lower cost.',
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
  },
  {
    id: 'gpt-5',
    name: 'GPT-5',
    provider: 'openai',
    tagline: 'Original GPT-5 reasoning model',
    description:
      'The first GPT-5 reasoning model. Superseded by GPT-5.1 and GPT-5.2, but still available for compatibility and cost optimization.',
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
  },
  {
    id: 'gpt-5-mini',
    name: 'GPT-5 Mini',
    provider: 'openai',
    tagline: 'Fast, affordable reasoning for well-defined tasks',
    description:
      'A compact reasoning model offering a great balance of speed and intelligence at a fraction of the cost. Ideal for structured, well-defined tasks.',
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
  },
  {
    id: 'gpt-5-nano',
    name: 'GPT-5 Nano',
    provider: 'openai',
    tagline: 'Fastest and cheapest reasoning model',
    description:
      'Ultra-fast, ultra-cheap reasoning. Excellent for summarization, classification, and high-throughput pipelines where cost is paramount.',
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
  },
  {
    id: 'gpt-5.1-codex',
    name: 'GPT-5.1 Codex',
    provider: 'openai',
    tagline: 'Purpose-built for complex coding tasks',
    description:
      'Optimized for long-horizon agentic coding: multi-file changes, complex refactors, and autonomous software engineering. Benchmark-leading on coding tasks.',
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
  },
  {
    id: 'gpt-5.1-codex-mini',
    name: 'GPT-5.1 Codex Mini',
    provider: 'openai',
    tagline: 'Fast coding assistance at low cost',
    description:
      'A smaller, faster version of Codex optimized for quick edits, code completions, and smaller coding tasks. Great cost-efficiency for everyday development.',
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
  },
  {
    id: 'gpt-4.1',
    name: 'GPT-4.1',
    provider: 'openai',
    tagline: 'Smartest non-reasoning model with 1M context',
    description:
      'The smartest GPT-4 series model with a 1M token context window. Exceptional at instruction following, tool calling, and handling long documents.',
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
  },
  {
    id: 'gpt-4.1-mini',
    name: 'GPT-4.1 Mini',
    provider: 'openai',
    tagline: 'Fast and capable with 1M context',
    description:
      'A smaller, faster version of GPT-4.1 retaining the 1M context window. A great starting point for most tasks with an excellent cost-to-performance ratio.',
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
  },
  {
    id: 'gpt-4.1-nano',
    name: 'GPT-4.1 Nano',
    provider: 'openai',
    tagline: 'Fastest GPT-4.1 for speed and cost',
    description:
      'The smallest and most cost-efficient GPT-4.1 model. Retains the 1M context window at a fraction of the cost. Best for speed-critical and price-sensitive use cases.',
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
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    tagline: 'Versatile multimodal with native audio',
    description:
      "OpenAI's versatile omni-model with native text, image, and audio I/O. Excellent for voice applications, multilingual tasks, and creative work across modalities.",
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
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    tagline: 'Fast multimodal at budget pricing',
    description:
      'A fast, affordable version of GPT-4o with audio support retained. The best budget option for multimodal applications that need text, image, and audio capabilities.',
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
  },
  {
    id: 'o3',
    name: 'o3',
    provider: 'openai',
    tagline: 'Legacy reasoning for complex problems',
    description:
      'A legacy reasoning model for complex analytical tasks. Superseded by GPT-5 but still available. Strong at math, science, and formal problem-solving.',
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
    badge: 'Legacy',
  },
  {
    id: 'o3-pro',
    name: 'o3 Pro',
    provider: 'openai',
    tagline: 'Max-compute reasoning for research',
    description:
      'Premium reasoning with maximum compute for the absolute hardest problems. Designed for boundary-pushing research in math, science, and engineering.',
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
    badge: 'Legacy',
  },
  {
    id: 'o4-mini',
    name: 'o4-mini',
    provider: 'openai',
    tagline: 'Efficient reasoning at moderate cost',
    description:
      'A cost-efficient reasoning model offering solid performance for structured problems. Superseded by GPT-5 Mini but still available.',
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
    badge: 'Legacy',
  },

  // ===== GOOGLE =====
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    tagline: "Google's most capable multimodal model",
    description:
      "Google's most powerful model with extended thinking and best-in-class multimodal capabilities. Massive 1M token context window with audio and vision support.",
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
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    tagline: 'Fast and capable with 1M context',
    description:
      "Google's best cost-to-performance model. Combines speed, multimodal ability, and a 1M token context window at a very low price point.",
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
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash-Lite',
    provider: 'google',
    tagline: 'Lightweight for cost-sensitive workloads',
    description:
      "Google's lightest model for high-volume, cost-sensitive applications. Retains the large context window at the lowest price in the Gemini 2.5 family.",
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
  },

  // ===== PERPLEXITY =====
  {
    id: 'sonar-pro',
    name: 'Perplexity Sonar Pro',
    provider: 'perplexity',
    tagline: 'Deep research with live web access',
    description:
      "Perplexity's most capable search-augmented model. Designed for in-depth research with real-time web access. Returns cited, up-to-date information on any topic.",
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
  },
  {
    id: 'sonar',
    name: 'Perplexity Sonar',
    provider: 'perplexity',
    tagline: 'Fast research with real-time web access',
    description:
      'A quick, cost-efficient search-augmented model for rapid fact-checking and lightweight research tasks. Returns cited answers from the web in real time.',
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
  },
];

// Get all unique providers in display order
export const PROVIDER_ORDER = ['anthropic', 'openai', 'google', 'perplexity'];

// Get models grouped by provider
export function getModelsByProvider() {
  const grouped = {};
  for (const providerId of PROVIDER_ORDER) {
    grouped[providerId] = MODELS.filter((m) => m.provider === providerId);
  }
  return grouped;
}

// Speed tier display info
export const SPEED_TIERS = {
  fast: { label: 'Fast', description: 'Under 500ms avg. response' },
  balanced: { label: 'Balanced', description: '500ms–1.5s avg. response' },
  powerful: { label: 'Powerful', description: 'Over 1.5s avg. response (deep reasoning)' },
};
