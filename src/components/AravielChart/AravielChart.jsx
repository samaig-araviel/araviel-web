import { useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectEffectiveTheme } from '../../store/slices/themeSlice';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import styles from './AravielChart.module.css';

// --- Araviel color palette ---
const PALETTE = [
  '#d97706', // warm amber (primary)
  '#3b82f6', // royal blue
  '#10b981', // emerald
  '#8b7355', // warm brown
  '#f43f5e', // rose
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#f97316', // orange
  '#6e6354', // earth
  '#84cc16', // lime
];

const GAIN_COLOR = '#10b981';
const LOSS_COLOR = '#ef4444';

// --- Formatters ---
function formatValue(value, format) {
  if (value == null || isNaN(value)) return '—';
  switch (format) {
    case 'currency':
    case 'usd':
      return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'inr':
      return `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'percent':
    case 'percentage':
      return `${Number(value).toFixed(2)}%`;
    case 'compact':
      return Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(
        value
      );
    case 'integer':
      return Math.round(value).toLocaleString();
    default:
      return typeof value === 'number'
        ? value.toLocaleString('en-US', { maximumFractionDigits: 2 })
        : String(value);
  }
}

function formatAxisTick(value, format) {
  if (format === 'date' && typeof value === 'string') {
    // Try to abbreviate dates for axis readability
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    // Shorten long strings
    return value.length > 12 ? value.slice(0, 10) + '…' : value;
  }
  if (typeof value === 'number') return formatValue(value, format || 'compact');
  return value?.length > 14 ? value.slice(0, 12) + '…' : value;
}

// --- Custom Tooltip ---
function ChartTooltip({ active, payload, label, config }) {
  if (!active || !payload || !payload.length) return null;
  const yFormat = config?.yAxisFormat;
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipLabel}>{label}</div>
      {payload.map((entry, idx) => (
        <div key={idx} className={styles.tooltipRow}>
          <span className={styles.tooltipDot} style={{ background: entry.color }} />
          <span className={styles.tooltipName}>{entry.name || entry.dataKey}</span>
          <span className={styles.tooltipValue}>{formatValue(entry.value, yFormat)}</span>
        </div>
      ))}
    </div>
  );
}

// --- Custom Candlestick Shape ---
function CandlestickBar(props) {
  const { x, y, width, height, payload } = props;
  if (!payload) return null;
  const { open, close, high, low } = payload;
  if ([open, close, high, low].some((v) => v == null)) return null;

  const isGain = close >= open;
  const color = isGain ? GAIN_COLOR : LOSS_COLOR;
  const bodyTop = Math.min(open, close);
  const bodyBottom = Math.max(open, close);

  // Scale factor from data coords to pixels
  const dataRange = props.yAxisRange || [low, high];
  const pixelRange = props.yAxisPixelRange || [y + height, y];
  const scale = (val) => {
    const ratio = (val - dataRange[0]) / (dataRange[1] - dataRange[0] || 1);
    return pixelRange[0] + ratio * (pixelRange[1] - pixelRange[0]);
  };

  const candleX = x + width * 0.15;
  const candleWidth = width * 0.7;
  const wickX = x + width / 2;

  return (
    <g>
      {/* Wick */}
      <line x1={wickX} y1={scale(high)} x2={wickX} y2={scale(low)} stroke={color} strokeWidth={1.5} />
      {/* Body */}
      <rect
        x={candleX}
        y={scale(bodyBottom)}
        width={candleWidth}
        height={Math.max(Math.abs(scale(bodyTop) - scale(bodyBottom)), 1)}
        fill={isGain ? color : color}
        fillOpacity={isGain ? 0.2 : 0.85}
        stroke={color}
        strokeWidth={1.5}
        rx={2}
      />
    </g>
  );
}

// --- Candlestick Tooltip ---
function CandlestickTooltip({ active, payload, label, config }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;
  const fmt = config?.yAxisFormat || 'currency';
  const isGain = data.close >= data.open;
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipLabel}>{label || data.date || data.name}</div>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipName}>Open</span>
        <span className={styles.tooltipValue}>{formatValue(data.open, fmt)}</span>
      </div>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipName}>High</span>
        <span className={styles.tooltipValue}>{formatValue(data.high, fmt)}</span>
      </div>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipName}>Low</span>
        <span className={styles.tooltipValue}>{formatValue(data.low, fmt)}</span>
      </div>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipName}>Close</span>
        <span className={styles.tooltipValue} style={{ color: isGain ? GAIN_COLOR : LOSS_COLOR }}>
          {formatValue(data.close, fmt)}
        </span>
      </div>
      {data.volume != null && (
        <div className={styles.tooltipRow}>
          <span className={styles.tooltipName}>Volume</span>
          <span className={styles.tooltipValue}>{formatValue(data.volume, 'compact')}</span>
        </div>
      )}
    </div>
  );
}

// --- Pie Label ---
function renderPieLabel({ cx, cy, midAngle, outerRadius, name, percent }) {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 28;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.04) return null;
  return (
    <text
      x={x}
      y={y}
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      style={{ fontSize: 12, fontWeight: 550, fill: 'var(--text-secondary)', letterSpacing: '-0.01em' }}
    >
      {name} ({(percent * 100).toFixed(1)}%)
    </text>
  );
}

// --- Main Component ---
export default function AravielChart({ spec, isStreaming = false }) {
  const [showData, setShowData] = useState(false);
  const effectiveTheme = useSelector(selectEffectiveTheme);
  const isDark = effectiveTheme === 'dark';
  const handleToggleData = useCallback(() => setShowData((v) => !v), []);

  const chartSpec = useMemo(() => {
    if (!spec) return null;
    try {
      return typeof spec === 'string' ? JSON.parse(spec) : spec;
    } catch {
      return null;
    }
  }, [spec]);

  const type = chartSpec?.type || 'line';
  const title = chartSpec?.title;
  const subtitle = chartSpec?.subtitle;
  const data = useMemo(() => chartSpec?.data || [], [chartSpec]);
  const xKey = chartSpec?.xKey || 'name';
  const series = useMemo(() => chartSpec?.series || [], [chartSpec]);
  const config = useMemo(() => chartSpec?.config || {}, [chartSpec]);

  const showGrid = config.showGrid !== false;
  const showLegend = config.showLegend !== false;
  const height = config.height || 360;
  const yAxisFormat = config.yAxisFormat;
  const xAxisFormat = config.xAxisFormat;
  const animate = config.animate !== false;
  const referenceLines = config.referenceLines || [];
  const gradientFill = config.gradientFill !== false;

  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const axisColor = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';

  // Infer series from data keys if not explicitly provided
  const effectiveSeries = useMemo(() => {
    if (series.length > 0) return series;
    if (!data[0]) return [];
    const keys = Object.keys(data[0]).filter((k) => k !== xKey && typeof data[0][k] === 'number');
    return keys.map((key, idx) => ({
      key,
      name: key.charAt(0).toUpperCase() + key.slice(1),
      color: PALETTE[idx % PALETTE.length],
    }));
  }, [series, data, xKey]);

  if (!chartSpec || !Array.isArray(chartSpec.data) || chartSpec.data.length === 0) {
    if (isStreaming) {
      return (
        <div className={styles.chartBlock}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitleGroup}>
              <span className={styles.chartTitle} style={{ opacity: 0.5 }}>Building chart...</span>
            </div>
          </div>
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.4, fontSize: '12.5px', color: 'var(--text-muted)' }}>
            Loading data...
          </div>
        </div>
      );
    }
    return (
      <div className={styles.chartBlock}>
        <div className={styles.chartError}>Unable to render chart — invalid or missing data.</div>
      </div>
    );
  }

  // Common axis props
  const xAxisProps = {
    dataKey: xKey,
    tick: { fontSize: 11, fill: axisColor, fontWeight: 500 },
    tickLine: false,
    axisLine: { stroke: gridColor, strokeWidth: 1 },
    tickFormatter: (v) => formatAxisTick(v, xAxisFormat),
    tickMargin: 10,
  };

  const yAxisProps = {
    tick: { fontSize: 11, fill: axisColor, fontWeight: 500 },
    tickLine: false,
    axisLine: false,
    tickFormatter: (v) => formatAxisTick(v, yAxisFormat),
    width: 56,
  };

  const tooltipProps = {
    content: <ChartTooltip config={config} />,
    cursor: { stroke: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', strokeWidth: 1, strokeDasharray: '4 4' },
  };

  const legendProps = showLegend
    ? {
        wrapperStyle: { fontSize: 12, color: axisColor, paddingTop: 8 },
        iconType: 'circle',
        iconSize: 8,
      }
    : undefined;

  const refLines = referenceLines.map((rl, idx) => (
    <ReferenceLine
      key={`ref-${idx}`}
      y={rl.y}
      x={rl.x}
      stroke={rl.color || axisColor}
      strokeDasharray={rl.dashed !== false ? '4 4' : undefined}
      label={rl.label ? { value: rl.label, fill: axisColor, fontSize: 11 } : undefined}
    />
  ));

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={data} margin={{ top: 12, right: 20, left: 0, bottom: 4 }}>
            {showGrid && <CartesianGrid stroke={gridColor} vertical={false} strokeDasharray="3 4" />}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip {...tooltipProps} />
            {showLegend && effectiveSeries.length > 1 && <Legend {...legendProps} />}
            {refLines}
            {effectiveSeries.map((s, idx) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name || s.key}
                stroke={s.color || PALETTE[idx % PALETTE.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2.5, fill: isDark ? '#1a1a1a' : '#fff', stroke: s.color || PALETTE[idx % PALETTE.length] }}
                isAnimationActive={animate}
                animationDuration={900}
                animationEasing="ease-out"
              />
            ))}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart data={data} margin={{ top: 12, right: 20, left: 0, bottom: 4 }}>
            <defs>
              {effectiveSeries.map((s, idx) => {
                const color = s.color || PALETTE[idx % PALETTE.length];
                return (
                  <linearGradient key={`grad-${s.key}`} id={`araviel-grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={isDark ? 0.25 : 0.2} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                );
              })}
            </defs>
            {showGrid && <CartesianGrid stroke={gridColor} vertical={false} strokeDasharray="3 4" />}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip {...tooltipProps} />
            {showLegend && effectiveSeries.length > 1 && <Legend {...legendProps} />}
            {refLines}
            {effectiveSeries.map((s, idx) => {
              const color = s.color || PALETTE[idx % PALETTE.length];
              return (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name || s.key}
                  stroke={color}
                  strokeWidth={2}
                  fill={gradientFill ? `url(#araviel-grad-${s.key})` : color}
                  fillOpacity={gradientFill ? 1 : 0.08}
                  activeDot={{ r: 5, strokeWidth: 2.5, fill: isDark ? '#1a1a1a' : '#fff', stroke: color }}
                  isAnimationActive={animate}
                  animationDuration={900}
                  animationEasing="ease-out"
                />
              );
            })}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart data={data} margin={{ top: 12, right: 20, left: 0, bottom: 4 }} barCategoryGap="25%">
            {showGrid && <CartesianGrid stroke={gridColor} vertical={false} strokeDasharray="3 4" />}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip {...tooltipProps} />
            {showLegend && effectiveSeries.length > 1 && <Legend {...legendProps} />}
            {refLines}
            {effectiveSeries.map((s, idx) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.name || s.key}
                fill={s.color || PALETTE[idx % PALETTE.length]}
                fillOpacity={0.9}
                radius={[6, 6, 0, 0]}
                isAnimationActive={animate}
                animationDuration={700}
                animationEasing="ease-out"
              />
            ))}
          </BarChart>
        );

      case 'candlestick': {
        // Candlestick expects data with: open, high, low, close
        const allHighs = data.map((d) => d.high).filter((v) => v != null);
        const allLows = data.map((d) => d.low).filter((v) => v != null);
        const dataMin = Math.min(...allLows);
        const dataMax = Math.max(...allHighs);
        const padding = (dataMax - dataMin) * 0.08;
        return (
          <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            {showGrid && <CartesianGrid stroke={gridColor} vertical={false} />}
            <XAxis {...xAxisProps} />
            <YAxis
              {...yAxisProps}
              domain={[dataMin - padding, dataMax + padding]}
            />
            <Tooltip content={<CandlestickTooltip config={config} />} />
            {refLines}
            <Bar
              dataKey="high"
              shape={(props) => (
                <CandlestickBar
                  {...props}
                  yAxisRange={[dataMin - padding, dataMax + padding]}
                />
              )}
              isAnimationActive={animate}
              animationDuration={600}
            />
          </BarChart>
        );
      }

      case 'pie':
      case 'donut': {
        const valueKey = effectiveSeries[0]?.key || 'value';
        const nameKey = xKey || 'name';
        const isDonut = type === 'donut';
        return (
          <PieChart>
            <Pie
              data={data}
              dataKey={valueKey}
              nameKey={nameKey}
              cx="50%"
              cy="50%"
              innerRadius={isDonut ? '58%' : 0}
              outerRadius="82%"
              paddingAngle={data.length > 1 ? 3 : 0}
              label={renderPieLabel}
              isAnimationActive={animate}
              animationDuration={900}
              animationEasing="ease-out"
              stroke={isDark ? '#1a1a1a' : '#fff'}
              strokeWidth={3}
              cornerRadius={3}
            >
              {data.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={entry.color || PALETTE[idx % PALETTE.length]}
                  fillOpacity={0.92}
                />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip config={config} />} />
            {showLegend && <Legend {...legendProps} />}
          </PieChart>
        );
      }

      case 'composed': {
        // Composed chart: each series specifies chartType: 'line' | 'bar' | 'area'
        return (
          <ComposedChart data={data} margin={{ top: 12, right: 20, left: 0, bottom: 4 }}>
            <defs>
              {effectiveSeries
                .filter((s) => s.chartType === 'area')
                .map((s, idx) => {
                  const color = s.color || PALETTE[idx % PALETTE.length];
                  return (
                    <linearGradient key={`grad-${s.key}`} id={`araviel-grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={isDark ? 0.3 : 0.25} />
                      <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                    </linearGradient>
                  );
                })}
            </defs>
            {showGrid && <CartesianGrid stroke={gridColor} vertical={false} strokeDasharray="3 4" />}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip {...tooltipProps} />
            {showLegend && effectiveSeries.length > 1 && <Legend {...legendProps} />}
            {refLines}
            {effectiveSeries.map((s, idx) => {
              const color = s.color || PALETTE[idx % PALETTE.length];
              const chartType = s.chartType || 'line';
              if (chartType === 'bar') {
                return (
                  <Bar
                    key={s.key}
                    dataKey={s.key}
                    name={s.name || s.key}
                    fill={color}
                    fillOpacity={0.85}
                    radius={[5, 5, 0, 0]}
                    isAnimationActive={animate}
                  />
                );
              }
              if (chartType === 'area') {
                return (
                  <Area
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.name || s.key}
                    stroke={color}
                    strokeWidth={2}
                    fill={`url(#araviel-grad-${s.key})`}
                    isAnimationActive={animate}
                  />
                );
              }
              return (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name || s.key}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2.5, fill: isDark ? '#1a1a1a' : '#fff', stroke: color }}
                  isAnimationActive={animate}
                />
              );
            })}
          </ComposedChart>
        );
      }

      case 'scatter':
        return (
          <ScatterChart margin={{ top: 12, right: 20, left: 0, bottom: 4 }}>
            {showGrid && <CartesianGrid stroke={gridColor} />}
            <XAxis
              {...xAxisProps}
              dataKey={xKey}
              type="number"
              name={xKey}
            />
            <YAxis
              {...yAxisProps}
              dataKey={effectiveSeries[0]?.key || 'y'}
              type="number"
              name={effectiveSeries[0]?.name || 'Value'}
            />
            <Tooltip {...tooltipProps} />
            {showLegend && <Legend {...legendProps} />}
            <Scatter
              name={effectiveSeries[0]?.name || 'Data'}
              data={data}
              fill={effectiveSeries[0]?.color || PALETTE[0]}
              fillOpacity={0.7}
              isAnimationActive={animate}
            />
          </ScatterChart>
        );

      default:
        return null;
    }
  };

  const chart = renderChart();
  if (!chart) {
    return (
      <div className={styles.chartBlock}>
        <div className={styles.chartError}>
          Unsupported chart type: <strong>{type}</strong>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chartBlock}>
      <div className={styles.chartHeader}>
        <div className={styles.chartTitleGroup}>
          {title && <span className={styles.chartTitle}>{title}</span>}
          {subtitle && <span className={styles.chartSubtitle}>{subtitle}</span>}
        </div>
        <div className={styles.chartActions}>
          <span className={styles.chartTypeBadge}>{type}</span>
          <button className={styles.chartToggle} onClick={handleToggleData}>
            {showData ? 'Chart' : 'Data'}
          </button>
        </div>
      </div>

      {showData ? (
        <div className={styles.chartDataView}>
          <table className={styles.chartDataTable}>
            <thead>
              <tr>
                <th>{xKey}</th>
                {type === 'candlestick'
                  ? ['open', 'high', 'low', 'close'].map((k) => <th key={k}>{k}</th>)
                  : effectiveSeries.map((s) => <th key={s.key}>{s.name || s.key}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.map((row, ri) => (
                <tr key={ri}>
                  <td>{row[xKey]}</td>
                  {type === 'candlestick'
                    ? ['open', 'high', 'low', 'close'].map((k) => (
                        <td key={k}>{formatValue(row[k], yAxisFormat)}</td>
                      ))
                    : effectiveSeries.map((s) => (
                        <td key={s.key}>{formatValue(row[s.key], yAxisFormat)}</td>
                      ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.chartCanvas}>
          <ResponsiveContainer width="100%" height={Math.min(Math.max(height, 240), 500)}>
            {chart}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
