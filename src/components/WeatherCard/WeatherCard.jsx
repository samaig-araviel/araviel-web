import { useMemo } from 'react';
import { mapConditionToTheme } from './weatherParser';
import styles from './WeatherCard.module.css';

// ── Weather Icons (inline SVGs — white strokes for immersive backgrounds) ──

function SunIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
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
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path
        d="M8 24h16a6 6 0 001.5-11.8A8 8 0 009.2 14 5 5 0 008 24z"
        fill="rgba(255,255,255,0.7)"
      />
    </svg>
  );
}

function PartlyCloudyIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="12" cy="14" r="5" fill="#FBBF24" />
      <g stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round">
        <line x1="12" y1="4" x2="12" y2="6.5" />
        <line x1="12" y1="21.5" x2="12" y2="24" />
        <line x1="4" y1="14" x2="6.5" y2="14" />
        <line x1="5.3" y1="7.3" x2="7.1" y2="9.1" />
        <line x1="5.3" y1="20.7" x2="7.1" y2="18.9" />
      </g>
      <path
        d="M12 26h14a5 5 0 001.2-9.8 6.5 6.5 0 00-12.5-1.2A4 4 0 0012 26z"
        fill="rgba(255,255,255,0.65)"
      />
    </svg>
  );
}

function RainIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path
        d="M8 18h16a6 6 0 001.5-11.8A8 8 0 009.2 8 5 5 0 008 18z"
        fill="rgba(255,255,255,0.6)"
      />
      <g stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round">
        <line x1="11" y1="21" x2="10" y2="25" />
        <line x1="16" y1="21" x2="15" y2="27" />
        <line x1="21" y1="21" x2="20" y2="25" />
      </g>
    </svg>
  );
}

function HeavyRainIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path
        d="M8 16h16a6 6 0 001.5-11.8A8 8 0 009.2 6 5 5 0 008 16z"
        fill="rgba(255,255,255,0.55)"
      />
      <g stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round">
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
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path
        d="M8 18h16a6 6 0 001.5-11.8A8 8 0 009.2 8 5 5 0 008 18z"
        fill="rgba(255,255,255,0.65)"
      />
      <g fill="rgba(255,255,255,0.9)">
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
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path
        d="M8 16h16a6 6 0 001.5-11.8A8 8 0 009.2 6 5 5 0 008 16z"
        fill="rgba(255,255,255,0.5)"
      />
      <polygon points="17,16 14,23 17,23 15,30 22,20 18,20 21,16" fill="#FBBF24" />
    </svg>
  );
}

function FogIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <g stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round">
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
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <g stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round">
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

// ── Mini icons for detail tiles (16px, white strokes) ────────────────────

function WindMini() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M2 6h9a1.5 1.5 0 10-1.5-1.5"
        stroke="#fff"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M3 9h7a1.2 1.2 0 11-1.2 1.2"
        stroke="#fff"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M2 12h5a1 1 0 10-1-1"
        stroke="#fff"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function HumidityMini() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2L4.5 8a3.5 3.5 0 107 0L8 2z" stroke="#fff" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

function PressureMini() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="5.5" stroke="#fff" strokeWidth="1.2" fill="none" />
      <path d="M8 5v3l2.5 1.5" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function UVMini() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="3" stroke="#fff" strokeWidth="1.2" fill="none" />
      <g stroke="#fff" strokeWidth="1" strokeLinecap="round">
        <line x1="8" y1="1.5" x2="8" y2="3" />
        <line x1="8" y1="13" x2="8" y2="14.5" />
        <line x1="1.5" y1="8" x2="3" y2="8" />
        <line x1="13" y1="8" x2="14.5" y2="8" />
      </g>
    </svg>
  );
}

function RainChanceMini() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M5 5h8a3 3 0 00.7-5.9A4 4 0 005.1 1 2.5 2.5 0 005 5z"
        stroke="#fff"
        strokeWidth="1"
        fill="none"
        transform="translate(-1,3)"
      />
      <line x1="6" y1="10" x2="5.5" y2="12.5" stroke="#fff" strokeWidth="1" strokeLinecap="round" />
      <line x1="9" y1="10" x2="8.5" y2="13" stroke="#fff" strokeWidth="1" strokeLinecap="round" />
      <line
        x1="12"
        y1="10"
        x2="11.5"
        y2="12.5"
        stroke="#fff"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function VisibilityMini() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M1 8s2.5-4 7-4 7 4 7 4-2.5 4-7 4-7-4-7-4z"
        stroke="#fff"
        strokeWidth="1.2"
        fill="none"
      />
      <circle cx="8" cy="8" r="2" stroke="#fff" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

function DewPointMini() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2L5 8.5a3 3 0 106 0L8 2z" stroke="#fff" strokeWidth="1.2" fill="none" />
      <circle cx="8" cy="10" r="1" fill="#fff" opacity="0.6" />
    </svg>
  );
}

