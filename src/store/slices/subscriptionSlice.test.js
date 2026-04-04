import { describe, it, expect } from 'vitest';
import subscriptionReducer, {
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
  selectCurrentTier,
  selectBillingCycle,
  selectIsFirstMonth,
  selectPeriodEnd,
  selectCancelAtPeriodEnd,
  selectSubscriptionStatus,
  selectTextCredits,
  selectImageCredits,
  selectShowUpgradeModal,
  selectUpgradeContext,
  selectUpgradeLoading,
  selectCheckoutLoading,
  selectPortalLoading,
  selectSubscriptionError,
} from './subscriptionSlice';

describe('subscriptionSlice', () => {
  let defaultState;

  beforeEach(() => {
    defaultState = subscriptionReducer(undefined, { type: 'unknown' });
  });

  describe('initial state', () => {
    it('defaults to free tier', () => {
      expect(defaultState.currentTier).toBe('free');
    });

    it('defaults to monthly billing', () => {
      expect(defaultState.billingCycle).toBe('monthly');
    });

    it('defaults to idle subscription status', () => {
      expect(defaultState.subscriptionStatus).toBe('idle');
    });

    it('has default text credits', () => {
      expect(defaultState.textCredits.monthlyLimit).toBe(100);
      expect(defaultState.textCredits.windowLimit).toBe(8);
    });

    it('has default image credits', () => {
      expect(defaultState.imageCredits.limit).toBe(5);
      expect(defaultState.imageCredits.remaining).toBe(5);
    });
  });

  describe('setCurrentTier', () => {
    it('sets the tier', () => {
      const state = subscriptionReducer(defaultState, setCurrentTier('pro'));
      expect(state.currentTier).toBe('pro');
    });
  });

  describe('setBillingCycle', () => {
    it('sets the billing cycle', () => {
      const state = subscriptionReducer(defaultState, setBillingCycle('annual'));
      expect(state.billingCycle).toBe('annual');
    });
  });

  describe('setIsFirstMonth', () => {
    it('sets first month flag', () => {
      const state = subscriptionReducer(defaultState, setIsFirstMonth(true));
      expect(state.isFirstMonth).toBe(true);
    });
  });

  describe('setTextCredits', () => {
    it('merges with existing text credits', () => {
      const state = subscriptionReducer(
        defaultState,
        setTextCredits({ monthlyUsed: 50, monthlyLimit: 1500 })
      );
      expect(state.textCredits.monthlyUsed).toBe(50);
      expect(state.textCredits.monthlyLimit).toBe(1500);
      expect(state.textCredits.windowLimit).toBe(8); // preserved
    });
  });

  describe('setImageCredits', () => {
    it('merges with existing image credits', () => {
      const state = subscriptionReducer(
        defaultState,
        setImageCredits({ used: 3, remaining: 47, limit: 50 })
      );
      expect(state.imageCredits.used).toBe(3);
      expect(state.imageCredits.remaining).toBe(47);
      expect(state.imageCredits.limit).toBe(50);
    });
  });

  describe('setSubscriptionData', () => {
    it('bulk-sets subscription data from API response', () => {
      const state = subscriptionReducer(
        defaultState,
        setSubscriptionData({
          tier: 'lite',
          billingInterval: 'annual',
          periodEnd: '2024-12-31',
          cancelAtPeriodEnd: true,
          firstMonth: true,
          textCredits: {
            monthlyUsed: 100,
            monthlyLimit: 1500,
            windowUsed: 10,
            windowLimit: 60,
            windowResetAt: '2024-01-01',
          },
          imageCredits: {
            used: 5,
            limit: 50,
            remaining: 45,
            packRemaining: 10,
            cycleResetsAt: '2024-02-01',
          },
        })
      );

      expect(state.currentTier).toBe('lite');
      expect(state.billingCycle).toBe('annual');
      expect(state.periodEnd).toBe('2024-12-31');
      expect(state.cancelAtPeriodEnd).toBe(true);
      expect(state.isFirstMonth).toBe(true);
      expect(state.textCredits.monthlyUsed).toBe(100);
      expect(state.textCredits.monthlyLimit).toBe(1500);
      expect(state.imageCredits.used).toBe(5);
      expect(state.imageCredits.packRemaining).toBe(10);
      expect(state.subscriptionStatus).toBe('succeeded');
    });

    it('handles partial data gracefully', () => {
      const state = subscriptionReducer(
        defaultState,
        setSubscriptionData({ tier: 'pro' })
      );
      expect(state.currentTier).toBe('pro');
      expect(state.billingCycle).toBe('monthly'); // unchanged
    });
  });

  describe('upgrade modal', () => {
    it('showUpgradeModal opens modal with context', () => {
      const state = subscriptionReducer(defaultState, showUpgradeModal('credits_exhausted'));
      expect(state.showUpgradeModal).toBe(true);
      expect(state.upgradeContext).toBe('credits_exhausted');
    });

    it('showUpgradeModal works without context', () => {
      const state = subscriptionReducer(defaultState, showUpgradeModal());
      expect(state.showUpgradeModal).toBe(true);
      expect(state.upgradeContext).toBeNull();
    });

    it('hideUpgradeModal closes modal and clears context', () => {
      let state = subscriptionReducer(defaultState, showUpgradeModal('test'));
      state = subscriptionReducer(state, hideUpgradeModal());
      expect(state.showUpgradeModal).toBe(false);
      expect(state.upgradeContext).toBeNull();
    });
  });

  describe('upgrade loading', () => {
    it('initiateUpgrade sets loading tier', () => {
      const state = subscriptionReducer(defaultState, initiateUpgrade('pro'));
      expect(state.upgradeLoading).toBe('pro');
    });

    it('clearUpgradeLoading clears loading', () => {
      let state = subscriptionReducer(defaultState, initiateUpgrade('pro'));
      state = subscriptionReducer(state, clearUpgradeLoading());
      expect(state.upgradeLoading).toBeNull();
    });
  });

  describe('resetSubscriptionState', () => {
    it('resets to defaults', () => {
      let state = subscriptionReducer(defaultState, setCurrentTier('pro'));
      state = subscriptionReducer(state, setBillingCycle('annual'));
      state = subscriptionReducer(state, resetSubscriptionState());
      expect(state.currentTier).toBe('free');
      expect(state.billingCycle).toBe('monthly');
    });
  });

  describe('async thunk reducers', () => {
    it('handles fetchSubscription.pending', () => {
      const state = subscriptionReducer(defaultState, {
        type: 'subscription/fetch/pending',
      });
      expect(state.subscriptionStatus).toBe('loading');
    });

    it('handles fetchSubscription.fulfilled', () => {
      const state = subscriptionReducer(defaultState, {
        type: 'subscription/fetch/fulfilled',
        payload: {
          tier: 'lite',
          billingInterval: 'annual',
          textCredits: { monthlyUsed: 50, monthlyLimit: 1500 },
          imageCredits: { used: 2, limit: 50, remaining: 48 },
        },
      });
      expect(state.currentTier).toBe('lite');
      expect(state.subscriptionStatus).toBe('succeeded');
    });

    it('handles fetchSubscription.rejected', () => {
      const state = subscriptionReducer(defaultState, {
        type: 'subscription/fetch/rejected',
      });
      expect(state.subscriptionStatus).toBe('failed');
    });

    it('handles createCheckout.pending', () => {
      const state = subscriptionReducer(defaultState, {
        type: 'subscription/createCheckout/pending',
      });
      expect(state.checkoutLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('handles createCheckout.fulfilled', () => {
      const prev = { ...defaultState, checkoutLoading: true };
      const state = subscriptionReducer(prev, {
        type: 'subscription/createCheckout/fulfilled',
      });
      expect(state.checkoutLoading).toBe(false);
    });

    it('handles createCheckout.rejected', () => {
      const state = subscriptionReducer(defaultState, {
        type: 'subscription/createCheckout/rejected',
        payload: 'Checkout failed',
      });
      expect(state.checkoutLoading).toBe(false);
      expect(state.error).toBe('Checkout failed');
    });

    it('handles createPortal.pending', () => {
      const state = subscriptionReducer(defaultState, {
        type: 'subscription/createPortal/pending',
      });
      expect(state.portalLoading).toBe(true);
    });

    it('handles createPortal.rejected', () => {
      const state = subscriptionReducer(defaultState, {
        type: 'subscription/createPortal/rejected',
        payload: 'Portal failed',
      });
      expect(state.portalLoading).toBe(false);
      expect(state.error).toBe('Portal failed');
    });
  });

  describe('selectors', () => {
    const rootState = {
      subscription: {
        currentTier: 'pro',
        billingCycle: 'annual',
        isFirstMonth: true,
        periodEnd: '2024-12-31',
        cancelAtPeriodEnd: false,
        subscriptionStatus: 'succeeded',
        textCredits: { monthlyUsed: 100, monthlyLimit: 4000 },
        imageCredits: { used: 10, limit: 150, remaining: 140 },
        showUpgradeModal: false,
        upgradeContext: null,
        upgradeLoading: null,
        checkoutLoading: false,
        portalLoading: false,
        error: null,
      },
    };

    it('selectCurrentTier', () => expect(selectCurrentTier(rootState)).toBe('pro'));
    it('selectBillingCycle', () => expect(selectBillingCycle(rootState)).toBe('annual'));
    it('selectIsFirstMonth', () => expect(selectIsFirstMonth(rootState)).toBe(true));
    it('selectPeriodEnd', () => expect(selectPeriodEnd(rootState)).toBe('2024-12-31'));
    it('selectCancelAtPeriodEnd', () => expect(selectCancelAtPeriodEnd(rootState)).toBe(false));
    it('selectSubscriptionStatus', () =>
      expect(selectSubscriptionStatus(rootState)).toBe('succeeded'));
    it('selectTextCredits', () =>
      expect(selectTextCredits(rootState).monthlyLimit).toBe(4000));
    it('selectImageCredits', () =>
      expect(selectImageCredits(rootState).remaining).toBe(140));
    it('selectShowUpgradeModal', () =>
      expect(selectShowUpgradeModal(rootState)).toBe(false));
    it('selectUpgradeContext', () => expect(selectUpgradeContext(rootState)).toBeNull());
    it('selectUpgradeLoading', () => expect(selectUpgradeLoading(rootState)).toBeNull());
    it('selectCheckoutLoading', () => expect(selectCheckoutLoading(rootState)).toBe(false));
    it('selectPortalLoading', () => expect(selectPortalLoading(rootState)).toBe(false));
    it('selectSubscriptionError', () => expect(selectSubscriptionError(rootState)).toBeNull());
  });
});
