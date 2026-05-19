import { useCallback, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { supabase } from '../lib/supabase';
import { initializeAuth, setAuth, clearAuth, signOut, updateBirthDate } from '../store/slices/authSlice';
import { resetChatState, setCreditBalance } from '../store/slices/chatSlice';
import { resetProjectsState } from '../store/slices/projectsSlice';
import {
  resetSubscriptionState,
  setImageCredits,
  fetchSubscriptionThunk,
} from '../store/slices/subscriptionSlice';
import { resetGuestPromptCount } from '../utils/guestSession';
import { fetchCreditBalance } from '../services/credits';
import { fetchGoogleBirthday } from '../services/googleBirthday';
import { clearImageCache } from '../services/imageGeneration';
import { setLoggerUser, logger } from '../lib/logger';
import { isAgeAllowed, MIN_AGE } from '../utils/age';

// ---------------------------------------------------------------------------
// Helpers: map Supabase objects to our app shapes
// ---------------------------------------------------------------------------

function mapUser(supabaseUser) {
  if (!supabaseUser) return null;
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || null,
    isAnonymous: supabaseUser.is_anonymous || false,
    avatarUrl: supabaseUser.user_metadata?.avatar_url || null,
    fullName:
      supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.display_name || null,
    birthDate: supabaseUser.user_metadata?.birth_date || null,
  };
}

function mapSession(session) {
  if (!session) return null;
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
  };
}

// ---------------------------------------------------------------------------
// localStorage keys to clear on sign-out (user-specific data)
// ---------------------------------------------------------------------------

const USER_STORAGE_KEYS = [
  'araviel-image-gen-limits',
  'araviel-settings',
  'araviel-user-id',
  'araviel-imported-context-providers',
];

// ---------------------------------------------------------------------------
// Refresh-policy constants
// ---------------------------------------------------------------------------

// Supabase fires TOKEN_REFRESHED every ~50 min, but it can also fire back-to-back
// (focus + scheduled refresh, multi-tab broadcast). We piggyback subscription
// refreshes on it to recover from any earlier silent fetch failure, but throttle
// so a rapid sequence of refresh events doesn't storm /api/subscription.
const TOKEN_REFRESH_THROTTLE_MS = 30_000;

// When the tab regains focus after being hidden for longer than this, refresh
// the tier. Catches the "user upgraded via Stripe portal in another tab" case
// without polling. Short hides (alt-tab, system notification) are ignored.
const VISIBILITY_REFRESH_THRESHOLD_MS = 60_000;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Side-effect hook that initialises auth state and keeps it in sync with
 * Supabase auth events. Call this once near the root of the component tree.
 *
 * Subscription tier is hydrated from the server on every auth event that
 * could represent a state change:
 *   - SIGNED_IN          — first authentication of a session
 *   - INITIAL_SESSION    — page reload / new tab restoring an existing session
 *   - TOKEN_REFRESHED    — periodic refresh; covers recovery from earlier
 *                          silent fetch failures (throttled)
 *
 * Plus a visibilitychange handler that refetches after a long hide, so
 * out-of-band Stripe updates land without requiring a manual reload.
 */
