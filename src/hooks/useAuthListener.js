import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { supabase } from '../lib/supabase';
import { initializeAuth, setAuth, clearAuth } from '../store/slices/authSlice';
import { resetChatState, setCreditBalance } from '../store/slices/chatSlice';
import { resetProjectsState } from '../store/slices/projectsSlice';
import {
  resetSubscriptionState,
  setSubscriptionData,
  setImageCredits,
} from '../store/slices/subscriptionSlice';
import { resetGuestPromptCount } from '../utils/guestSession';
import { fetchCreditBalance } from '../services/credits';
import { fetchSubscription } from '../services/subscription';
import { clearImageCache } from '../services/imageGeneration';
import { setLoggerUser } from '../lib/logger';
import { mapUser, mapSession, isFullyAuthenticated } from '../lib/authMappers';

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
          setLoggerUser(user?.id || null);
          dispatch(
            setAuth({
              user,
              session: mapSession(session),
            })
          );
          // Sync tier/credits from backend only for fully authenticated
          // users — i.e. non-anonymous AND email-confirmed. An
          // email-pending user is technically non-anonymous (Supabase
          // converts them on signUp) but their account doesn't have any
          // server-side credits or subscription yet, and our API treats
          // them as a guest, so calling these endpoints would just churn.
          if (event === 'SIGNED_IN' && isFullyAuthenticated(user)) {
            resetGuestPromptCount();
            fetchCreditBalance()
              .then((data) => {
                if (data.balance) {
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
          setLoggerUser(null);
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
