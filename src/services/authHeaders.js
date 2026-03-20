import { supabase } from '../lib/supabase';

/**
 * Get authorization headers for API requests.
 * Reads the current session token from Supabase and returns
 * headers including the Bearer token.
 *
 * Always call this fresh before each request — never cache the token,
 * as Supabase auto-refreshes expired tokens.
 */
export async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = {
    'Content-Type': 'application/json',
  };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
}
