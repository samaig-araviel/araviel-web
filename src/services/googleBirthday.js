/**
 * Fetch the signed-in user's birthday from the Google People API.
 *
 * Requires the `https://www.googleapis.com/auth/user.birthday.read`
 * scope to have been requested during OAuth consent. The token used
 * here is `session.provider_token` — Supabase only exposes that on
 * the very first SIGNED_IN event after the Google OAuth redirect, so
 * the caller must capture it then.
 *
 * Returns an ISO `yyyy-mm-dd` string only when Google has the full
 * date (year + month + day). When the year is missing — Google lets
 * users enter just month/day — we return null so the caller can fall
 * back to the manual /signup/verify-age step instead of trying to
 * compute an age from a partial date.
 *
 * @param {string} providerAccessToken Google OAuth access token.
 * @returns {Promise<string|null>}
 */
export async function fetchGoogleBirthday(providerAccessToken) {
  if (!providerAccessToken) return null;
  try {
    const response = await fetch(
      'https://people.googleapis.com/v1/people/me?personFields=birthdays',
      {
        headers: { Authorization: `Bearer ${providerAccessToken}` },
      }
    );
    if (!response.ok) return null;
    const json = await response.json();
    const birthdays = Array.isArray(json.birthdays) ? json.birthdays : [];
    if (birthdays.length === 0) return null;

    // Prefer the entry that comes from the user's own profile over any
    // birthdays they might have stored in their address book contacts.
    const entry =
      birthdays.find((b) => b?.metadata?.source?.type === 'PROFILE') ||
      birthdays.find((b) => b?.metadata?.primary) ||
      birthdays[0];

    const date = entry?.date;
    if (!date) return null;
    const { year, month, day } = date;
    if (!year || !month || !day) return null;

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  } catch {
    return null;
  }
}
