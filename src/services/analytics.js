import { MODELS, PROVIDERS } from '../data/models';

// ── Helpers ──

function getDateKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function getDayOfWeek(dateStr) {
  return new Date(dateStr).getDay(); // 0=Sun … 6=Sat
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => {
  if (i === 0) return '12am';
  if (i < 12) return `${i}am`;
  if (i === 12) return '12pm';
  return `${i - 12}pm`;
});

// Stop-words for topic analysis
const STOP_WORDS = new Set([
  'the',
  'a',
  'an',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'could',
  'should',
  'may',
  'might',
  'shall',
  'can',
  'need',
  'dare',
  'ought',
  'used',
  'to',
  'of',
  'in',
  'for',
  'on',
  'with',
  'at',
  'by',
  'from',
  'as',
  'into',
  'through',
  'during',
  'before',
  'after',
  'above',
  'below',
  'between',
  'out',
  'off',
  'over',
  'under',
  'again',
  'further',
  'then',
  'once',
  'here',
  'there',
  'when',
  'where',
  'why',
  'how',
  'all',
  'each',
  'every',
  'both',
  'few',
  'more',
  'most',
  'other',
  'some',
  'such',
  'no',
  'not',
  'only',
  'own',
  'same',
  'so',
  'than',
  'too',
  'very',
  'just',
  'because',
  'but',
  'and',
  'or',
  'if',
  'while',
  'although',
  'this',
  'that',
  'these',
  'those',
  'i',
  'me',
  'my',
  'we',
  'our',
  'you',
  'your',
  'he',
  'him',
  'his',
  'she',
  'her',
  'it',
  'its',
  'they',
  'them',
  'their',
  'what',
  'which',
  'who',
  'whom',
  'whose',
  'about',
  'up',
  'down',
  'also',
  'please',
  'help',
  'make',
  'like',
  'know',
  'get',
  'got',
  'give',
  'given',
  'tell',
  'want',
  'use',
  'using',
  'write',
  'create',
  'generate',
  'explain',
  'something',
  'anything',
  'thing',
  'much',
  'many',
  'well',
  'really',
]);

// ── Period Filtering ──

export function filterByPeriod(dailyUsage, period) {
  const now = new Date();
  const today = getDateKey(now);

  if (period === 'today') {
    return dailyUsage[today] ? { [today]: dailyUsage[today] } : {};
  }

  const cutoff = new Date(now);
  if (period === 'week') cutoff.setDate(cutoff.getDate() - 7);
  else if (period === 'month') cutoff.setMonth(cutoff.getMonth() - 1);
  else return dailyUsage; // 'all'

  const cutoffKey = getDateKey(cutoff);
  const filtered = {};
  for (const [key, val] of Object.entries(dailyUsage)) {
    if (key >= cutoffKey) filtered[key] = val;
  }
  return filtered;
}

// ── Overview Stats (from persisted lifetime data) ──

export function computeOverviewFromLifetime(stats, period) {
  const daily = filterByPeriod(stats.dailyUsage || {}, period);
  const days = Object.values(daily);

  const totalMessages = days.reduce((s, d) => s + d.messages, 0);
  const totalCost = days.reduce((s, d) => s + d.cost, 0);
  const totalInputTokens = days.reduce((s, d) => s + (d.inputTokens || 0), 0);
  const totalOutputTokens = days.reduce((s, d) => s + (d.outputTokens || 0), 0);
  const avgLatency = stats.latencyCount > 0 ? Math.round(stats.latencySum / stats.latencyCount) : 0;

  return {
    totalMessages,
    totalCost,
    totalInputTokens,
    totalOutputTokens,
    totalTokens: totalInputTokens + totalOutputTokens,
    avgLatency,
    uniqueModels: Object.keys(stats.modelUsage || {}).length,
    uniqueProviders: Object.keys(stats.providerUsage || {}).length,
    activeDays: Object.keys(daily).length,
  };
}

// ── Usage Trend (for AravielChart) ──

export function computeUsageTrend(dailyUsage, period) {
  const filtered = filterByPeriod(dailyUsage, period);
  return Object.entries(filtered)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      input: data.inputTokens || 0,
      output: data.outputTokens || 0,
    }));
}

// ── Cost Trend ──

export function computeCostTrend(dailyUsage, period) {
  const filtered = filterByPeriod(dailyUsage, period);
  let cumulative = 0;
  return Object.entries(filtered)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => {
      cumulative += data.cost || 0;
      return { date, cost: Number(cumulative.toFixed(4)) };
    });
}

// ── Model Breakdown ──

export function computeModelBreakdown(modelUsage) {
  return Object.entries(modelUsage || {})
    .map(([modelId, count]) => {
      const model = MODELS.find((m) => m.id === modelId);
      const provider = model ? PROVIDERS[model.provider] : null;
      return {
        modelId,
        name: model?.name || modelId,
        provider: model?.provider || 'unknown',
        count,
        color: provider?.accentColor || '#9e9283',
      };
    })
    .sort((a, b) => b.count - a.count);
}

// ── Provider Breakdown ──

export function computeProviderBreakdown(providerUsage) {
  return Object.entries(providerUsage || {})
    .map(([providerId, count]) => {
      const provider = PROVIDERS[providerId];
      return {
        providerId,
        name: provider?.name || providerId,
        value: count,
        color: provider?.accentColor || '#9e9283',
      };
    })
    .sort((a, b) => b.value - a.value);
}

