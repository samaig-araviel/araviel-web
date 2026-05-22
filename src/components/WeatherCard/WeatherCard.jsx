import { useMemo } from 'react';
import { mapConditionToTheme } from './weatherParser';
import styles from './WeatherCard.module.css';

/* ─────────────────────────────────────────────────────────────────
   Premium weather icons — gradient-rich SVGs, color-aware
   ───────────────────────────────────────────────────────────────── */

function SunIcon({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="wc-sun-core" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#FFE08A" />
          <stop offset="55%" stopColor="#FFB347" />
          <stop offset="100%" stopColor="#FF8A1E" />
        </radialGradient>
        <radialGradient id="wc-sun-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFD56B" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#FFD56B" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="16" fill="url(#wc-sun-halo)" />
      <g stroke="#FFB347" strokeWidth="2" strokeLinecap="round" opacity="0.9">
        <line x1="20" y1="3" x2="20" y2="7" />
        <line x1="20" y1="33" x2="20" y2="37" />
        <line x1="3" y1="20" x2="7" y2="20" />
        <line x1="33" y1="20" x2="37" y2="20" />
        <line x1="7.5" y1="7.5" x2="10.4" y2="10.4" />
        <line x1="29.6" y1="29.6" x2="32.5" y2="32.5" />
        <line x1="7.5" y1="32.5" x2="10.4" y2="29.6" />
        <line x1="29.6" y1="10.4" x2="32.5" y2="7.5" />
      </g>
      <circle cx="20" cy="20" r="8.5" fill="url(#wc-sun-core)" />
    </svg>
  );
}

function CloudIcon({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="wc-cloud-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.95" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.65" />
        </linearGradient>
      </defs>
      <path
        d="M11 30h18a7 7 0 001.6-13.8 9 9 0 00-17.5-1.3A6 6 0 0011 30z"
        fill="url(#wc-cloud-fill)"
      />
    </svg>
  );
}

function PartlyCloudyIcon({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="wc-pc-sun" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#FFE08A" />
          <stop offset="60%" stopColor="#FFB347" />
          <stop offset="100%" stopColor="#FF8A1E" />
        </radialGradient>
        <linearGradient id="wc-pc-cloud" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.95" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <g stroke="#FFB347" strokeWidth="1.6" strokeLinecap="round" opacity="0.85">
        <line x1="15" y1="4" x2="15" y2="7" />
        <line x1="5" y1="14" x2="8" y2="14" />
        <line x1="7.5" y1="6.5" x2="9.6" y2="8.6" />
        <line x1="22.5" y1="6.5" x2="20.4" y2="8.6" />
      </g>
      <circle cx="15" cy="14" r="6.5" fill="url(#wc-pc-sun)" />
      <path
        d="M14 32h16a6.5 6.5 0 001.4-12.8 8 8 0 00-15.2 0A5 5 0 0014 32z"
        fill="url(#wc-pc-cloud)"
      />
    </svg>
  );
}

function RainIcon({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="wc-rain-cloud" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id="wc-rain-drop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6CA9FF" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#3D7FFF" />
        </linearGradient>
      </defs>
      <path
        d="M10 22h18a6.5 6.5 0 001.5-12.8 8.5 8.5 0 00-16 0A5.5 5.5 0 0010 22z"
        fill="url(#wc-rain-cloud)"
      />
      <g stroke="url(#wc-rain-drop)" strokeWidth="2.2" strokeLinecap="round">
        <line x1="14" y1="26" x2="12.5" y2="32" />
        <line x1="20" y1="26" x2="18.5" y2="34" />
        <line x1="26" y1="26" x2="24.5" y2="32" />
      </g>
    </svg>
  );
}

function HeavyRainIcon({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="wc-hrain-cloud" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.95" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="wc-hrain-drop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6CA9FF" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#3D7FFF" />
        </linearGradient>
      </defs>
      <path
        d="M10 20h18a6.5 6.5 0 001.5-12.8 8.5 8.5 0 00-16 0A5.5 5.5 0 0010 20z"
        fill="url(#wc-hrain-cloud)"
      />
      <g stroke="url(#wc-hrain-drop)" strokeWidth="2" strokeLinecap="round">
        <line x1="12" y1="24" x2="10" y2="33" />
        <line x1="17" y1="24" x2="15" y2="35" />
        <line x1="22" y1="24" x2="20" y2="33" />
        <line x1="27" y1="24" x2="25" y2="35" />
        <line x1="32" y1="24" x2="30" y2="33" />
      </g>
    </svg>
  );
}

