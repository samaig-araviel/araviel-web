import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { SubscriptionTier } from '../../config/subscription';
import {
  fetchSubscription,
  createCheckoutSession,
  createPortalSession,
} from '../../services/subscription';

// ─── Async Thunks ──────────────────────────────────────────────────────────

export const fetchSubscriptionThunk = createAsyncThunk(
  'subscription/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchSubscription();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createCheckoutThunk = createAsyncThunk(
  'subscription/createCheckout',
  async ({ tier, interval }, { rejectWithValue }) => {
    try {
      const { url } = await createCheckoutSession(tier, interval);
      if (url) window.location.href = url;
      return { url };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createPortalThunk = createAsyncThunk(
  'subscription/createPortal',
  async (_, { rejectWithValue }) => {
    try {
      const { url } = await createPortalSession();
      if (url) window.location.href = url;
      return { url };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ─── Slice ─────────────────────────────────────────────────────────────────

const initialState = {
  currentTier: SubscriptionTier.Free,
  billingCycle: 'monthly', // 'monthly' | 'annual'
  creditsRemaining: 0,
  dailyCreditsUsed: 0,
  creditsLimit: 30,
  isFirstMonth: false,
  periodEnd: null,
  cancelAtPeriodEnd: false,
  subscriptionStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  showUpgradeModal: false,
  upgradeContext: null,
  // upgradeContext shape: { reason: 'credit_limit' | 'model_gated' | 'feature_gated', suggestedTier, message, modelName? }
  upgradeLoading: null, // tier id when initiating upgrade
  checkoutLoading: false,
  portalLoading: false,
  error: null,
};

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    setCurrentTier: (state, action) => {
      state.currentTier = action.payload;
    },
    setBillingCycle: (state, action) => {
      state.billingCycle = action.payload;
    },
    setCreditsRemaining: (state, action) => {
      state.creditsRemaining = action.payload;
    },
    setDailyCreditsUsed: (state, action) => {
      state.dailyCreditsUsed = action.payload;
    },
    setCreditsLimit: (state, action) => {
      state.creditsLimit = action.payload;
    },
    setIsFirstMonth: (state, action) => {
      state.isFirstMonth = action.payload;
    },
    /** Bulk setter from API response — avoids multiple dispatches */
    setSubscriptionData: (state, action) => {
      const data = action.payload;
      if (data.tier) state.currentTier = data.tier;
      if (data.billingInterval) state.billingCycle = data.billingInterval;
      if (data.credits) {
        state.dailyCreditsUsed = data.credits.used ?? 0;
        state.creditsLimit = data.credits.limit ?? 30;
        state.creditsRemaining = (data.credits.limit ?? 30) - (data.credits.used ?? 0);
      }
      if (data.periodEnd !== undefined) state.periodEnd = data.periodEnd;
      if (data.cancelAtPeriodEnd !== undefined) state.cancelAtPeriodEnd = data.cancelAtPeriodEnd;
      if (data.firstMonth !== undefined) state.isFirstMonth = data.firstMonth;
      state.subscriptionStatus = 'succeeded';
    },
    showUpgradeModal: (state, action) => {
      state.showUpgradeModal = true;
      state.upgradeContext = action.payload || null;
    },
    hideUpgradeModal: (state) => {
      state.showUpgradeModal = false;
      state.upgradeContext = null;
    },
    initiateUpgrade: (state, action) => {
      state.upgradeLoading = action.payload; // tier id
    },
    clearUpgradeLoading: (state) => {
      state.upgradeLoading = null;
    },
    resetSubscriptionState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubscriptionThunk.pending, (state) => {
        state.subscriptionStatus = 'loading';
      })
      .addCase(fetchSubscriptionThunk.fulfilled, (state, action) => {
        const data = action.payload;
        state.currentTier = data.tier || SubscriptionTier.Free;
        if (data.billingInterval) state.billingCycle = data.billingInterval;
        if (data.credits) {
          state.dailyCreditsUsed = data.credits.used ?? 0;
          state.creditsLimit = data.credits.limit ?? 30;
          state.creditsRemaining = (data.credits.limit ?? 30) - (data.credits.used ?? 0);
        }
        state.periodEnd = data.periodEnd ?? null;
        state.cancelAtPeriodEnd = data.cancelAtPeriodEnd ?? false;
        state.isFirstMonth = data.firstMonth ?? false;
        state.subscriptionStatus = 'succeeded';
      })
      .addCase(fetchSubscriptionThunk.rejected, (state) => {
        state.subscriptionStatus = 'failed';
      })
      .addCase(createCheckoutThunk.pending, (state) => {
        state.checkoutLoading = true;
        state.error = null;
      })
      .addCase(createCheckoutThunk.fulfilled, (state) => {
        state.checkoutLoading = false;
      })
      .addCase(createCheckoutThunk.rejected, (state, action) => {
        state.checkoutLoading = false;
        state.error = action.payload || 'Failed to start checkout. Please try again.';
      })
      .addCase(createPortalThunk.pending, (state) => {
        state.portalLoading = true;
        state.error = null;
      })
      .addCase(createPortalThunk.fulfilled, (state) => {
        state.portalLoading = false;
      })
      .addCase(createPortalThunk.rejected, (state, action) => {
        state.portalLoading = false;
        state.error = action.payload || 'Failed to open subscription portal. Please try again.';
      });
  },
});

export const {
  setCurrentTier,
  setBillingCycle,
  setCreditsRemaining,
  setDailyCreditsUsed,
  setCreditsLimit,
  setIsFirstMonth,
  setSubscriptionData,
  showUpgradeModal,
  hideUpgradeModal,
  initiateUpgrade,
  clearUpgradeLoading,
  resetSubscriptionState,
} = subscriptionSlice.actions;

export const selectCurrentTier = (state) => state.subscription.currentTier;
export const selectBillingCycle = (state) => state.subscription.billingCycle;
export const selectCreditsRemaining = (state) => state.subscription.creditsRemaining;
export const selectDailyCreditsUsed = (state) => state.subscription.dailyCreditsUsed;
export const selectCreditsLimit = (state) => state.subscription.creditsLimit;
export const selectIsFirstMonth = (state) => state.subscription.isFirstMonth;
export const selectPeriodEnd = (state) => state.subscription.periodEnd;
export const selectCancelAtPeriodEnd = (state) => state.subscription.cancelAtPeriodEnd;
export const selectSubscriptionStatus = (state) => state.subscription.subscriptionStatus;
export const selectShowUpgradeModal = (state) => state.subscription.showUpgradeModal;
export const selectUpgradeContext = (state) => state.subscription.upgradeContext;
export const selectUpgradeLoading = (state) => state.subscription.upgradeLoading;
export const selectCheckoutLoading = (state) => state.subscription.checkoutLoading;
export const selectPortalLoading = (state) => state.subscription.portalLoading;
export const selectSubscriptionError = (state) => state.subscription.error;

export default subscriptionSlice.reducer;
