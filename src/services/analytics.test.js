import { describe, it, expect } from 'vitest';
import {
  filterByPeriod,
  computeOverviewFromLifetime,
  computeUsageTrend,
  computeCostTrend,
  computeModelBreakdown,
  computeProviderBreakdown,
  computeWeekdayFrequency,
  computeHourlyActivity,
  computeLatencyByModel,
  computeTopicAnalysis,
  getLevel,
  computeBudgetStatus,
  computePeriodCounts,
  getMostActiveHour,
  getTopModel,
  getTopProvider,
} from './analytics';

// Helper: create a date key in YYYY-MM-DD format
function dateKey(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const sampleDailyUsage = {
  [dateKey(0)]: { messages: 10, cost: 0.5, inputTokens: 1000, outputTokens: 2000 },
  [dateKey(1)]: { messages: 5, cost: 0.3, inputTokens: 500, outputTokens: 1000 },
  [dateKey(5)]: { messages: 8, cost: 0.4, inputTokens: 800, outputTokens: 1600 },
  [dateKey(15)]: { messages: 3, cost: 0.1, inputTokens: 300, outputTokens: 600 },
  [dateKey(40)]: { messages: 2, cost: 0.05, inputTokens: 200, outputTokens: 400 },
};

describe('analytics service', () => {
  describe('filterByPeriod', () => {
    it('filters for today only', () => {
      const result = filterByPeriod(sampleDailyUsage, 'today');
      const keys = Object.keys(result);
      expect(keys).toHaveLength(1);
      expect(keys[0]).toBe(dateKey(0));
    });

    it('filters for the past week', () => {
      const result = filterByPeriod(sampleDailyUsage, 'week');
      const keys = Object.keys(result);
      // Should include today, 1 day ago, 5 days ago
      expect(keys.length).toBeGreaterThanOrEqual(2);
      expect(keys.length).toBeLessThanOrEqual(4);
    });

    it('filters for the past month', () => {
      const result = filterByPeriod(sampleDailyUsage, 'month');
      const keys = Object.keys(result);
      expect(keys.length).toBeGreaterThanOrEqual(3);
    });

    it('returns all data for "all" period', () => {
      const result = filterByPeriod(sampleDailyUsage, 'all');
      expect(Object.keys(result)).toHaveLength(Object.keys(sampleDailyUsage).length);
    });

    it('returns empty object when today has no data', () => {
      const result = filterByPeriod({}, 'today');
      expect(Object.keys(result)).toHaveLength(0);
    });
  });

  describe('computeOverviewFromLifetime', () => {
    const stats = {
      dailyUsage: sampleDailyUsage,
      modelUsage: { 'model-a': 10, 'model-b': 5 },
      providerUsage: { anthropic: 8, openai: 7 },
      latencySum: 5000,
      latencyCount: 10,
    };

    it('computes totals for all periods', () => {
      const overview = computeOverviewFromLifetime(stats, 'all');
      expect(overview.totalMessages).toBe(28);
      expect(overview.totalCost).toBeCloseTo(1.35, 2);
      expect(overview.totalInputTokens).toBe(2800);
      expect(overview.totalOutputTokens).toBe(5600);
      expect(overview.totalTokens).toBe(8400);
    });

    it('computes average latency', () => {
      const overview = computeOverviewFromLifetime(stats, 'all');
      expect(overview.avgLatency).toBe(500);
    });

    it('counts unique models and providers', () => {
      const overview = computeOverviewFromLifetime(stats, 'all');
      expect(overview.uniqueModels).toBe(2);
      expect(overview.uniqueProviders).toBe(2);
    });

    it('counts active days', () => {
      const overview = computeOverviewFromLifetime(stats, 'all');
      expect(overview.activeDays).toBe(5);
    });

    it('returns 0 latency when no latency data', () => {
      const noLatency = { ...stats, latencySum: 0, latencyCount: 0 };
      const overview = computeOverviewFromLifetime(noLatency, 'all');
      expect(overview.avgLatency).toBe(0);
    });
  });

  describe('computeUsageTrend', () => {
    it('returns sorted trend data', () => {
      const trend = computeUsageTrend(sampleDailyUsage, 'all');
      expect(trend.length).toBe(5);
      for (let i = 1; i < trend.length; i++) {
        expect(trend[i].date >= trend[i - 1].date).toBe(true);
      }
    });

    it('each entry has date, input, output', () => {
      const trend = computeUsageTrend(sampleDailyUsage, 'all');
      for (const entry of trend) {
        expect(entry.date).toBeDefined();
        expect(typeof entry.input).toBe('number');
        expect(typeof entry.output).toBe('number');
      }
    });
  });

  describe('computeCostTrend', () => {
    it('returns cumulative cost', () => {
      const trend = computeCostTrend(sampleDailyUsage, 'all');
      for (let i = 1; i < trend.length; i++) {
        expect(trend[i].cost).toBeGreaterThanOrEqual(trend[i - 1].cost);
      }
    });

    it('last entry has total cost', () => {
      const trend = computeCostTrend(sampleDailyUsage, 'all');
      const last = trend[trend.length - 1];
      expect(last.cost).toBeCloseTo(1.35, 2);
    });
  });

  describe('computeModelBreakdown', () => {
    it('returns sorted breakdown by count', () => {
      const breakdown = computeModelBreakdown({ 'claude-sonnet-4-6': 10, 'gpt-4o': 5 });
      expect(breakdown[0].count).toBeGreaterThanOrEqual(breakdown[1].count);
    });

    it('handles empty usage', () => {
      expect(computeModelBreakdown({})).toHaveLength(0);
      expect(computeModelBreakdown(null)).toHaveLength(0);
    });

    it('entries have required fields', () => {
      const breakdown = computeModelBreakdown({ 'claude-sonnet-4-6': 5 });
      expect(breakdown[0].modelId).toBe('claude-sonnet-4-6');
      expect(breakdown[0].count).toBe(5);
      expect(breakdown[0].name).toBeDefined();
    });
  });

  describe('computeProviderBreakdown', () => {
    it('returns sorted breakdown by value', () => {
      const breakdown = computeProviderBreakdown({ anthropic: 10, openai: 20 });
      expect(breakdown[0].value).toBeGreaterThanOrEqual(breakdown[1].value);
      expect(breakdown[0].providerId).toBe('openai');
    });

    it('handles empty usage', () => {
      expect(computeProviderBreakdown({})).toHaveLength(0);
      expect(computeProviderBreakdown(null)).toHaveLength(0);
    });
  });

  describe('computeWeekdayFrequency', () => {
    it('returns 7 entries for each day of the week', () => {
      const freq = computeWeekdayFrequency(sampleDailyUsage);
      expect(freq).toHaveLength(7);
      expect(freq[0].day).toBe('Sun');
      expect(freq[6].day).toBe('Sat');
    });

    it('handles empty usage', () => {
      const freq = computeWeekdayFrequency({});
      expect(freq).toHaveLength(7);
      for (const entry of freq) {
        expect(entry.messages).toBe(0);
      }
    });
  });

  describe('computeHourlyActivity', () => {
    it('returns 24 entries', () => {
      const activity = computeHourlyActivity({ '0': 5, '12': 10, '23': 3 });
      expect(activity).toHaveLength(24);
    });

    it('maps hourly data correctly', () => {
      const activity = computeHourlyActivity({ '12': 10 });
      expect(activity[12].messages).toBe(10);
      expect(activity[0].messages).toBe(0);
    });

    it('handles empty usage', () => {
      const activity = computeHourlyActivity({});
      expect(activity).toHaveLength(24);
      for (const entry of activity) {
        expect(entry.messages).toBe(0);
      }
    });
  });

  describe('computeLatencyByModel', () => {
    it('computes average latency per model', () => {
      const result = computeLatencyByModel({
        'claude-sonnet-4-6': { sum: 3000, count: 3 },
      });
      expect(result[0].latency).toBe(1000);
    });

    it('sorts by latency descending', () => {
      const result = computeLatencyByModel({
        'model-a': { sum: 1000, count: 1 },
        'model-b': { sum: 5000, count: 1 },
      });
      expect(result[0].latency).toBeGreaterThanOrEqual(result[1].latency);
    });

    it('limits to 10 entries', () => {
      const data = {};
      for (let i = 0; i < 15; i++) {
        data[`model-${i}`] = { sum: 1000 * i, count: 1 };
      }
      const result = computeLatencyByModel(data);
      expect(result.length).toBeLessThanOrEqual(10);
    });

    it('handles empty data', () => {
      expect(computeLatencyByModel({})).toHaveLength(0);
      expect(computeLatencyByModel(null)).toHaveLength(0);
    });
  });

  describe('computeTopicAnalysis', () => {
    it('extracts word frequencies from snippets', () => {
      const topics = computeTopicAnalysis([
        'React performance optimization',
        'React hooks tutorial',
        'React component testing',
      ]);
      const reactTopic = topics.find((t) => t.word === 'react');
      expect(reactTopic).toBeDefined();
      expect(reactTopic.count).toBe(3);
    });

    it('filters out stop words', () => {
      const topics = computeTopicAnalysis(['the quick brown fox']);
      const words = topics.map((t) => t.word);
      expect(words).not.toContain('the');
    });

    it('filters out short words', () => {
      const topics = computeTopicAnalysis(['go to me at']);
      expect(topics).toHaveLength(0);
    });

    it('limits to 20 topics', () => {
      const snippets = [];
      for (let i = 0; i < 50; i++) {
        snippets.push(`word${i} unique${i} special${i}`);
      }
      const topics = computeTopicAnalysis(snippets);
      expect(topics.length).toBeLessThanOrEqual(20);
    });

    it('handles empty input', () => {
      expect(computeTopicAnalysis([])).toHaveLength(0);
      expect(computeTopicAnalysis(null)).toHaveLength(0);
    });
  });

  describe('getLevel', () => {
    it('returns Beginner for 0 points', () => {
      expect(getLevel(0).name).toBe('Beginner');
    });

    it('returns Explorer for 100 points', () => {
      expect(getLevel(100).name).toBe('Explorer');
    });

    it('returns Power User for 300 points', () => {
      expect(getLevel(300).name).toBe('Power User');
    });

    it('returns Expert for 800 points', () => {
      expect(getLevel(800).name).toBe('Expert');
    });

    it('returns Master for 2000 points', () => {
      expect(getLevel(2000).name).toBe('Master');
    });

    it('includes progress field between 0 and 1', () => {
      const level = getLevel(25);
      expect(level.progress).toBeGreaterThanOrEqual(0);
      expect(level.progress).toBeLessThanOrEqual(1);
    });

    it('Master level has progress of 1', () => {
      expect(getLevel(5000).progress).toBe(1);
    });
  });

  describe('computeBudgetStatus', () => {
    it('returns null when no budget set', () => {
      expect(computeBudgetStatus(sampleDailyUsage, null)).toBeNull();
    });

    it('computes budget status correctly', () => {
      const status = computeBudgetStatus({ [dateKey(0)]: { cost: 5 } }, 10);
      expect(status.spent).toBe(5);
      expect(status.budget).toBe(10);
      expect(status.percent).toBe(0.5);
      expect(status.remaining).toBe(5);
    });

    it('remaining never goes negative', () => {
      const status = computeBudgetStatus({ [dateKey(0)]: { cost: 15 } }, 10);
      expect(status.remaining).toBe(0);
    });
  });

  describe('computePeriodCounts', () => {
    it('computes daily, weekly, monthly, yearly, and allTime', () => {
      const counts = computePeriodCounts(sampleDailyUsage);
      expect(typeof counts.daily).toBe('number');
      expect(typeof counts.weekly).toBe('number');
      expect(typeof counts.monthly).toBe('number');
      expect(typeof counts.yearly).toBe('number');
      expect(typeof counts.allTime).toBe('number');
    });

    it('daily count matches today', () => {
      const counts = computePeriodCounts(sampleDailyUsage);
      expect(counts.daily).toBe(10);
    });

    it('allTime includes everything', () => {
      const counts = computePeriodCounts(sampleDailyUsage);
      expect(counts.allTime).toBe(28);
    });

    it('handles empty usage', () => {
      const counts = computePeriodCounts({});
      expect(counts.allTime).toBe(0);
    });
  });

  describe('getMostActiveHour', () => {
    it('returns the hour with most messages', () => {
      const result = getMostActiveHour({ '9': 5, '14': 20, '22': 10 });
      expect(result.hour).toBe(14);
      expect(result.count).toBe(20);
    });

    it('returns hour 0 for empty usage', () => {
      const result = getMostActiveHour({});
      expect(result.hour).toBe(0);
      expect(result.count).toBe(0);
    });
  });

  describe('getTopModel', () => {
    it('returns the most used model', () => {
      const result = getTopModel({ 'claude-sonnet-4-6': 20, 'gpt-4o': 5 });
      expect(result.modelId).toBe('claude-sonnet-4-6');
      expect(result.count).toBe(20);
    });

    it('returns null for empty usage', () => {
      expect(getTopModel({})).toBeNull();
    });
  });

  describe('getTopProvider', () => {
    it('returns the most used provider', () => {
      const result = getTopProvider({ anthropic: 30, openai: 10 });
      expect(result.providerId).toBe('anthropic');
      expect(result.count).toBe(30);
    });

    it('returns null for empty usage', () => {
      expect(getTopProvider({})).toBeNull();
    });
  });
});
