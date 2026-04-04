import { describe, it, expect } from 'vitest';
import { getCreditCost } from './credits';

// Only test pure functions — async functions require network mocking

describe('credits service', () => {
  describe('getCreditCost', () => {
    it('returns 1 for standard quality', () => {
      expect(getCreditCost('standard')).toBe(1);
    });

    it('returns 2 for hd quality', () => {
      expect(getCreditCost('hd')).toBe(2);
    });

    it('returns 4 for ultra quality', () => {
      expect(getCreditCost('ultra')).toBe(4);
    });

    it('defaults to standard cost for unknown quality', () => {
      expect(getCreditCost('unknown')).toBe(1);
    });

    it('defaults to standard cost when called with no argument', () => {
      expect(getCreditCost()).toBe(1);
    });
  });
});
