import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchStatusThunk,
  fetchStatusHistoryThunk,
  selectProviders,
  selectPlatform,
  selectOverall,
  selectStatusTimestamp,
  selectStatusLoading,
  selectStatusHistory,
  selectHistoryLoading,
} from '../../store/slices/statusSlice';
import { setActiveItem } from '../../store/slices/sidebarSlice';
import { getProviderLogo } from '../getProviderLogo';
import AravielChart from '../AravielChart/AravielChart';
import styles from './StatusDashboard.module.css';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROVIDERS = [
  { id: 'anthropic', name: 'Anthropic', label: 'Claude' },
  { id: 'openai', name: 'OpenAI', label: 'GPT' },
  { id: 'google', name: 'Google', label: 'Gemini' },
  { id: 'perplexity', name: 'Perplexity', label: 'Sonar' },
  { id: 'xai', name: 'xAI', label: 'Grok' },
  { id: 'elevenlabs', name: 'ElevenLabs', label: 'Voice' },
];

const PLATFORM_SERVICES = [
  { id: 'arc', name: 'ARC', description: 'API Backend' },
  { id: 'ade', name: 'ADE', description: 'Decision Engine' },
  { id: 'supabase', name: 'Database', description: 'Supabase' },
];

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'providers', label: 'Providers' },
  { key: 'platform', label: 'Platform' },
  { key: 'incidents', label: 'Incidents' },
];

const HISTORY_PERIODS = [
  { key: 1, label: '1H' },
  { key: 6, label: '6H' },
  { key: 24, label: '24H' },
  { key: 168, label: '7D' },
];

const POLL_INTERVAL_MS = 30_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatStatus(status) {
  switch (status) {
    case 'operational': return 'Operational';
    case 'degraded': return 'Degraded';
    case 'partial_outage': return 'Partial Outage';
    case 'major_outage': return 'Major Outage';
    case 'down': return 'Down';
    default: return 'Unknown';
  }
}

function getStatusClass(status) {
  switch (status) {
    case 'operational': return styles.statusOperational;
    case 'degraded': return styles.statusDegraded;
    case 'partial_outage': return styles.statusPartialOutage;
    case 'major_outage':
    case 'down': return styles.statusMajorOutage;
    default: return styles.statusUnknown;
  }
}

function getBannerIconClass(status) {
  switch (status) {
    case 'operational': return styles.bannerIconOperational;
    case 'degraded': return styles.bannerIconDegraded;
    case 'partial_outage':
    case 'major_outage': return styles.bannerIconOutage;
    default: return styles.bannerIconUnknown;
  }
}

function getUptimeClass(status) {
  switch (status) {
    case 'operational': return styles.uptimeOperational;
    case 'degraded': return styles.uptimeDegraded;
    case 'partial_outage': return styles.uptimePartialOutage;
    case 'major_outage': return styles.uptimeMajorOutage;
    default: return styles.uptimeUnknown;
  }
}

function getBannerMessage(overall) {
  switch (overall) {
    case 'operational': return { title: 'All Systems Operational', subtitle: 'All providers and platform services are running normally.' };
    case 'degraded': return { title: 'Minor Service Degradation', subtitle: 'Some services are experiencing slower response times.' };
    case 'partial_outage': return { title: 'Partial Service Disruption', subtitle: 'Some providers are experiencing issues.' };
    case 'major_outage': return { title: 'Service Disruption', subtitle: 'One or more providers are experiencing a major outage.' };
    default: return { title: 'Checking Status', subtitle: 'Waiting for the first status check to complete.' };
  }
}

