import { useState, useMemo, useCallback } from 'react';
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

// ── Tab Navigation ──

const TABS = [
  { key: 'overview', label: 'Overview', icon: 'grid' },
  { key: 'tokens', label: 'Tokens & Cost', icon: 'activity' },
  { key: 'models', label: 'Models', icon: 'cpu' },
  { key: 'insights', label: 'Insights', icon: 'zap' },
];

const TabIcon = ({ type }) => {
  const props = {
    width: 15,
    height: 15,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };
  switch (type) {
    case 'grid':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      );
    case 'activity':
      return (
        <svg {...props}>
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      );
    case 'cpu':
      return (
        <svg {...props}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <rect x="9" y="9" width="6" height="6" />
          <line x1="9" y1="1" x2="9" y2="4" />
          <line x1="15" y1="1" x2="15" y2="4" />
          <line x1="9" y1="20" x2="9" y2="23" />
          <line x1="15" y1="20" x2="15" y2="23" />
          <line x1="20" y1="9" x2="23" y2="9" />
          <line x1="20" y1="14" x2="23" y2="14" />
          <line x1="1" y1="9" x2="4" y2="9" />
          <line x1="1" y1="14" x2="4" y2="14" />
        </svg>
      );
    case 'zap':
      return (
        <svg {...props}>
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    default:
      return null;
  }
};

// ── Period Selector ──

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
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
        </span>
      )}
    </div>
  );
}

// ── Metric Card ──

function MetricCard({ label, value, subtitle, icon, trend }) {
  return (
    <div className={styles.metricCard}>
      <div className={styles.metricHeader}>
        <span className={styles.metricIcon}>{icon}</span>
        <span className={styles.metricLabel}>{label}</span>
      </div>
      <div className={styles.metricValue}>{value}</div>
      {subtitle && <div className={styles.metricSubtitle}>{subtitle}</div>}
      {trend != null && (
        <div
          className={`${styles.metricTrend} ${
            trend >= 0 ? styles.metricTrendUp : styles.metricTrendDown
          }`}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            {trend >= 0 ? (
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            ) : (
              <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
            )}
          </svg>
          <span>{Math.abs(trend)}%</span>
        </div>
      )}
    </div>
  );
}

// ── Section ──

