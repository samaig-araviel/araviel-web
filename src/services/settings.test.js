import { describe, it, expect } from 'vitest';
import { DEFAULT_SETTINGS } from './settings';

// We test the DEFAULT_SETTINGS shape and values.
// The toSnakeCase/toCamelCase functions are not exported, but are tested
// implicitly through the async functions. We test what we can without network.

describe('settings service', () => {
  describe('DEFAULT_SETTINGS', () => {
    it('has all expected keys', () => {
      const expectedKeys = [
        'displayName',
        'bio',
        'preferredLanguage',
        'responseTone',
        'customInstructions',
        'occupation',
        'expertise',
        'answerFont',
        'sendWithEnter',
        'defaultModel',
        'enableReasoning',
        'webSearchDefault',
        'imageQualityDefault',
        'enableFollowUps',
        'locationMetadata',
        'notifyNewFeatures',
        'notifyUsageLimits',
        'usageLimitThresholds',
        'avatarUrl',
        'fullName',
        'phone',
        'website',
        'location',
      ];

      for (const key of expectedKeys) {
        expect(DEFAULT_SETTINGS).toHaveProperty(key);
      }
    });

    it('has sensible defaults', () => {
      expect(DEFAULT_SETTINGS.displayName).toBe('User');
      expect(DEFAULT_SETTINGS.preferredLanguage).toBe('English');
      expect(DEFAULT_SETTINGS.responseTone).toBe('default');
      expect(DEFAULT_SETTINGS.answerFont).toBe('system');
      expect(DEFAULT_SETTINGS.defaultModel).toBe('auto');
      expect(DEFAULT_SETTINGS.imageQualityDefault).toBe('standard');
      expect(DEFAULT_SETTINGS.webSearchDefault).toBe('auto');
    });

    it('has boolean settings with correct defaults', () => {
      expect(DEFAULT_SETTINGS.sendWithEnter).toBe(true);
      expect(DEFAULT_SETTINGS.enableReasoning).toBe(false);
      expect(DEFAULT_SETTINGS.enableFollowUps).toBe(true);
      expect(DEFAULT_SETTINGS.locationMetadata).toBe(false);
      expect(DEFAULT_SETTINGS.notifyNewFeatures).toBe(true);
      expect(DEFAULT_SETTINGS.notifyUsageLimits).toBe(true);
    });

    it('has empty string defaults for profile fields', () => {
      expect(DEFAULT_SETTINGS.bio).toBe('');
      expect(DEFAULT_SETTINGS.customInstructions).toBe('');
      expect(DEFAULT_SETTINGS.occupation).toBe('');
      expect(DEFAULT_SETTINGS.expertise).toBe('');
      expect(DEFAULT_SETTINGS.avatarUrl).toBe('');
      expect(DEFAULT_SETTINGS.fullName).toBe('');
      expect(DEFAULT_SETTINGS.phone).toBe('');
      expect(DEFAULT_SETTINGS.website).toBe('');
      expect(DEFAULT_SETTINGS.location).toBe('');
    });

    it('has sensible threshold defaults for usage limit warnings', () => {
      expect(Array.isArray(DEFAULT_SETTINGS.usageLimitThresholds)).toBe(true);
      expect(DEFAULT_SETTINGS.usageLimitThresholds.length).toBeGreaterThan(0);
      for (const t of DEFAULT_SETTINGS.usageLimitThresholds) {
        expect(t).toBeGreaterThan(0);
        expect(t).toBeLessThanOrEqual(100);
      }
    });
  });
});
