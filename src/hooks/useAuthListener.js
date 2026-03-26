import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { supabase } from '../lib/supabase';
import { initializeAuth, setAuth, clearAuth } from '../store/slices/authSlice';
import { resetChatState, setCreditBalance } from '../store/slices/chatSlice';
import { resetProjectsState } from '../store/slices/projectsSlice';
import { resetSubscriptionState, setSubscriptionData } from '../store/slices/subscriptionSlice';
import { resetGuestPromptCount } from '../utils/guestSession';
import { fetchCreditBalance } from '../services/credits';
import { fetchSubscription } from '../services/subscription';
import { clearImageCache } from '../services/imageGeneration';

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
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
        case 'USER_UPDATED': {
          const user = mapUser(session?.user);
          dispatch(
            setAuth({
              user,
              session: mapSession(session),
            })
          );
          // On real (non-anonymous) sign-in, sync tier/credits from backend
          if (event === 'SIGNED_IN' && user && !user.isAnonymous) {
            resetGuestPromptCount();
            fetchCreditBalance()
              .then((data) => {
                if (data.balance) {
                  dispatch(setCreditBalance(data.balance));
                }
              })
              .catch(() => {});
            // Hydrate subscription state from server
            fetchSubscription()
              .then((data) => {
                dispatch(setSubscriptionData(data));
              })
              .catch(() => {});
          }
          break;
        }
        case 'SIGNED_OUT': {
          // 1. Reset guest prompt counters and clear image cache
          resetGuestPromptCount();
          clearImageCache();

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

    // 3. Cleanup on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [dispatch]);
}
