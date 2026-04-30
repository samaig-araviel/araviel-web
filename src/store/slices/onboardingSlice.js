import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../../lib/apiClient';

// ---------------------------------------------------------------------------
// Onboarding slice — tracks the post-signup age verification gate.
//
// State shape mirrors the server's `ageVerification` block from /api/me so the
// gate component can read it directly. Status is recomputed server-side on
// every fetch (it depends on stored DOB + the current date + the configured
// minimum), so the slice never tries to derive it locally.
// ---------------------------------------------------------------------------

const STATUS_UNKNOWN = 'unknown';

const initialState = {
  // Server-driven status: 'pending' | 'blocked' | 'verified' | 'unknown'.
  // 'unknown' is the local-only state we use until the first /me response
  // returns; the gate renders nothing during this window so there is no
  // flash of either the onboarding screen or the app.
  status: STATUS_UNKNOWN,
  // Mirrors AGE_VERIFICATION_ENABLED on the server — when false the gate is
  // a no-op and the client should never redirect.
  enabled: false,
  // Configurable threshold from the server (default 13). Used in the
  // blocked-screen copy so it stays in sync with whatever the operator set.
  minimumAge: 13,
  // ISO date string the server has on file for this user, or null.
  dateOfBirth: null,
  // Generic loading flag used by both the gate (initial fetch) and the
  // submit form. The form has its own button-level disabled state so this
  // doesn't cause cross-talk.
  isLoading: false,
  // Last submission error, surfaced in the entry form.
  error: null,
};

/**
 * Fetch the current user's verification status from the server. Called once
 * on every SIGNED_IN event from the auth listener.
 */
export const fetchVerificationStatus = createAsyncThunk(
  'onboarding/fetchVerificationStatus',
  async (_, { rejectWithValue }) => {
    try {
      const me = await apiFetch('/api/me', { errorContext: 'onboarding.fetchStatus' });
      return me.ageVerification;
    } catch (err) {
      return rejectWithValue(err?.userMessage || err?.message || 'Failed to fetch status');
    }
  }
);

/**
 * Submit a manually-entered date of birth.
 * Returns the updated verification block on success.
 */
export const submitDateOfBirth = createAsyncThunk(
  'onboarding/submitDateOfBirth',
  async ({ dateOfBirth }, { rejectWithValue }) => {
    try {
      const response = await apiFetch('/api/onboarding/age', {
        method: 'POST',
        json: { dateOfBirth },
        errorContext: 'onboarding.submitDOB',
      });
      return response.ageVerification;
    } catch (err) {
      return rejectWithValue(err?.userMessage || err?.message || 'Failed to verify age');
    }
  }
);

/**
 * Best-effort silent verification using the Google `provider_token` Supabase
 * exposes only on the very first OAuth callback. The server fetches the
 * birthday from the Google People API; if it isn't available the response
 * carries `requiresManualEntry: true` and we fall through to the manual
 * screen via the gate.
 */
export const verifyWithGoogle = createAsyncThunk(
  'onboarding/verifyWithGoogle',
  async ({ providerToken }, { rejectWithValue }) => {
    try {
      const response = await apiFetch('/api/onboarding/age/google', {
        method: 'POST',
        json: { providerToken },
        errorContext: 'onboarding.verifyGoogle',
      });
      return response.ageVerification;
    } catch (err) {
      return rejectWithValue(err?.userMessage || err?.message || 'Google verification failed');
    }
  }
);

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    /** Reset to initial state on sign-out so the next user starts clean. */
    resetOnboardingState() {
      return { ...initialState };
    },
    /** Clear the last submission error (e.g. when the user edits the form). */
    clearOnboardingError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const applyVerification = (state, action) => {
      if (!action.payload) return;
      state.status = action.payload.status ?? STATUS_UNKNOWN;
      state.enabled = Boolean(action.payload.enabled);
      if (typeof action.payload.minimumAge === 'number') {
        state.minimumAge = action.payload.minimumAge;
      }
      state.dateOfBirth = action.payload.dateOfBirth ?? null;
      state.error = null;
    };

    builder
      .addCase(fetchVerificationStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVerificationStatus.fulfilled, (state, action) => {
        applyVerification(state, action);
        state.isLoading = false;
      })
      .addCase(fetchVerificationStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch status';
      });

    builder
      .addCase(submitDateOfBirth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(submitDateOfBirth.fulfilled, (state, action) => {
        applyVerification(state, action);
        state.isLoading = false;
      })
      .addCase(submitDateOfBirth.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to verify age';
      });

    builder
      .addCase(verifyWithGoogle.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyWithGoogle.fulfilled, (state, action) => {
        applyVerification(state, action);
        state.isLoading = false;
      })
      .addCase(verifyWithGoogle.rejected, (state, action) => {
        // Google flow failures fall back to manual entry — surface no error.
        state.isLoading = false;
        state.error = null;
        state.status = 'pending';
      });
  },
});

export const { resetOnboardingState, clearOnboardingError } = onboardingSlice.actions;

export const selectOnboardingStatus = (state) => state.onboarding.status;
export const selectOnboardingEnabled = (state) => state.onboarding.enabled;
export const selectOnboardingMinimumAge = (state) => state.onboarding.minimumAge;
export const selectOnboardingLoading = (state) => state.onboarding.isLoading;
export const selectOnboardingError = (state) => state.onboarding.error;

export default onboardingSlice.reducer;
