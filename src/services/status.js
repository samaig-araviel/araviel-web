import { getAuthHeaders } from './authHeaders';

const API_BASE =
  import.meta.env.VITE_ARAVIEL_API_BASE ||
  (import.meta.env.DEV ? '' : 'https://araviel-api.vercel.app');

/**
 * Fetch current status for all providers and platform services.
 * @returns {Promise<{ providers, platform, overall, timestamp }>}
 */
export async function fetchProviderStatus() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/status`, { headers });
  if (!res.ok) throw new Error(`Failed to fetch status: ${res.status}`);
  return res.json();
}

/**
 * Fetch historical status data for charting.
 * @param {object} params
 * @param {string} [params.provider] - Provider name filter
 * @param {number} [params.hours] - Hours of history (default 24)
 * @param {'provider'|'platform'} [params.type] - Data type
 * @param {string} [params.service] - Platform service filter
 * @returns {Promise<{ type, hours, data: Array }>}
 */
export async function fetchStatusHistory({
  provider,
  hours = 24,
  type = 'provider',
  service,
} = {}) {
  const headers = await getAuthHeaders();
  const query = new URLSearchParams({ type, hours: String(hours) });
  if (provider) query.set('provider', provider);
  if (service) query.set('service', service);

  const res = await fetch(`${API_BASE}/api/status/history?${query}`, { headers });
  if (!res.ok) throw new Error(`Failed to fetch status history: ${res.status}`);
  return res.json();
}
