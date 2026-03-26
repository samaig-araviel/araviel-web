/**
 * Guest session management — tracks prompt usage for anonymous (guest) users.
 *
 * Guest users are allowed a limited number of prompts before they must sign up.
 * The count is stored in localStorage and resets when the user signs in.
 */

const GUEST_PROMPT_COUNT_KEY = 'araviel-guest-prompt-count';
const GUEST_IMAGE_COUNT_KEY = 'araviel-guest-image-count';

/** Maximum text prompts a guest user can send before being required to sign up. */
export const GUEST_PROMPT_LIMIT = 3;

/** Guests cannot generate images — must sign up first. */
export const GUEST_IMAGE_LIMIT = 0;

// ── Text prompts ──

/** Get the number of text prompts the guest has already sent. */
export function getGuestPromptCount() {
  const count = localStorage.getItem(GUEST_PROMPT_COUNT_KEY);
  return count ? parseInt(count, 10) : 0;
}

/** Increment the guest text prompt count by 1. */
export function incrementGuestPromptCount() {
  const current = getGuestPromptCount();
  localStorage.setItem(GUEST_PROMPT_COUNT_KEY, String(current + 1));
}

/** Check whether the guest has reached their text prompt limit. */
export function hasReachedGuestLimit() {
  return getGuestPromptCount() >= GUEST_PROMPT_LIMIT;
}

/** Get remaining text prompts for the guest. */
export function getRemainingGuestPrompts() {
  return Math.max(0, GUEST_PROMPT_LIMIT - getGuestPromptCount());
}

// ── Image prompts ──

/** Get the number of image prompts the guest has already sent. */
export function getGuestImageCount() {
  const count = localStorage.getItem(GUEST_IMAGE_COUNT_KEY);
  return count ? parseInt(count, 10) : 0;
}

/** Increment the guest image prompt count by 1. */
export function incrementGuestImageCount() {
  const current = getGuestImageCount();
  localStorage.setItem(GUEST_IMAGE_COUNT_KEY, String(current + 1));
}

/** Check whether the guest has reached their image prompt limit. */
export function hasReachedGuestImageLimit() {
  return getGuestImageCount() >= GUEST_IMAGE_LIMIT;
}

/** Get remaining image prompts for the guest. */
export function getRemainingGuestImages() {
  return Math.max(0, GUEST_IMAGE_LIMIT - getGuestImageCount());
}

// ── Reset ──

/** Reset all guest prompt counts (called when user signs up or signs in). */
export function resetGuestPromptCount() {
  localStorage.removeItem(GUEST_PROMPT_COUNT_KEY);
  localStorage.removeItem(GUEST_IMAGE_COUNT_KEY);
}
