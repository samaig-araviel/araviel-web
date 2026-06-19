/**
 * Web's runtime model registry.
 *
 * The model catalog has a single source of truth: ADE. araviel-api
 * exposes it via /api/models/catalog, and scripts/sync-models.mjs
 * pulls it into bundledModels.js as a build-time snapshot. This
 * module composes those canonical facts with web-owned presentation
 * copy (modelPresentation.js) and provider/tier constants
 * (modelConstants.js) into the shape that the rest of the app uses.
 *
 * All re-exports below preserve the historical public surface so
 * consumers can keep importing from './data/models' unchanged.
 */

import { BUNDLED_MODELS } from './bundledModels';
import { MODEL_PRESENTATION } from './modelPresentation';
import { ACCESS_TIERS, PROVIDER_ORDER } from './modelConstants';

export {
  ACCESS_TIERS,
  PROVIDERS,
  PROVIDER_ORDER,
  SPEED_TIERS,
  formatTokens,
  formatPricePerM,
} from './modelConstants';

const EMPTY_PRESENTATION = Object.freeze({
  tagline: '',
  bestFor: Object.freeze([]),
  badge: null,
});

function mergePresentation(facts) {
  const copy = MODEL_PRESENTATION[facts.id] ?? EMPTY_PRESENTATION;
  return { ...facts, ...copy };
}

export const MODELS = BUNDLED_MODELS.map(mergePresentation);

const MODELS_BY_ID = new Map(MODELS.map((m) => [m.id, m]));

export function getModelsByProvider(modelList) {
  const source = modelList ?? MODELS;
  const grouped = {};
  for (const providerId of PROVIDER_ORDER) {
    const providerModels = source.filter((m) => m.provider === providerId);
    if (providerModels.length > 0) {
      grouped[providerId] = providerModels;
    }
  }
  return grouped;
}

export function getModelsForTier(tier) {
  if (tier === ACCESS_TIERS.pro) return MODELS;
  if (tier === ACCESS_TIERS.lite) {
    return MODELS.filter((m) => m.accessTier !== ACCESS_TIERS.pro);
  }
  return MODELS.filter((m) => m.accessTier === ACCESS_TIERS.free);
}

export function isModelAccessible(modelId, tier) {
  const model = MODELS_BY_ID.get(modelId);
  if (!model) return false;
  if (tier === ACCESS_TIERS.pro) return true;
  if (tier === ACCESS_TIERS.lite) return model.accessTier !== ACCESS_TIERS.pro;
  return model.accessTier === ACCESS_TIERS.free;
}

export function isImageGenerationModel(modelId) {
  return MODELS_BY_ID.get(modelId)?.capabilities?.imageGeneration === true;
}

export function getUpgradeModels(currentTier) {
  if (currentTier === ACCESS_TIERS.pro) return [];
  if (currentTier === ACCESS_TIERS.lite) {
    return MODELS.filter((m) => m.accessTier === ACCESS_TIERS.pro);
  }
  return MODELS.filter((m) => m.accessTier !== ACCESS_TIERS.free);
}

export const getProOnlyModels = () => getUpgradeModels(ACCESS_TIERS.free);

const FEATURED_PROVIDERS = ['anthropic', 'openai', 'google'];

export function getFeaturedModelsForTier(tier, fromList) {
  const source = fromList ?? getModelsForTier(tier);
  return FEATURED_PROVIDERS.map((providerId) =>
    source.find((m) => m.provider === providerId)
  ).filter(Boolean);
}
