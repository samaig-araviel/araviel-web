import { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectLifetimeStats,
  selectMonthlyBudget,
  selectBudgetAlertThreshold,
  setMonthlyBudget,
  setBudgetAlertThreshold,
} from '../../store/slices/analyticsSlice';
import { getUserTier, ACCESS_TIERS, PROVIDERS } from '../../data/models';
import AravielChart from '../AravielChart/AravielChart';
import {
  computeOverviewFromLifetime,
  computeUsageTrend,
  computeCostTrend,
  computeModelBreakdown,
  computeProviderBreakdown,
  computeWeekdayFrequency,
  computeHourlyActivity,
  computeLatencyByModel,
  computeTopicAnalysis,
  computeBudgetStatus,
  computePeriodCounts,
  getMostActiveHour,
  getTopModel,
  getTopProvider,
  getLevel,
} from '../../services/analytics';
import styles from './AnalyticsDashboard.module.css';

// ── Period Selector ──

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All Time' },
];

function PeriodSelector({ value, onChange, isPro }) {
  const available = isPro ? PERIODS : PERIODS.filter((p) => p.key === 'month' || p.key === 'all');
  return (
    <div className={styles.periodSelector}>
      {available.map((p) => (
        <button
          key={p.key}
          className={`${styles.periodBtn} ${value === p.key ? styles.periodBtnActive : ''}`}
          onClick={() => onChange(p.key)}
        >
          {p.label}
        </button>
      ))}
      {!isPro && (
        <span className={styles.periodProHint}>
          <span className={styles.proBadge}>PRO</span>
          for daily & weekly
        </span>
      )}
    </div>
  );
}

// ── Stat Card ──

function StatCard({ label, value, subtitle, icon, accent }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statCardIcon} style={accent ? { color: accent } : undefined}>
        {icon}
      </div>
      <div className={styles.statCardContent}>
        <span className={styles.statCardValue}>{value}</span>
        <span className={styles.statCardLabel}>{label}</span>
        {subtitle && <span className={styles.statCardSubtitle}>{subtitle}</span>}
      </div>
    </div>
  );
}

// ── Section Header ──

function SectionHeader({ title, proOnly }) {
  return (
    <div className={styles.sectionHeader}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {proOnly && <span className={styles.proBadge}>PRO</span>}
    </div>
  );
}

// ── Pro Lock Overlay ──

function ProLockOverlay() {
  return (
    <div className={styles.proLockOverlay}>
      <div className={styles.proLockContent}>
        <span className={styles.proLockIcon}>{'\u2728'}</span>
        <span className={styles.proLockText}>Upgrade to Pro to unlock</span>
      </div>
    </div>
  );
}

// ── Top Models List ──