// ── Usage Frequency (day-of-week) ──

export function computeWeekdayFrequency(dailyUsage) {
  const buckets = Array(7).fill(0);
  for (const [dateStr, data] of Object.entries(dailyUsage || {})) {
    const dow = getDayOfWeek(dateStr);
    buckets[dow] += data.messages;
  }
  return buckets.map((messages, i) => ({
    day: DAY_LABELS[i],
    messages,
  }));
}

// ── Hourly Activity ──

export function computeHourlyActivity(hourlyUsage) {
  return Array.from({ length: 24 }, (_, i) => ({
    hour: HOUR_LABELS[i],
    messages: hourlyUsage?.[String(i)] || 0,
  }));
}

// ── Latency by Model ──

export function computeLatencyByModel(latencyByModel) {
  return Object.entries(latencyByModel || {})
    .map(([modelId, { sum, count }]) => {
      const model = MODELS.find((m) => m.id === modelId);
      const provider = model ? PROVIDERS[model.provider] : null;
      return {
        model: model?.name || modelId,
        latency: Math.round(sum / count),
        color: provider?.accentColor || '#9e9283',
      };
    })
    .sort((a, b) => b.latency - a.latency)
    .slice(0, 10);
}

// ── Topic Analysis (keyword frequency) ──

export function computeTopicAnalysis(promptSnippets) {
  const freq = {};
  for (const snippet of promptSnippets || []) {
    const words = snippet
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
    for (const word of words) {
      freq[word] = (freq[word] || 0) + 1;
    }
  }
  return Object.entries(freq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([word, count]) => ({ word, count }));
}

// ── Points & Level ──

const LEVELS = [
  { name: 'Beginner', min: 0, max: 50, color: '#9e9283' },
  { name: 'Explorer', min: 51, max: 200, color: '#0ea5e9' },
  { name: 'Power User', min: 201, max: 500, color: '#8b5cf6' },
  { name: 'Expert', min: 501, max: 1000, color: '#d97706' },
  { name: 'Master', min: 1001, max: Infinity, color: '#f43f5e' },
];

export function getLevel(points) {
  for (const level of LEVELS) {
    if (points <= level.max) {
      const progress =
        level.max === Infinity ? 1 : (points - level.min) / (level.max - level.min + 1);
      return { ...level, progress: Math.min(progress, 1) };
    }
  }
  return { ...LEVELS[LEVELS.length - 1], progress: 1 };
}

// ── Budget Status ──

export function computeBudgetStatus(dailyUsage, monthlyBudget) {
  if (!monthlyBudget) return null;
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  let spent = 0;
  for (const [date, data] of Object.entries(dailyUsage || {})) {
    if (date >= monthStart) spent += data.cost || 0;
  }
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const projected = dayOfMonth > 0 ? (spent / dayOfMonth) * daysInMonth : 0;

  return {
    spent: Number(spent.toFixed(4)),
    budget: monthlyBudget,
    percent: monthlyBudget > 0 ? spent / monthlyBudget : 0,
    projected: Number(projected.toFixed(4)),
    remaining: Number(Math.max(0, monthlyBudget - spent).toFixed(4)),
  };
}

// ── Messages per Period Counts ──

export function computePeriodCounts(dailyUsage) {
  const now = new Date();
  const today = getDateKey(now);

  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekKey = getDateKey(weekAgo);

  const monthAgo = new Date(now);
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  const monthKey = getDateKey(monthAgo);

  const yearAgo = new Date(now);
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  const yearKey = getDateKey(yearAgo);

  let daily = 0,
    weekly = 0,
    monthly = 0,
    yearly = 0,
    allTime = 0;

  for (const [date, data] of Object.entries(dailyUsage || {})) {
    const count = data.messages || 0;
    allTime += count;
    if (date === today) daily += count;
    if (date >= weekKey) weekly += count;
    if (date >= monthKey) monthly += count;
    if (date >= yearKey) yearly += count;
  }

  return { daily, weekly, monthly, yearly, allTime };
}

// ── Most Active Hour ──

export function getMostActiveHour(hourlyUsage) {
  let maxHour = 0;
  let maxCount = 0;
  for (const [hour, count] of Object.entries(hourlyUsage || {})) {
    if (count > maxCount) {
      maxCount = count;
      maxHour = Number(hour);
    }
  }
  return { hour: maxHour, label: HOUR_LABELS[maxHour], count: maxCount };
}

// ── Top Model & Provider ──

export function getTopModel(modelUsage) {
  let topId = null;
  let topCount = 0;
  for (const [id, count] of Object.entries(modelUsage || {})) {
    if (count > topCount) {
      topCount = count;
      topId = id;
    }
  }
  if (!topId) return null;
  const model = MODELS.find((m) => m.id === topId);
  const provider = model ? PROVIDERS[model.provider] : null;
  return {
    modelId: topId,
    name: model?.name || topId,
    provider: model?.provider,
    providerName: provider?.name,
    count: topCount,
    color: provider?.accentColor,
  };
}

export function getTopProvider(providerUsage) {
  let topId = null;
  let topCount = 0;
  for (const [id, count] of Object.entries(providerUsage || {})) {
    if (count > topCount) {
      topCount = count;
      topId = id;
    }
  }
  if (!topId) return null;
  const provider = PROVIDERS[topId];
  return {
    providerId: topId,
    name: provider?.name || topId,
    count: topCount,
    color: provider?.accentColor,
  };
}
