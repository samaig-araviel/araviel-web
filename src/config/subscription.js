// Subscription tier configuration: single source of truth for all pricing display

export const SubscriptionTier = {
  Free: 'free',
  Lite: 'lite',
  Pro: 'pro',
};

export const FeatureCategory = {
  Models: 'Models',
  Credits: 'Credits & Usage',
  ADE: 'ADE Routing',
  Features: 'Features',
};

export const ModelAccessLevel = {
  Budget: 'budget',
  MidTier: 'mid_tier',
  Flagship: 'flagship',
  FlagshipPlus: 'flagship_plus',
};

export const SUBSCRIPTION_TIERS = [
  {
    id: SubscriptionTier.Free,
    name: 'Free',
    tagline: 'Experience the ADE',
    monthlyPrice: 0,
    annualPricePerMonth: 0,
    annualTotal: 0,
    currency: 'GBP',
    monthlyTextCredits: 100,
    windowCredits: 8,
    monthlyImageCredits: 5,
    firstMonthBonusCredits: 0,
    modelCount: 19,
    providerCount: 6,
    highlighted: false,
    available: true,
    ctaText: 'Get Started Free',
    modelAccess: ModelAccessLevel.Budget,
    features: [
      { name: 'Monthly credits', value: '100', category: FeatureCategory.Credits },
      { name: 'Per 3hr window', value: '8', category: FeatureCategory.Credits },
      { name: 'First month bonus', value: false, category: FeatureCategory.Credits },
      { name: 'Credit top-ups', value: false, category: FeatureCategory.Credits },
      { name: 'Models', value: '19', category: FeatureCategory.Models },
      { name: 'Providers', value: '6', category: FeatureCategory.Models },
      { name: 'Model tiers', value: 'Budget only', category: FeatureCategory.Models },
      { name: 'Manual model selection', value: false, category: FeatureCategory.Models },
      { name: 'ADE routing', value: 'Basic', category: FeatureCategory.ADE },
      { name: 'Routing transparency', value: false, category: FeatureCategory.ADE },
      { name: 'Chat history', value: '3-day rolling', category: FeatureCategory.Features },
      { name: 'Projects', value: '1 project', category: FeatureCategory.Features },
      { name: 'Conversations per project', value: '5', category: FeatureCategory.Features },
      { name: 'File uploads', value: false, category: FeatureCategory.Features },
      { name: 'Web search', value: 'Basic (Sonar)', category: FeatureCategory.Features },
      { name: 'Image generation', value: 'Basic', category: FeatureCategory.Features },
      { name: 'Voice (TTS/STT)', value: 'Basic', category: FeatureCategory.Features },
      { name: 'Thinking mode', value: false, category: FeatureCategory.Features },
      { name: 'Deep research', value: false, category: FeatureCategory.Features },
      { name: 'Chat search', value: false, category: FeatureCategory.Features },
      { name: 'Quick prompts', value: false, category: FeatureCategory.Features },
    ],
  },
  {
    id: SubscriptionTier.Lite,
    name: 'Lite',
    tagline: 'All the AIs, one price',
    monthlyPrice: 9.99,
    annualPricePerMonth: 7.99,
    annualTotal: 95.88,
    currency: 'GBP',
    monthlyTextCredits: 1500,
    windowCredits: 60,
    monthlyImageCredits: 50,
    firstMonthBonusCredits: 2250,
    modelCount: 31,
    providerCount: 6,
    highlighted: true,
    available: true,
    ctaText: 'Upgrade to Lite',
    modelAccess: ModelAccessLevel.MidTier,
    features: [
      { name: 'Monthly credits', value: '1,500', category: FeatureCategory.Credits },
      { name: 'Per 3hr window', value: '60', category: FeatureCategory.Credits },
      {
        name: 'First month bonus',
        value: '+50% credits (2,250/month)',
        category: FeatureCategory.Credits,
      },
      { name: 'Credit top-ups', value: '£0.012/credit', category: FeatureCategory.Credits },
      { name: 'Models', value: '31', category: FeatureCategory.Models },
      { name: 'Providers', value: '6', category: FeatureCategory.Models },
      { name: 'Model tiers', value: 'Budget + Mid-tier', category: FeatureCategory.Models },
      { name: 'Manual model selection', value: true, category: FeatureCategory.Models },
      { name: 'ADE routing', value: 'Full (cost-optimised)', category: FeatureCategory.ADE },
      { name: 'Routing transparency', value: false, category: FeatureCategory.ADE },
      { name: 'Chat history', value: '30-day rolling', category: FeatureCategory.Features },
      { name: 'Projects', value: '4 projects', category: FeatureCategory.Features },
      { name: 'Conversations per project', value: 'Unlimited', category: FeatureCategory.Features },
      { name: 'File uploads', value: '3 per conversation', category: FeatureCategory.Features },
      { name: 'Web search', value: 'Full', category: FeatureCategory.Features },
      { name: 'Image generation', value: 'Premium', category: FeatureCategory.Features },
      { name: 'Voice (TTS/STT)', value: 'Full', category: FeatureCategory.Features },
      { name: 'Thinking mode', value: false, category: FeatureCategory.Features },
      { name: 'Deep research', value: 'o4-mini', category: FeatureCategory.Features },
      { name: 'Chat search', value: false, category: FeatureCategory.Features },
      { name: 'Quick prompts', value: true, category: FeatureCategory.Features },
    ],
  },
  {
    id: SubscriptionTier.Pro,
    name: 'Pro',
    tagline: 'Every major AI, one subscription',
    monthlyPrice: 19.99,
    fullMonthlyPrice: 24.99, // standard price after launch
    annualPricePerMonth: 15.99,
    fullAnnualPricePerMonth: 19.99, // standard annual price after launch
    annualTotal: 191.88,
    fullAnnualTotal: 239.88, // standard annual total after launch
    currency: 'GBP',
    monthlyTextCredits: 4000,
    windowCredits: 160,
    monthlyImageCredits: 150,
    firstMonthBonusCredits: 6000,
    modelCount: 41,
    providerCount: 6,
    highlighted: false,
    available: true,
    isLaunchOffer: true,
    launchSpotsTotal: 100,
    ctaText: 'Upgrade to Pro',
    modelAccess: ModelAccessLevel.Flagship,
    features: [
      { name: 'Monthly credits', value: '4,000', category: FeatureCategory.Credits },
      { name: 'Per 3hr window', value: '160', category: FeatureCategory.Credits },
      {
        name: 'First month bonus',
        value: '+50% credits (6,000/month)',
        category: FeatureCategory.Credits,
      },
      { name: 'Credit top-ups', value: '£0.010/credit', category: FeatureCategory.Credits },
      { name: 'Models', value: '41', category: FeatureCategory.Models },
      { name: 'Providers', value: '6', category: FeatureCategory.Models },
      { name: 'Model tiers', value: 'All incl. flagships', category: FeatureCategory.Models },
      { name: 'Manual model selection', value: true, category: FeatureCategory.Models },
      { name: 'ADE routing', value: 'Full (quality-optimised)', category: FeatureCategory.ADE },
      { name: 'Routing transparency', value: true, category: FeatureCategory.ADE },
      { name: 'Chat history', value: 'Unlimited', category: FeatureCategory.Features },
      { name: 'Projects', value: 'Unlimited', category: FeatureCategory.Features },
      { name: 'Conversations per project', value: 'Unlimited', category: FeatureCategory.Features },
      { name: 'File uploads', value: 'Unlimited', category: FeatureCategory.Features },
      { name: 'Web search', value: 'Full + Sonar Pro', category: FeatureCategory.Features },
      { name: 'Image generation', value: 'Premium', category: FeatureCategory.Features },
      { name: 'Voice (TTS/STT)', value: 'Full', category: FeatureCategory.Features },
      { name: 'Thinking mode', value: true, category: FeatureCategory.Features },
      { name: 'Deep research', value: 'Full (o3)', category: FeatureCategory.Features },
      { name: 'Chat search', value: true, category: FeatureCategory.Features },
      { name: 'Quick prompts', value: true, category: FeatureCategory.Features },
    ],
  },
];

