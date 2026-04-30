/**
 * Shape adapters between raw Supabase Auth objects and the slim user/session
 * shape we put into Redux.
 *
 * Centralised here because both the auth slice (`store/slices/authSlice.js`)
 * and the auth listener hook (`hooks/useAuthListener.js`) need the same
 * mapping — letting them drift produces extremely subtle bugs around the
 * email-confirmation gate, which keys on `email_confirmed_at`.
 *
 * @typedef {Object} AppUser
 * @property {string}      id
 * @property {string|null} email
 * @property {boolean}     isAnonymous
 * @property {string|null} emailConfirmedAt   ISO timestamp Supabase set when
 *                                            the user clicked their confirmation
 *                                            link. Null until then. This is the
 *                                            single source of truth for "really
 *                                            authenticated" — `is_anonymous`
 *                                            alone is not enough because a
 *                                            converted anonymous-to-email user
 *                                            has `is_anonymous=false` while
 *                                            their email is still pending.
 * @property {string|null} avatarUrl
 * @property {string|null} fullName
 *
 * @typedef {Object} AppSession
 * @property {string} access_token
 * @property {string} refresh_token
 * @property {number} expires_at
 */

/**
 * Map a raw Supabase user object into the app's `AppUser` shape.
 * Returns null when given a falsy input.
 */
export function mapUser(supabaseUser) {
  if (!supabaseUser) return null;
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || null,
    isAnonymous: supabaseUser.is_anonymous || false,
    emailConfirmedAt: supabaseUser.email_confirmed_at || null,
    avatarUrl: supabaseUser.user_metadata?.avatar_url || null,
    fullName:
      supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.display_name || null,
  };
}

/**
 * Map a raw Supabase session into the minimal `AppSession` shape we keep in
 * Redux. We deliberately do NOT mirror the entire Supabase session — the JS
 * client owns refresh/expiry; we only need the fields downstream services
 * read.
 */
export function mapSession(session) {
  if (!session) return null;
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
  };
}

/**
 * `true` iff the user is fully authenticated — non-anonymous AND has a
 * confirmed email. This is the predicate the rest of the app should use.
 */
export function isFullyAuthenticated(user) {
  return Boolean(user) && !user.isAnonymous && Boolean(user.emailConfirmedAt);
}

/**
 * `true` iff the user has signed up with an email but has not yet clicked
 * the confirmation link. We use the user object's own state (rather than a
 * separate flag in Redux) so the predicate stays correct across reloads —
 * Supabase rehydrates the user from localStorage, and `email_confirmed_at`
 * is the persistent signal we rely on.
 */
export function hasPendingEmailVerification(user) {
  return Boolean(user) && Boolean(user.email) && !user.emailConfirmedAt;
}