function SnowIcon({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="wc-snow-cloud" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.92" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <path
        d="M10 22h18a6.5 6.5 0 001.5-12.8 8.5 8.5 0 00-16 0A5.5 5.5 0 0010 22z"
        fill="url(#wc-snow-cloud)"
      />
      <g fill="#E8F1FF" opacity="0.95">
        <circle cx="13" cy="28" r="1.6" />
        <circle cx="20" cy="30.5" r="1.6" />
        <circle cx="27" cy="27.5" r="1.6" />
        <circle cx="16" cy="34" r="1.3" />
        <circle cx="24" cy="34" r="1.3" />
      </g>
    </svg>
  );
}

function StormIcon({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="wc-storm-cloud" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id="wc-bolt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE57A" />
          <stop offset="100%" stopColor="#FFB347" />
        </linearGradient>
      </defs>
      <path
        d="M10 20h18a6.5 6.5 0 001.5-12.8 8.5 8.5 0 00-16 0A5.5 5.5 0 0010 20z"
        fill="url(#wc-storm-cloud)"
      />
      <polygon points="22,20 17,29 21,29 18,37 27,26 22,26 26,20" fill="url(#wc-bolt)" />
    </svg>
  );
}

function FogIcon({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.75">
        <path
          d="M7 13c2 0 3-1.5 5-1.5s3 1.5 5 1.5 3-1.5 5-1.5 3 1.5 5 1.5 3-1.5 5-1.5"
          fill="none"
        />
        <path
          d="M5 20c2 0 3-1.5 5-1.5s3 1.5 5 1.5 3-1.5 5-1.5 3 1.5 5 1.5 3-1.5 5-1.5"
          fill="none"
        />
        <path
          d="M7 27c2 0 3-1.5 5-1.5s3 1.5 5 1.5 3-1.5 5-1.5 3 1.5 5 1.5 3-1.5 5-1.5"
          fill="none"
        />
      </g>
    </svg>
  );
}

function WindyIcon({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.85">
        <path d="M5 14h22a4 4 0 10-4-4" />
        <path d="M5 22h17a3 3 0 11-3 3" />
        <path d="M5 30h13a2.5 2.5 0 10-2.5-2.5" />
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

/* ─────────────────────────────────────────────────────────────────
   Mini icons for detail pills (use currentColor so light/dark works)
   ───────────────────────────────────────────────────────────────── */

const miniStroke = {
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  fill: 'none',
};

function WindMini() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2 6h9a1.5 1.5 0 10-1.5-1.5" {...miniStroke} />
      <path d="M3 9h7a1.2 1.2 0 11-1.2 1.2" {...miniStroke} />
      <path d="M2 12h5a1 1 0 10-1-1" {...miniStroke} />
    </svg>
  );
}

function HumidityMini() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 2.5C5.5 6 4 8.2 4 10a4 4 0 008 0c0-1.8-1.5-4-4-7.5z" {...miniStroke} />
    </svg>
  );
}

function PressureMini() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="5.5" {...miniStroke} />
      <path d="M8 5v3l2.3 1.4" {...miniStroke} />
    </svg>
  );
}

function UVMini() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="3" {...miniStroke} />
      <g {...miniStroke}>
        <line x1="8" y1="1.5" x2="8" y2="3.2" />
        <line x1="8" y1="12.8" x2="8" y2="14.5" />
        <line x1="1.5" y1="8" x2="3.2" y2="8" />
        <line x1="12.8" y1="8" x2="14.5" y2="8" />
        <line x1="3.5" y1="3.5" x2="4.7" y2="4.7" />
        <line x1="11.3" y1="11.3" x2="12.5" y2="12.5" />
        <line x1="3.5" y1="12.5" x2="4.7" y2="11.3" />
        <line x1="11.3" y1="4.7" x2="12.5" y2="3.5" />
      </g>
    </svg>
  );
}

function RainChanceMini() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8h8a2.5 2.5 0 00.6-4.9 3.5 3.5 0 00-6.6-.6A2.2 2.2 0 003 8z" {...miniStroke} />
      <line x1="5" y1="11" x2="4.5" y2="13.5" {...miniStroke} />
      <line x1="8" y1="11" x2="7.5" y2="14" {...miniStroke} />
      <line x1="11" y1="11" x2="10.5" y2="13.5" {...miniStroke} />
    </svg>
  );
}

function VisibilityMini() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M1.5 8s2.3-4 6.5-4 6.5 4 6.5 4-2.3 4-6.5 4-6.5-4-6.5-4z" {...miniStroke} />
      <circle cx="8" cy="8" r="2" {...miniStroke} />
    </svg>
  );
}