function formatLatency(ms) {
  if (ms == null) return '--';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatRate(rate) {
  if (rate == null) return '--';
  return `${rate}%`;
}

function timeAgo(timestamp) {
  if (!timestamp) return '--';
  const diff = Date.now() - new Date(timestamp).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

const iconProps = {
  width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
};

const TabIcons = {
  overview: () => (
    <svg {...iconProps}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
  ),
  providers: () => (
    <svg {...iconProps}><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
  ),
  platform: () => (
    <svg {...iconProps}><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
  ),
  incidents: () => (
    <svg {...iconProps}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
  ),
};

const CheckCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const AlertTriangleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const XCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

function BannerIcon({ overall }) {
  if (overall === 'operational') return <CheckCircleIcon />;
  if (overall === 'major_outage' || overall === 'down') return <XCircleIcon />;
  return <AlertTriangleIcon />;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }) {
  return (
    <span className={`${styles.statusBadge} ${getStatusClass(status)}`}>
      <span className={styles.statusDot} />
      {formatStatus(status)}
    </span>
  );
}

function ProviderCard({ provider, data }) {
  const Logo = getProviderLogo(provider.id);

  return (
    <div className={styles.providerCard}>
      <div className={styles.providerCardHeader}>
        <div className={styles.providerIdentity}>
          <div className={styles.providerLogo}><Logo size={18} /></div>
          <span className={styles.providerName}>{provider.name}</span>
        </div>
        <StatusBadge status={data?.status ?? 'unknown'} />
      </div>
      <div className={styles.providerMetrics}>
        <div className={styles.providerMetric}>
          <span className={styles.providerMetricLabel}>Latency</span>
          <span className={styles.providerMetricValue}>{formatLatency(data?.latencyMs)}</span>
        </div>
        <div className={styles.providerMetric}>
          <span className={styles.providerMetricLabel}>Success</span>
          <span className={styles.providerMetricValue}>
            {data?.successRate != null ? formatRate(data.successRate) : <span className={styles.providerMetricMuted}>--</span>}
          </span>
        </div>
        <div className={styles.providerMetric}>
          <span className={styles.providerMetricLabel}>Checked</span>
          <span className={`${styles.providerMetricValue} ${styles.providerMetricMuted}`}>
            {timeAgo(data?.lastChecked)}
          </span>
        </div>
      </div>
    </div>
  );
}

function PlatformCard({ service, data }) {
  return (
    <div className={styles.platformCard}>
      <div className={styles.platformInfo}>
        <span className={styles.platformName}>{service.name}</span>
        <span className={styles.platformLatency}>
          {service.description}{data?.latencyMs != null ? ` \u00B7 ${formatLatency(data.latencyMs)}` : ''}
        </span>
      </div>
      <StatusBadge status={data?.status ?? 'unknown'} />
    </div>
  );
}

function UptimeBar({ history, label }) {
  const segments = useMemo(() => {
    if (!history || history.length === 0) {
      return Array.from({ length: 90 }, () => 'unknown');
    }

    // Group by day, take worst status per day
    const dayMap = {};
    const severityOrder = ['operational', 'degraded', 'partial_outage', 'major_outage'];

    for (const entry of history) {
      const day = entry.checked_at?.slice(0, 10);
      if (!day) continue;
      const existing = dayMap[day];
      if (!existing || severityOrder.indexOf(entry.status) > severityOrder.indexOf(existing)) {
        dayMap[day] = entry.status;
      }
    }

    // Build 90-day bar from oldest to newest
    const days = [];
    for (let i = 89; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86_400_000);
      const key = d.toISOString().slice(0, 10);
      days.push(dayMap[key] ?? 'unknown');
    }
    return days;
  }, [history]);

  const operationalCount = segments.filter((s) => s === 'operational').length;
  const knownCount = segments.filter((s) => s !== 'unknown').length;
  const uptimePercent = knownCount > 0 ? ((operationalCount / knownCount) * 100).toFixed(2) : null;

  return (
    <div className={styles.uptimeBarWrapper}>
      <div className={styles.uptimeBarLabel}>
        <span>{label ?? '90-day uptime'}</span>
        <span>{uptimePercent != null ? `${uptimePercent}%` : '--'}</span>
      </div>
      <div className={styles.uptimeBar}>
        {segments.map((status, i) => (
          <div key={i} className={`${styles.uptimeSegment} ${getUptimeClass(status)}`} title={`Day ${90 - i}: ${formatStatus(status)}`} />
        ))}
      </div>
    </div>
  );
}

