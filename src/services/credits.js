// Credit service — communicates with /api/credits backend
import { IMAGE_QUALITY_COSTS } from '../config/credits';
import { getAuthHeaders } from './authHeaders';

const API_BASE =
  import.meta.env.VITE_ARAVIEL_API_BASE ||
  (import.meta.env.DEV ? '' : 'https://araviel-api.vercel.app');

/**
 * Get the current user ID from the Supabase session.
 * Falls back to a localStorage-based anonymous ID if no session exists.
 */
export function getUserId() {
  // Try synchronous access first — Supabase stores session in localStorage
  const sessionStr = localStorage.getItem('sb-' + (import.meta.env.VITE_SUPABASE_URL || '').split('//')[1]?.split('.')[0] + '-auth-token');
  if (sessionStr) {
    try {
      const parsed = JSON.parse(sessionStr);
      if (parsed?.user?.id) return parsed.user.id;
    } catch { /* fall through */ }
  }
  // Fallback for pre-auth state
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
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/credits`, { headers });
  if (!res.ok) throw new Error(`Failed to fetch credits: ${res.status}`);
  return res.json();
}

/**
 * Check if user can generate at given quality.
 */
export async function checkCanGenerate(quality = 'standard') {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/credits`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action: 'check', quality }),
  });
  if (!res.ok) throw new Error(`Credit check failed: ${res.status}`);
  return res.json();
}

/**
 * Buy a credit pack (no payment — placeholder for Stripe).
 */
export async function buyPack(packType) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/credits`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action: 'buy-pack', packType }),
  });
  if (!res.ok) throw new Error(`Failed to buy pack: ${res.status}`);
  return res.json();
}

/**
 * Update user tier.
 */
export async function updateUserTier(tier) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/credits`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action: 'update-tier', tier }),
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
