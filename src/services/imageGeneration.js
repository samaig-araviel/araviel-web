// Image generation service — manages limits, storage, and tracking
import { getUserTier } from '../data/models';

const STORAGE_KEY = 'araviel-generated-images';
const LIMITS_KEY = 'araviel-image-gen-limits';

// Limits per tier per 24 hours
const TIER_LIMITS = {
  free: 2,
  pro: 10,
};

/**
 * Get the current image generation limit for the user's tier.
 */
export function getImageLimit() {
  const tier = getUserTier();
  return TIER_LIMITS[tier] || TIER_LIMITS.free;
}

/**
 * Get the usage record (reset after 24 hours).
 */
function getUsageRecord() {
  try {
    const raw = localStorage.getItem(LIMITS_KEY);
    if (!raw) return { count: 0, resetAt: 0 };
    const data = JSON.parse(raw);
    // Auto-reset after 24 hours
    if (Date.now() > data.resetAt) {
      return { count: 0, resetAt: 0 };
    }
    return data;
  } catch {
    return { count: 0, resetAt: 0 };
  }
}

/**
 * Get remaining image generation count for this 24-hour window.
 */
export function getRemainingGenerations() {
  const usage = getUsageRecord();
  const limit = getImageLimit();
  return Math.max(0, limit - usage.count);
}

/**
 * Check whether the user can generate an image.
 */
export function canGenerateImage() {
  return getRemainingGenerations() > 0;
}

/**
 * Record that one image was generated — updates the limit counter.
 */
export function recordGeneration() {
  const usage = getUsageRecord();
  const now = Date.now();
  const newUsage = {
    count: usage.count + 1,
    resetAt: usage.resetAt || now + 24 * 60 * 60 * 1000,
  };
  localStorage.setItem(LIMITS_KEY, JSON.stringify(newUsage));
}

/**
 * Get info about the limit status (for UI display).
 */
export function getLimitInfo() {
  const tier = getUserTier();
  const limit = getImageLimit();
  const usage = getUsageRecord();
  const remaining = Math.max(0, limit - usage.count);
  const resetAt = usage.resetAt || 0;

  return {
    tier,
    limit,
    used: usage.count,
    remaining,
    resetAt,
    isAtLimit: remaining <= 0,
  };
}

/**
 * Save a generated image to local storage.
 * Handles localStorage quota errors by evicting oldest images when needed.
 */
export function saveGeneratedImage(image) {
  // Always read fresh from storage right before writing to avoid stale reads
  const images = getGeneratedImages();
  const entry = {
    id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    url: image.url,
    prompt: image.prompt || '',
    model: image.model || 'unknown',
    provider: image.provider || 'unknown',
    createdAt: Date.now(),
    size: image.size || null,
    style: image.style || null,
    messageId: image.messageId || null,
  };

  // Prevent duplicate saves — skip if same URL + prompt already exists recently
  const isDuplicate = images.some(
    (existing) =>
      existing.url === entry.url &&
      existing.prompt === entry.prompt &&
      Date.now() - existing.createdAt < 5000
  );
  if (isDuplicate) {
    // Already saved — still dispatch event for UI sync but don't re-save
    window.dispatchEvent(new CustomEvent('araviel-image-saved', { detail: entry }));
    return images.find((e) => e.url === entry.url) || entry;
  }

  images.unshift(entry);
  // Keep max 100 images
  if (images.length > 100) images.length = 100;

  // Attempt to persist — evict oldest entries if localStorage quota is exceeded
  let saved = false;
  const toSave = [...images];
  while (toSave.length > 0) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      saved = true;
      break;
    } catch {
      // QuotaExceededError — remove oldest image and retry
      toSave.pop();
    }
  }

  if (!saved) {
    // Last resort: store only the new entry
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([entry]));
    } catch {
      // localStorage completely unavailable — proceed without persistence
    }
  }

  // Notify any listeners (e.g. ImageGalleryView) about the new image
  window.dispatchEvent(new CustomEvent('araviel-image-saved', { detail: entry }));
  return entry;
}

/**
 * Get all locally stored generated images.
 */
export function getGeneratedImages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Delete a generated image by ID.
 */
export function deleteGeneratedImage(imageId) {
  const images = getGeneratedImages().filter((img) => img.id !== imageId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(images));
}