function LatencyChart({ history, provider }) {
  const spec = useMemo(() => {
    if (!history || history.length === 0) return null;

    const data = history.map((entry) => ({
      time: new Date(entry.checked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      latency: entry.latency_ms ?? 0,
      successRate: entry.success_rate != null ? Number(entry.success_rate) : null,
    }));

    // Sample if too many points
    const sampled = data.length > 60 ? data.filter((_, i) => i % Math.ceil(data.length / 60) === 0) : data;

    return {
      type: 'area',
      title: `${provider} Response Latency`,
      data: sampled,
      xKey: 'time',
      series: [{ key: 'latency', name: 'Latency (ms)', color: '#d97706' }],
      config: {
        height: 220,
        yAxisFormat: 'integer',
        showLegend: false,
        gradientFill: true,
      },
    };
  }, [history, provider]);

  if (!spec) {
    return (
      <div className={styles.emptyState}>
        <span className={styles.emptyText}>No latency data available yet</span>
      </div>
    );
  }

  return <AravielChart spec={spec} />;
}

function IncidentsList({ providers }) {
  const incidents = useMemo(() => {
    const all = [];
    for (const [providerId, data] of Object.entries(providers)) {
      if (!data?.incidents || !Array.isArray(data.incidents)) continue;
      for (const inc of data.incidents) {
        all.push({
          id: inc.id ?? `${providerId}-${inc.created_at ?? Math.random()}`,
          provider: providerId,
          name: inc.name ?? inc.service_name ?? 'Incident',
          status: inc.status ?? data.status ?? 'unknown',
          createdAt: inc.created_at ?? inc.begin ?? null,
          impact: inc.impact ?? null,
        });
      }
    }
    all.sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    return all;
  }, [providers]);

  if (incidents.length === 0) {
    return (
      <div className={styles.emptyState}>
        <CheckCircleIcon />
        <span className={styles.emptyText}>No active incidents</span>
      </div>
    );
  }

  return (
    <div className={styles.incidentList}>
      {incidents.map((inc) => {
        const providerInfo = PROVIDERS.find((p) => p.id === inc.provider);
        const Logo = getProviderLogo(inc.provider);
        return (
          <div key={inc.id} className={styles.incidentItem}>
            <div className={`${styles.incidentIndicator} ${getUptimeClass(inc.status)}`} />
            <div className={styles.incidentContent}>
              <div className={styles.incidentHeader}>
                <span className={styles.incidentTitle}>{inc.name}</span>
                <span className={styles.incidentTime}>{inc.createdAt ? timeAgo(inc.createdAt) : '--'}</span>
              </div>
              <span className={styles.incidentProvider}>
                <Logo size={12} />
                {providerInfo?.name ?? inc.provider}
                {inc.impact ? ` \u00B7 ${inc.impact}` : ''}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className={styles.content}>
      <div className={`${styles.skeleton} ${styles.skeletonBanner}`} />
      <div className={styles.providerGrid}>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className={`${styles.skeleton} ${styles.skeletonCard}`} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function StatusDashboard() {
  const dispatch = useDispatch();
  const [tab, setTab] = useState('overview');
  const [historyPeriod, setHistoryPeriod] = useState(24);
  const [selectedProvider, setSelectedProvider] = useState(null);

  const providers = useSelector(selectProviders);
  const platform = useSelector(selectPlatform);
  const overall = useSelector(selectOverall);
  const timestamp = useSelector(selectStatusTimestamp);
  const loading = useSelector(selectStatusLoading);
  const history = useSelector(selectStatusHistory);
  const historyLoading = useSelector(selectHistoryLoading);

  const hasData = Object.keys(providers).length > 0;

  // Initial fetch and polling
  useEffect(() => {
    dispatch(fetchStatusThunk());
    const interval = setInterval(() => dispatch(fetchStatusThunk()), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [dispatch]);

  // Fetch history when tab or period changes
  useEffect(() => {
    if (tab === 'providers' || tab === 'overview') {
      dispatch(fetchStatusHistoryThunk({ hours: Math.max(historyPeriod, 168) }));
    }
  }, [dispatch, tab, historyPeriod]);

  // Fetch per-provider history when selected
  useEffect(() => {
    if (selectedProvider) {
      dispatch(fetchStatusHistoryThunk({ provider: selectedProvider, hours: historyPeriod }));
    }
  }, [dispatch, selectedProvider, historyPeriod]);

  const handleBack = useCallback(() => {
    dispatch(setActiveItem('home'));
  }, [dispatch]);

  const banner = getBannerMessage(overall);

  // ---------------------------------------------------------------------------
  // Render: Overview tab
  // ---------------------------------------------------------------------------

  const renderOverview = () => (
    <>
      <div className={styles.overallBanner}>
        <div className={`${styles.bannerIcon} ${getBannerIconClass(overall)}`}>
          <BannerIcon overall={overall} />
        </div>
        <div className={styles.bannerText}>
          <span className={styles.bannerTitle}>{banner.title}</span>
          <span className={styles.bannerSubtitle}>{banner.subtitle}</span>
        </div>
      </div>

      <div className={styles.providerGrid}>
        {PROVIDERS.map((p) => (
          <ProviderCard key={p.id} provider={p} data={providers[p.id]} />
        ))}
      </div>

      <div className={styles.platformGrid}>
        {PLATFORM_SERVICES.map((s) => (
          <PlatformCard key={s.id} service={s} data={platform[s.id]} />
        ))}
      </div>
    </>
  );

  // ---------------------------------------------------------------------------
  // Render: Providers tab
  // ---------------------------------------------------------------------------

  const renderProviders = () => {
    const allHistory = history['all'] ?? [];

    return (
      <>
        <div className={styles.providerGrid}>
          {PROVIDERS.map((p) => {
            const provHistory = allHistory.filter((h) => h.provider === p.id);
            return (
              <div key={p.id} onClick={() => setSelectedProvider(selectedProvider === p.id ? null : p.id)} style={{ cursor: 'pointer' }}>
                <ProviderCard provider={p} data={providers[p.id]} />
                <UptimeBar history={provHistory} label={`${p.name} uptime`} />
              </div>
            );
          })}
        </div>

        {selectedProvider && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleGroup}>
                <span className={styles.sectionTitle}>
                  {PROVIDERS.find((p) => p.id === selectedProvider)?.name} Latency
                </span>
                <span className={styles.sectionSubtitle}>Response time over the selected period</span>
              </div>
              <div className={styles.periodSelector}>
                {HISTORY_PERIODS.map((p) => (
                  <button
                    key={p.key}
                    className={`${styles.periodBtn} ${historyPeriod === p.key ? styles.periodBtnActive : ''}`}
                    onClick={() => setHistoryPeriod(p.key)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.sectionBody}>
              {historyLoading ? (
                <div className={`${styles.skeleton}`} style={{ height: 220, borderRadius: 8 }} />
              ) : (
                <LatencyChart
                  history={history[selectedProvider] ?? []}
                  provider={PROVIDERS.find((p) => p.id === selectedProvider)?.name ?? selectedProvider}
                />
              )}
            </div>
          </div>
        )}
      </>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Platform tab
  // ---------------------------------------------------------------------------

  const renderPlatform = () => (
    <>
      <div className={styles.platformGrid}>
        {PLATFORM_SERVICES.map((s) => (
          <PlatformCard key={s.id} service={s} data={platform[s.id]} />
        ))}
      </div>

      <div className={styles.splitRow}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <span className={styles.sectionTitle}>Provider Success Rates</span>
              <span className={styles.sectionSubtitle}>Based on actual API calls in the last 5 minutes</span>
            </div>
          </div>
          <div className={styles.sectionBody}>
            {PROVIDERS.map((p) => {
              const data = providers[p.id];
              const Logo = getProviderLogo(p.id);
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                    <Logo size={14} /> {p.name}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: data?.successRate != null && data.successRate < 95 ? '#ef4444' : 'var(--text-primary)' }}>
                    {data?.successRate != null ? `${data.successRate}%` : '--'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <span className={styles.sectionTitle}>Average Response Time</span>
              <span className={styles.sectionSubtitle}>Provider latency from health checks</span>
            </div>
          </div>
          <div className={styles.sectionBody}>
            {PROVIDERS.map((p) => {
              const data = providers[p.id];
              const Logo = getProviderLogo(p.id);
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                    <Logo size={14} /> {p.name}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {formatLatency(data?.latencyMs)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );

  // ---------------------------------------------------------------------------
  // Render: Incidents tab
  // ---------------------------------------------------------------------------

  const renderIncidents = () => (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleGroup}>
          <span className={styles.sectionTitle}>Active Incidents</span>
          <span className={styles.sectionSubtitle}>Issues reported by provider status pages</span>
        </div>
      </div>
      <div className={styles.sectionBody}>
        <IncidentsList providers={providers} />
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <div className={styles.container}>
      <div className={styles.headerBar}>
        <div className={styles.headerTop}>
          <div className={styles.headerTitleGroup}>
            <button className={styles.tabBtn} onClick={handleBack} aria-label="Back to chat" style={{ padding: '0 8px 0 0' }}>
              <BackIcon />
            </button>
            <h1 className={styles.pageTitle}>Status</h1>
          </div>
          <div className={styles.headerMeta}>
            <span className={styles.liveIndicator}>
              <span className={styles.liveDot} />
              Live
            </span>
            {timestamp && (
              <span>Updated {timeAgo(timestamp)}</span>
            )}
          </div>
        </div>
        <div className={styles.tabBar}>
          {TABS.map((t) => {
            const Icon = TabIcons[t.key];
            return (
              <button
                key={t.key}
                className={`${styles.tabBtn} ${tab === t.key ? styles.tabBtnActive : ''}`}
                onClick={() => setTab(t.key)}
              >
                <Icon />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading && !hasData ? (
        <LoadingSkeleton />
      ) : (
        <div className={styles.content}>
          {tab === 'overview' && renderOverview()}
          {tab === 'providers' && renderProviders()}
          {tab === 'platform' && renderPlatform()}
          {tab === 'incidents' && renderIncidents()}
        </div>
      )}
    </div>
  );
}
