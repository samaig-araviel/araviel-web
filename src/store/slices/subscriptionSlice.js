import { createSlice } from '@reduxjs/toolkit';
import { SubscriptionTier } from '../../config/subscription';

const initialState = {
  currentTier: SubscriptionTier.Free,
  billingCycle: 'monthly', // 'monthly' | 'annual'
  creditsRemaining: 0,
  dailyCreditsUsed: 0,
  isFirstMonth: true,
  showUpgradeModal: false,
  upgradeContext: null,
  // upgradeContext shape: { reason: 'credit_limit' | 'model_gated' | 'feature_gated', suggestedTier, message, modelName? }
  upgradeLoading: null, // tier id when initiating upgrade
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
    setIsFirstMonth: (state, action) => {
      state.isFirstMonth = action.payload;
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
});

export const {
  setCurrentTier,
  setBillingCycle,
  setCreditsRemaining,
  setDailyCreditsUsed,
  setIsFirstMonth,
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
export const selectIsFirstMonth = (state) => state.subscription.isFirstMonth;
export const selectShowUpgradeModal = (state) => state.subscription.showUpgradeModal;
export const selectUpgradeContext = (state) => state.subscription.upgradeContext;
export const selectUpgradeLoading = (state) => state.subscription.upgradeLoading;

export default subscriptionSlice.reducer;
