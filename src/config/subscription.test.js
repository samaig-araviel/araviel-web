import { describe, it, expect } from 'vitest';
import {
  SubscriptionTier,
  FeatureCategory,
  ModelAccessLevel,
  SUBSCRIPTION_TIERS,
  COMPARISON_FEATURES,
  TIER_ORDER,
  getAvailableTiers,
  getTierById,
  getDisplayPrice,
  getAnnualSavings,
  isUpgrade,
  isDowngrade,
  getProjectLimit,
  getNextTier,
} from './subscription';

describe('subscription config', () => {
  describe('SubscriptionTier enum', () => {
    it('contains all 5 tiers', () => {
      expect(SubscriptionTier.Free).toBe('free');
      expect(SubscriptionTier.Lite).toBe('lite');
      expect(SubscriptionTier.Pro).toBe('pro');
      expect(SubscriptionTier.Ultra).toBe('ultra');
      expect(SubscriptionTier.Apex).toBe('apex');
    });
  });

  describe('FeatureCategory enum', () => {
    it('has all categories', () => {
      expect(FeatureCategory.Models).toBe('Models');
      expect(FeatureCategory.Credits).toBe('Credits & Usage');
      expect(FeatureCategory.ADE).toBe('ADE Routing');
      expect(FeatureCategory.Features).toBe('Features');
    });
  });

  describe('ModelAccessLevel enum', () => {
    it('has all access levels', () => {
      expect(ModelAccessLevel.Budget).toBe('budget');
      expect(ModelAccessLevel.MidTier).toBe('mid_tier');
      expect(ModelAccessLevel.Flagship).toBe('flagship');
      expect(ModelAccessLevel.FlagshipPlus).toBe('flagship_plus');
    });
  });

  describe('SUBSCRIPTION_TIERS', () => {
    it('contains exactly 5 tiers', () => {
      expect(SUBSCRIPTION_TIERS).toHaveLength(5);
    });

    it('each tier has required properties', () => {
      for (const tier of SUBSCRIPTION_TIERS) {
        expect(tier.id).toBeDefined();
        expect(tier.name).toBeDefined();
        expect(tier.tagline).toBeDefined();
        expect(typeof tier.monthlyPrice).toBe('number');
        expect(typeof tier.annualPricePerMonth).toBe('number');
        expect(tier.currency).toBe('GBP');
        expect(typeof tier.monthlyTextCredits).toBe('number');
        expect(typeof tier.monthlyImageCredits).toBe('number');
        expect(Array.isArray(tier.features)).toBe(true);
        expect(tier.features.length).toBeGreaterThan(0);
      }
    });

    it('free tier has price of 0', () => {
      const free = SUBSCRIPTION_TIERS.find((t) => t.id === 'free');
      expect(free.monthlyPrice).toBe(0);
      expect(free.annualPricePerMonth).toBe(0);
    });

    it('annual price is always less than or equal to monthly', () => {
      for (const tier of SUBSCRIPTION_TIERS) {
        expect(tier.annualPricePerMonth).toBeLessThanOrEqual(tier.monthlyPrice);
      }
    });
  });

  describe('TIER_ORDER', () => {
    it('orders tiers from lowest to highest', () => {
      expect(TIER_ORDER).toEqual(['free', 'lite', 'pro', 'ultra', 'apex']);
    });
  });

  describe('COMPARISON_FEATURES', () => {
    it('has features with name and category', () => {
      for (const feature of COMPARISON_FEATURES) {
        expect(typeof feature.name).toBe('string');
        expect(typeof feature.category).toBe('string');
      }
    });
  });

  describe('getAvailableTiers', () => {
    it('returns only tiers marked as available', () => {
      const available = getAvailableTiers();
      for (const tier of available) {
        expect(tier.available).toBe(true);
      }
    });

    it('includes free, lite, and pro', () => {
      const ids = getAvailableTiers().map((t) => t.id);
      expect(ids).toContain('free');
      expect(ids).toContain('lite');
      expect(ids).toContain('pro');
    });

    it('excludes ultra and apex', () => {
      const ids = getAvailableTiers().map((t) => t.id);
      expect(ids).not.toContain('ultra');
      expect(ids).not.toContain('apex');
    });
  });

  describe('getTierById', () => {
    it('returns the correct tier for a valid id', () => {
      const lite = getTierById('lite');
      expect(lite.id).toBe('lite');
      expect(lite.name).toBe('Lite');
    });

    it('returns undefined for an invalid id', () => {
      expect(getTierById('nonexistent')).toBeUndefined();
    });
  });

  describe('getDisplayPrice', () => {
    it('returns 0 for free tier', () => {
      const free = getTierById('free');
      expect(getDisplayPrice(free, 'monthly')).toBe(0);
      expect(getDisplayPrice(free, 'annual')).toBe(0);
    });

    it('returns monthly price for monthly billing', () => {
      const lite = getTierById('lite');
      expect(getDisplayPrice(lite, 'monthly')).toBe(lite.monthlyPrice);
    });

    it('returns annual price per month for annual billing', () => {
      const lite = getTierById('lite');
      expect(getDisplayPrice(lite, 'annual')).toBe(lite.annualPricePerMonth);
    });
  });

  describe('getAnnualSavings', () => {
    it('returns 0 for free tier', () => {
      const free = getTierById('free');
      expect(getAnnualSavings(free)).toBe(0);
    });

    it('returns a positive savings percentage for paid tiers', () => {
      const lite = getTierById('lite');
      const savings = getAnnualSavings(lite);
      expect(savings).toBeGreaterThan(0);
      expect(savings).toBeLessThan(100);
    });

    it('returns a rounded integer', () => {
      const pro = getTierById('pro');
      const savings = getAnnualSavings(pro);
      expect(Number.isInteger(savings)).toBe(true);
    });
  });

  describe('isUpgrade', () => {
    it('free to lite is an upgrade', () => {
      expect(isUpgrade('free', 'lite')).toBe(true);
    });

    it('free to pro is an upgrade', () => {
      expect(isUpgrade('free', 'pro')).toBe(true);
    });

    it('pro to free is not an upgrade', () => {
      expect(isUpgrade('pro', 'free')).toBe(false);
    });

    it('same tier is not an upgrade', () => {
      expect(isUpgrade('lite', 'lite')).toBe(false);
    });
  });

  describe('isDowngrade', () => {
    it('pro to free is a downgrade', () => {
      expect(isDowngrade('pro', 'free')).toBe(true);
    });

    it('free to pro is not a downgrade', () => {
      expect(isDowngrade('free', 'pro')).toBe(false);
    });

    it('same tier is not a downgrade', () => {
      expect(isDowngrade('lite', 'lite')).toBe(false);
    });
  });

  describe('getProjectLimit', () => {
    it('free tier has limit of 1', () => {
      expect(getProjectLimit('free')).toBe(1);
    });

    it('lite tier has limit of 4', () => {
      expect(getProjectLimit('lite')).toBe(4);
    });

    it('pro tier has unlimited projects', () => {
      expect(getProjectLimit('pro')).toBe(Infinity);
    });

    it('defaults to 1 for unknown tier', () => {
      expect(getProjectLimit('nonexistent')).toBe(1);
    });
  });

  describe('getNextTier', () => {
    it('free upgrades to lite', () => {
      expect(getNextTier('free')).toBe('lite');
    });

    it('lite upgrades to pro', () => {
      expect(getNextTier('lite')).toBe('pro');
    });

    it('pro has no next tier', () => {
      expect(getNextTier('pro')).toBeNull();
    });

    it('unknown tier returns null', () => {
      expect(getNextTier('nonexistent')).toBeNull();
    });
  });
});
