/**
 * Weather detection and extraction for LLM responses.
 * Parses markdown text to detect weather content and extract structured data.
 */

// ── Detection ──────────────────────────────────────────────────────────────

const TEMP_PATTERN = /(-?\d+[\u2013\u2014–-]?\d*)\s*°\s*([CF])/g;
const CONDITION_WORDS = [
  'rain',
  'rainy',
  'raining',
  'showers',
  'drizzle',
  'sunny',
  'clear',
  'sunshine',
  'cloudy',
  'overcast',
  'partly cloudy',
  'mostly cloudy',
  'snow',
  'snowy',
  'snowing',
  'sleet',
  'hail',
  'storm',
  'thunderstorm',
  'thunder',
  'lightning',
  'fog',
  'foggy',
  'mist',
  'misty',
  'haze',
  'hazy',
  'windy',
  'breezy',
  'gusty',
  'humidity',
  'wind',
  'forecast',
  'weather',
  'temperature',
  'feels like',
  'wind chill',
  'heat index',
  'precipitation',
  'dew point',
];
const TIME_PERIOD_WORDS = [
  'morning',
  'afternoon',
  'evening',
  'overnight',
  'tonight',
  'today',
  'tomorrow',
];
const WEATHER_CONTEXT_PHRASES = [
  'current conditions',
  'current weather',
  'weather for',
  'weather in',
  'forecast for',
  'forecast in',
  'weather today',
  'weather report',
  "here's the",
  'here is the',
  'weather update',
];

