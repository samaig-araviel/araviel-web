import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { supabase } from '../lib/supabase';
import {
  initializeAuth,
  setAuth,
  clearAuth,
  signOut,
  updateBirthDate,
} from '../store/slices/authSlice';
import { resetChatState, setCreditBalance } from '../store/slices/chatSlice';
import { resetProjectsState } from '../store/slices/projectsSlice';
import {
  resetSubscriptionState,
  setSubscriptionData,
  setSubscriptionLoading,
  setSubscriptionFailed,
  setImageCredits,
} from '../store/slices/subscriptionSlice';
import { resetGuestPromptCount } from '../utils/guestSession';
import { fetchCreditBalance } from '../services/credits';
import { fetchSubscription } from '../services/subscription';
import { fetchGoogleBirthday } from '../services/googleBirthday';
import { clearImageCache } from '../services/imageGeneration';
import { logger, setLoggerUser } from '../lib/logger';
import { isAgeAllowed, MIN_AGE } from '../utils/age';

// Single in-flight hydration so SIGNED_IN, INITIAL_SESSION, and
// TOKEN_REFRESHED arriving close together don't fan out into duplicate
// API calls.
let hydrationInFlight = null;
// Wall-clock of the last successful subscription fetch. Used by the
// visibility listener to decide whether to re-validate when the tab
// regains focus.
let lastHydratedAt = 0;

// Up to 5 attempts with exponential backoff capped at 4s
// (500, 1000, 2000, 4000, 4000) — total ~11s worth of retries.
// Hydration is infrequent and important: a stale tier locks the user out
// of paid features they've actually paid for, so we'd rather try a few
// more times than give up after 1.5s.
const SUBSCRIPTION_FETCH_MAX_ATTEMPTS = 5;
const SUBSCRIPTION_FETCH_BACKOFF_CAP_MS = 4000;

function hydrateUserState(dispatch) {
  if (hydrationInFlight) return hydrationInFlight;

  dispatch(setSubscriptionLoading());

  // Retry the subscription fetch several times before giving up. We never
  // dispatch a fallback "free" tier on failure — the slice keeps the last
  // known value so a transient API blip can't silently downgrade a paying
  // user. The server-side endpoint is now strict (returns 5xx on real DB
  // errors instead of returning tier="free"), so a 200 response really is
  // authoritative and is safe to apply.
  const fetchWithRetry = async (attempt = 0) => {
    try {
      const data = await fetchSubscription();
      dispatch(setSubscriptionData(data));
      lastHydratedAt = Date.now();
    } catch (err) {
      if (attempt < SUBSCRIPTION_FETCH_MAX_ATTEMPTS - 1) {
        const delay = Math.min(500 * 2 ** attempt, SUBSCRIPTION_FETCH_BACKOFF_CAP_MS);
        await new Promise((r) => setTimeout(r, delay));
        return fetchWithRetry(attempt + 1);
      }
      dispatch(setSubscriptionFailed());
      logger.warn('subscription hydration failed', {
        route: 'auth.hydrate',
        reason: err?.message,
      });
    }
  };

  const creditsPromise = fetchCreditBalance()
    .then((data) => {
      if (data?.balance) {
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
      }
    })
    .catch((err) => {
      logger.warn('credit balance hydration failed', {
        route: 'auth.hydrate',
        reason: err?.message,
      });
    });

  hydrationInFlight = Promise.all([fetchWithRetry(), creditsPromise]).finally(() => {
    hydrationInFlight = null;
  });
  return hydrationInFlight;
}

/**
 * Re-fetch the subscription if it hasn't been refreshed recently. Called
 * when the tab regains visibility so a session left idle for a while
 * picks up any tier changes (Stripe events, manual upgrades) without
 * requiring a page reload.
 */
const STALE_AFTER_MS = 2 * 60 * 1000; // 2 minutes
function refreshIfStale(dispatch) {
  if (Date.now() - lastHydratedAt < STALE_AFTER_MS) return;
  hydrateUserState(dispatch);
}

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
  'araviel-user-location',
  'araviel-location-permission',
  'araviel-location-asked',
];

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Side-effect hook that initialises auth state and keeps it in sync with
 * Supabase auth events. Call this once near the root of the component tree.
 */
export default function useAuthListener() {
  const dispatch = useDispatch();

  useEffect(() => {
    // 1. Kick off the initial session check
    dispatch(initializeAuth());

    // 2. Subscribe to ongoing auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      switch (event) {
        case 'INITIAL_SESSION':
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
        case 'USER_UPDATED': {
          const user = mapUser(session?.user);
          setLoggerUser(user?.id || null);
          dispatch(
            setAuth({
              user,
              session: mapSession(session),
            })
          );
          // Hydrate tier/credits from backend on any auth event that
          // produces a non-anonymous session. SIGNED_IN catches fresh
          // logins; INITIAL_SESSION covers page reloads (Supabase
          // restored the session from storage); TOKEN_REFRESHED covers
          // long-lived sessions where a server-side tier change should
          // become visible; USER_UPDATED covers metadata updates.
          if (user && !user.isAnonymous) {
            if (event === 'SIGNED_IN') {
              resetGuestPromptCount();
            }

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
            if (
              event === 'SIGNED_IN' &&
              provider === 'google' &&
              providerToken &&
              !user.birthDate
            ) {
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

            hydrateUserState(dispatch);
          }
          break;
        }
        case 'SIGNED_OUT': {
          // 1. Reset guest prompt counters and clear image cache
          setLoggerUser(null);
          resetGuestPromptCount();
          clearImageCache();
          lastHydratedAt = 0;

          // 2. Clear user-specific localStorage
          USER_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));

          // 3. Reset all Redux slices
          dispatch(clearAuth());
          dispatch(resetChatState());
          dispatch(resetProjectsState());
          dispatch(resetSubscriptionState());

          // 4. Re-create anonymous session so guest flow works
          dispatch(initializeAuth());
          break;
        }
        default:
          break;
      }
    });

    // 3. Refresh subscription when the tab regains visibility after being
    //    hidden long enough to be considered stale. Catches the case
    //    where the user upgraded in another tab / Stripe portal and came
    //    back without a Supabase auth event firing.
    const handleVisibilityChange = () => {
      if (typeof document === 'undefined') return;
      if (document.visibilityState !== 'visible') return;
      // Read current auth state via the supabase client rather than the
      // redux selector so we don't have to wire up a subscription —
      // this is a one-shot check, not a derived view.
      supabase.auth.getSession().then(({ data }) => {
        const sUser = data?.session?.user;
        if (sUser && !sUser.is_anonymous) {
          refreshIfStale(dispatch);
        }
      });
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    // 4. Cleanup on unmount
    return () => {
      subscription.unsubscribe();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [dispatch]);
}
