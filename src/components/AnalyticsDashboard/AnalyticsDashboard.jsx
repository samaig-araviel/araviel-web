import { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectLifetimeStats,
  selectMonthlyBudget,
  selectBudgetAlertThreshold,
  setMonthlyBudget,
  setBudgetAlertThreshold,
} from '../../store/slices/analyticsSlice';
import { getUserTier, ACCESS_TIERS } from '../../data/models';
import AravielChart from '../AravielChart/AravielChart';
import {
  computeOverviewFromLifetime,
  computeUsageTrend,
  computeCostTrend,
  computeModelBreakdown,
  computeProviderBreakdown,
  computeHourlyActivity,
  computeTopicAnalysis,
  computeBudgetStatus,
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

// ── Section Card ──

function SectionCard({ title, proOnly, locked, children }) {
  return (
    <div className={`${styles.sectionCard} ${locked ? styles.sectionLocked : ''}`}>
      <div className={styles.sectionCardHeader}>
        <h3 className={styles.sectionCardTitle}>{title}</h3>
        {proOnly && <span className={styles.proBadge}>PRO</span>}
      </div>
      <div className={styles.sectionCardBody}>
        {locked && <ProLockOverlay />}
        {children}
      </div>
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

// ── XP Hero Card ──

function XPHeroCard({ points, level, streak, longestStreak }) {
  return (
    <div className={styles.xpHero}>
      <div className={styles.xpHeroMain}>
        <div className={styles.xpHeroLevel}>
          <span className={styles.xpLevelLabel}>Level</span>
          <span className={styles.xpLevelName} style={{ color: level.color }}>
            {level.name}
          </span>
        </div>
        <div className={styles.xpHeroPoints}>
          <span className={styles.xpPointsValue}>{points.toLocaleString()}</span>
          <span className={styles.xpPointsUnit}>XP</span>
        </div>
        <div className={styles.xpHeroStreak}>
          <span className={styles.xpStreakFire}>{'\uD83D\uDD25'}</span>
          <span className={styles.xpStreakCount}>{streak}</span>
          <span className={styles.xpStreakLabel}>day streak</span>
          {longestStreak > 0 && <span className={styles.xpStreakBest}>Best: {longestStreak}</span>}
        </div>
      </div>
      <div className={styles.xpProgressContainer}>
        <div className={styles.xpProgressTrack}>
          <div
            className={styles.xpProgressFill}
            style={{
              width: `${Math.round(level.progress * 100)}%`,
              background: `linear-gradient(90deg, ${level.color}, ${level.color}cc)`,
            }}
          />
        </div>
        <div className={styles.xpProgressMeta}>
          <span className={styles.xpProgressPercent}>{Math.round(level.progress * 100)}%</span>
          <span className={styles.xpProgressHint}>
            {level.max === Infinity
              ? 'Maximum level reached!'
              : `${level.max - points + 1} XP to next level`}
          </span>
        </div>
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

  const [period, setPeriod] = useState('month');

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
  const hourlyActivity = useMemo(
    () => computeHourlyActivity(stats.hourlyUsage),
    [stats.hourlyUsage]
  );
  const topics = useMemo(() => computeTopicAnalysis(stats.promptSnippets), [stats.promptSnippets]);
  const budgetStatus = useMemo(
    () => computeBudgetStatus(stats.dailyUsage, monthlyBudget),
    [stats.dailyUsage, monthlyBudget]
  );
  const level = useMemo(() => getLevel(stats.points), [stats.points]);

  // Chart specs — always create them (AravielChart handles empty data)
  const tokenTrendSpec = useMemo(
    () => ({
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
    }),
    [usageTrend]
  );

  const costTrendSpec = useMemo(
    () => ({
      type: 'area',
      title: 'Cumulative Cost',
      subtitle: 'Running total spend over time',
      xKey: 'date',
      series: [{ key: 'cost', name: 'Total Cost', color: '#10b981' }],
      data: costTrend,
      config: { xAxisFormat: 'date', yAxisFormat: 'usd', height: 280, showLegend: false },
    }),
    [costTrend]
  );

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

  const hourlySpec = useMemo(
    () => ({
      type: 'bar',
      title: 'Hourly Activity',
      subtitle: 'When you use AI most',
      xKey: 'hour',
      series: [{ key: 'messages', name: 'Messages', color: '#06b6d4' }],
      data: hourlyActivity,
      config: { yAxisFormat: 'integer', height: 240, showLegend: false },
    }),
    [hourlyActivity]
  );

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

      <div className={styles.content}>
        {/* ── XP Hero Card ── */}
        <XPHeroCard
          points={stats.points}
          level={level}
          streak={stats.currentStreak}
          longestStreak={stats.longestStreak}
        />

        {/* Period Selector */}
        <div className={styles.toolbar}>
          <PeriodSelector value={period} onChange={setPeriod} isPro={isPro} />
        </div>

        {/* ── Overview Stat Cards (single row of 5) ── */}
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
            subtitle={`${formatTokensCompact(overview.totalInputTokens)} in / ${formatTokensCompact(
              overview.totalOutputTokens
            )} out`}
            icon={<TokenIcon />}
            accent="#d97706"
          />
          <StatCard
            label="Messages"
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
        </div>

        {/* ── Token Usage Trend ── */}
        <SectionCard title="Token Usage Trend">
          <AravielChart spec={tokenTrendSpec} />
        </SectionCard>

        {/* ── Provider + Top Models (side by side) ── */}
        <div className={styles.splitSection}>
          <SectionCard title="Usage by Provider">
            {providerDonutSpec ? (
              <AravielChart spec={providerDonutSpec} />
            ) : (
              <p className={styles.emptyHint}>No provider data yet</p>
            )}
          </SectionCard>
          <SectionCard title="Top Models">
            <TopModelsList models={modelBreakdown} totalMessages={overview.totalMessages} />
          </SectionCard>
        </div>

        {/* ── Cost Trend + Budget (side by side, PRO) ── */}
        <div className={styles.splitSection}>
          <SectionCard title="Cost Trend" proOnly={!isPro} locked={!isPro}>
            <AravielChart spec={costTrendSpec} />
          </SectionCard>
          <SectionCard title="Budget & Limits" proOnly={!isPro} locked={!isPro}>
            {isPro ? (
              <BudgetSection
                budgetStatus={budgetStatus}
                monthlyBudget={monthlyBudget}
                alertThreshold={alertThreshold}
                dispatch={dispatch}
              />
            ) : (
              <BudgetSection
                budgetStatus={{ spent: 0, budget: 10, percent: 0, projected: 0, remaining: 10 }}
                monthlyBudget={10}
                alertThreshold={0.8}
                dispatch={() => {}}
              />
            )}
          </SectionCard>
        </div>

        {/* ── Hourly Activity + Topics (side by side, PRO) ── */}
        <div className={styles.splitSection}>
          <SectionCard title="Hourly Activity" proOnly={!isPro} locked={!isPro}>
            <AravielChart spec={hourlySpec} />
          </SectionCard>
          <SectionCard title="Your Topics" proOnly={!isPro} locked={!isPro}>
            <TopicCloud topics={topics} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