// Helper: get only tiers visible at launch
export function getAvailableTiers() {
  return SUBSCRIPTION_TIERS.filter((t) => t.available);
}

// Helper: get tier config by id
export function getTierById(tierId) {
  return SUBSCRIPTION_TIERS.find((t) => t.id === tierId);
}

// Helper: get display price
export function getDisplayPrice(tier, billingCycle) {
  if (tier.monthlyPrice === 0) return 0;
  return billingCycle === 'annual' ? tier.annualPricePerMonth : tier.monthlyPrice;
}

// Helper: get annual savings percentage
export function getAnnualSavings(tier) {
  if (tier.monthlyPrice === 0) return 0;
  return Math.round((1 - tier.annualPricePerMonth / tier.monthlyPrice) * 100);
}

// Feature comparison rows for the table (ordered for display)
export const COMPARISON_FEATURES = [
  // Credits & Usage
  { name: 'Monthly credits', category: FeatureCategory.Credits },
  { name: 'Per 3hr window', category: FeatureCategory.Credits },
  { name: 'First month bonus', category: FeatureCategory.Credits },
  { name: 'Credit top-ups', category: FeatureCategory.Credits },
  // Models
  { name: 'Models', category: FeatureCategory.Models },
  { name: 'Providers', category: FeatureCategory.Models },
  { name: 'Model tiers', category: FeatureCategory.Models },
  { name: 'Manual model selection', category: FeatureCategory.Models },
  // ADE Routing
  { name: 'ADE routing', category: FeatureCategory.ADE },
  { name: 'Routing transparency', category: FeatureCategory.ADE },
  // Features
  { name: 'Chat history', category: FeatureCategory.Features },
  { name: 'Projects', category: FeatureCategory.Features },
  { name: 'Conversations per project', category: FeatureCategory.Features },
  { name: 'File uploads', category: FeatureCategory.Features },
  { name: 'Web search', category: FeatureCategory.Features },
  { name: 'Image generation', category: FeatureCategory.Features },
  { name: 'Voice (TTS/STT)', category: FeatureCategory.Features },
  { name: 'Thinking mode', category: FeatureCategory.Features },
  { name: 'Deep research', category: FeatureCategory.Features },
  { name: 'Chat search', category: FeatureCategory.Features },
  { name: 'Quick prompts', category: FeatureCategory.Features },
];