function DewPointMini() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 2.5C5.5 6 4 8.2 4 10a4 4 0 008 0c0-1.8-1.5-4-4-7.5z" {...miniStroke} />
      <circle cx="8" cy="10.2" r="1" fill="currentColor" />
    </svg>
  );
}

function SunriseMini() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2 12.5h12" {...miniStroke} />
      <path d="M4.5 12.5a3.5 3.5 0 017 0" {...miniStroke} />
      <path d="M8 3.5v3" {...miniStroke} />
      <path d="M6 6l2-2.2 2 2.2" {...miniStroke} />
    </svg>
  );
}

function SunsetMini() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2 12.5h12" {...miniStroke} />
      <path d="M4.5 12.5a3.5 3.5 0 017 0" {...miniStroke} />
      <path d="M8 7v-3" {...miniStroke} />
      <path d="M6 4l2 2.2 2-2.2" {...miniStroke} />
    </svg>
  );
}

function GustsMini() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2 7h10a1.5 1.5 0 10-1.5-1.5" {...miniStroke} />
      <path d="M3 10h7.5a1.3 1.3 0 11-1.3 1.3" {...miniStroke} />
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

/* ─────────────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────────────── */

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

function parseTempNumber(tempStr) {
  if (!tempStr) return null;
  const match = String(tempStr).match(/-?\d+(?:\.\d+)?/);
  return match ? parseFloat(match[0]) : null;
}

/* ─────────────────────────────────────────────────────────────────
   Animated weather overlays — falling rain, drifting snow, etc.
   ───────────────────────────────────────────────────────────────── */

function WeatherAnimations({ kind }) {
  if (kind === 'rain' || kind === 'heavyRain') {
    const drops = kind === 'heavyRain' ? 26 : 16;
    return (
      <div className={styles.fxLayer} aria-hidden="true">
        {Array.from({ length: drops }).map((_, i) => {
          const left = (i * 37 + 13) % 100;
          const delay = ((i * 31) % 180) / 100;
          const duration = 0.7 + ((i * 17) % 60) / 100;
          const height = 12 + ((i * 7) % 16);
          return (
            <span
              key={i}
              className={styles.rainDrop}
              style={{
                left: `${left}%`,
                height: `${height}px`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
              }}
            />
          );
        })}
      </div>
    );
  }

  if (kind === 'snow') {
    return (
      <div className={styles.fxLayer} aria-hidden="true">
        {Array.from({ length: 20 }).map((_, i) => {
          const left = (i * 23 + 7) % 100;
          const fallDelay = ((i * 29) % 400) / 100;
          const fallDuration = 6 + ((i * 13) % 50) / 10;
          const swayDuration = 2.5 + ((i * 7) % 30) / 10;
          const size = 2 + (i % 4);
          const opacity = 0.55 + ((i * 11) % 40) / 100;
          return (
            <span
              key={i}
              className={styles.snowflake}
              style={{
                left: `${left}%`,
                width: `${size}px`,
                height: `${size}px`,
                opacity,
                animationDelay: `${fallDelay}s, ${fallDelay / 2}s`,
                animationDuration: `${fallDuration}s, ${swayDuration}s`,
              }}
            />
          );
        })}
      </div>
    );
  }

  if (kind === 'storm') {
    return (
      <div className={styles.fxLayer} aria-hidden="true">
        {Array.from({ length: 22 }).map((_, i) => {
          const left = (i * 41 + 5) % 100;
          const delay = ((i * 19) % 150) / 100;
          const duration = 0.55 + ((i * 11) % 45) / 100;
          const height = 14 + ((i * 7) % 18);
          return (
            <span
              key={i}
              className={styles.rainDrop}
              style={{
                left: `${left}%`,
                height: `${height}px`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
              }}
            />
          );
        })}
        <span className={styles.lightningFlash} />
      </div>
    );
  }

  if (kind === 'sunny') {
    return (
      <div className={styles.fxLayer} aria-hidden="true">
        <span className={styles.sunGlow} />
      </div>
    );
  }

  if (kind === 'partlyCloudy' || kind === 'cloudy') {
    return (
      <div className={styles.fxLayer} aria-hidden="true">
        <span
          className={styles.cloudShape}
          style={{ top: '18%', width: '55%', height: '50px', animationDuration: '42s' }}
        />
        <span
          className={styles.cloudShape}
          style={{
            top: '52%',
            width: '45%',
            height: '40px',
            animationDuration: '58s',
            animationDelay: '-18s',
          }}
        />
      </div>
    );
  }

  if (kind === 'fog') {
    return (
      <div className={styles.fxLayer} aria-hidden="true">
        <span className={styles.fogBand} style={{ top: '22%', animationDuration: '14s' }} />
        <span
          className={styles.fogBand}
          style={{ top: '48%', animationDuration: '18s', animationDelay: '-6s' }}
        />
        <span
          className={styles.fogBand}
          style={{ top: '74%', animationDuration: '15s', animationDelay: '-3s' }}
        />
      </div>
    );
  }

  if (kind === 'windy') {
    return (
      <div className={styles.fxLayer} aria-hidden="true">
        <span className={styles.windStreak} style={{ top: '28%', animationDuration: '6s' }} />
        <span
          className={styles.windStreak}
          style={{ top: '52%', animationDuration: '8s', animationDelay: '-2s' }}
        />
        <span
          className={styles.windStreak}
          style={{ top: '74%', animationDuration: '7s', animationDelay: '-4s' }}
        />
      </div>
    );
  }

  return null;
}