function TopModelsList({ models, totalMessages }) {
  if (!models.length) {
    return <p className={styles.emptyHint}>No model usage data yet</p>;
  }
  const max = models[0]?.count || 1;
  return (
    <div className={styles.topModelsList}>
      {models.slice(0, 8).map((m) => (
        <div key={m.modelId} className={styles.topModelRow}>
          <div className={styles.topModelInfo}>
            <span className={styles.topModelDot} style={{ backgroundColor: m.color }} />
            <span className={styles.topModelName}>{m.name}</span>
            <span className={styles.topModelCount}>
              {m.count} {m.count === 1 ? 'msg' : 'msgs'}
            </span>
          </div>
          <div className={styles.topModelBarTrack}>
            <div
              className={styles.topModelBarFill}
              style={{
                width: `${(m.count / max) * 100}%`,
                backgroundColor: m.color,
              }}
            />
          </div>
          <span className={styles.topModelPercent}>
            {totalMessages > 0 ? `${((m.count / totalMessages) * 100).toFixed(1)}%` : '0%'}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Budget Section ──

function BudgetSection({ budgetStatus, monthlyBudget, alertThreshold, dispatch }) {
  const [editing, setEditing] = useState(false);
  const [budgetInput, setBudgetInput] = useState(monthlyBudget || '');
  const [thresholdInput, setThresholdInput] = useState(
    alertThreshold != null ? Math.round(alertThreshold * 100) : 80
  );

  const handleSave = () => {
    const val = parseFloat(budgetInput);
    dispatch(setMonthlyBudget(val > 0 ? val : null));
    dispatch(setBudgetAlertThreshold(Math.min(100, Math.max(10, thresholdInput)) / 100));
    setEditing(false);
  };

  const isOverBudget = budgetStatus && budgetStatus.percent >= 1;
  const isNearBudget = budgetStatus && !isOverBudget && budgetStatus.percent >= alertThreshold;

  return (
    <div className={styles.budgetSection}>
      {!monthlyBudget && !editing ? (
        <div className={styles.budgetEmpty}>
          <p className={styles.budgetEmptyText}>Set a monthly budget to track your spending</p>
          <button className={styles.budgetSetBtn} onClick={() => setEditing(true)}>
            Set Budget
          </button>
        </div>
      ) : editing ? (
        <div className={styles.budgetForm}>
          <div className={styles.budgetFormRow}>
            <label className={styles.budgetFormLabel}>Monthly budget ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className={styles.budgetFormInput}
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              placeholder="e.g. 10.00"
            />
          </div>
          <div className={styles.budgetFormRow}>
            <label className={styles.budgetFormLabel}>Alert at (%)</label>
            <input
              type="number"
              min="10"
              max="100"
              className={styles.budgetFormInput}
              value={thresholdInput}
              onChange={(e) => setThresholdInput(e.target.value)}
              placeholder="80"
            />
          </div>
          <div className={styles.budgetFormActions}>
            <button className={styles.budgetSaveBtn} onClick={handleSave}>
              Save
            </button>
            <button className={styles.budgetCancelBtn} onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.budgetDisplay}>
          <div className={styles.budgetHeader}>
            <div className={styles.budgetAmounts}>
              <span className={styles.budgetSpent}>
                ${budgetStatus?.spent?.toFixed(2) || '0.00'}
              </span>
              <span className={styles.budgetOf}>of</span>
              <span className={styles.budgetTotal}>${monthlyBudget?.toFixed(2)}</span>
            </div>
            <button
              className={styles.budgetEditBtn}
              onClick={() => {
                setBudgetInput(monthlyBudget || '');
                setThresholdInput(Math.round(alertThreshold * 100));
                setEditing(true);
              }}
            >
              Edit
            </button>
          </div>
          <div className={styles.budgetBarTrack}>
            <div
              className={`${styles.budgetBarFill} ${
                isOverBudget ? styles.budgetBarOver : isNearBudget ? styles.budgetBarWarn : ''
              }`}
              style={{ width: `${Math.min((budgetStatus?.percent || 0) * 100, 100)}%` }}
            />
          </div>
          <div className={styles.budgetMeta}>
            <span className={styles.budgetMetaItem}>
              {((budgetStatus?.percent || 0) * 100).toFixed(1)}% used
            </span>
            <span className={styles.budgetMetaItem}>
              ${budgetStatus?.remaining?.toFixed(2)} remaining
            </span>
            <span className={styles.budgetMetaItem}>
              Projected: ${budgetStatus?.projected?.toFixed(2)}/mo
            </span>
          </div>
          {isOverBudget && (
            <div className={styles.budgetAlert}>
              {'\u26A0'} You&apos;ve exceeded your monthly budget
            </div>
          )}
          {isNearBudget && !isOverBudget && (
            <div className={styles.budgetWarn}>
              {'\u26A0'} Approaching budget limit ({Math.round(alertThreshold * 100)}% threshold)
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Points Card ──

function PointsCard({ points }) {
  const level = getLevel(points);
  const circumference = 2 * Math.PI * 36;
  const offset = circumference * (1 - level.progress);

  return (
    <div className={styles.pointsCard}>
      <div className={styles.pointsRing}>
        <svg viewBox="0 0 80 80" className={styles.pointsRingSvg}>
          <circle cx="40" cy="40" r="36" fill="none" stroke="var(--border-color)" strokeWidth="5" />
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke={level.color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 40 40)"
            className={styles.pointsRingProgress}
          />
        </svg>
        <div className={styles.pointsRingValue}>
          <span className={styles.pointsNumber}>{points}</span>
          <span className={styles.pointsLabel}>pts</span>
        </div>
      </div>
      <div className={styles.pointsInfo}>
        <span className={styles.pointsLevelName} style={{ color: level.color }}>
          {level.name}
        </span>
        <span className={styles.pointsLevelHint}>
          {level.max === Infinity
            ? 'Maximum level reached!'
            : `${level.max - points + 1} pts to next level`}
        </span>
      </div>
    </div>
  );
}

// ── Streak Card ──

function StreakCard({ current, longest }) {
  return (
    <div className={styles.streakCard}>
      <div className={styles.streakMain}>
        <span className={styles.streakFireIcon}>{'\uD83D\uDD25'}</span>
        <span className={styles.streakNumber}>{current}</span>
        <span className={styles.streakUnit}>day streak</span>
      </div>
      <span className={styles.streakBest}>Best: {longest} days</span>
    </div>
  );
}

// ── Topic Cloud ──

function TopicCloud({ topics }) {
  if (!topics.length) {
    return <p className={styles.emptyHint}>Send some messages to see your top topics</p>;
  }
  const maxCount = topics[0]?.count || 1;
  return (
    <div className={styles.topicCloud}>
      {topics.map((t) => {
        const intensity = 0.4 + 0.6 * (t.count / maxCount);
        return (
          <span
            key={t.word}
            className={styles.topicTag}
            style={{ opacity: intensity, fontSize: `${11 + 5 * (t.count / maxCount)}px` }}
          >
            {t.word}
            <span className={styles.topicCount}>{t.count}</span>
          </span>
        );
      })}
    </div>
  );
}

// ── Empty State ──

function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyStateIcon}>{'\uD83D\uDCCA'}</div>
      <h2 className={styles.emptyStateTitle}>No usage data yet</h2>
      <p className={styles.emptyStateText}>
        Start chatting with AI models and your analytics will appear here. Every message tracks
        cost, tokens, latency, and more.
      </p>
    </div>
  );
}

// ── Format Helpers ──

function formatCost(cost) {
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  if (cost < 1) return `$${cost.toFixed(3)}`;
  return `$${cost.toFixed(2)}`;
}

function formatTokensCompact(count) {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return `${count}`;
}

function formatMs(ms) {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

// ── SVG Icons (inline, dashboard-specific) ──

const DollarIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const TokenIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const MessageIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const ClockIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const ModelIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="9" y="9" width="6" height="6" />
  </svg>
);

const ProviderIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

const CalendarIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const TrendIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

// ════════════════════════════════════════
// ── Main Dashboard Component ──
// ════════════════════════════════════════

export default function AnalyticsDashboard() {
  const dispatch = useDispatch();
  const stats = useSelector(selectLifetimeStats);
  const monthlyBudget = useSelector(selectMonthlyBudget);
  const alertThreshold = useSelector(selectBudgetAlertThreshold);
  const userTier = getUserTier();
  const isPro = userTier === ACCESS_TIERS.pro;

  const [period, setPeriod] = useState(isPro ? 'month' : 'month');

  const overview = useMemo(() => computeOverviewFromLifetime(stats, period), [stats, period]);
  const usageTrend = useMemo(
    () => computeUsageTrend(stats.dailyUsage, period),
    [stats.dailyUsage, period]
  );
  const costTrend = useMemo(
    () => computeCostTrend(stats.dailyUsage, period),
    [stats.dailyUsage, period]
  );
  const modelBreakdown = useMemo(() => computeModelBreakdown(stats.modelUsage), [stats.modelUsage]);
  const providerBreakdown = useMemo(
    () => computeProviderBreakdown(stats.providerUsage),
    [stats.providerUsage]
  );
  const weekdayFrequency = useMemo(
    () => computeWeekdayFrequency(stats.dailyUsage),
    [stats.dailyUsage]
  );
  const hourlyActivity = useMemo(
    () => computeHourlyActivity(stats.hourlyUsage),
    [stats.hourlyUsage]
  );
  const latencyByModel = useMemo(
    () => computeLatencyByModel(stats.latencyByModel),
    [stats.latencyByModel]
  );
  const topics = useMemo(() => computeTopicAnalysis(stats.promptSnippets), [stats.promptSnippets]);
  const budgetStatus = useMemo(
    () => computeBudgetStatus(stats.dailyUsage, monthlyBudget),
    [stats.dailyUsage, monthlyBudget]
  );
  const periodCounts = useMemo(() => computePeriodCounts(stats.dailyUsage), [stats.dailyUsage]);
  const mostActiveHour = useMemo(() => getMostActiveHour(stats.hourlyUsage), [stats.hourlyUsage]);
  const topModel = useMemo(() => getTopModel(stats.modelUsage), [stats.modelUsage]);
  const topProvider = useMemo(() => getTopProvider(stats.providerUsage), [stats.providerUsage]);
  const level = useMemo(() => getLevel(stats.points), [stats.points]);

  const hasData = stats.totalMessages > 0;

  // Chart specs
  const tokenTrendSpec = useMemo(() => {
    if (!usageTrend.length) return null;
    return {
      type: 'area',
      title: 'Token Usage',
      subtitle: 'Input vs Output tokens over time',
      xKey: 'date',
      series: [
        { key: 'input', name: 'Input Tokens', color: '#d97706' },
        { key: 'output', name: 'Output Tokens', color: '#0ea5e9' },
      ],
      data: usageTrend,
      config: { xAxisFormat: 'date', yAxisFormat: 'compact', height: 280 },
    };
  }, [usageTrend]);

  const providerDonutSpec = useMemo(() => {
    if (!providerBreakdown.length) return null;
    return {
      type: 'donut',
      title: 'Usage by Provider',
      subtitle: 'Message distribution across providers',
      xKey: 'name',
      series: [{ key: 'value', name: 'Messages' }],
      data: providerBreakdown,
      config: { height: 300, yAxisFormat: 'integer' },
    };
  }, [providerBreakdown]);

  const weekdaySpec = useMemo(() => {
    if (!weekdayFrequency.some((d) => d.messages > 0)) return null;
    return {
      type: 'bar',
      title: 'Daily Activity Pattern',
      subtitle: 'Messages by day of week',
      xKey: 'day',
      series: [{ key: 'messages', name: 'Messages', color: '#d97706' }],
      data: weekdayFrequency,
      config: { yAxisFormat: 'integer', height: 240, showLegend: false },
    };
  }, [weekdayFrequency]);

  const hourlySpec = useMemo(() => {
    if (!hourlyActivity.some((d) => d.messages > 0)) return null;
    return {
      type: 'bar',
      title: 'Hourly Activity',
      subtitle: 'When you use AI most',
      xKey: 'hour',
      series: [{ key: 'messages', name: 'Messages', color: '#06b6d4' }],
      data: hourlyActivity,
      config: { yAxisFormat: 'integer', height: 240, showLegend: false },
    };
  }, [hourlyActivity]);

  const latencySpec = useMemo(() => {
    if (!latencyByModel.length) return null;
    return {
      type: 'bar',
      title: 'Average Latency by Model',
      subtitle: 'Response time comparison (ms)',
      xKey: 'model',
      series: [{ key: 'latency', name: 'Avg Latency (ms)', color: '#8b5cf6' }],
      data: latencyByModel,
      config: { yAxisFormat: 'integer', height: 280, showLegend: false },
    };
  }, [latencyByModel]);

  const costTrendSpec = useMemo(() => {
    if (!costTrend.length) return null;
    return {
      type: 'area',
      title: 'Cumulative Cost',
      subtitle: 'Running total spend over time',
      xKey: 'date',
      series: [{ key: 'cost', name: 'Total Cost', color: '#10b981' }],
      data: costTrend,
      config: { xAxisFormat: 'date', yAxisFormat: 'usd', height: 280, showLegend: false },
    };
  }, [costTrend]);

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Usage Dashboard</h1>
        <p className={styles.pageSubtitle}>
          Your AI usage at a glance
          {!isPro && (
            <span className={styles.tierHint}>
              {' \u2014 '}
              <span className={styles.proBadge}>PRO</span> unlocks full analytics
            </span>
          )}
        </p>
      </div>

      {/* Period Selector */}
      <div className={styles.toolbar}>
        <PeriodSelector value={period} onChange={setPeriod} isPro={isPro} />
      </div>

      {!hasData ? (
        <div className={styles.content}>
          <EmptyState />
        </div>
      ) : (
        <div className={styles.content}>
          {/* ── Overview Stat Cards ── */}
          <div className={styles.statGrid}>
            <StatCard
              label="Total Cost"
              value={formatCost(overview.totalCost)}
              icon={<DollarIcon />}
              accent="#10b981"
            />
            <StatCard
              label="Total Tokens"
              value={formatTokensCompact(overview.totalTokens)}
              subtitle={`${formatTokensCompact(
                overview.totalInputTokens
              )} in / ${formatTokensCompact(overview.totalOutputTokens)} out`}
              icon={<TokenIcon />}
              accent="#d97706"
            />
            <StatCard
              label="Messages Sent"
              value={overview.totalMessages.toLocaleString()}
              icon={<MessageIcon />}
              accent="#0ea5e9"
            />
            <StatCard
              label="Avg Latency"
              value={formatMs(overview.avgLatency)}
              icon={<ClockIcon />}
              accent="#8b5cf6"
            />
            <StatCard
              label="Models Used"
              value={overview.uniqueModels}
              icon={<ModelIcon />}
              accent="#f97316"
            />
            <StatCard
              label="Providers"
              value={overview.uniqueProviders}
              icon={<ProviderIcon />}
              accent="#06b6d4"
            />
          </div>

          {/* ── Token Usage Trend ── */}
          {tokenTrendSpec && (
            <div className={styles.chartSection}>
              <AravielChart spec={tokenTrendSpec} />
            </div>
          )}

          {/* ── Cost Breakdown + Top Models (side by side) ── */}
          <div className={styles.splitSection}>
            <div className={styles.splitCard}>
              <SectionHeader title="Usage by Provider" />
              {providerDonutSpec ? (
                <AravielChart spec={providerDonutSpec} />
              ) : (
                <p className={styles.emptyHint}>No provider data yet</p>
              )}
            </div>
            <div className={styles.splitCard}>
              <SectionHeader title="Top Models" />
              <TopModelsList models={modelBreakdown} totalMessages={overview.totalMessages} />
            </div>
          </div>

          {/* ── Budget & Limits (PRO) ── */}
          <div className={`${styles.section} ${!isPro ? styles.sectionLocked : ''}`}>
            <SectionHeader title="Budget & Limits" proOnly={!isPro} />
            {isPro ? (
              <BudgetSection
                budgetStatus={budgetStatus}
                monthlyBudget={monthlyBudget}
                alertThreshold={alertThreshold}
                dispatch={dispatch}
              />
            ) : (
              <div className={styles.proLockedPlaceholder}>
                <BudgetSection
                  budgetStatus={{ spent: 0, budget: 10, percent: 0, projected: 0, remaining: 10 }}
                  monthlyBudget={10}
                  alertThreshold={0.8}
                  dispatch={() => {}}
                />
                <ProLockOverlay />
              </div>
            )}
          </div>

          {/* ── Usage Frequency (Weekday) ── */}
          {weekdaySpec && (
            <div className={styles.chartSection}>
              <AravielChart spec={weekdaySpec} />
            </div>
          )}

          {/* ── Hourly Activity (PRO) ── */}
          <div className={`${styles.chartSection} ${!isPro ? styles.sectionLocked : ''}`}>
            {!isPro && <ProLockOverlay />}
            {hourlySpec ? (
              <AravielChart spec={hourlySpec} />
            ) : (
              <div className={styles.chartPlaceholder}>
                <SectionHeader title="Hourly Activity" proOnly={!isPro} />
                <p className={styles.emptyHint}>Not enough data yet</p>
              </div>
            )}
          </div>

          {/* ── Latency Distribution (PRO) ── */}
          <div className={`${styles.chartSection} ${!isPro ? styles.sectionLocked : ''}`}>
            {!isPro && <ProLockOverlay />}
            {latencySpec ? (
              <AravielChart spec={latencySpec} />
            ) : (
              <div className={styles.chartPlaceholder}>
                <SectionHeader title="Latency by Model" proOnly={!isPro} />
                <p className={styles.emptyHint}>Not enough data yet</p>
              </div>
            )}
          </div>

          {/* ── Cost Trend (PRO) ── */}
          <div className={`${styles.chartSection} ${!isPro ? styles.sectionLocked : ''}`}>
            {!isPro && <ProLockOverlay />}
            {costTrendSpec ? (
              <AravielChart spec={costTrendSpec} />
            ) : (
              <div className={styles.chartPlaceholder}>
                <SectionHeader title="Cost Trend" proOnly={!isPro} />
                <p className={styles.emptyHint}>Not enough data yet</p>
              </div>
            )}
          </div>

          {/* ── Fun Stats Section ── */}
          <SectionHeader title="Fun Stats" />
          <div className={styles.funStatsGrid}>
            <PointsCard points={stats.points} />
            <StreakCard current={stats.currentStreak} longest={stats.longestStreak} />
            <div className={styles.funStatCard}>
              <span className={styles.funStatIcon}>{'\uD83C\uDFAF'}</span>
              <span className={styles.funStatValue}>{topModel?.name || 'None'}</span>
              <span className={styles.funStatLabel}>Favorite Model</span>
              {topModel && (
                <span className={styles.funStatDetail} style={{ color: topModel.color }}>
                  {topModel.count} messages
                </span>
              )}
            </div>
            <div className={styles.funStatCard}>
              <span className={styles.funStatIcon}>{'\u23F0'}</span>
              <span className={styles.funStatValue}>{mostActiveHour.label}</span>
              <span className={styles.funStatLabel}>Peak Hour</span>
              <span className={styles.funStatDetail}>{mostActiveHour.count} messages</span>
            </div>
          </div>

          {/* ── Usage Frequency Counts ── */}
          <div className={styles.frequencyGrid}>
            <div className={styles.frequencyCard}>
              <span className={styles.frequencyValue}>{periodCounts.daily}</span>
              <span className={styles.frequencyLabel}>Today</span>
            </div>
            <div className={styles.frequencyCard}>
              <span className={styles.frequencyValue}>{periodCounts.weekly}</span>
              <span className={styles.frequencyLabel}>This Week</span>
            </div>
            <div className={styles.frequencyCard}>
              <span className={styles.frequencyValue}>{periodCounts.monthly}</span>
              <span className={styles.frequencyLabel}>This Month</span>
            </div>
            <div className={styles.frequencyCard}>
              <span className={styles.frequencyValue}>{periodCounts.yearly}</span>
              <span className={styles.frequencyLabel}>This Year</span>
            </div>
            <div className={styles.frequencyCard}>
              <span className={styles.frequencyValue}>{periodCounts.allTime}</span>
              <span className={styles.frequencyLabel}>All Time</span>
            </div>
          </div>

          {/* ── Topic Cloud (PRO) ── */}
          <div className={`${styles.section} ${!isPro ? styles.sectionLocked : ''}`}>
            <SectionHeader title="Your Topics" proOnly={!isPro} />
            {!isPro && <ProLockOverlay />}
            <TopicCloud topics={topics} />
          </div>
        </div>
      )}
    </div>
  );
}
