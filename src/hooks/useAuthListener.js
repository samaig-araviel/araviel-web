import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { supabase } from '../lib/supabase';
import {
  initializeAuth,
  setAuth,
  clearAuth,
} from '../store/slices/authSlice';

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
      supabaseUser.user_metadata?.full_name ||
      supabaseUser.user_metadata?.display_name ||
      null,
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        switch (event) {
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
          case 'USER_UPDATED': {
            dispatch(
              setAuth({
                user: mapUser(session?.user),
                session: mapSession(session),
              }),
            );
            break;
          }
          case 'SIGNED_OUT': {
            dispatch(clearAuth());
            break;
          }
          default:
            break;
        }
      },
    );

    // 3. Cleanup on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [dispatch]);
}
