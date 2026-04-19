import { createSlice } from '@reduxjs/toolkit';

const STORAGE_KEY = 'araviel-analytics';
const MILESTONES = [10, 50, 100, 500, 1000, 5000];
// Bounded ring buffer for client-side product telemetry events. Keeps the
// localStorage payload predictable while still retaining recent history for
// debugging and downstream aggregation.
const EVENT_HISTORY_LIMIT = 500;

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return null;
}

function saveToStorage(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function getDateKey(timestamp) {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

const defaultState = {
  lifetimeStats: {
    totalMessages: 0,
    totalCost: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    firstUsedAt: null,
    modelUsage: {},
    providerUsage: {},
    dailyUsage: {},
    hourlyUsage: {},
    points: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    modelsDiscovered: [],
    latencySum: 0,
    latencyCount: 0,
    latencyByModel: {},
    promptSnippets: [],
    events: [],
  },
  monthlyBudget: null,
  budgetAlertThreshold: 0.8,
};

const persisted = loadFromStorage();

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: persisted || defaultState,
  reducers: {
    recordMessage(state, action) {
      const {
        modelId,
        modelName,
        provider,
        costUsd,
        inputTokens,
        outputTokens,
        latencyMs,
        timestamp,
        promptSnippet,
      } = action.payload;

      const stats = state.lifetimeStats;
      const prevTotal = stats.totalMessages;

      // Core counters
      stats.totalMessages += 1;
      stats.totalCost += costUsd || 0;
      stats.totalInputTokens += inputTokens || 0;
      stats.totalOutputTokens += outputTokens || 0;

      if (!stats.firstUsedAt) {
        stats.firstUsedAt = timestamp;
      }

      // Model & provider usage
      if (modelId) {
        stats.modelUsage[modelId] = (stats.modelUsage[modelId] || 0) + 1;
      }
      if (provider) {
        stats.providerUsage[provider] = (stats.providerUsage[provider] || 0) + 1;
      }

      // Daily usage
      const dateKey = getDateKey(timestamp);
      if (!stats.dailyUsage[dateKey]) {
        stats.dailyUsage[dateKey] = { messages: 0, cost: 0, inputTokens: 0, outputTokens: 0 };
      }
      stats.dailyUsage[dateKey].messages += 1;
      stats.dailyUsage[dateKey].cost += costUsd || 0;
      stats.dailyUsage[dateKey].inputTokens += inputTokens || 0;
      stats.dailyUsage[dateKey].outputTokens += outputTokens || 0;

      // Hourly usage
      const hour = new Date(timestamp).getHours();
      const hourKey = String(hour);
      stats.hourlyUsage[hourKey] = (stats.hourlyUsage[hourKey] || 0) + 1;

      // Latency tracking
      if (latencyMs && latencyMs > 0) {
        stats.latencySum += latencyMs;
        stats.latencyCount += 1;
        if (modelId) {
          if (!stats.latencyByModel[modelId]) {
            stats.latencyByModel[modelId] = { sum: 0, count: 0 };
          }
          stats.latencyByModel[modelId].sum += latencyMs;
          stats.latencyByModel[modelId].count += 1;
        }
      }

      // Prompt snippets (keep last 200 for topic analysis)
      if (promptSnippet) {
        if (!stats.promptSnippets) stats.promptSnippets = [];
        stats.promptSnippets.push(promptSnippet);
        if (stats.promptSnippets.length > 200) {
          stats.promptSnippets = stats.promptSnippets.slice(-200);
        }
      }

      // --- Points system ---
      let pointsEarned = 1; // base point per message

      // Streak
      const today = dateKey;
      if (stats.lastActiveDate && stats.lastActiveDate !== today) {
        const lastDate = new Date(stats.lastActiveDate);
        const todayDate = new Date(today);
        const diffDays = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          stats.currentStreak += 1;
          pointsEarned += 5; // streak bonus
        } else if (diffDays > 1) {
          stats.currentStreak = 1;
        }
      } else if (!stats.lastActiveDate) {
        stats.currentStreak = 1;
      }
      stats.lastActiveDate = today;
      if (stats.currentStreak > stats.longestStreak) {
        stats.longestStreak = stats.currentStreak;
      }

      // New model discovery bonus
      if (modelId && !stats.modelsDiscovered.includes(modelId)) {
        stats.modelsDiscovered.push(modelId);
        pointsEarned += 3;
      }

      // Milestone bonus
      const newTotal = stats.totalMessages;
      for (const milestone of MILESTONES) {
        if (prevTotal < milestone && newTotal >= milestone) {
          pointsEarned += 10;
        }
      }

      stats.points += pointsEarned;

      saveToStorage(state);
    },

    setMonthlyBudget(state, action) {
      state.monthlyBudget = action.payload;
      saveToStorage(state);
    },

    setBudgetAlertThreshold(state, action) {
      state.budgetAlertThreshold = action.payload;
      saveToStorage(state);
    },

    resetStats(state) {
      Object.assign(state, defaultState);
      saveToStorage(state);
    },

    /**
     * Record a structured product-telemetry event.
     * Kept deliberately small: a name and a flat bag of properties. The
     * buffer is capped at EVENT_HISTORY_LIMIT to bound localStorage growth.
     *
     * @param {{ name: string, properties?: object, timestamp?: number }} payload
     */
    recordEvent(state, action) {
      const { name, properties, timestamp } = action.payload || {};
      if (!name) return;
      const stats = state.lifetimeStats;
      if (!Array.isArray(stats.events)) stats.events = [];
      stats.events.push({
        name,
        properties: properties || {},
        timestamp: timestamp || Date.now(),
      });
      if (stats.events.length > EVENT_HISTORY_LIMIT) {
        stats.events = stats.events.slice(-EVENT_HISTORY_LIMIT);
      }
      saveToStorage(state);
    },
  },
});

export const { recordMessage, recordEvent, setMonthlyBudget, setBudgetAlertThreshold, resetStats } =
  analyticsSlice.actions;

// Selectors
export const selectLifetimeStats = (state) => state.analytics.lifetimeStats;
export const selectMonthlyBudget = (state) => state.analytics.monthlyBudget;
export const selectBudgetAlertThreshold = (state) => state.analytics.budgetAlertThreshold;
export const selectRecentEvents = (state) => state.analytics.lifetimeStats.events || [];

export default analyticsSlice.reducer;
