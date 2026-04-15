// Image generation service — manages limits, storage, and tracking
import { getAuthHeaders } from './authHeaders';
import { logger } from '../lib/logger';

const API_BASE =
  import.meta.env.VITE_ARAVIEL_API_BASE ||
  (import.meta.env.DEV ? '' : 'https://araviel-api.vercel.app');

const LIMITS_KEY = 'araviel-image-gen-limits';

// In-memory cache of gallery images (refreshed from API)
let _cachedImages = null;
let _cacheTimestamp = 0;
const CACHE_TTL = 30_000; // 30 seconds

/**
 * Clear the in-memory image cache. Must be called on sign-out
 * to prevent leaking images between user sessions.
 */
export function clearImageCache() {
  _cachedImages = null;
  _cacheTimestamp = 0;
}

// Limits per tier per 24 hours
const TIER_LIMITS = {
  free: 2,
  lite: 5,
  pro: 10,
};

/**
 * Get the current image generation limit for the user's tier.
 */
export function getImageLimit(tier = 'free') {
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
export function getRemainingGenerations(tier = 'free') {
  const usage = getUsageRecord();
  const limit = getImageLimit(tier);
  return Math.max(0, limit - usage.count);
}

/**
 * Check whether the user can generate an image.
 */
export function canGenerateImage(tier = 'free') {
  return getRemainingGenerations(tier) > 0;
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
export function getLimitInfo(tier = 'free') {
  const limit = getImageLimit(tier);
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
 * Notify the gallery that a new image was saved (for real-time UI updates).
 * The image data comes from the backend's image_generation SSE event —
 * it already has a public URL (not base64) after being uploaded to Supabase Storage.
 */
export function saveGeneratedImage(image) {
  const entry = {
    id: image.id || `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    url: image.url,
    prompt: image.prompt || '',
    model: image.model || 'unknown',
    provider: image.provider || 'unknown',
    createdAt: Date.now(),
    size: image.size || null,
    style: image.style || null,
    messageId: image.messageId || null,
  };

  // Add to in-memory cache for instant gallery update
  if (_cachedImages) {
    const isDuplicate = _cachedImages.some(
      (existing) =>
        existing.id === entry.id || (existing.url === entry.url && existing.prompt === entry.prompt)
    );
    if (!isDuplicate) {
      _cachedImages.unshift(entry);
    }
  }

  // Notify any listeners (e.g. ImageGalleryView) about the new image
  window.dispatchEvent(new CustomEvent('araviel-image-saved', { detail: entry }));
  return entry;
}

/**
 * Fetch generated images from the API (with in-memory cache).
 * Returns array of image objects sorted newest first.
 */
export async function fetchGeneratedImagesFromAPI({ limit = 50, offset = 0 } = {}) {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/api/images?limit=${limit}&offset=${offset}`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const images = (data.images || []).map((img) => ({
      id: img.id,
      url: img.url,
      prompt: img.prompt || '',
      model: img.model || 'unknown',
      provider: img.provider || 'unknown',
      createdAt: img.createdAt ? new Date(img.createdAt).getTime() : Date.now(),
      size: img.size || null,
      style: img.style || null,
      messageId: img.messageId || null,
      conversationId: img.conversationId || null,
    }));
    // Update cache
    if (offset === 0) {
      _cachedImages = images;
      _cacheTimestamp = Date.now();
    }
    return images;
  } catch (err) {
    logger.error('Failed to fetch generated images', err, {
      route: 'images.list',
    });
    // Fallback to cache if available
    return _cachedImages || [];
  }
}

/**
 * Get generated images — uses in-memory cache if fresh, otherwise fetches from API.
 * This is the synchronous-compatible version used by the gallery.
 * Returns cached images immediately; call fetchGeneratedImagesFromAPI() for fresh data.
 */
export function getGeneratedImages() {
  return _cachedImages || [];
}

/**
 * Delete a generated image by ID via API.
 */
export async function deleteGeneratedImage(imageId) {
  // Optimistically remove from cache
  if (_cachedImages) {
    _cachedImages = _cachedImages.filter((img) => img.id !== imageId);
  }

  try {
    const headers = await getAuthHeaders();
    await fetch(`${API_BASE}/api/images`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ id: imageId }),
    });
  } catch {
    // Silently fail — image may already be deleted
  }
}
