// Credit service — communicates with /api/credits backend
import { IMAGE_QUALITY_COSTS } from '../config/credits';

const API_BASE =
  import.meta.env.VITE_ARAVIEL_API_BASE ||
  (import.meta.env.DEV ? '' : 'https://araviel-api.vercel.app');

/**
 * Get the current user ID.
 * Until auth is implemented, uses a localStorage-based anonymous ID.
 */
export function getUserId() {
  let userId = localStorage.getItem('araviel-user-id');
  if (!userId) {
    userId = `anon-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem('araviel-user-id', userId);
  }
  return userId;
}

/**
 * Fetch the user's full credit balance from the backend.
 */
export async function fetchCreditBalance() {
  const userId = getUserId();
  const res = await fetch(`${API_BASE}/api/credits?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error(`Failed to fetch credits: ${res.status}`);
  return res.json();
}

/**
 * Check if user can generate at given quality.
 */
export async function checkCanGenerate(quality = 'standard') {
  const userId = getUserId();
  const res = await fetch(`${API_BASE}/api/credits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'check', userId, quality }),
  });
  if (!res.ok) throw new Error(`Credit check failed: ${res.status}`);
  return res.json();
}

/**
 * Buy a credit pack (no payment — placeholder for Stripe).
 */
export async function buyPack(packType) {
  const userId = getUserId();
  const res = await fetch(`${API_BASE}/api/credits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'buy-pack', userId, packType }),
  });
  if (!res.ok) throw new Error(`Failed to buy pack: ${res.status}`);
  return res.json();
}

/**
 * Update user tier.
 */
export async function updateUserTier(tier) {
  const userId = getUserId();
  const res = await fetch(`${API_BASE}/api/credits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update-tier', userId, tier }),
  });
  if (!res.ok) throw new Error(`Failed to update tier: ${res.status}`);
  return res.json();
}

/**
 * Get cost for a quality level (client-side, no network).
 */
export function getCreditCost(quality = 'standard') {
  return IMAGE_QUALITY_COSTS[quality] ?? IMAGE_QUALITY_COSTS.standard;
}
