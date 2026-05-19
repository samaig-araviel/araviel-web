import { getAuthHeaders } from './authHeaders';

const API_BASE =
  import.meta.env.VITE_ARAVIEL_API_BASE ||
  (import.meta.env.DEV ? '' : 'https://araviel-api.vercel.app');

const SUBSCRIPTION_RETRY_DELAY_MS = 500;

async function fetchSubscriptionOnce() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/subscription`, { headers });
  if (!res.ok) {
    const err = new Error(`Failed to fetch subscription: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/**
 * Fetch the current user's subscription and daily credit status.
 *
 * Transient failures (network errors, 5xx, 408, 429) are retried once after
 * a short delay. Client-class failures (401/403/404 and other 4xx) surface
 * immediately — retrying won't change a permanent rejection, and masking a
 * 401 as transient would hide token problems from the caller.
 *
 * @returns {Promise<{ tier, status, billingInterval, periodEnd, cancelAtPeriodEnd, firstMonth, textCredits, imageCredits }>}
 */
export async function fetchSubscription() {
  try {
    return await fetchSubscriptionOnce();
  } catch (err) {
    const status = err?.status;
    const isTransient =
      status === undefined ||
      status === 408 ||
      status === 429 ||
      status >= 500;
    if (!isTransient) throw err;
    await new Promise((resolve) => setTimeout(resolve, SUBSCRIPTION_RETRY_DELAY_MS));
    return fetchSubscriptionOnce();
  }
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