/* ─────────────────────────────────────────────────────────────────
   Period sparkline — smooth curve through the day's named periods
   ───────────────────────────────────────────────────────────────── */

function PeriodSparkline({ periods, isDark }) {
  const data = useMemo(() => {
    return periods.map((p) => ({ ...p, num: parseTempNumber(p.temp) }));
  }, [periods]);

  const validIdx = data.map((d, i) => (d.num !== null ? i : -1)).filter((i) => i !== -1);
  if (validIdx.length < 2) return null;

  const validTemps = validIdx.map((i) => data[i].num);
  const min = Math.min(...validTemps);
  const max = Math.max(...validTemps);
  const range = max - min || 1;

  const W = 400;
  const H = 64;
  const padX = 24;
  const padTop = 18;
  const padBottom = 10;
  const chartW = W - padX * 2;
  const chartH = H - padTop - padBottom;

  const xFor = (i) => padX + (i / Math.max(data.length - 1, 1)) * chartW;
  const yFor = (t) => padTop + ((max - t) / range) * chartH;

  let pathD = '';
  validIdx.forEach((i, idx) => {
    const x = xFor(i);
    const y = yFor(data[i].num);
    if (idx === 0) {
      pathD += `M ${x.toFixed(2)} ${y.toFixed(2)}`;
    } else {
      const prevI = validIdx[idx - 1];
      const px = xFor(prevI);
      const py = yFor(data[prevI].num);
      const midX = (px + x) / 2;
      pathD += ` C ${midX.toFixed(2)} ${py.toFixed(2)}, ${midX.toFixed(2)} ${y.toFixed(
        2
      )}, ${x.toFixed(2)} ${y.toFixed(2)}`;
    }
  });

  const firstX = xFor(validIdx[0]);
  const lastX = xFor(validIdx[validIdx.length - 1]);
  const fillD = `${pathD} L ${lastX.toFixed(2)} ${H - padBottom} L ${firstX.toFixed(2)} ${
    H - padBottom
  } Z`;

  const stroke = isDark ? 'rgba(255,255,255,0.82)' : 'rgba(40,40,60,0.78)';
  const fillTop = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(40,40,60,0.18)';
  const fillBot = isDark ? 'rgba(255,255,255,0)' : 'rgba(40,40,60,0)';

  const gradId = `wc-spark-fill-${isDark ? 'd' : 'l'}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={styles.periodSparkline}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={fillTop} />
          <stop offset="100%" stopColor={fillBot} />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#${gradId})`} />
      <path
        d={pathD}
        stroke={stroke}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Small composables
   ───────────────────────────────────────────────────────────────── */

function DetailPill({ iconKey, label, value }) {
  if (!value) return null;
  const MiniIcon = MINI_ICON_MAP[iconKey];
  return (
    <span className={styles.detailPill}>
      {MiniIcon && (
        <span className={styles.detailPillIcon}>
          <MiniIcon />
        </span>
      )}
      <span className={styles.detailPillLabel}>{label}</span>
      <span className={styles.detailPillValue}>{value}</span>
    </span>
  );
}

