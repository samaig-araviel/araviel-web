import { describe, it, expect, beforeEach } from 'vitest';
import analyticsReducer, {
  recordMessage,
  setMonthlyBudget,
  setBudgetAlertThreshold,
  resetStats,
  selectLifetimeStats,
  selectMonthlyBudget,
  selectBudgetAlertThreshold,
} from './analyticsSlice';

describe('analyticsSlice', () => {
  let defaultState;

  beforeEach(() => {
    localStorage.clear();
    defaultState = analyticsReducer(undefined, resetStats());
  });

  describe('initial state', () => {
    it('has zeroed lifetime stats', () => {
      expect(defaultState.lifetimeStats.totalMessages).toBe(0);
      expect(defaultState.lifetimeStats.totalCost).toBe(0);
      expect(defaultState.lifetimeStats.totalInputTokens).toBe(0);
      expect(defaultState.lifetimeStats.totalOutputTokens).toBe(0);
      expect(defaultState.lifetimeStats.points).toBe(0);
      expect(defaultState.lifetimeStats.currentStreak).toBe(0);
      expect(defaultState.lifetimeStats.longestStreak).toBe(0);
    });

    it('has null monthly budget', () => {
      expect(defaultState.monthlyBudget).toBeNull();
    });

    it('has default budget alert threshold', () => {
      expect(defaultState.budgetAlertThreshold).toBe(0.8);
    });
  });

  describe('recordMessage', () => {
    const basePayload = {
      modelId: 'claude-sonnet-4-6',
      modelName: 'Claude Sonnet 4.6',
      provider: 'anthropic',
      costUsd: 0.01,
      inputTokens: 100,
      outputTokens: 200,
      latencyMs: 500,
      timestamp: new Date().toISOString(),
      promptSnippet: 'Tell me about AI',
    };

    it('increments totalMessages', () => {
      const state = analyticsReducer(defaultState, recordMessage(basePayload));
      expect(state.lifetimeStats.totalMessages).toBe(1);
    });

    it('accumulates cost', () => {
      let state = analyticsReducer(defaultState, recordMessage(basePayload));
      state = analyticsReducer(state, recordMessage({ ...basePayload, costUsd: 0.02 }));
      expect(state.lifetimeStats.totalCost).toBeCloseTo(0.03, 4);
    });

    it('accumulates tokens', () => {
      const state = analyticsReducer(defaultState, recordMessage(basePayload));
      expect(state.lifetimeStats.totalInputTokens).toBe(100);
      expect(state.lifetimeStats.totalOutputTokens).toBe(200);
    });

    it('tracks model usage', () => {
      const state = analyticsReducer(defaultState, recordMessage(basePayload));
      expect(state.lifetimeStats.modelUsage['claude-sonnet-4-6']).toBe(1);
    });

    it('tracks provider usage', () => {
      const state = analyticsReducer(defaultState, recordMessage(basePayload));
      expect(state.lifetimeStats.providerUsage['anthropic']).toBe(1);
    });

    it('tracks daily usage', () => {
      const state = analyticsReducer(defaultState, recordMessage(basePayload));
      const dailyKeys = Object.keys(state.lifetimeStats.dailyUsage);
      expect(dailyKeys.length).toBe(1);
      const day = state.lifetimeStats.dailyUsage[dailyKeys[0]];
      expect(day.messages).toBe(1);
      expect(day.cost).toBe(0.01);
    });

    it('tracks hourly usage', () => {
      const state = analyticsReducer(defaultState, recordMessage(basePayload));
      const hourKeys = Object.keys(state.lifetimeStats.hourlyUsage);
      expect(hourKeys.length).toBe(1);
    });

    it('tracks latency', () => {
      const state = analyticsReducer(defaultState, recordMessage(basePayload));
      expect(state.lifetimeStats.latencySum).toBe(500);
      expect(state.lifetimeStats.latencyCount).toBe(1);
    });

    it('tracks latency by model', () => {
      const state = analyticsReducer(defaultState, recordMessage(basePayload));
      expect(state.lifetimeStats.latencyByModel['claude-sonnet-4-6'].sum).toBe(500);
      expect(state.lifetimeStats.latencyByModel['claude-sonnet-4-6'].count).toBe(1);
    });

    it('stores prompt snippets', () => {
      const state = analyticsReducer(defaultState, recordMessage(basePayload));
      expect(state.lifetimeStats.promptSnippets).toContain('Tell me about AI');
    });

    it('limits prompt snippets to 200', () => {
      let state = defaultState;
      for (let i = 0; i < 210; i++) {
        state = analyticsReducer(
          state,
          recordMessage({ ...basePayload, promptSnippet: `Snippet ${i}` })
        );
      }
      expect(state.lifetimeStats.promptSnippets.length).toBeLessThanOrEqual(200);
    });

    it('sets firstUsedAt on first message', () => {
      const state = analyticsReducer(defaultState, recordMessage(basePayload));
      expect(state.lifetimeStats.firstUsedAt).toBe(basePayload.timestamp);
    });

    it('does not overwrite firstUsedAt on subsequent messages', () => {
      let state = analyticsReducer(defaultState, recordMessage(basePayload));
      const laterTimestamp = new Date(Date.now() + 10000).toISOString();
      state = analyticsReducer(
        state,
        recordMessage({ ...basePayload, timestamp: laterTimestamp })
      );
      expect(state.lifetimeStats.firstUsedAt).toBe(basePayload.timestamp);
    });

    describe('points system', () => {
      it('awards base point per message', () => {
        const state = analyticsReducer(defaultState, recordMessage(basePayload));
        expect(state.lifetimeStats.points).toBeGreaterThanOrEqual(1);
      });

      it('awards model discovery bonus for new models', () => {
        const state = analyticsReducer(defaultState, recordMessage(basePayload));
        // Base (1) + first streak day (0 since it's first active date, sets streak to 1) + model discovery (3)
        expect(state.lifetimeStats.modelsDiscovered).toContain('claude-sonnet-4-6');
      });

      it('no duplicate model discovery bonus', () => {
        let state = analyticsReducer(defaultState, recordMessage(basePayload));
        const pointsAfterFirst = state.lifetimeStats.points;
        state = analyticsReducer(state, recordMessage(basePayload));
        // Second message: only base point (1), no model discovery
        expect(state.lifetimeStats.points).toBe(pointsAfterFirst + 1);
      });

      it('tracks streak days', () => {
        const state = analyticsReducer(defaultState, recordMessage(basePayload));
        expect(state.lifetimeStats.currentStreak).toBe(1);
      });
    });

    it('handles missing optional fields gracefully', () => {
      const minimal = {
        timestamp: new Date().toISOString(),
      };
      const state = analyticsReducer(defaultState, recordMessage(minimal));
      expect(state.lifetimeStats.totalMessages).toBe(1);
      expect(state.lifetimeStats.totalCost).toBe(0);
    });

    it('persists to localStorage', () => {
      analyticsReducer(defaultState, recordMessage(basePayload));
      expect(localStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('setMonthlyBudget', () => {
    it('sets the budget', () => {
      const state = analyticsReducer(defaultState, setMonthlyBudget(50));
      expect(state.monthlyBudget).toBe(50);
    });

    it('persists to localStorage', () => {
      analyticsReducer(defaultState, setMonthlyBudget(50));
      expect(localStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('setBudgetAlertThreshold', () => {
    it('sets the threshold', () => {
      const state = analyticsReducer(defaultState, setBudgetAlertThreshold(0.9));
      expect(state.budgetAlertThreshold).toBe(0.9);
    });
  });

  describe('resetStats', () => {
    it('resets all analytics to defaults', () => {
      let state = analyticsReducer(
        defaultState,
        recordMessage({
          modelId: 'test',
          costUsd: 1,
          timestamp: new Date().toISOString(),
        })
      );
      state = analyticsReducer(state, setMonthlyBudget(100));
      state = analyticsReducer(state, resetStats());

      expect(state.lifetimeStats.totalMessages).toBe(0);
      expect(state.monthlyBudget).toBeNull();
      expect(state.budgetAlertThreshold).toBe(0.8);
    });
  });

  describe('selectors', () => {
    const rootState = {
      analytics: {
        lifetimeStats: { totalMessages: 42 },
        monthlyBudget: 25,
        budgetAlertThreshold: 0.9,
      },
    };

    it('selectLifetimeStats', () => {
      expect(selectLifetimeStats(rootState).totalMessages).toBe(42);
    });

    it('selectMonthlyBudget', () => {
      expect(selectMonthlyBudget(rootState)).toBe(25);
    });

    it('selectBudgetAlertThreshold', () => {
      expect(selectBudgetAlertThreshold(rootState)).toBe(0.9);
    });
  });
});
