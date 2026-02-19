// ADE (Araviel Decision Engine) API client

const ADE_BASE_URL = 'https://ade-sandy.vercel.app/api/v1';

/**
 * Determine the time-of-day context string for ADE routing.
 */
export function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour >= 9 && hour < 17) return 'work_hours';
  if (hour >= 17 && hour < 20) return 'evening';
  if (hour >= 20 && hour < 23) return 'late_night';
  if (hour >= 23 || hour < 2) return 'midnight';
  return 'early_morning'; // 2-9
}

/**
 * Call ADE route endpoint to determine the optimal model for a given prompt.
 *
 * @param {string} prompt - The user prompt
 * @param {object} [options] - Optional routing options
 * @param {string} [options.preferModel] - Preferred model ID (when user manually selected)
 * @returns {{ modelId, modelName, provider, score, reasoning, alternateModels }}
 */
export async function routePrompt(prompt, options = {}) {
  const timeOfDay = getTimeOfDay();
  const { preferModel } = options;

  try {
    const body = {
      prompt,
      humanContext: { timeOfDay },
    };
    if (preferModel) {
      body.options = { preferModel };
    }

    const response = await fetch(`${ADE_BASE_URL}/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`ADE API returned ${response.status}`);
    }

    const data = await response.json();

    // Normalize alternate models from the response
    const alternateModels = normalizeAlternateModels(data);

    return {
      modelId: data.selectedModel || data.model || data.modelId || 'claude-sonnet-4-5-20250929',
      modelName: data.modelName || data.selectedModelName || null,
      provider: data.provider || null,
      score: data.score || data.confidence || 0.92,
      reasoning: data.reasoning || data.explanation || 'Best match for your request',
      alternateModels,
    };
  } catch (err) {
    console.warn('ADE routing failed, using fallback:', err.message);
    return getFallbackRouting(prompt, preferModel);
  }
}

/**
 * Normalize alternate models from ADE response into a consistent shape.
 */
function normalizeAlternateModels(data) {
  if (data.alternativeModels && Array.isArray(data.alternativeModels)) {
    return data.alternativeModels.map((m) => ({
      modelId: m.id || m.modelId,
      modelName: m.name || m.modelName,
      provider: m.provider,
      score: m.score != null ? m.score / 100 : null,
      reasoning: m.reasoning || null,
    }));
  }
  if (data.alternateModels && Array.isArray(data.alternateModels)) {
    return data.alternateModels;
  }
  return [];
}

/**
 * Fallback routing logic when ADE API is unavailable.
 * Uses simple heuristics based on prompt content.
 * Also generates fallback alternate models.
 */
function getFallbackRouting(prompt, preferModel) {
  const lower = prompt.toLowerCase();

  // All candidate routes
  const candidates = [
    {
      modelId: 'claude-sonnet-4-5-20250929',
      modelName: 'Claude Sonnet 4.5',
      provider: 'anthropic',
      score: 0.94,
      reasoning: 'Strong coding performance with great balance of speed and capability',
      patterns:
        /\b(code|function|debug|program|script|api|sql|html|css|javascript|python|react|algorithm|compile|error|bug|import|class|const|let|var)\b/,
    },
    {
      modelId: 'sonar-pro',
      modelName: 'Perplexity Sonar Pro',
      provider: 'perplexity',
      score: 0.91,
      reasoning: 'Real-time web search for up-to-date research and fact-checking',
      patterns: /\b(explain|research|what is|how does|why|history|science|quantum|theory)\b/,
    },
    {
      modelId: 'claude-opus-4-5-20251101',
      modelName: 'Claude Opus 4.5',
      provider: 'anthropic',
      score: 0.93,
      reasoning: 'Flagship intelligence for nuanced creative and reasoning tasks',
      patterns: /\b(write|poem|haiku|story|creative|imagine|compose|draft)\b/,
    },
    {
      modelId: 'gemini-2.5-flash',
      modelName: 'Gemini 2.5 Flash',
      provider: 'google',
      score: 0.96,
      reasoning: 'Ultra-fast responses ideal for quick calculations and simple tasks',
      patterns: /\b(\d+\s*[\+\-\*\/x]\s*\d+|calculate|math|sum|multiply|divide)\b/,
    },
    {
      modelId: 'gemini-2.5-pro',
      modelName: 'Gemini 2.5 Pro',
      provider: 'google',
      score: 0.9,
      reasoning: 'Excellent for data analysis with massive context window',
      patterns: /\b(analyze|data|compare|trend|insight|chart|metric|report)\b/,
    },
    {
      modelId: 'gpt-5.2',
      modelName: 'GPT-5.2',
      provider: 'openai',
      score: 0.89,
      reasoning: 'Versatile flagship model great for a wide range of tasks',
      patterns: null, // default
    },
    {
      modelId: 'claude-sonnet-4-6',
      modelName: 'Claude Sonnet 4.6',
      provider: 'anthropic',
      score: 0.92,
      reasoning: 'Latest Sonnet with near-Opus performance at a fraction of the cost',
      patterns: null,
    },
    {
      modelId: 'claude-opus-4-6',
      modelName: 'Claude Opus 4.6',
      provider: 'anthropic',
      score: 0.91,
      reasoning: 'Latest flagship model with advanced reasoning and agentic capabilities',
      patterns: null,
    },
  ];

  // Determine primary model by pattern matching
  let primary = null;

  // If user specified a preferred model, use it as primary
  if (preferModel) {
    primary = candidates.find((c) => c.modelId === preferModel);
    if (!primary) {
      // Not in candidates — build a stub primary
      primary = {
        modelId: preferModel,
        modelName: null,
        provider: null,
        score: null,
        reasoning: 'Selected by user',
      };
    }
  }

  if (!primary) {
    for (const c of candidates) {
      if (c.patterns && c.patterns.test(lower)) {
        primary = c;
        break;
      }
    }
    if (!primary) {
      primary = candidates.find((c) => c.modelId === 'gpt-5.2');
    }
  }

  // Pick alternate models: different from primary, sorted by score, take top 3
  const alternateModels = candidates
    .filter((c) => c.modelId !== primary.modelId)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 3)
    .map(({ patterns, ...rest }) => rest);

  const { patterns, ...result } = primary;
  return {
    ...result,
    alternateModels,
  };
}
