/**
 * Provider, tier, and presentation constants that web owns directly.
 *
 * These values are not facts about the model catalog (those come from
 * bundledModels.js, sourced from ADE via the api gateway). They are
 * brand assets (provider logos, accent colours) and UX taxonomy
 * (access tiers, speed tier labels, display order) that belong with
 * the consumer that renders them.
 */

export const ACCESS_TIERS = {
  free: 'free',
  lite: 'lite',
  pro: 'pro',
};

export const PROVIDERS = {
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    shortName: 'Anthropic',
    logoChar: 'A',
    accentColor: '#8b7355',
    accentBg: '#f5f0eb',
    accentBgDark: '#2a2520',
    accentText: '#6b5a45',
    accentTextDark: '#c4b49a',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    shortName: 'OpenAI',
    logoChar: 'O',
    accentColor: '#6b7b8d',
    accentBg: '#f0f3f6',
    accentBgDark: '#1e252c',
    accentText: '#4a5a6a',
    accentTextDark: '#9aabb8',
  },
  google: {
    id: 'google',
    name: 'Google',
    shortName: 'Google',
    logoChar: 'G',
    accentColor: '#6b8a6b',
    accentBg: '#f0f5f0',
    accentBgDark: '#1e261e',
    accentText: '#4a6a4a',
    accentTextDark: '#9ab89a',
  },
  xai: {
    id: 'xai',
    name: 'xAI',
    shortName: 'xAI',
    logoChar: 'X',
    accentColor: '#7a6b8d',
    accentBg: '#f3f0f6',
    accentBgDark: '#252028',
    accentText: '#5a4a6a',
    accentTextDark: '#b09ac4',
  },
  perplexity: {
    id: 'perplexity',
    name: 'Perplexity',
    shortName: 'Perplexity',
    logoChar: 'P',
    accentColor: '#7a7a8d',
    accentBg: '#f0f0f5',
    accentBgDark: '#202025',
    accentText: '#555568',
    accentTextDark: '#a8a8c0',
  },
  elevenlabs: {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    shortName: 'ElevenLabs',
    logoChar: 'E',
    accentColor: '#8d6b7a',
    accentBg: '#f5f0f3',
    accentBgDark: '#281e24',
    accentText: '#6a4a5a',
    accentTextDark: '#c49ab0',
  },
};

export const PROVIDER_ORDER = ['anthropic', 'openai', 'google', 'xai', 'perplexity', 'elevenlabs'];

export const SPEED_TIERS = {
  fast: { label: 'Fast', description: 'Under 500ms avg. response' },
  balanced: { label: 'Balanced', description: '500ms–1.5s avg. response' },
  powerful: {
    label: 'Powerful',
    description: 'Over 1.5s avg. response (deep reasoning)',
  },
};

export function formatTokens(count) {
  if (count >= 1000000) {
    const millions = count / 1000000;
    return `${millions.toFixed(count % 1000000 === 0 ? 0 : 1)}M`;
  }
  if (count >= 1000) return `${Math.round(count / 1000)}K`;
  return `${count}`;
}

export function formatPricePerM(pricePerK) {
  const perM = pricePerK * 1000;
  if (perM < 0.01) return `$${perM.toFixed(4)}`;
  if (perM < 1) return `$${perM.toFixed(3)}`;
  return `$${perM.toFixed(2)}`;
}
