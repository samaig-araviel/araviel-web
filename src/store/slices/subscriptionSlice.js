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
  isFirstMonth: false,
  periodEnd: null,
  cancelAtPeriodEnd: false,
  subscriptionStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  // Text credits (monthly + 3-hour window)
  textCredits: {
    monthlyUsed: 0,
    monthlyLimit: 100,
    windowUsed: 0,
    windowLimit: 8,
    windowResetAt: null,
  },
  // Image credits (monthly, separate)
  imageCredits: {
    used: 0,
    limit: 5,
    remaining: 5,
    packRemaining: 0,
    cycleResetsAt: null,
  },
  showUpgradeModal: false,
  upgradeContext: null,
  upgradeLoading: null,
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
    setIsFirstMonth: (state, action) => {
      state.isFirstMonth = action.payload;
    },
    setTextCredits: (state, action) => {
      state.textCredits = { ...state.textCredits, ...action.payload };
    },
    setImageCredits: (state, action) => {
      state.imageCredits = { ...state.imageCredits, ...action.payload };
    },
    /** Bulk setter from API response — avoids multiple dispatches */
    setSubscriptionData: (state, action) => {
      const data = action.payload;
      if (data.tier) state.currentTier = data.tier;
      if (data.billingInterval) state.billingCycle = data.billingInterval;
      if (data.periodEnd !== undefined) state.periodEnd = data.periodEnd;
      if (data.cancelAtPeriodEnd !== undefined) state.cancelAtPeriodEnd = data.cancelAtPeriodEnd;
      if (data.firstMonth !== undefined) state.isFirstMonth = data.firstMonth;
      if (data.textCredits) {
        state.textCredits = {
          monthlyUsed: data.textCredits.monthlyUsed ?? 0,
          monthlyLimit: data.textCredits.monthlyLimit ?? 100,
          windowUsed: data.textCredits.windowUsed ?? 0,
          windowLimit: data.textCredits.windowLimit ?? 8,
          windowResetAt: data.textCredits.windowResetAt ?? null,
        };
      }
      if (data.imageCredits) {
        state.imageCredits = {
          used: data.imageCredits.used ?? 0,
          limit: data.imageCredits.limit ?? 5,
          remaining: data.imageCredits.remaining ?? 5,
          packRemaining: data.imageCredits.packRemaining ?? 0,
          cycleResetsAt: data.imageCredits.cycleResetsAt ?? null,
        };
      }
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
        if (data.textCredits) {
          state.textCredits = {
            monthlyUsed: data.textCredits.monthlyUsed ?? 0,
            monthlyLimit: data.textCredits.monthlyLimit ?? 100,
            windowUsed: data.textCredits.windowUsed ?? 0,
            windowLimit: data.textCredits.windowLimit ?? 8,
            windowResetAt: data.textCredits.windowResetAt ?? null,
          };
        }
        if (data.imageCredits) {
          state.imageCredits = {
            used: data.imageCredits.used ?? 0,
            limit: data.imageCredits.limit ?? 5,
            remaining: data.imageCredits.remaining ?? 5,
            packRemaining: data.imageCredits.packRemaining ?? 0,
            cycleResetsAt: data.imageCredits.cycleResetsAt ?? null,
          };
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
  setIsFirstMonth,
  setTextCredits,
  setImageCredits,
  setSubscriptionData,
  showUpgradeModal,
  hideUpgradeModal,
  initiateUpgrade,
  clearUpgradeLoading,
  resetSubscriptionState,
} = subscriptionSlice.actions;

export const selectCurrentTier = (state) => state.subscription.currentTier;
export const selectBillingCycle = (state) => state.subscription.billingCycle;
export const selectIsFirstMonth = (state) => state.subscription.isFirstMonth;
export const selectPeriodEnd = (state) => state.subscription.periodEnd;
export const selectCancelAtPeriodEnd = (state) => state.subscription.cancelAtPeriodEnd;
export const selectSubscriptionStatus = (state) => state.subscription.subscriptionStatus;
export const selectTextCredits = (state) => state.subscription.textCredits;
export const selectImageCredits = (state) => state.subscription.imageCredits;
export const selectShowUpgradeModal = (state) => state.subscription.showUpgradeModal;
export const selectUpgradeContext = (state) => state.subscription.upgradeContext;
export const selectUpgradeLoading = (state) => state.subscription.upgradeLoading;
export const selectCheckoutLoading = (state) => state.subscription.checkoutLoading;
export const selectPortalLoading = (state) => state.subscription.portalLoading;
export const selectSubscriptionError = (state) => state.subscription.error;

export default subscriptionSlice.reducer;
