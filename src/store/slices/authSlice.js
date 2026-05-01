import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabase';
import { setRememberMePreference } from '../../lib/authStorage';
import { resetGuestPromptCount } from '../../utils/guestSession';
import { logger } from '../../lib/logger';

// ---------------------------------------------------------------------------
// Helper: map a Supabase user object to our app's user shape
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

// ---------------------------------------------------------------------------
// Helper: map a Supabase session to a minimal session shape
// ---------------------------------------------------------------------------
function mapSession(session) {
  if (!session) return null;
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
  };
}

// ---------------------------------------------------------------------------
// Async thunks
// ---------------------------------------------------------------------------

/** Check for an existing session on app start. Auto-creates anonymous session if none. */
export const initializeAuth = createAsyncThunk(
  'auth/initializeAuth',
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) return rejectWithValue(error.message);

      if (data.session) {
        return {
          user: mapUser(data.session.user),
          session: mapSession(data.session),
        };
      }

      // No active session — create an anonymous session so guest users
      // get a valid JWT for the limited prompts they're allowed.
      const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
      if (anonError) {
        // If anonymous auth is not enabled on the Supabase project, fail
        // gracefully — the user can still browse but chat won't work.
        logger.warn('Anonymous sign-in unavailable', {
          route: 'auth.init',
          reason: anonError.message,
        });
        return { user: null, session: null };
      }

      return {
        user: mapUser(anonData.session?.user ?? anonData.user),
        session: mapSession(anonData.session),
      };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** Redirect the user to Google OAuth. */
export const signInWithGoogle = createAsyncThunk(
  'auth/signInWithGoogle',
  async (_, { rejectWithValue }) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) return rejectWithValue(error.message);
      // The browser will redirect — no meaningful return value.
      return null;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** Sign in with email & password.
 *
 * The `rememberMe` flag reflects the user's "Remember me" choice. It is
 * persisted via the AuthModal so the preference survives across sessions;
 * the underlying Supabase client already persists the session itself.
 */
