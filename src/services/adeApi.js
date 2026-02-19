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
 * Returns { model, provider, score, reasoning } or a fallback on error.
 */
export async function routePrompt(prompt) {
  const timeOfDay = getTimeOfDay();

  try {
    const response = await fetch(`${ADE_BASE_URL}/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        humanContext: { timeOfDay },
      }),
    });

    if (!response.ok) {
      throw new Error(`ADE API returned ${response.status}`);
    }

    const data = await response.json();

    // Normalize the response shape
    return {
      modelId: data.selectedModel || data.model || data.modelId || 'claude-sonnet-4-5-20250929',
      modelName: data.modelName || data.selectedModelName || null,
      provider: data.provider || null,
      score: data.score || data.confidence || 0.92,
      reasoning: data.reasoning || data.explanation || 'Best match for your request',
    };
  } catch (err) {
    console.warn('ADE routing failed, using fallback:', err.message);
    return getFallbackRouting(prompt);
  }
}

/**
 * Fallback routing logic when ADE API is unavailable.
 * Uses simple heuristics based on prompt content.
 */
function getFallbackRouting(prompt) {
  const lower = prompt.toLowerCase();

  // Coding patterns
  if (
    /\b(code|function|debug|program|script|api|sql|html|css|javascript|python|react|algorithm|compile|error|bug|import|class|const|let|var)\b/.test(
      lower
    )
  ) {
    return {
      modelId: 'claude-sonnet-4-5-20250929',
      modelName: 'Claude Sonnet 4.5',
      provider: 'anthropic',
      score: 0.94,
      reasoning: 'Coding task detected — routed to best coding model',
    };
  }

  // Research / explanation patterns
  if (/\b(explain|research|what is|how does|why|history|science|quantum|theory)\b/.test(lower)) {
    return {
      modelId: 'sonar-pro',
      modelName: 'Perplexity Sonar Pro',
      provider: 'perplexity',
      score: 0.91,
      reasoning: 'Research query detected — routed to search-augmented model',
    };
  }

  // Creative patterns
  if (/\b(write|poem|haiku|story|creative|imagine|compose|draft)\b/.test(lower)) {
    return {
      modelId: 'claude-opus-4-5-20251101',
      modelName: 'Claude Opus 4.5',
      provider: 'anthropic',
      score: 0.93,
      reasoning: 'Creative task detected — routed to flagship model',
    };
  }

  // Quick math / simple questions
  if (/\b(\d+\s*[\+\-\*\/x]\s*\d+|calculate|math|sum|multiply|divide)\b/.test(lower)) {
    return {
      modelId: 'gemini-2.5-flash',
      modelName: 'Gemini 2.5 Flash',
      provider: 'google',
      score: 0.96,
      reasoning: 'Quick calculation — routed to fastest model',
    };
  }

  // Analytical patterns
  if (/\b(analyze|data|compare|trend|insight|chart|metric|report)\b/.test(lower)) {
    return {
      modelId: 'gemini-2.5-pro',
      modelName: 'Gemini 2.5 Pro',
      provider: 'google',
      score: 0.9,
      reasoning: 'Analytical task detected — routed to data-focused model',
    };
  }

  // Default: balanced choice
  return {
    modelId: 'gpt-5.2',
    modelName: 'GPT-5.2',
    provider: 'openai',
    score: 0.89,
    reasoning: 'General query — routed to versatile flagship model',
  };
}