export default function useAuthListener() {
  const dispatch = useDispatch();

  // Refs survive across event firings without triggering re-runs of the
  // effect. They're the single source of truth for refresh policy:
  //   - subscriptionInFlightRef: dedupes concurrent fetches.
  //   - lastSubscriptionFetchAtRef: throttles TOKEN_REFRESHED.
  //   - hiddenSinceRef: tracks how long the tab was backgrounded.
  //   - realUserSignedInRef: gates background refreshes off when the
  //     current session is anonymous or signed out.
  const subscriptionInFlightRef = useRef(false);
  const lastSubscriptionFetchAtRef = useRef(0);
  const hiddenSinceRef = useRef(0);
  const realUserSignedInRef = useRef(false);

  const refreshSubscription = useCallback(
    (reason) => {
      if (!realUserSignedInRef.current) return;
      if (subscriptionInFlightRef.current) return;
      subscriptionInFlightRef.current = true;
      dispatch(fetchSubscriptionThunk())
        .unwrap()
        .then(() => {
          lastSubscriptionFetchAtRef.current = Date.now();
        })
        .catch((err) => {
          // Reject value from createAsyncThunk is the message string we
          // passed to rejectWithValue, not an Error — wrap it so the
          // logger captures a useful record.
          logger.error(
            'Failed to refresh subscription tier',
            err instanceof Error ? err : new Error(String(err ?? 'unknown')),
            { reason }
          );
        })
        .finally(() => {
          subscriptionInFlightRef.current = false;
        });
    },
    [dispatch]
  );

  const refreshCreditBalance = useCallback(
    (reason) => {
      fetchCreditBalance()
        .then((data) => {
          if (!data?.balance) return;
          dispatch(setCreditBalance(data.balance));
          dispatch(
            setImageCredits({
              used: data.balance.monthly?.used ?? 0,
              limit: data.balance.monthly?.total ?? 5,
              remaining: data.balance.monthly?.remaining ?? 0,
              packRemaining: data.balance.packs?.remaining ?? 0,
              cycleResetsAt: data.balance.cycleResetsAt ?? null,
            })
          );
        })
        .catch((err) => {
          logger.warn('Failed to refresh credit balance', {
            reason,
            error: err?.message,
          });
        });
    },
    [dispatch]
  );

  // ── Visibility refresh ────────────────────────────────────────────────────
  // Refresh tier (and credits) when the tab becomes visible again after a
  // long hide. The short-hide guard prevents storms from alt-tabbing.
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        const hiddenAt = hiddenSinceRef.current;
        hiddenSinceRef.current = 0;
        if (hiddenAt > 0 && Date.now() - hiddenAt > VISIBILITY_REFRESH_THRESHOLD_MS) {
          refreshSubscription('visibility_change');
          refreshCreditBalance('visibility_change');
        }
      } else {
        hiddenSinceRef.current = Date.now();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [refreshSubscription, refreshCreditBalance]);

  // ── Auth listener ─────────────────────────────────────────────────────────
  useEffect(() => {
    // 1. Kick off the initial session check
    dispatch(initializeAuth());

    // 2. Subscribe to ongoing auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      switch (event) {
        case 'SIGNED_IN':
        case 'INITIAL_SESSION':
        case 'TOKEN_REFRESHED':
        case 'USER_UPDATED': {
          const user = mapUser(session?.user);
          setLoggerUser(user?.id || null);

          // INITIAL_SESSION can fire with session=null when there's no
          // active session yet — in that case initializeAuth() is still
          // running and will populate the slice (real or anonymous).
          // Dispatching setAuth({ user: null }) here would wipe that work.
          if (user && session) {
            dispatch(setAuth({ user, session: mapSession(session) }));
          }

          const isRealUser = !!(user && !user.isAnonymous);
          realUserSignedInRef.current = isRealUser;

          // One-time side effects that only run on a true sign-in event
          // (not on page reloads or token refreshes).
          if (event === 'SIGNED_IN' && isRealUser) {
            resetGuestPromptCount();

            // Google sign-in only: try to lift the user's date of birth from
            // Google's People API so we can skip the manual age step when
            // the data is already there. The provider_token is only exposed
            // on this initial SIGNED_IN event after the OAuth redirect — it
            // isn't refreshed — so we have to capture it here. If the fetch
            // returns null (no DOB on the Google account, partial date, or
            // request failed), App.jsx's age gate will route the user to
            // /signup/verify-age for manual entry.
            const provider = session?.user?.app_metadata?.provider;
            const providerToken = session?.provider_token;
            if (provider === 'google' && providerToken && !user.birthDate) {
              fetchGoogleBirthday(providerToken)
                .then((birthDate) => {
                  if (!birthDate) return; // Falls through to manual entry.
                  // Validate against MIN_AGE here so an under-13 Google
                  // user is signed out immediately, before App.jsx's
                  // gate has to react to the metadata write. The DB
                  // sync trigger would also reject the update, but
                  // checking client-side gives a clearer UX path.
                  if (!isAgeAllowed(birthDate)) {
                    // Stash the rejection so AuthModal can surface it
                    // after the hard redirect — we don't have router
                    // access here. sessionStorage clears at the end of
                    // the browsing session, and AuthModal removes the
                    // key once read so refreshing /login doesn't echo
                    // the message indefinitely.
                    if (typeof window !== 'undefined') {
                      try {
                        sessionStorage.setItem(
                          'araviel-age-rejection',
                          `You must be at least ${MIN_AGE} years old to use Araviel.`
                        );
                      } catch {
                        // Quota / private mode → skip the message.
                      }
                    }
                    dispatch(signOut());
                    if (typeof window !== 'undefined') {
                      window.location.assign('/login');
                    }
                    return;
                  }
                  dispatch(updateBirthDate({ birthDate }));
                })
                .catch(() => {});
            }
          }

          // Hydrate tier + credits on every auth event that could reflect
          // a real change. INITIAL_SESSION is the critical one — without it
          // a page reload leaves the slice at its 'free' initialState until
          // the user happens to visit /subscription.
          if (isRealUser) {
            if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
              refreshSubscription(event.toLowerCase());
              refreshCreditBalance(event.toLowerCase());
            } else if (event === 'TOKEN_REFRESHED') {
              const since = Date.now() - lastSubscriptionFetchAtRef.current;
              if (since > TOKEN_REFRESH_THROTTLE_MS) {
                refreshSubscription('token_refreshed');
              }
            }
            // USER_UPDATED carries metadata changes (display name, etc.) and
            // doesn't affect tier or credits — no refresh needed.
          }
          break;
        }
        case 'SIGNED_OUT': {
          // 1. Reset refs so background refreshes stop firing
          realUserSignedInRef.current = false;
          lastSubscriptionFetchAtRef.current = 0;

          // 2. Reset guest prompt counters and clear image cache
          setLoggerUser(null);
          resetGuestPromptCount();
          clearImageCache();

          // 3. Clear user-specific localStorage
          USER_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));

          // 4. Reset all Redux slices
          dispatch(clearAuth());
          dispatch(resetChatState());
          dispatch(resetProjectsState());
          dispatch(resetSubscriptionState());

          // 5. Re-create anonymous session so guest flow works
          dispatch(initializeAuth());
          break;
        }
        default:
          break;
      }
    });

    // 3. Cleanup on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [dispatch, refreshSubscription, refreshCreditBalance]);
}
