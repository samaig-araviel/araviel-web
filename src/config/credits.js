// Credit system configuration — mirrors backend constants

// ─── Text Credits (monthly + 3-hour window) ─────────────────────────────────

export const TIER_TEXT_CREDITS = {
  free: { monthly: 100, window: 8, firstMonthBonus: 0 },
  lite: { monthly: 1500, window: 60, firstMonthBonus: 750 },
  pro: { monthly: 4000, window: 160, firstMonthBonus: 2000 },
};

// ─── Image Credits (monthly, separate system) ───────────────────────────────

export const TIER_IMAGE_CREDITS = {
  free: 5,
  lite: 50,
  pro: 150,
};

export const IMAGE_QUALITY_COSTS = {
  standard: 1,
  hd: 2,
  ultra: 4,
};

export const IMAGE_QUALITY_OPTIONS = [
  { value: 'standard', label: 'SD', cost: 1 },
  { value: 'hd', label: 'HD', cost: 2 },
  { value: 'ultra', label: 'Ultra', cost: 4 },
];

export const IMAGE_PACKS = {
  starter: { credits: 20, label: 'Starter Pack' },
  creator: { credits: 50, label: 'Creator Pack' },
  studio: { credits: 100, label: 'Studio Pack' },
};

export const PACK_EXPIRY_DAYS = 90;

// ─── Guest Limits ───────────────────────────────────────────────────────────

export const GUEST_TEXT_LIMIT = 3; // lifetime total, not per window/month
export const GUEST_IMAGE_LIMIT = 0; // no image generation for guests