export function detectWeatherResponse(text) {
  if (!text || text.length < 30) return false;

  const lower = text.toLowerCase();
  let score = 0;

  // Temperature patterns — strong signal
  const tempMatches = lower.match(/\d+\s*°\s*[cf]/g);
  if (tempMatches) {
    score += Math.min(tempMatches.length * 3, 9);
  }

  // Weather condition words
  for (const word of CONDITION_WORDS) {
    if (lower.includes(word)) score += 1;
  }

  // Time period words related to weather descriptions
  for (const word of TIME_PERIOD_WORDS) {
    if (lower.includes(word)) score += 1;
  }

  // Weather context phrases — strong signal
  for (const phrase of WEATHER_CONTEXT_PHRASES) {
    if (lower.includes(phrase)) score += 3;
  }

  // Negative signals — code blocks suggest this is not a weather response
  const codeBlockCount = (text.match(/```/g) || []).length / 2;
  if (codeBlockCount >= 1) score -= 8;

  // Very long text is likely not primarily about weather
  if (text.length > 3000) score -= 4;
  if (text.length > 5000) score -= 6;

  return score >= 8;
}

// ── Extraction ─────────────────────────────────────────────────────────────

function extractTemperature(text) {
  const match = text.match(/(-?\d+[\u2013\u2014–-]?\d*)\s*°\s*([CF])/);
  if (match) return `${match[1]}°${match[2]}`;
  return null;
}

function extractAllTemperatures(text) {
  const results = [];
  const regex = /(-?\d+[\u2013\u2014–-]?\d*)\s*°\s*([CF])/g;
  let m;
  while ((m = regex.exec(text)) !== null) {
    results.push({ raw: m[0], value: m[1], unit: m[2] });
  }
  return results;
}

function extractLocation(text) {
  // Look for "weather for/in <Location>" patterns
  const patterns = [
    /(?:weather\s+(?:for|in)\s+)([A-Z][A-Za-z\s,]+?)(?:\s*[\(:.]|\s+today|\s+\()/i,
    /(?:for|in)\s+([A-Z][A-Za-z\s]+(?:,\s*[A-Z][A-Za-z\s]+)?)\s*\(?\s*today/i,
    /(?:for|in)\s+([A-Z][A-Za-z\s]+(?:,\s*[A-Z][A-Za-z\s]+))\s*[:.]/i,
    // "London, United Kingdom" at the start of a phrase
    /(?:^|\n)\s*(?:\*\*)?([A-Z][A-Za-z\s]+(?:,\s*[A-Z][A-Za-z\s]+))(?:\*\*)?/m,
  ];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) {
      const loc = m[1].trim().replace(/[,\s]+$/, '');
      if (loc.length > 2 && loc.length < 80) return loc;
    }
  }
  return null;
}

function extractDate(text) {
  // Match common date formats
  const patterns = [
    /(?:today,?\s*)([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
    /\(([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})\)/i,
    /(\w+day,?\s+[A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
    /([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
  ];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) return m[1].trim();
  }
  return null;
}

function inferCondition(text) {
  const lower = text.toLowerCase();
  const conditions = [
    { keywords: ['thunderstorm', 'thunder', 'lightning'], label: 'Thunderstorm' },
    { keywords: ['heavy rain', 'downpour'], label: 'Heavy Rain' },
    { keywords: ['rain', 'rainy', 'raining', 'showers', 'drizzle'], label: 'Rain' },
    { keywords: ['snow', 'snowy', 'snowing', 'blizzard'], label: 'Snow' },
    { keywords: ['sleet', 'hail', 'freezing rain'], label: 'Sleet' },
    { keywords: ['fog', 'foggy', 'mist', 'misty', 'haze', 'hazy'], label: 'Fog' },
    { keywords: ['partly cloudy', 'mostly sunny'], label: 'Partly Cloudy' },
    { keywords: ['cloudy', 'overcast', 'mostly cloudy'], label: 'Cloudy' },
    { keywords: ['sunny', 'clear', 'sunshine', 'bright'], label: 'Sunny' },
    { keywords: ['windy', 'gusty', 'breezy'], label: 'Windy' },
  ];
  for (const { keywords, label } of conditions) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return label;
    }
  }
  return null;
}

function extractDetail(text, label) {
  // Try to find "Label: value" or "Label value" patterns
  const patterns = [
    new RegExp(`${label}[:\\s]+([\\d.]+[\\s]*(?:%|km\\/h|mph|m\\/s|°[CF])?)`, 'i'),
    new RegExp(`${label}[:\\s]+([\\w\\d.%/°]+(?:\\s*[A-Za-z/°]+)?)`, 'i'),
  ];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) return m[1].trim();
  }
  return null;
}

function extractPeriods(text) {
  const periods = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const lower = line.toLowerCase();
    // Match bullet points or lines with time periods
    const periodPatterns = [
      /(?:[-*•]\s*)?(morning|afternoon|evening|overnight|tonight|today|tomorrow|this\s+\w+)[\s:/]+(.+)/i,
      /(?:[-*•]\s*)?(afternoon\/evening|late\s+\w+|early\s+\w+)[\s:/]+(.+)/i,
    ];

    for (const pat of periodPatterns) {
      const m = line.match(pat);
      if (m) {
        const label = m[1].trim();
        const desc = m[2].trim().replace(/^\*\*|\*\*$/g, '');
        const temp = extractTemperature(desc);
        const condition =
          inferCondition(desc) ||
          desc
            .replace(/\d+\s*°\s*[CF]/g, '')
            .replace(/[,\s]+$/, '')
            .trim();
        periods.push({
          label: label.charAt(0).toUpperCase() + label.slice(1),
          temp,
          condition: condition || null,
        });
        break;
      }
    }
  }
  return periods;
}

function extractForecast(text) {
  const forecast = [];
  const lines = text.split('\n');
  const dayNames = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
    'mon',
    'tue',
    'wed',
    'thu',
    'fri',
    'sat',
    'sun',
  ];

  for (const line of lines) {
    const lower = line.toLowerCase().trim();
    if (!lower) continue;

    for (const day of dayNames) {
      if (
        lower.startsWith(day) ||
        lower.startsWith(`- ${day}`) ||
        lower.startsWith(`* ${day}`) ||
        lower.startsWith(`• ${day}`)
      ) {
        const temps = extractAllTemperatures(line);
        const condition = inferCondition(line);
        const dayLabel = day.charAt(0).toUpperCase() + day.slice(1, 3);

        if (temps.length >= 2) {
          forecast.push({
            day: dayLabel,
            high: `${temps[0].value}°${temps[0].unit}`,
            low: `${temps[1].value}°${temps[1].unit}`,
            condition: condition || null,
          });
        } else if (temps.length === 1) {
          forecast.push({
            day: dayLabel,
            high: `${temps[0].value}°${temps[0].unit}`,
            low: null,
            condition: condition || null,
          });
        }
        break;
      }
    }
  }
  return forecast;
}

function extractSource(text) {
  const patterns = [
    /(?:source|data):\s*(.+?)(?:\.|$)/im,
    /(?:source|data)\s*[:\-]\s*(.+?)(?:\.|$)/im,
  ];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) return m[1].trim();
  }
  return null;
}

export function extractWeatherData(text) {
  const location = extractLocation(text);
  const date = extractDate(text);
  const temps = extractAllTemperatures(text);
  const mainCondition = inferCondition(text);
  const periods = extractPeriods(text);
  const forecast = extractForecast(text);
  const source = extractSource(text);

  // Current temperature — first temperature in the text
  const currentTemp = temps.length > 0 ? `${temps[0].value}°${temps[0].unit}` : null;

  // Try to extract secondary temp as "feels like"
  const feelsLike = extractDetail(text, 'feels like') || extractDetail(text, 'feel like');
  const humidity = extractDetail(text, 'humidity');
  const wind = extractDetail(text, 'wind');

  // If we have a parenthetical with the other unit, extract it
  let altTemp = null;
  const altMatch = text.match(/\d+\s*°\s*[CF]\s*\((\d+\s*°\s*[CF])\)/);
  if (altMatch) altTemp = altMatch[1].replace(/\s/g, '');

  return {
    location,
    date,
    current: {
      temp: currentTemp,
      altTemp,
      feelsLike: feelsLike || null,
      condition: mainCondition,
      humidity: humidity || null,
      wind: wind || null,
    },
    periods: periods.length > 0 ? periods : null,
    forecast: forecast.length > 0 ? forecast : null,
    source,
  };
}

// ── Condition → Theme Mapping ──────────────────────────────────────────────

const CONDITION_THEMES = {
  Rain: { key: 'rain', icon: 'rain', gradient: 'rain' },
  'Heavy Rain': { key: 'rain', icon: 'heavyRain', gradient: 'rain' },
  Drizzle: { key: 'rain', icon: 'rain', gradient: 'rain' },
  Showers: { key: 'rain', icon: 'rain', gradient: 'rain' },
  Thunderstorm: { key: 'storm', icon: 'storm', gradient: 'storm' },
  Snow: { key: 'snow', icon: 'snow', gradient: 'snow' },
  Sleet: { key: 'snow', icon: 'snow', gradient: 'snow' },
  Fog: { key: 'fog', icon: 'fog', gradient: 'fog' },
  'Partly Cloudy': { key: 'partlyCloudy', icon: 'partlyCloudy', gradient: 'cloudy' },
  Cloudy: { key: 'cloudy', icon: 'cloudy', gradient: 'cloudy' },
  Sunny: { key: 'sunny', icon: 'sunny', gradient: 'sunny' },
  Windy: { key: 'windy', icon: 'windy', gradient: 'cloudy' },
};

export function mapConditionToTheme(condition) {
  if (!condition) return { key: 'default', icon: 'cloudy', gradient: 'cloudy' };
  return CONDITION_THEMES[condition] || { key: 'default', icon: 'cloudy', gradient: 'cloudy' };
}
