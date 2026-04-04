import { describe, it, expect, beforeEach } from 'vitest';
import {
  getGuestPromptCount,
  incrementGuestPromptCount,
  hasReachedGuestLimit,
  getRemainingGuestPrompts,
  getGuestImageCount,
  incrementGuestImageCount,
  hasReachedGuestImageLimit,
  getRemainingGuestImages,
  resetGuestPromptCount,
  GUEST_PROMPT_LIMIT,
  GUEST_IMAGE_LIMIT,
} from './guestSession';

describe('guestSession', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('text prompts', () => {
    it('returns 0 when no prompts have been sent', () => {
      expect(getGuestPromptCount()).toBe(0);
    });

    it('increments the prompt count', () => {
      incrementGuestPromptCount();
      expect(getGuestPromptCount()).toBe(1);

      incrementGuestPromptCount();
      expect(getGuestPromptCount()).toBe(2);
    });

    it('reports limit not reached when under limit', () => {
      expect(hasReachedGuestLimit()).toBe(false);
    });

    it('reports limit reached when at the limit', () => {
      for (let i = 0; i < GUEST_PROMPT_LIMIT; i++) {
        incrementGuestPromptCount();
      }
      expect(hasReachedGuestLimit()).toBe(true);
    });

    it('reports limit reached when over the limit', () => {
      for (let i = 0; i < GUEST_PROMPT_LIMIT + 1; i++) {
        incrementGuestPromptCount();
      }
      expect(hasReachedGuestLimit()).toBe(true);
    });

    it('returns correct remaining prompts', () => {
      expect(getRemainingGuestPrompts()).toBe(GUEST_PROMPT_LIMIT);

      incrementGuestPromptCount();
      expect(getRemainingGuestPrompts()).toBe(GUEST_PROMPT_LIMIT - 1);
    });

    it('never returns negative remaining prompts', () => {
      for (let i = 0; i < GUEST_PROMPT_LIMIT + 5; i++) {
        incrementGuestPromptCount();
      }
      expect(getRemainingGuestPrompts()).toBe(0);
    });
  });

  describe('image prompts', () => {
    it('returns 0 when no images have been generated', () => {
      expect(getGuestImageCount()).toBe(0);
    });

    it('increments the image count', () => {
      incrementGuestImageCount();
      expect(getGuestImageCount()).toBe(1);
    });

    it('always reports image limit reached since limit is 0', () => {
      expect(GUEST_IMAGE_LIMIT).toBe(0);
      expect(hasReachedGuestImageLimit()).toBe(true);
    });

    it('returns 0 remaining images', () => {
      expect(getRemainingGuestImages()).toBe(0);
    });
  });

  describe('resetGuestPromptCount', () => {
    it('resets both text and image counts', () => {
      incrementGuestPromptCount();
      incrementGuestPromptCount();
      incrementGuestImageCount();

      resetGuestPromptCount();

      expect(getGuestPromptCount()).toBe(0);
      expect(getGuestImageCount()).toBe(0);
    });

    it('removes the localStorage keys', () => {
      incrementGuestPromptCount();
      resetGuestPromptCount();
      expect(localStorage.removeItem).toHaveBeenCalledWith('araviel-guest-prompt-count');
      expect(localStorage.removeItem).toHaveBeenCalledWith('araviel-guest-image-count');
    });
  });

  describe('constants', () => {
    it('has GUEST_PROMPT_LIMIT of 3', () => {
      expect(GUEST_PROMPT_LIMIT).toBe(3);
    });

    it('has GUEST_IMAGE_LIMIT of 0', () => {
      expect(GUEST_IMAGE_LIMIT).toBe(0);
    });
  });
});
