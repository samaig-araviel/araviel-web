/**
 * Web-owned presentation copy for models. Maintained by hand alongside
 * design and marketing changes. Looked up by model ID and merged on top
 * of the canonical facts from bundledModels.js to form the runtime
 * MODELS array in models.js.
 *
 * When ADE adds a new model, add a matching entry here. Missing entries
 * fall back to empty defaults at render time.
 */
export const MODEL_PRESENTATION = {
  'claude-opus-4-8': {
    tagline: "Anthropic's latest Opus — adaptive thinking and agentic coding at the frontier",
    bestFor: [
      'Agentic coding',
      'Complex reasoning',
      'Long-horizon autonomy',
      'Vision & document analysis',
    ],
    badge: 'New',
  },
  'claude-opus-4-7': {
    tagline: 'Most capable Claude with step-change agentic coding and high-res vision',
    bestFor: [
      'Agentic coding',
      'Complex reasoning',
      'Long-horizon autonomy',
      'Vision & document analysis',
    ],
    badge: 'Flagship',
  },
  'claude-opus-4-6': {
    tagline: 'Most intelligent Claude with agent teams and adaptive thinking',
    bestFor: ['Complex reasoning', 'Coding', 'Agentic workflows', 'Creative writing'],
    badge: null,
  },
  'claude-opus-4-5-20251101': {
    tagline: 'Previous flagship with state-of-the-art coding',
    bestFor: ['Complex reasoning', 'Long-form coding', 'Agentic workflows', 'Research & analysis'],
    badge: null,
  },
  'claude-sonnet-4-6': {
    tagline: 'Best speed/intelligence balance at 1/5 Opus cost',
    bestFor: ['Coding', 'Agentic tasks', 'Default model', 'Balanced workloads'],
    badge: 'New Default',
  },
  'claude-sonnet-4-5-20250929': {
    tagline: 'Best coding model with industry-leading agent capabilities',
    bestFor: ['Coding', 'Agentic tasks', 'Balanced workloads'],
    badge: null,
  },
  'claude-haiku-4-5-20251001': {
    tagline: 'Fastest Claude with near-frontier intelligence',
    bestFor: ['Real-time responses', 'High-volume tasks', 'Cost-efficient work'],
    badge: 'Fastest',
  },
  'gpt-5.4': {
    tagline: "OpenAI's most capable frontier model",
    bestFor: ['Coding', 'Reasoning', 'Math', 'Long-context analysis'],
    badge: 'Flagship',
  },
  'gpt-5.4-pro': {
    tagline: 'Maximum compute for the hardest problems',
    bestFor: ['Research', 'Math', 'Frontier problems'],
    badge: 'Max Power',
  },
  'gpt-5.2': {
    tagline: "OpenAI's flagship for coding and agentic tasks",
    bestFor: ['Coding', 'Reasoning', 'Math', 'Agentic tasks'],
    badge: 'Flagship',
  },
  'gpt-5.2-pro': {
    tagline: 'Maximum compute for the hardest problems',
    bestFor: ['Research', 'Math', 'Frontier problems'],
    badge: 'Max Power',
  },
  'gpt-5': {
    tagline: 'Previous intelligent reasoning model',
    bestFor: ['Reasoning', 'Coding', 'General tasks'],
    badge: null,
  },
  'gpt-5-mini': {
    tagline: 'Fast, cost-efficient reasoning',
    bestFor: ['Structured tasks', 'Cost-efficient reasoning', 'Quick responses'],
    badge: null,
  },
  'gpt-5-nano': {
    tagline: 'Fastest, cheapest reasoning model',
    bestFor: ['Summarization', 'Classification', 'High-throughput pipelines'],
    badge: 'Most Affordable',
  },
  'gpt-4.1': {
    tagline: 'Smartest non-reasoning model with 1M context',
    bestFor: ['Long documents', 'Tool use', 'Instruction following'],
    badge: '1M Context',
  },
  'gpt-4.1-mini': {
    tagline: 'Fast and capable with 1M context',
    bestFor: ['General tasks', 'Cost-efficient work', 'Long documents'],
    badge: '1M Context',
  },
  'gpt-4o': {
    tagline: 'Versatile multimodal with native audio',
    bestFor: ['Voice apps', 'Multimodal tasks', 'Creative work'],
    badge: 'Audio',
  },
  'gpt-4o-mini': {
    tagline: 'Fast multimodal at budget pricing',
    bestFor: ['Budget multimodal', 'Voice features', 'Fast responses'],
    badge: 'Audio',
  },
  'gpt-5.3-codex': {
    tagline: 'Most advanced agentic coding model',
    bestFor: ['Complex code generation', 'Multi-file refactors', 'Agentic coding'],
    badge: 'Best for Code',
  },
  'o3-deep-research': {
    tagline: 'Most powerful deep research with web browsing',
    bestFor: ['Deep research', 'Multi-step analysis', 'Web browsing'],
    badge: 'Deep Research',
  },
  'o4-mini-deep-research': {
    tagline: 'Faster, more affordable deep research',
    bestFor: ['Research', 'Analysis', 'Budget deep research'],
    badge: 'Deep Research',
  },
  'gpt-image-2': {
    tagline: 'OpenAI flagship image generation',
    bestFor: ['Image creation', 'Image editing', 'Multilingual text', 'Complex compositions'],
    badge: 'Image Gen',
  },
  'gpt-image-1.5': {
    tagline: 'High-quality image generation',
    bestFor: ['Image creation', 'Image editing', 'Visual design'],
    badge: 'Image Gen',
  },
  'gpt-image-1-mini': {
    tagline: 'Cost-efficient image generation',
    bestFor: ['Budget image creation', 'Quick visuals'],
    badge: 'Image Gen',
  },
  'gpt-4o-mini-tts': {
    tagline: 'Natural-sounding text-to-speech',
    bestFor: ['Voice narration', 'Accessibility', 'Audio content'],
    badge: 'TTS',
  },
  'gpt-4o-mini-transcribe': {
    tagline: 'Fast speech-to-text transcription',
    bestFor: ['Transcription', 'Speech-to-text'],
    badge: 'STT',
  },
  'gpt-realtime': {
    tagline: 'Realtime text and audio I/O for voice agents',
    bestFor: ['Voice agents', 'Low-latency audio', 'Realtime conversation'],
    badge: 'Realtime',
  },
  'gemini-3.1-pro-preview': {
    tagline: 'Latest Gemini with advanced intelligence and agentic coding',
    bestFor: ['Multilingual', 'Multimodal', 'Reasoning', 'Coding'],
    badge: 'Flagship',
  },
  'gemini-3-flash-preview': {
    tagline: 'Frontier-class performance at fraction of cost',
    bestFor: ['Fast tasks', 'Multilingual', 'Multimodal', 'Long context'],
    badge: null,
  },
  'gemini-2.5-pro': {
    tagline: "Google's advanced model for complex tasks",
    bestFor: ['Long documents', 'Multimodal tasks', 'Translation', 'Research'],
    badge: null,
  },
  'gemini-2.5-flash': {
    tagline: 'Best price-performance for reasoning tasks',
    bestFor: ['Fast responses', 'Multimodal tasks', 'Long documents'],
    badge: 'Best Value',
  },
  'gemini-2.5-flash-lite': {
    tagline: 'Cheapest Gemini for cost-sensitive workloads',
    bestFor: ['High-volume pipelines', 'Cost optimization', 'Simple tasks'],
    badge: null,
  },
  'gemini-3.1-flash-image': {
    tagline:
      'GA image generation — 4K resolution, advanced text rendering, grounding with Google Search',
    bestFor: ['Image generation', 'Marketing assets', 'Infographics', 'Multi-image composition'],
    badge: 'New',
  },
  'veo-3.1-generate-preview': {
    tagline: 'Cinematic video generation with synced audio',
    bestFor: ['Video creation', 'Cinematic content', 'High-fidelity video'],
    badge: 'Video Gen',
  },
  'gemini-2.5-flash-preview-tts': {
    tagline: 'Text-to-speech audio generation',
    bestFor: ['Text-to-speech', 'Multilingual voice'],
    badge: 'TTS',
  },
  'gemini-2.5-flash-native-audio-preview-12-2025': {
    tagline: 'Low-latency voice agents with Live API',
    bestFor: ['Voice agents', 'Low-latency audio', 'Multilingual voice'],
    badge: 'Realtime',
  },
  'deep-research-pro-preview-12-2025': {
    tagline: 'Agentic multi-step research across hundreds of sources',
    bestFor: ['Deep research', 'Analysis', 'Citations', 'Comprehensive reports'],
    badge: 'Deep Research',
  },
  'grok-4': {
    tagline: 'xAI flagship reasoning with built-in web and X search',
    bestFor: ['Research', 'Real-time data', 'Reasoning', 'X search'],
    badge: 'Web Search',
  },
  'grok-4.1-fast': {
    tagline: 'Near-frontier at ultra-low cost with 2M context',
    bestFor: ['Fast tasks', 'Web search', 'X search', 'Budget', 'Long context'],
    badge: '2M Context',
  },
  'grok-4-fast': {
    tagline: 'Fast Grok 4 variant with 2M context',
    bestFor: ['Fast tasks', 'Web search', 'X search', 'Budget'],
    badge: '2M Context',
  },
  sonar: {
    tagline: 'Fast search-augmented model with web access',
    bestFor: ['Quick fact-checking', 'Lightweight research', 'Current events'],
    badge: 'Web Search',
  },
  'sonar-pro': {
    tagline: 'Advanced search for complex queries and follow-ups',
    bestFor: ['Research', 'Fact-checking', 'Current events', 'Market analysis'],
    badge: 'Web Search',
  },
  'sonar-reasoning-pro': {
    tagline: 'Reasoning with Chain of Thought and web grounding',
    bestFor: ['Reasoning + search', 'Fact-checking', 'Complex analysis'],
    badge: 'Reasoning',
  },
  'sonar-deep-research': {
    tagline: 'Expert-level exhaustive research and reports',
    bestFor: ['Expert research', 'Comprehensive reports', 'Citations'],
    badge: 'Deep Research',
  },
  eleven_flash_v2_5: {
    tagline: 'Ultra-low latency TTS in 32 languages',
    bestFor: ['Ultra-low latency TTS', 'Voice cloning', 'Multilingual voice'],
    badge: 'TTS',
  },
  eleven_multilingual_v2: {
    tagline: 'High quality voice generation in 32 languages',
    bestFor: ['Premium voice', 'Voice cloning', 'Multilingual TTS'],
    badge: 'TTS',
  },
  scribe_v2: {
    tagline: 'Speech-to-text with 98%+ accuracy in 90+ languages',
    bestFor: ['Transcription', 'Multilingual STT'],
    badge: 'STT',
  },
  'elevenlabs-music': {
    tagline: 'Text-to-music generation',
    bestFor: ['Music generation'],
    badge: 'Music Gen',
  },
  'elevenlabs-sfx': {
    tagline: 'Text-to-sound-effects generation',
    bestFor: ['Sound effects', 'Audio generation'],
    badge: 'SFX',
  },
  'elevenlabs-voice-isolator': {
    tagline: 'Remove background noise from audio',
    bestFor: ['Noise removal', 'Voice isolation', 'Audio processing'],
    badge: 'Audio',
  },
  'gpt-5.5': {
    tagline: "OpenAI's newest frontier model",
    bestFor: ['Coding', 'Reasoning', 'Math', 'Agentic tasks'],
    badge: 'New',
  },
  'gpt-5.5-pro': {
    tagline: 'Maximum compute for the hardest problems',
    bestFor: ['Research', 'Deep reasoning', 'Frontier problems'],
    badge: 'Max Power',
  },
  'gpt-5.4-mini': {
    tagline: 'Mid-tier reasoning in the GPT-5.4 family',
    bestFor: ['Cost-efficient reasoning', 'Structured tasks', 'Quick responses'],
    badge: null,
  },
  'gpt-5.4-nano': {
    tagline: 'Fastest, cheapest reasoning in the 5.4 family',
    bestFor: ['Summarization', 'Classification', 'High-throughput pipelines'],
    badge: 'Most Affordable',
  },
  'gemini-3.5-flash': {
    tagline: "Google's newest Flash workhorse",
    bestFor: ['Fast responses', 'Multimodal tasks', 'Reasoning'],
    badge: 'New',
  },
  'gemini-3.1-flash-lite': {
    tagline: 'Frontier-class Gemini at budget tier',
    bestFor: ['High-volume pipelines', 'Cost optimization', 'Quick reasoning'],
    badge: null,
  },
};