function SunriseMini() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 12h12" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M4 12a4 4 0 018 0" stroke="#fff" strokeWidth="1.2" fill="none" />
      <path d="M8 3v2" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M8 6l0 -2" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function SunsetMini() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 12h12" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M4 12a4 4 0 018 0" stroke="#fff" strokeWidth="1.2" fill="none" />
      <path d="M8 3v2" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
      <path
        d="M6.5 4.5L8 6l1.5-1.5"
        stroke="#fff"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function GustsMini() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M1 7h10a1.5 1.5 0 10-1.5-1.5"
        stroke="#fff"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M3 10h8a1.2 1.2 0 11-1.2 1.2"
        stroke="#fff"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

const MINI_ICON_MAP = {
  wind: WindMini,
  humidity: HumidityMini,
  pressure: PressureMini,
  uv: UVMini,
  rainChance: RainChanceMini,
  visibility: VisibilityMini,
  dewPoint: DewPointMini,
  sunrise: SunriseMini,
  sunset: SunsetMini,
  gusts: GustsMini,
};

// ── Detail Tile ──────────────────────────────────────────────────────────

function DetailTile({ icon, label, value }) {
  if (!value) return null;
  const MiniIcon = MINI_ICON_MAP[icon];
  return (
    <div className={styles.detailTile}>
      {MiniIcon && (
        <div className={styles.detailTileIcon}>
          <MiniIcon />
        </div>
      )}
      <div className={styles.detailTileContent}>
        <span className={styles.detailTileLabel}>{label}</span>
        <span className={styles.detailTileValue}>{value}</span>
      </div>
    </div>
  );
}

// ── Period & Forecast helpers ────────────────────────────────────────────

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

// ── Main Component ──────────────────────────────────────────────────────

export default function WeatherCard({ weatherData, isDark, renderMarkdown }) {
  const { location, date, current, periods, forecast, source, remainingText } = weatherData;
  const theme = useMemo(() => mapConditionToTheme(current?.condition), [current?.condition]);
  const IconComp = ICON_MAP[theme.icon] || CloudIcon;

  const hasPeriods = periods && periods.length > 0;
  const hasForecast = forecast && forecast.length > 0;

  const displayLocation = location || 'Current Weather';
  const displayDate =
    date ||
    new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  // Build detail tiles array from available data
  const details = [
    { icon: 'wind', label: 'Wind', value: current?.wind },
    { icon: 'humidity', label: 'Humidity', value: current?.humidity },
    { icon: 'pressure', label: 'Pressure', value: current?.pressure },
    { icon: 'uv', label: 'UV Index', value: current?.uvIndex },
    { icon: 'rainChance', label: 'Rain Chance', value: current?.chanceOfRain },
    { icon: 'visibility', label: 'Visibility', value: current?.visibility },
    { icon: 'dewPoint', label: 'Dew Point', value: current?.dewPoint },
    { icon: 'gusts', label: 'Gusts', value: current?.gusts },
    { icon: 'sunrise', label: 'Sunrise', value: current?.sunrise },
    { icon: 'sunset', label: 'Sunset', value: current?.sunset },
  ].filter((d) => d.value);

  const hasDetails = details.length > 0;

  return (
    <>
      <div
        className={`${styles.weatherCard} ${styles[`gradient_${theme.gradient}`] || ''}`}
        data-theme-mode={isDark ? 'dark' : 'light'}
      >
        {/* Location & Date bar */}
        <div className={styles.locationBar}>
          <h3 className={styles.location}>{displayLocation}</h3>
          <span className={styles.date}>{displayDate}</span>
        </div>

        {/* Hero: icon + temp + condition + side info */}
        <div className={styles.heroSection}>
          <div className={styles.heroIcon}>
            <IconComp size={60} />
          </div>
          <div className={styles.heroCenter}>
            {current?.temp && <span className={styles.heroTemp}>{current.temp}</span>}
            {current?.altTemp && <span className={styles.heroAltTemp}>{current.altTemp}</span>}
            {current?.condition && (
              <span className={styles.heroCondition}>{current.condition}</span>
            )}
          </div>
          <div className={styles.heroSide}>
            {current?.feelsLike && (
              <span className={styles.feelsLike}>Feels like {current.feelsLike}</span>
            )}
            {(current?.minTemp || current?.maxTemp) && (
              <div className={styles.minMaxRow}>
                {current.maxTemp && <span>H: {current.maxTemp}</span>}
                {current.minTemp && <span>L: {current.minTemp}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Detail grid */}
        {hasDetails && (
          <div className={styles.detailGrid}>
            {details.map((d) => (
              <DetailTile key={d.icon} icon={d.icon} label={d.label} value={d.value} />
            ))}
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

        {/* Source */}
        {source && <div className={styles.source}>{source}</div>}
      </div>

      {/* Remaining text (news, articles, links) */}
      {remainingText && renderMarkdown && (
        <div className={styles.remainingContent}>{renderMarkdown(remainingText)}</div>
      )}
    </>
  );
}
