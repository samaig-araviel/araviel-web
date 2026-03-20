import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabase';

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
      supabaseUser.user_metadata?.full_name ||
      supabaseUser.user_metadata?.display_name ||
      null,
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

/** Check for an existing session on app start. */
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

      // No active session — user is unauthenticated
      return { user: null, session: null };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
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
  },
);

/** Sign in with email & password. */
export const signInWithEmail = createAsyncThunk(
  'auth/signInWithEmail',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return rejectWithValue(error.message);
      return {
        user: mapUser(data.user),
        session: mapSession(data.session),
      };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

/** Create a new account with email, password, and optional display name. */
export const signUpWithEmail = createAsyncThunk(
  'auth/signUpWithEmail',
  async ({ email, password, displayName }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });
      if (error) return rejectWithValue(error.message);
      return {
        user: mapUser(data.user),
        session: mapSession(data.session),
      };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

/** Sign the current user out. */
export const signOut = createAsyncThunk(
  'auth/signOut',
  async (_, { rejectWithValue }) => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) return rejectWithValue(error.message);
      return null;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

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
  },
);

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const initialState = {
  user: null,
  session: null,
  isLoading: true,
  error: null,
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
    },
    /** Clear all auth state (e.g. on sign-out). */
    clearAuth(state) {
      state.user = null;
      state.session = null;
      state.error = null;
      state.isLoading = false;
    },
    /** Explicitly toggle the loading flag. */
    setAuthLoading(state, action) {
      state.isLoading = action.payload;
    },
    /** Set an error message. */
    setAuthError(state, action) {
      state.error = action.payload;
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

    // signInWithGoogle
    builder
      .addCase(signInWithGoogle.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signInWithGoogle.fulfilled, (state) => {
        // Browser redirects — state will be updated by the auth listener
        state.isLoading = false;
      })
      .addCase(signInWithGoogle.rejected, (state, action) => {
        state.isLoading = false;
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
        state.user = action.payload.user;
        state.session = action.payload.session;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(signUpWithEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Sign-up failed';
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

export const { setAuth, clearAuth, setAuthLoading, setAuthError } =
  authSlice.actions;

// Selectors
export const selectAuthUser = (state) => state.auth.user;
export const selectAuthSession = (state) => state.auth.session;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;
export const selectIsAuthenticated = (state) =>
  Boolean(state.auth.user) && !state.auth.user.isAnonymous;
export const selectIsAnonymous = (state) =>
  Boolean(state.auth.user) && state.auth.user.isAnonymous;

export default authSlice.reducer;
