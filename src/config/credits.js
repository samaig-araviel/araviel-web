// Credit system configuration — mirrors backend constants

export const TIER_CREDITS = {
  free: 5,
  lite: 50,
  pro: 200,
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