function ForecastDay({ item, index }) {
  const theme = mapConditionToTheme(item.condition);
  const IconComp = ICON_MAP[theme.icon] || CloudIcon;
  return (
    <div className={styles.forecastDay} style={{ animationDelay: `${0.08 * index + 0.15}s` }}>
      <span className={styles.forecastDayName}>{item.day}</span>
      <span className={styles.forecastIcon}>
        <IconComp size={28} />
      </span>
      <div className={styles.forecastTemps}>
        <span className={styles.forecastHigh}>{item.high || '--'}</span>
        {item.low && <span className={styles.forecastLow}>{item.low}</span>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Main component
   ───────────────────────────────────────────────────────────────── */

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
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

  const details = [
    { iconKey: 'wind', label: 'Wind', value: current?.wind },
    { iconKey: 'humidity', label: 'Humidity', value: current?.humidity },
    { iconKey: 'rainChance', label: 'Rain', value: current?.chanceOfRain },
    { iconKey: 'uv', label: 'UV', value: current?.uvIndex },
    { iconKey: 'visibility', label: 'Visibility', value: current?.visibility },
    { iconKey: 'pressure', label: 'Pressure', value: current?.pressure },
    { iconKey: 'dewPoint', label: 'Dew point', value: current?.dewPoint },
    { iconKey: 'gusts', label: 'Gusts', value: current?.gusts },
    { iconKey: 'sunrise', label: 'Sunrise', value: current?.sunrise },
    { iconKey: 'sunset', label: 'Sunset', value: current?.sunset },
  ].filter((d) => d.value);

  const hasDetails = details.length > 0;
  const periodsHaveTemps = hasPeriods && periods.some((p) => parseTempNumber(p.temp) !== null);

  return (
    <>
      <div
        className={`${styles.weatherCard} ${styles[`tone_${theme.gradient}`] || ''}`}
        data-theme-mode={isDark ? 'dark' : 'light'}
        data-condition={theme.icon}
      >
        <WeatherAnimations kind={theme.icon} />

        <div className={styles.content}>
          <div className={styles.locationBar}>
            <h3 className={styles.location}>{displayLocation}</h3>
            <span className={styles.date}>{displayDate}</span>
          </div>

          <div className={styles.hero}>
            <div className={styles.heroLeft}>
              <div className={styles.heroIcon}>
                <IconComp size={68} />
              </div>
              <div className={styles.heroTempBlock}>
                <div className={styles.heroTempRow}>
                  {current?.temp && <span className={styles.heroTemp}>{current.temp}</span>}
                  {current?.altTemp && (
                    <span className={styles.heroAltTemp}>{current.altTemp}</span>
                  )}
                </div>
                {current?.condition && (
                  <span className={styles.heroCondition}>{current.condition}</span>
                )}
              </div>
            </div>

            {(current?.maxTemp || current?.minTemp || current?.feelsLike) && (
              <div className={styles.heroRight}>
                {(current?.maxTemp || current?.minTemp) && (
                  <div className={styles.minMax}>
                    {current.maxTemp && (
                      <span>
                        <span className={styles.minMaxLabel}>H</span>
                        {current.maxTemp}
                      </span>
                    )}
                    {current.minTemp && (
                      <span>
                        <span className={styles.minMaxLabel}>L</span>
                        {current.minTemp}
                      </span>
                    )}
                  </div>
                )}
                {current?.feelsLike && (
                  <span className={styles.feelsLikeHero}>Feels like {current.feelsLike}</span>
                )}
              </div>
            )}
          </div>

          {hasDetails && (
            <div className={styles.details}>
              {details.map((d) => (
                <DetailPill key={d.iconKey} iconKey={d.iconKey} label={d.label} value={d.value} />
              ))}
            </div>
          )}

          {hasPeriods && (
            <div className={styles.periodSection}>
              {periodsHaveTemps && <PeriodSparkline periods={periods} isDark={isDark} />}
              <div className={styles.periodRow}>
                {periods.map((p, i) => {
                  const periodTheme = mapConditionToTheme(inferConditionFromLabel(p.condition));
                  const PIcon = ICON_MAP[periodTheme.icon] || CloudIcon;
                  return (
                    <div
                      key={i}
                      className={styles.periodChip}
                      style={{ animationDelay: `${0.05 * i + 0.1}s` }}
                    >
                      <span className={styles.periodLabel}>{p.label}</span>
                      <PIcon size={22} />
                      {p.temp && <span className={styles.periodTemp}>{p.temp}</span>}
                      {p.condition && !p.temp && (
                        <span className={styles.periodCondition}>{p.condition}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {hasForecast && (
            <div className={styles.forecast}>
              {forecast.map((f, i) => (
                <ForecastDay key={`${f.day}-${i}`} item={f} index={i} />
              ))}
            </div>
          )}

          {source && <div className={styles.source}>{source}</div>}
        </div>
      </div>

      {remainingText && renderMarkdown && (
        <div className={styles.remainingContent}>{renderMarkdown(remainingText)}</div>
      )}
    </>
  );
}
