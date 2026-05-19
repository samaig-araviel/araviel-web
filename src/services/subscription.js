import { getAuthHeaders } from './authHeaders';

const API_BASE =
  import.meta.env.VITE_ARAVIEL_API_BASE ||
  (import.meta.env.DEV ? '' : 'https://araviel-api.vercel.app');

/**
 * Fetch the current user's subscription and daily credit status.
 * @returns {Promise<{ tier, status, billingInterval, credits: { used, limit, bonus }, periodEnd, cancelAtPeriodEnd, firstMonth }>}
 */
export async function fetchSubscription() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/subscription`, { headers });
  if (!res.ok) throw new Error(`Failed to fetch subscription: ${res.status}`);
  return res.json();
}

/**
 * Create a Stripe Checkout session for subscribing.
 * @param {string} tier - 'lite' or 'pro'
 * @param {string} interval - 'monthly' or 'annual'
 * @returns {Promise<{ url: string }>}
 */
export async function createCheckoutSession(tier, interval) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/stripe/checkout`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ tier, interval }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Checkout failed (${res.status}): ${text}`);
  }
  return res.json();
}

/**
 * Create a Stripe Checkout session for a credit pack.
 * @param {string} packType - 'starter', 'creator', or 'studio'
 * @returns {Promise<{ url: string }>}
 */
export async function createPackCheckoutSession(packType) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/stripe/checkout-pack`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ packType }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Pack checkout failed (${res.status}): ${text}`);
  }
  return res.json();
}

/**
 * Create a Stripe Billing Portal session.
 * @returns {Promise<{ url: string }>}
 */
export async function createPortalSession() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/stripe/portal`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Portal failed (${res.status}): ${text}`);
  }
  return res.json();
}