// Tier ordering for comparison (higher index = higher tier)
export const TIER_ORDER = [SubscriptionTier.Free, SubscriptionTier.Lite, SubscriptionTier.Pro];

export function isUpgrade(fromTier, toTier) {
  return TIER_ORDER.indexOf(toTier) > TIER_ORDER.indexOf(fromTier);
}

export function isDowngrade(fromTier, toTier) {
  return TIER_ORDER.indexOf(toTier) < TIER_ORDER.indexOf(fromTier);
}

// Project limits by tier
const PROJECT_LIMITS = {
  [SubscriptionTier.Free]: 1,
  [SubscriptionTier.Lite]: 4,
  [SubscriptionTier.Pro]: Infinity,
};

export function getProjectLimit(tierId) {
  return PROJECT_LIMITS[tierId] ?? 1;
}

// Next tier for upgrade suggestions
const NEXT_TIER_MAP = {
  [SubscriptionTier.Free]: SubscriptionTier.Lite,
  [SubscriptionTier.Lite]: SubscriptionTier.Pro,
  [SubscriptionTier.Pro]: null,
};

export function getNextTier(tierId) {
  return NEXT_TIER_MAP[tierId] ?? null;
}

// CTA label for the top-nav upgrade button. Returns null when the user is
// already on the highest tier and no upgrade is available.
const UPGRADE_CTA_LABELS = {
  [SubscriptionTier.Free]: 'Upgrade',
  [SubscriptionTier.Lite]: 'Go Pro',
  [SubscriptionTier.Pro]: null,
};

export function getUpgradeCtaLabel(tierId) {
  // Treat unknown / missing tiers as Free so newly-logged-in users immediately
  // see the Upgrade CTA before their subscription has been fetched.
  if (!tierId) return UPGRADE_CTA_LABELS[SubscriptionTier.Free];
  return UPGRADE_CTA_LABELS[tierId] ?? null;
}