export const signInWithEmail = createAsyncThunk(
  'auth/signInWithEmail',
  async ({ email, password, rememberMe = true }, { rejectWithValue }) => {
    try {
      // Record the preference BEFORE the sign-in call so the storage adapter
      // writes the new session to the correct bucket (local vs. session
      // storage) on the very first write. Doing this after the call would
      // leak the session into the previously-active storage.
      setRememberMePreference(rememberMe);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return rejectWithValue(error.message);
      return {
        user: mapUser(data.user),
        session: mapSession(data.session),
        rememberMe,
      };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** Create a new account with email, password, and optional display name.
 *
 * When email confirmation is enabled in Supabase (the project default for
 * Araviel), a successful `signUp` returns a `user` object but a `null`
 * session — the user record exists but no session is issued until they
 * click the link in the confirmation email. The slice surfaces this as a
 * `pendingEmailVerification` state instead of writing a half-formed user
 * into Redux: the modal switches to its "check your email" view, and the
 * underlying anonymous session keeps the rest of the app usable.
 */
export const signUpWithEmail = createAsyncThunk(
  'auth/signUpWithEmail',
  async ({ email, password, displayName }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) return rejectWithValue(error.message);
      return {
        user: mapUser(data.user),
        session: mapSession(data.session),
        emailSubmitted: email,
      };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** Re-send the signup confirmation email for a user who hasn't confirmed yet.
 * Supabase enforces its own rate limit; the UI applies a short cooldown on
 * top so the button isn't a spam vector.
 */
export const resendConfirmationEmail = createAsyncThunk(
  'auth/resendConfirmationEmail',
  async ({ email }, { rejectWithValue }) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) return rejectWithValue(error.message);
      return { email };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** Sign the current user out. */
export const signOut = createAsyncThunk('auth/signOut', async (_, { rejectWithValue }) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) return rejectWithValue(error.message);
    return null;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

/** Send a password-reset email. */
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ email }, { rejectWithValue }) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) return rejectWithValue(error.message);
      return null;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const initialState = {
  user: null,
  session: null,
  isLoading: true,
  error: null,
  // When a user signs up with email but Supabase requires email
  // confirmation, no session is issued. We hold the email here so the
  // AuthModal can render its "check your email" view and the global
  // banner can prompt them until they confirm. Cleared on sign-in
  // (confirmation flow lands them with a real session) and on sign-out.
  pendingEmailVerification: null,
  // True only while a Google OAuth redirect is in flight. Kept separate
  // from `isLoading` so the modal can keep its CTA in the "Redirecting…"
  // state until the browser actually navigates away — avoids the
  // momentary flash of the modal closing before Google's screen appears.
  isOAuthRedirecting: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Set user and session (typically called from the auth listener). */
    setAuth(state, action) {
      state.user = action.payload.user;
      state.session = action.payload.session;
      state.error = null;
      state.isLoading = false;
      // A real (non-anonymous) sign-in always satisfies any pending
      // verification — the only way to land here without an existing
      // session is via the Supabase confirmation link.
      if (action.payload.user && !action.payload.user.isAnonymous) {
        state.pendingEmailVerification = null;
      }
      state.isOAuthRedirecting = false;
    },
    /** Clear all auth state (e.g. on sign-out). */
    clearAuth(state) {
      state.user = null;
      state.session = null;
      state.error = null;
      state.isLoading = false;
      state.pendingEmailVerification = null;
      state.isOAuthRedirecting = false;
    },
    /** Manually clear the pending email verification (e.g. user dismisses
     *  the banner or chooses "use a different email"). */
    clearPendingEmailVerification(state) {
      state.pendingEmailVerification = null;
    },
    /** Explicitly toggle the loading flag. */
    setAuthLoading(state, action) {
      state.isLoading = action.payload;
    },
    /** Set an error message. */
    setAuthError(state, action) {
      state.error = action.payload;
    },
    /** Update just the avatar URL on the current user (e.g. after upload). */
    setUserAvatarUrl(state, action) {
      if (state.user) {
        state.user.avatarUrl = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    // initializeAuth
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.session = action.payload.session;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to initialize auth';
      });

    // signInWithGoogle — `fulfilled` resolves the moment Supabase has
    // queued the redirect; the browser navigation itself happens a tick
    // later. We deliberately leave `isOAuthRedirecting` true so the
    // modal can keep showing "Redirecting…" until the page changes,
    // avoiding the previous flash of the modal closing before Google's
    // consent screen appeared.
    builder
      .addCase(signInWithGoogle.pending, (state) => {
        state.isLoading = true;
        state.isOAuthRedirecting = true;
        state.error = null;
      })
      .addCase(signInWithGoogle.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(signInWithGoogle.rejected, (state, action) => {
        state.isLoading = false;
        state.isOAuthRedirecting = false;
        state.error = action.payload || 'Google sign-in failed';
      });

    // signInWithEmail
    builder
      .addCase(signInWithEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signInWithEmail.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.session = action.payload.session;
        state.isLoading = false;
        state.error = null;
        resetGuestPromptCount();
      })
      .addCase(signInWithEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Email sign-in failed';
      });

    // signUpWithEmail
    builder
      .addCase(signUpWithEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signUpWithEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        // If Supabase issued a session immediately (email confirmation
        // disabled at the project level), commit the real auth state.
        // Otherwise hold the email as a pending verification — the user
        // is NOT authenticated yet. Writing a session-less user to
        // `state.user` was the source of the "drops you into the app"
        // bug.
        if (action.payload.session) {
          state.user = action.payload.user;
          state.session = action.payload.session;
          resetGuestPromptCount();
        } else {
          state.pendingEmailVerification = {
            email: action.payload.emailSubmitted,
          };
        }
      })
      .addCase(signUpWithEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Sign-up failed';
      });

    // resendConfirmationEmail — surfaces errors via the slice but doesn't
    // mutate session state. We don't toggle `isLoading` here so it
    // doesn't fight with the modal's button-level cooldown spinner.
    builder.addCase(resendConfirmationEmail.rejected, (state, action) => {
      state.error = action.payload || 'Failed to resend confirmation email';
    });

    // signOut
    builder
      .addCase(signOut.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signOut.fulfilled, (state) => {
        state.user = null;
        state.session = null;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(signOut.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Sign-out failed';
      });

    // resetPassword
    builder
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Password reset failed';
      });
  },
});

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const {
  setAuth,
  clearAuth,
  setAuthLoading,
  setAuthError,
  setUserAvatarUrl,
  clearPendingEmailVerification,
} = authSlice.actions;

// Selectors
export const selectAuthUser = (state) => state.auth.user;
export const selectAuthSession = (state) => state.auth.session;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;
export const selectIsAuthenticated = (state) =>
  Boolean(state.auth.user) && !state.auth.user.isAnonymous;
export const selectIsAnonymous = (state) => Boolean(state.auth.user) && state.auth.user.isAnonymous;
export const selectPendingEmailVerification = (state) => state.auth.pendingEmailVerification;
export const selectIsOAuthRedirecting = (state) => state.auth.isOAuthRedirecting;

export default authSlice.reducer;
