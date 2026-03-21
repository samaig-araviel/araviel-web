/**
 * Guest session management — tracks prompt usage for anonymous (guest) users.
 *
 * Guest users are allowed a limited number of prompts before they must sign up.
 * The count is stored in localStorage and resets when the user signs in.
 */

const GUEST_PROMPT_COUNT_KEY = 'araviel-guest-prompt-count';

/** Maximum prompts a guest user can send before being required to sign up. */
export const GUEST_PROMPT_LIMIT = 2;

/** Get the number of prompts the guest has already sent. */
export function getGuestPromptCount() {
  const count = localStorage.getItem(GUEST_PROMPT_COUNT_KEY);
  return count ? parseInt(count, 10) : 0;
}

/** Increment the guest prompt count by 1. */
export function incrementGuestPromptCount() {
  const current = getGuestPromptCount();
  localStorage.setItem(GUEST_PROMPT_COUNT_KEY, String(current + 1));
}

/** Check whether the guest has reached their prompt limit. */
export function hasReachedGuestLimit() {
  return getGuestPromptCount() >= GUEST_PROMPT_LIMIT;
}

/** Get remaining prompts for the guest. */
export function getRemainingGuestPrompts() {
  return Math.max(0, GUEST_PROMPT_LIMIT - getGuestPromptCount());
}

/** Reset the guest prompt count (called when user signs up or signs in). */
export function resetGuestPromptCount() {
  localStorage.removeItem(GUEST_PROMPT_COUNT_KEY);
}