function Section({ title, subtitle, proOnly, locked, action, children }) {
  return (
    <div className={`${styles.section} ${locked ? styles.sectionLocked : ''}`}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleGroup}>
          <h3 className={styles.sectionTitle}>{title}</h3>
          {subtitle && <p className={styles.sectionSubtitle}>{subtitle}</p>}
        </div>
        <div className={styles.sectionHeaderRight}>
          {proOnly && <span className={styles.proBadge}>PRO</span>}
          {action}
        </div>
      </div>
      <div className={styles.sectionBody}>
        {locked && (
          <div className={styles.proLockOverlay}>
            <div className={styles.proLockContent}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Upgrade to Pro</span>
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// ── XP Banner ──

function XPBanner({ points, level, streak, longestStreak }) {
  return (
    <div className={styles.xpBanner}>
      <div className={styles.xpBannerLeft}>
        <div className={styles.xpLevelBadge} style={{ '--level-color': level.color }}>
          <span className={styles.xpLevelIcon}>
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
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </span>
          <div className={styles.xpLevelInfo}>
            <span className={styles.xpLevelName} style={{ color: level.color }}>
              {level.name}
            </span>
            <span className={styles.xpLevelXp}>{points.toLocaleString()} XP</span>
          </div>
        </div>
        <div className={styles.xpProgressWrapper}>
          <div className={styles.xpProgressTrack}>
            <div
              className={styles.xpProgressFill}
              style={{
                width: `${Math.round(level.progress * 100)}%`,
                backgroundColor: level.color,
              }}
            />
          </div>
          <span className={styles.xpProgressLabel}>
            {level.max === Infinity ? 'Max level' : `${Math.round(level.progress * 100)}% to next`}
          </span>
        </div>
      </div>
      <div className={styles.xpStreakPill}>
        <span className={styles.xpStreakNum}>{streak}</span>
        <span className={styles.xpStreakText}>day streak</span>
        {longestStreak > 0 && <span className={styles.xpStreakBest}>Best: {longestStreak}</span>}
      </div>
    </div>
  );
}

// ── Top Models List ──

function TopModelsList({ models, totalMessages }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  if (!models.length) {
    return <p className={styles.emptyHint}>No model usage data yet</p>;
  }
  const max = models[0]?.count || 1;
  return (
    <div className={styles.topModelsList}>
      {models.slice(0, 8).map((m, idx) => (
        <div
          key={m.modelId}
          className={`${styles.topModelRow} ${hoveredIdx === idx ? styles.topModelRowHover : ''}`}
          onMouseEnter={() => setHoveredIdx(idx)}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <span className={styles.topModelRank}>{idx + 1}</span>
          <span className={styles.topModelDot} style={{ backgroundColor: m.color }} />
          <span className={styles.topModelName}>{m.name}</span>
          <div className={styles.topModelBarTrack}>
            <div
              className={styles.topModelBarFill}
              style={{
                width: `${(m.count / max) * 100}%`,
                backgroundColor: m.color,
              }}
            />
          </div>
          <span className={styles.topModelCount}>{m.count}</span>
          <span className={styles.topModelPercent}>
            {totalMessages > 0 ? `${((m.count / totalMessages) * 100).toFixed(0)}%` : '0%'}
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
  const percentUsed = Math.min((budgetStatus?.percent || 0) * 100, 100);

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
              <span className={styles.budgetOf}>/</span>
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
              style={{ width: `${percentUsed}%` }}
            />
          </div>
          <div className={styles.budgetMeta}>
            <span>{percentUsed.toFixed(0)}% used</span>
            <span>${budgetStatus?.remaining?.toFixed(2)} left</span>
          </div>
          {isOverBudget && <div className={styles.budgetAlert}>Over budget</div>}
          {isNearBudget && !isOverBudget && (
            <div className={styles.budgetWarn}>
              Approaching limit ({Math.round(alertThreshold * 100)}%)
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
            style={{ opacity: intensity, fontSize: `${12 + 4 * (t.count / maxCount)}px` }}
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

// ── Inline SVG Icons ──

const DollarIcon = () => (
  <svg
    width="16"
    height="16"
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
    width="16"
    height="16"
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
    width="16"
    height="16"
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
    width="16"
    height="16"
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

const ModelSmallIcon = () => (
  <svg
    width="16"
    height="16"
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

  const [activeTab, setActiveTab] = useState('overview');
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

  // Chart specs
  const tokenTrendSpec = useMemo(
    () => ({
      type: 'area',
      xKey: 'date',
      series: [
        { key: 'input', name: 'Input', color: '#d97706' },
        { key: 'output', name: 'Output', color: '#0ea5e9' },
      ],
      data: usageTrend,
      config: { xAxisFormat: 'date', yAxisFormat: 'compact', height: 300, showLegend: true },
    }),
    [usageTrend]
  );

  const costTrendSpec = useMemo(
    () => ({
      type: 'area',
      xKey: 'date',
      series: [{ key: 'cost', name: 'Total Cost', color: '#10b981' }],
      data: costTrend,
      config: { xAxisFormat: 'date', yAxisFormat: 'usd', height: 300, showLegend: false },
    }),
    [costTrend]
  );

  const providerDonutSpec = useMemo(() => {
    if (!providerBreakdown.length) return null;
    return {
      type: 'donut',
      xKey: 'name',
      series: [{ key: 'value', name: 'Messages' }],
      data: providerBreakdown,
      config: { height: 300, yAxisFormat: 'integer' },
    };
  }, [providerBreakdown]);

  const hourlySpec = useMemo(
    () => ({
      type: 'bar',
      xKey: 'hour',
      series: [{ key: 'messages', name: 'Messages', color: '#d97706' }],
      data: hourlyActivity,
      config: { yAxisFormat: 'integer', height: 260, showLegend: false },
    }),
    [hourlyActivity]
  );

  const handleTabChange = useCallback((key) => setActiveTab(key), []);

  return (
    <div className={styles.container}>
      {/* ── Sticky header ── */}
      <div className={styles.headerBar}>
        <div className={styles.headerTop}>
          <div className={styles.headerTitleGroup}>
            <h1 className={styles.pageTitle}>Usage</h1>
            {!isPro && <span className={styles.proBadge}>PRO</span>}
          </div>
          <PeriodSelector value={period} onChange={setPeriod} isPro={isPro} />
        </div>
        <nav className={styles.tabBar}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`${styles.tabBtn} ${activeTab === tab.key ? styles.tabBtnActive : ''}`}
              onClick={() => handleTabChange(tab.key)}
            >
              <TabIcon type={tab.icon} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className={styles.content}>
        {/* ── XP Banner (always visible) ── */}
        <XPBanner
          points={stats.points}
          level={level}
          streak={stats.currentStreak}
          longestStreak={stats.longestStreak}
        />

        {/* ──────── OVERVIEW TAB ──────── */}
        {activeTab === 'overview' && (
          <>
            <div className={styles.metricsGrid}>
              <MetricCard
                label="Total Cost"
                value={formatCost(overview.totalCost)}
                icon={<DollarIcon />}
              />
              <MetricCard
                label="Tokens"
                value={formatTokensCompact(overview.totalTokens)}
                subtitle={`${formatTokensCompact(
                  overview.totalInputTokens
                )} in / ${formatTokensCompact(overview.totalOutputTokens)} out`}
                icon={<TokenIcon />}
              />
              <MetricCard
                label="Messages"
                value={overview.totalMessages.toLocaleString()}
                icon={<MessageIcon />}
              />
              <MetricCard
                label="Avg Latency"
                value={formatMs(overview.avgLatency)}
                icon={<ClockIcon />}
              />
              <MetricCard label="Models" value={overview.uniqueModels} icon={<ModelSmallIcon />} />
            </div>

            <Section title="Token Usage" subtitle="Input vs output tokens over time">
              <AravielChart spec={tokenTrendSpec} />
            </Section>

            <div className={styles.splitRow}>
              <Section title="Providers" subtitle="Message distribution">
                {providerDonutSpec ? (
                  <AravielChart spec={providerDonutSpec} />
                ) : (
                  <p className={styles.emptyHint}>No provider data yet</p>
                )}
              </Section>
              <Section title="Top Models" subtitle="Most used models">
                <TopModelsList models={modelBreakdown} totalMessages={overview.totalMessages} />
              </Section>
            </div>
          </>
        )}

        {/* ──────── TOKENS & COST TAB ──────── */}
        {activeTab === 'tokens' && (
          <>
            <div className={styles.metricsGrid}>
              <MetricCard
                label="Total Cost"
                value={formatCost(overview.totalCost)}
                icon={<DollarIcon />}
              />
              <MetricCard
                label="Input Tokens"
                value={formatTokensCompact(overview.totalInputTokens)}
                icon={<TokenIcon />}
              />
              <MetricCard
                label="Output Tokens"
                value={formatTokensCompact(overview.totalOutputTokens)}
                icon={<TokenIcon />}
              />
              <MetricCard
                label="Total Tokens"
                value={formatTokensCompact(overview.totalTokens)}
                icon={<TokenIcon />}
              />
            </div>

            <Section title="Token Usage Trend" subtitle="Daily token consumption over time">
              <AravielChart spec={tokenTrendSpec} />
            </Section>

            <div className={styles.splitRow}>
              <Section
                title="Cost Trend"
                subtitle="Cumulative spend over time"
                proOnly={!isPro}
                locked={!isPro}
              >
                <AravielChart spec={costTrendSpec} />
              </Section>
              <Section
                title="Budget"
                subtitle="Monthly spending limits"
                proOnly={!isPro}
                locked={!isPro}
              >
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
              </Section>
            </div>
          </>
        )}

        {/* ──────── MODELS TAB ──────── */}
        {activeTab === 'models' && (
          <>
            <div className={styles.metricsGrid}>
              <MetricCard
                label="Models Used"
                value={overview.uniqueModels}
                icon={<ModelSmallIcon />}
              />
              <MetricCard
                label="Messages"
                value={overview.totalMessages.toLocaleString()}
                icon={<MessageIcon />}
              />
              <MetricCard
                label="Avg Latency"
                value={formatMs(overview.avgLatency)}
                icon={<ClockIcon />}
              />
            </div>

            <div className={styles.splitRow}>
              <Section title="Providers" subtitle="Message distribution across providers">
                {providerDonutSpec ? (
                  <AravielChart spec={providerDonutSpec} />
                ) : (
                  <p className={styles.emptyHint}>No provider data yet</p>
                )}
              </Section>
              <Section title="Top Models" subtitle="Ranked by usage">
                <TopModelsList models={modelBreakdown} totalMessages={overview.totalMessages} />
              </Section>
            </div>
          </>
        )}

        {/* ──────── INSIGHTS TAB ──────── */}
        {activeTab === 'insights' && (
          <>
            <div className={styles.metricsGrid}>
              <MetricCard
                label="Messages"
                value={overview.totalMessages.toLocaleString()}
                icon={<MessageIcon />}
              />
              <MetricCard
                label="Avg Latency"
                value={formatMs(overview.avgLatency)}
                icon={<ClockIcon />}
              />
            </div>

            <div className={styles.splitRow}>
              <Section
                title="Activity Pattern"
                subtitle="When you use AI most"
                proOnly={!isPro}
                locked={!isPro}
              >
                <AravielChart spec={hourlySpec} />
              </Section>
              <Section
                title="Your Topics"
                subtitle="Common themes in your prompts"
                proOnly={!isPro}
                locked={!isPro}
              >
                <TopicCloud topics={topics} />
              </Section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
