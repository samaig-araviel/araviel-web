import { useMemo } from 'react';
import { mapConditionToTheme } from './weatherParser';
import styles from './WeatherCard.module.css';

// ── Weather Icons (inline SVGs) ────────────────────────────────────────────

function SunIcon({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="16" cy="16" r="6" fill="#FBBF24" />
      <g stroke="#FBBF24" strokeWidth="2" strokeLinecap="round">
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="16" y1="26" x2="16" y2="30" />
        <line x1="2" y1="16" x2="6" y2="16" />
        <line x1="26" y1="16" x2="30" y2="16" />
        <line x1="6.1" y1="6.1" x2="8.9" y2="8.9" />
        <line x1="23.1" y1="23.1" x2="25.9" y2="25.9" />
        <line x1="6.1" y1="25.9" x2="8.9" y2="23.1" />
        <line x1="23.1" y1="8.9" x2="25.9" y2="6.1" />
      </g>
    </svg>
  );
}

function CloudIcon({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8 24h16a6 6 0 001.5-11.8A8 8 0 009.2 14 5 5 0 008 24z" fill="#9CA3AF" />
    </svg>
  );
}

function PartlyCloudyIcon({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="14" r="5" fill="#FBBF24" />
      <g stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round">
        <line x1="12" y1="4" x2="12" y2="6.5" />
        <line x1="12" y1="21.5" x2="12" y2="24" />
        <line x1="4" y1="14" x2="6.5" y2="14" />
        <line x1="5.3" y1="7.3" x2="7.1" y2="9.1" />
        <line x1="5.3" y1="20.7" x2="7.1" y2="18.9" />
      </g>
      <path d="M12 26h14a5 5 0 001.2-9.8 6.5 6.5 0 00-12.5-1.2A4 4 0 0012 26z" fill="#9CA3AF" />
    </svg>
  );
}

function RainIcon({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8 18h16a6 6 0 001.5-11.8A8 8 0 009.2 8 5 5 0 008 18z" fill="#60A5FA" />
      <g stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round">
        <line x1="11" y1="21" x2="10" y2="25" />
        <line x1="16" y1="21" x2="15" y2="27" />
        <line x1="21" y1="21" x2="20" y2="25" />
      </g>
    </svg>
  );
}

function HeavyRainIcon({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8 16h16a6 6 0 001.5-11.8A8 8 0 009.2 6 5 5 0 008 16z" fill="#3B82F6" />
      <g stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round">
        <line x1="9" y1="19" x2="7" y2="26" />
        <line x1="13" y1="19" x2="11" y2="28" />
        <line x1="17" y1="19" x2="15" y2="26" />
        <line x1="21" y1="19" x2="19" y2="28" />
        <line x1="25" y1="19" x2="23" y2="26" />
      </g>
    </svg>
  );
}

function SnowIcon({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8 18h16a6 6 0 001.5-11.8A8 8 0 009.2 8 5 5 0 008 18z" fill="#BAE6FD" />
      <g fill="#60A5FA">
        <circle cx="11" cy="23" r="1.5" />
        <circle cx="16" cy="25" r="1.5" />
        <circle cx="21" cy="22" r="1.5" />
        <circle cx="14" cy="28" r="1.2" />
        <circle cx="19" cy="28" r="1.2" />
      </g>
    </svg>
  );
}

function StormIcon({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8 16h16a6 6 0 001.5-11.8A8 8 0 009.2 6 5 5 0 008 16z" fill="#6B7280" />
      <polygon points="17,16 14,23 17,23 15,30 22,20 18,20 21,16" fill="#FBBF24" />
    </svg>
  );
}

function FogIcon({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round">
        <line x1="6" y1="12" x2="26" y2="12" />
        <line x1="8" y1="17" x2="24" y2="17" />
        <line x1="6" y1="22" x2="26" y2="22" />
        <line x1="10" y1="27" x2="22" y2="27" />
      </g>
    </svg>
  );
}

function WindyIcon({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke="#6B7280" strokeWidth="2" strokeLinecap="round">
        <path d="M4 12h18a3 3 0 10-3-3" fill="none" />
        <path d="M6 18h14a2.5 2.5 0 11-2.5 2.5" fill="none" />
        <path d="M4 24h10a2 2 0 10-2-2" fill="none" />
      </g>
    </svg>
  );
}

const ICON_MAP = {
  sunny: SunIcon,
  cloudy: CloudIcon,
  partlyCloudy: PartlyCloudyIcon,
  rain: RainIcon,
  heavyRain: HeavyRainIcon,
  snow: SnowIcon,
  storm: StormIcon,
  fog: FogIcon,
  windy: WindyIcon,
};

// ── Detail helpers ─────────────────────────────────────────────────────────

function DetailItem({ label, value }) {
  if (!value) return null;
  return (
    <div className={styles.detailItem}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailValue}>{value}</span>
    </div>
  );
}

