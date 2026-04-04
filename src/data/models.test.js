import { describe, it, expect } from 'vitest';
import {
  MODELS,
  PROVIDERS,
  ACCESS_TIERS,
  PROVIDER_ORDER,
  SPEED_TIERS,
  formatTokens,
  formatPricePerM,
  getModelsByProvider,
  getModelsForTier,
  isModelAccessible,
  isImageGenerationModel,
  getUpgradeModels,
  getProOnlyModels,
} from './models';

describe('models data', () => {
  describe('PROVIDERS', () => {
    it('defines all 6 providers', () => {
      expect(Object.keys(PROVIDERS)).toHaveLength(6);
      expect(PROVIDERS.anthropic).toBeDefined();
      expect(PROVIDERS.openai).toBeDefined();
      expect(PROVIDERS.google).toBeDefined();
      expect(PROVIDERS.xai).toBeDefined();
      expect(PROVIDERS.perplexity).toBeDefined();
      expect(PROVIDERS.elevenlabs).toBeDefined();
    });

    it('each provider has required properties', () => {
      for (const provider of Object.values(PROVIDERS)) {
        expect(provider.id).toBeDefined();
        expect(provider.name).toBeDefined();
        expect(provider.logoChar).toBeDefined();
        expect(provider.accentColor).toBeDefined();
      }
    });
  });

  describe('ACCESS_TIERS', () => {
    it('defines free, lite, and pro', () => {
      expect(ACCESS_TIERS.free).toBe('free');
      expect(ACCESS_TIERS.lite).toBe('lite');
      expect(ACCESS_TIERS.pro).toBe('pro');
    });
  });

  describe('MODELS', () => {
    it('contains models', () => {
      expect(MODELS.length).toBeGreaterThan(0);
    });

    it('each model has required properties', () => {
      for (const model of MODELS) {
        expect(model.id).toBeDefined();
        expect(model.name).toBeDefined();
        expect(model.provider).toBeDefined();
        expect(PROVIDERS[model.provider]).toBeDefined();
        expect(model.pricing).toBeDefined();
        expect(model.accessTier).toBeDefined();
        expect(typeof model.creditCost).toBe('number');
      }
    });

    it('every model references a valid provider', () => {
      for (const model of MODELS) {
        expect(Object.keys(PROVIDERS)).toContain(model.provider);
      }
    });

    it('every model has a valid access tier', () => {
      const validTiers = Object.values(ACCESS_TIERS);
      for (const model of MODELS) {
        expect(validTiers).toContain(model.accessTier);
      }
    });

    it('every model has a valid speed tier', () => {
      const validSpeeds = Object.keys(SPEED_TIERS);
      for (const model of MODELS) {
        expect(validSpeeds).toContain(model.speedTier);
      }
    });
  });

  describe('PROVIDER_ORDER', () => {
    it('lists all 6 providers', () => {
      expect(PROVIDER_ORDER).toHaveLength(6);
      for (const id of PROVIDER_ORDER) {
        expect(PROVIDERS[id]).toBeDefined();
      }
    });
  });

  describe('formatTokens', () => {
    it('formats millions', () => {
      expect(formatTokens(1000000)).toBe('1M');
      expect(formatTokens(2500000)).toBe('2.5M');
    });

    it('formats thousands', () => {
      expect(formatTokens(1000)).toBe('1K');
      expect(formatTokens(128000)).toBe('128K');
      expect(formatTokens(200000)).toBe('200K');
    });

    it('formats small numbers directly', () => {
      expect(formatTokens(500)).toBe('500');
      expect(formatTokens(0)).toBe('0');
    });
  });

  describe('formatPricePerM', () => {
    it('formats very small prices with 4 decimals', () => {
      expect(formatPricePerM(0.000005)).toBe('$0.0050');
    });

    it('formats sub-dollar prices with 3 decimals', () => {
      expect(formatPricePerM(0.0003)).toBe('$0.300');
    });

    it('formats dollar+ prices with 2 decimals', () => {
      expect(formatPricePerM(0.005)).toBe('$5.00');
      expect(formatPricePerM(0.025)).toBe('$25.00');
    });
  });

  describe('getModelsByProvider', () => {
    it('groups models by provider', () => {
      const grouped = getModelsByProvider();
      for (const providerId of Object.keys(grouped)) {
        expect(PROVIDER_ORDER).toContain(providerId);
        for (const model of grouped[providerId]) {
          expect(model.provider).toBe(providerId);
        }
      }
    });

    it('accepts a custom model list', () => {
      const subset = MODELS.filter((m) => m.provider === 'anthropic');
      const grouped = getModelsByProvider(subset);
      expect(Object.keys(grouped)).toEqual(['anthropic']);
    });

    it('omits providers with no models', () => {
      const grouped = getModelsByProvider([]);
      expect(Object.keys(grouped)).toHaveLength(0);
    });
  });

  describe('getModelsForTier', () => {
    it('pro tier returns all models', () => {
      const proModels = getModelsForTier('pro');
      expect(proModels).toHaveLength(MODELS.length);
    });

    it('lite tier excludes pro-only models', () => {
      const liteModels = getModelsForTier('lite');
      for (const model of liteModels) {
        expect(model.accessTier).not.toBe('pro');
      }
    });

    it('free tier returns only free models', () => {
      const freeModels = getModelsForTier('free');
      for (const model of freeModels) {
        expect(model.accessTier).toBe('free');
      }
    });

    it('tier sizes are ordered: free <= lite <= pro', () => {
      const freeCount = getModelsForTier('free').length;
      const liteCount = getModelsForTier('lite').length;
      const proCount = getModelsForTier('pro').length;
      expect(freeCount).toBeLessThanOrEqual(liteCount);
      expect(liteCount).toBeLessThanOrEqual(proCount);
    });
  });

  describe('isModelAccessible', () => {
    it('returns false for nonexistent model', () => {
      expect(isModelAccessible('nonexistent', 'pro')).toBe(false);
    });

    it('pro tier can access any model', () => {
      for (const model of MODELS) {
        expect(isModelAccessible(model.id, 'pro')).toBe(true);
      }
    });

    it('free tier can only access free models', () => {
      for (const model of MODELS) {
        if (model.accessTier === 'free') {
          expect(isModelAccessible(model.id, 'free')).toBe(true);
        } else {
          expect(isModelAccessible(model.id, 'free')).toBe(false);
        }
      }
    });

    it('lite tier cannot access pro models', () => {
      const proModels = MODELS.filter((m) => m.accessTier === 'pro');
      for (const model of proModels) {
        expect(isModelAccessible(model.id, 'lite')).toBe(false);
      }
    });
  });

  describe('isImageGenerationModel', () => {
    it('returns false for nonexistent model', () => {
      expect(isImageGenerationModel('nonexistent')).toBeFalsy();
    });

    it('returns false for text-only models', () => {
      const textModel = MODELS.find((m) => !m.capabilities?.imageGeneration);
      if (textModel) {
        expect(isImageGenerationModel(textModel.id)).toBeFalsy();
      }
    });

    it('returns true for image generation models', () => {
      const imgModel = MODELS.find((m) => m.capabilities?.imageGeneration === true);
      if (imgModel) {
        expect(isImageGenerationModel(imgModel.id)).toBe(true);
      }
    });
  });

  describe('getUpgradeModels', () => {
    it('pro tier has no upgrade models', () => {
      expect(getUpgradeModels('pro')).toHaveLength(0);
    });

    it('free tier sees lite and pro models as upgrades', () => {
      const upgrades = getUpgradeModels('free');
      for (const model of upgrades) {
        expect(model.accessTier).not.toBe('free');
      }
      expect(upgrades.length).toBeGreaterThan(0);
    });

    it('lite tier sees only pro models as upgrades', () => {
      const upgrades = getUpgradeModels('lite');
      for (const model of upgrades) {
        expect(model.accessTier).toBe('pro');
      }
    });
  });

  describe('getProOnlyModels', () => {
    it('is an alias for getUpgradeModels("free")', () => {
      expect(getProOnlyModels()).toEqual(getUpgradeModels('free'));
    });
  });

  describe('SPEED_TIERS', () => {
    it('defines fast, balanced, and powerful', () => {
      expect(SPEED_TIERS.fast).toBeDefined();
      expect(SPEED_TIERS.balanced).toBeDefined();
      expect(SPEED_TIERS.powerful).toBeDefined();
    });

    it('each speed tier has label and description', () => {
      for (const tier of Object.values(SPEED_TIERS)) {
        expect(typeof tier.label).toBe('string');
        expect(typeof tier.description).toBe('string');
      }
    });
  });
});
