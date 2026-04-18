/**
 * Conditional auth storage adapter for Supabase.
 *
 * Purpose
 * -------
 * Implements the Supabase `SupportedStorage` interface so the auth client
 * persists session tokens to either `localStorage` or `sessionStorage` based
 * on the user's "Remember me" preference:
 *
 *   - Remember me ON  → localStorage  (survives browser restart)
 *   - Remember me OFF → sessionStorage (cleared when the tab closes)
 *
 * The `SupportedStorage` contract only requires `getItem`, `setItem`, and
 * `removeItem`; everything else is intentionally omitted.
 *
 * Security model
 * --------------
 * Web Storage (both local and session) is accessible to any JavaScript that
 * runs in the page, so neither option defends against an XSS vulnerability.
 * The real mitigations are:
 *   - A strict Content-Security-Policy that blocks untrusted scripts.
 *   - React's default output encoding for all rendered text.
 *   - Keeping third-party scripts out of the auth-bearing origin.
 *
 * What this adapter *does* give us over the Supabase default:
 *   - "Remember me OFF" sessions are dropped when the tab closes, reducing
 *     the blast radius on shared / public computers.
 *   - Tokens live in exactly one storage at a time, so toggling the
 *     preference cannot silently leave a stale copy behind.
 *   - All storage access is wrapped in try/catch, so SSR contexts, private
 *     browsing modes, and quota errors can't crash the auth pipeline.
 *
 * Cross-tab behaviour
 * -------------------
 * Supabase uses the `storage` event for cross-tab sync. That event only
 * fires for `localStorage`, so a "Remember me OFF" session deliberately
 * stays scoped to the tab that created it — which is the expected UX.
 */

import { logger } from './logger';

/** localStorage key that records the most recent Remember-me preference. */
export const REMEMBER_ME_STORAGE_KEY = 'araviel.auth.rememberMe';

/** Default when no preference has been stored yet. */
const DEFAULT_REMEMBER_ME = true;

/**
 * @typedef {'local' | 'session'} StorageMode
 */

/**
 * In-memory mirror of the preference. Supabase calls `getItem` / `setItem`
 * synchronously during bootstrap, so we cannot afford to touch storage on
 * every call. The mirror is seeded from localStorage at module load time
 * and updated by {@link setRememberMePreference}.
 */
let currentMode = /** @type {StorageMode} */ (DEFAULT_REMEMBER_ME ? 'local' : 'session');

/**
 * Safely access a `Storage` instance. Returns `null` when the runtime has
 * no DOM (SSR) or storage access is blocked (private browsing, disabled
 * cookies, iframe sandbox, etc.).
 *
 * @param {StorageMode} mode
 * @returns {Storage | null}
 */
function getStorage(mode) {
  if (typeof window === 'undefined') return null;
  try {
    return mode === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * Read the persisted Remember-me preference.
 *
 * Falls back to {@link DEFAULT_REMEMBER_ME} when storage is unavailable or
 * when no preference has been saved yet.
 *
 * @returns {boolean}
 */
export function getRememberMePreference() {
  const storage = getStorage('local');
  if (!storage) return DEFAULT_REMEMBER_ME;
  try {
    const raw = storage.getItem(REMEMBER_ME_STORAGE_KEY);
    if (raw === null) return DEFAULT_REMEMBER_ME;
    return raw === 'true';
  } catch {
    return DEFAULT_REMEMBER_ME;
  }
}

/**
 * Record the Remember-me preference and update the active storage mode.
 *
 * IMPORTANT: this must be called **before** invoking
 * `supabase.auth.signInWithPassword` (or any other auth call that writes
 * the session) so the storage adapter routes the new session to the
 * correct storage on the first write.
 *
 * @param {boolean} remember
 * @returns {void}
 */
export function setRememberMePreference(remember) {
  const nextMode = /** @type {StorageMode} */ (remember ? 'local' : 'session');
  currentMode = nextMode;

  const localStore = getStorage('local');
  if (localStore) {
    try {
      localStore.setItem(REMEMBER_ME_STORAGE_KEY, String(remember));
    } catch (err) {
      // Quota or serialization errors must not break sign-in.
      logger.warn('Failed to persist rememberMe preference', {
        route: 'auth.storage',
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

/**
 * Seed the in-memory mode from persisted state so that storage reads during
 * Supabase bootstrap hit the right bucket even before the user interacts.
 */
(function initializeMode() {
  currentMode = getRememberMePreference() ? 'local' : 'session';
})();

/**
 * Return the storage adapter matching the user's active preference.
 *
 * Exposed for tests / debugging. Application code should use
 * {@link conditionalAuthStorage} instead.
 *
 * @returns {StorageMode}
 */
export function getActiveStorageMode() {
  return currentMode;
}

/**
 * Read a value, preferring the active storage but falling back to the other
 * one. The fallback handles the case where the user was previously signed
 * in under a different Remember-me preference — their existing session is
 * still valid and we honour it until they next sign in.
 *
 * @param {string} key
 * @returns {string | null}
 */
function readAcrossStorages(key) {
  const preferred = getStorage(currentMode);
  if (preferred) {
    try {
      const v = preferred.getItem(key);
      if (v !== null) return v;
    } catch {
      /* fall through to the other storage */
    }
  }
  const other = getStorage(currentMode === 'local' ? 'session' : 'local');
  if (other) {
    try {
      return other.getItem(key);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Supabase `SupportedStorage` adapter.
 *
 * Writes always go to a single storage (the one matching the active mode)
 * and clear the corresponding key from the other storage, so there can
 * never be two divergent session copies. Removes are applied to both.
 */
export const conditionalAuthStorage = {
  /**
   * @param {string} key
   * @returns {string | null}
   */
  getItem(key) {
    return readAcrossStorages(key);
  },

  /**
   * @param {string} key
   * @param {string} value
   */
  setItem(key, value) {
    const active = getStorage(currentMode);
    const inactive = getStorage(currentMode === 'local' ? 'session' : 'local');

    if (active) {
      try {
        active.setItem(key, value);
      } catch (err) {
        logger.warn('Auth storage write failed', {
          route: 'auth.storage',
          mode: currentMode,
          reason: err instanceof Error ? err.message : String(err),
        });
      }
    }
    if (inactive) {
      try {
        inactive.removeItem(key);
      } catch {
        /* best effort — duplicate cleanup only */
      }
    }
  },

  /**
   * @param {string} key
   */
  removeItem(key) {
    for (const mode of /** @type {StorageMode[]} */ (['local', 'session'])) {
      const store = getStorage(mode);
      if (!store) continue;
      try {
        store.removeItem(key);
      } catch {
        /* best effort */
      }
    }
  },
};