function PeriodChip({ period }) {
  const theme = mapConditionToTheme(inferConditionFromLabel(period.condition));
  const IconComp = ICON_MAP[theme.icon] || CloudIcon;
  return (
    <div className={styles.periodChip}>
      <IconComp size={18} />
      <div className={styles.periodInfo}>
        <span className={styles.periodLabel}>{period.label}</span>
        {period.temp && <span className={styles.periodTemp}>{period.temp}</span>}
        {period.condition && <span className={styles.periodCondition}>{period.condition}</span>}
      </div>
    </div>
  );
}

function ForecastDay({ item }) {
  const theme = mapConditionToTheme(item.condition);
  const IconComp = ICON_MAP[theme.icon] || CloudIcon;
  return (
    <div className={styles.forecastDay}>
      <span className={styles.forecastDayName}>{item.day}</span>
      <IconComp size={20} />
      <span className={styles.forecastHigh}>{item.high || '--'}</span>
      {item.low && <span className={styles.forecastLow}>{item.low}</span>}
    </div>
  );
}

function inferConditionFromLabel(label) {
  if (!label) return null;
  const lower = label.toLowerCase();
  if (lower.includes('thunder') || lower.includes('storm')) return 'Thunderstorm';
  if (lower.includes('heavy rain')) return 'Heavy Rain';
  if (lower.includes('rain') || lower.includes('shower') || lower.includes('drizzle'))
    return 'Rain';
  if (lower.includes('snow') || lower.includes('blizzard')) return 'Snow';
  if (lower.includes('fog') || lower.includes('mist')) return 'Fog';
  if (lower.includes('partly cloudy')) return 'Partly Cloudy';
  if (lower.includes('cloudy') || lower.includes('overcast')) return 'Cloudy';
  if (lower.includes('sunny') || lower.includes('clear')) return 'Sunny';
  if (lower.includes('wind') || lower.includes('gust')) return 'Windy';
  return null;
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function WeatherCard({ weatherData, isDark, renderMarkdown }) {
  const { location, date, current, periods, forecast, source, remainingText } = weatherData;
  const theme = useMemo(() => mapConditionToTheme(current?.condition), [current?.condition]);
  const IconComp = ICON_MAP[theme.icon] || CloudIcon;

  const hasDetails =
    current?.feelsLike ||
    current?.humidity ||
    current?.wind ||
    current?.visibility ||
    current?.pressure ||
    current?.uvIndex ||
    current?.dewPoint;
  const hasPeriods = periods && periods.length > 0;
  const hasForecast = forecast && forecast.length > 0;

  // Fallback display values
  const displayLocation = location || 'Current Weather';
  const displayDate =
    date ||
    new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  return (
    <>
      <div
        className={`${styles.weatherCard} ${styles[`gradient_${theme.gradient}`] || ''}`}
        data-theme-mode={isDark ? 'dark' : 'light'}
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <IconComp size={28} />
          </div>
          <div className={styles.headerText}>
            <h3 className={styles.location}>{displayLocation}</h3>
            <span className={styles.date}>{displayDate}</span>
          </div>
        </div>

        {/* Main temperature */}
        {current?.temp && (
          <div className={styles.mainTemp}>
            <div className={styles.tempRow}>
              <span className={styles.temperature}>{current.temp}</span>
              {current.altTemp && <span className={styles.altTemp}>({current.altTemp})</span>}
            </div>
            {current.condition && <span className={styles.condition}>{current.condition}</span>}
          </div>
        )}

        {/* Details row */}
        {hasDetails && (
          <div className={styles.details}>
            <DetailItem label="Feels like" value={current.feelsLike} />
            <DetailItem label="Humidity" value={current.humidity} />
            <DetailItem label="Wind" value={current.wind} />
            <DetailItem label="Visibility" value={current.visibility} />
            <DetailItem label="Pressure" value={current.pressure} />
            <DetailItem label="UV Index" value={current.uvIndex} />
            <DetailItem label="Dew Point" value={current.dewPoint} />
          </div>
        )}

        {/* Time periods */}
        {hasPeriods && (
          <div className={styles.periods}>
            {periods.map((p, i) => (
              <PeriodChip key={i} period={p} />
            ))}
          </div>
        )}

        {/* Multi-day forecast */}
        {hasForecast && (
          <div className={styles.forecast}>
            {forecast.map((f, i) => (
              <ForecastDay key={i} item={f} />
            ))}
          </div>
        )}

        {/* Source attribution */}
        {source && <div className={styles.source}>{source}</div>}
      </div>

      {/* Remaining text (news, articles, sources, follow-up questions) */}
      {remainingText && renderMarkdown && (
        <div className={styles.remainingContent}>{renderMarkdown(remainingText)}</div>
      )}
    </>
  );
}
