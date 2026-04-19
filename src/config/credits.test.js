import { describe, it, expect } from 'vitest';
import {
  TIER_TEXT_CREDITS,
  TIER_IMAGE_CREDITS,
  IMAGE_QUALITY_COSTS,
  IMAGE_QUALITY_OPTIONS,
  IMAGE_PACKS,
  PACK_EXPIRY_DAYS,
  GUEST_TEXT_LIMIT,
  GUEST_IMAGE_LIMIT,
  TIER_IMAGE_QUALITY_DEFAULTS,
  getDefaultImageQualityForTier,
} from './credits';

describe('credits config', () => {
  describe('TIER_TEXT_CREDITS', () => {
    it('defines credits for free, lite, and pro tiers', () => {
      expect(TIER_TEXT_CREDITS.free).toBeDefined();
      expect(TIER_TEXT_CREDITS.lite).toBeDefined();
      expect(TIER_TEXT_CREDITS.pro).toBeDefined();
    });

    it('each tier has monthly, window, and firstMonthBonus', () => {
      for (const tier of Object.values(TIER_TEXT_CREDITS)) {
        expect(typeof tier.monthly).toBe('number');
        expect(typeof tier.window).toBe('number');
        expect(typeof tier.firstMonthBonus).toBe('number');
      }
    });

    it('free tier has lower credits than lite, lite lower than pro', () => {
      expect(TIER_TEXT_CREDITS.free.monthly).toBeLessThan(TIER_TEXT_CREDITS.lite.monthly);
      expect(TIER_TEXT_CREDITS.lite.monthly).toBeLessThan(TIER_TEXT_CREDITS.pro.monthly);
    });

    it('free tier has no first month bonus', () => {
      expect(TIER_TEXT_CREDITS.free.firstMonthBonus).toBe(0);
    });
  });

  describe('TIER_IMAGE_CREDITS', () => {
    it('scales with tier level', () => {
      expect(TIER_IMAGE_CREDITS.free).toBeLessThan(TIER_IMAGE_CREDITS.lite);
      expect(TIER_IMAGE_CREDITS.lite).toBeLessThan(TIER_IMAGE_CREDITS.pro);
    });
  });

  describe('IMAGE_QUALITY_COSTS', () => {
    it('standard costs 1 credit', () => {
      expect(IMAGE_QUALITY_COSTS.standard).toBe(1);
    });

    it('hd costs more than standard', () => {
      expect(IMAGE_QUALITY_COSTS.hd).toBeGreaterThan(IMAGE_QUALITY_COSTS.standard);
    });

    it('ultra costs more than hd', () => {
      expect(IMAGE_QUALITY_COSTS.ultra).toBeGreaterThan(IMAGE_QUALITY_COSTS.hd);
    });
  });

  describe('IMAGE_QUALITY_OPTIONS', () => {
    it('has 3 quality options', () => {
      expect(IMAGE_QUALITY_OPTIONS).toHaveLength(3);
    });

    it('each option has value, label, and cost', () => {
      for (const option of IMAGE_QUALITY_OPTIONS) {
        expect(option.value).toBeDefined();
        expect(option.label).toBeDefined();
        expect(typeof option.cost).toBe('number');
      }
    });

    it('option costs match IMAGE_QUALITY_COSTS', () => {
      for (const option of IMAGE_QUALITY_OPTIONS) {
        expect(option.cost).toBe(IMAGE_QUALITY_COSTS[option.value]);
      }
    });
  });

  describe('IMAGE_PACKS', () => {
    it('defines starter, creator, and studio packs', () => {
      expect(IMAGE_PACKS.starter).toBeDefined();
      expect(IMAGE_PACKS.creator).toBeDefined();
      expect(IMAGE_PACKS.studio).toBeDefined();
    });

    it('each pack has credits, label, and price', () => {
      for (const pack of Object.values(IMAGE_PACKS)) {
        expect(typeof pack.credits).toBe('number');
        expect(typeof pack.label).toBe('string');
        expect(typeof pack.price).toBe('string');
      }
    });

    it('pack credits scale up', () => {
      expect(IMAGE_PACKS.starter.credits).toBeLessThan(IMAGE_PACKS.creator.credits);
      expect(IMAGE_PACKS.creator.credits).toBeLessThan(IMAGE_PACKS.studio.credits);
    });
  });

  describe('TIER_IMAGE_QUALITY_DEFAULTS', () => {
    it('maps each tier to a valid quality value', () => {
      expect(TIER_IMAGE_QUALITY_DEFAULTS.free).toBe('standard');
      expect(TIER_IMAGE_QUALITY_DEFAULTS.lite).toBe('hd');
      expect(TIER_IMAGE_QUALITY_DEFAULTS.pro).toBe('ultra');
    });

    it('default quality escalates with tier (cost strictly non-decreasing)', () => {
      expect(IMAGE_QUALITY_COSTS[TIER_IMAGE_QUALITY_DEFAULTS.free]).toBeLessThanOrEqual(
        IMAGE_QUALITY_COSTS[TIER_IMAGE_QUALITY_DEFAULTS.lite]
      );
      expect(IMAGE_QUALITY_COSTS[TIER_IMAGE_QUALITY_DEFAULTS.lite]).toBeLessThanOrEqual(
        IMAGE_QUALITY_COSTS[TIER_IMAGE_QUALITY_DEFAULTS.pro]
      );
    });
  });

  describe('getDefaultImageQualityForTier', () => {
    it('returns the tier-specific default', () => {
      expect(getDefaultImageQualityForTier('free')).toBe('standard');
      expect(getDefaultImageQualityForTier('lite')).toBe('hd');
      expect(getDefaultImageQualityForTier('pro')).toBe('ultra');
    });

    it('falls back to standard for unknown or missing tiers', () => {
      expect(getDefaultImageQualityForTier(null)).toBe('standard');
      expect(getDefaultImageQualityForTier(undefined)).toBe('standard');
      expect(getDefaultImageQualityForTier('enterprise')).toBe('standard');
    });
  });

  describe('constants', () => {
    it('PACK_EXPIRY_DAYS is 90', () => {
      expect(PACK_EXPIRY_DAYS).toBe(90);
    });

    it('GUEST_TEXT_LIMIT is 3', () => {
      expect(GUEST_TEXT_LIMIT).toBe(3);
    });

    it('GUEST_IMAGE_LIMIT is 0', () => {
      expect(GUEST_IMAGE_LIMIT).toBe(0);
    });
  });
});
