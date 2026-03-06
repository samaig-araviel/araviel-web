/**
 * Weather detection and extraction for LLM responses.
 * Parses markdown text to detect weather content and extract structured data.
 * v2 — Robust extraction that handles diverse LLM response formats.
 */

// ── Detection ──────────────────────────────────────────────────────────────

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
  'dropping to',
  'temperatures around',
  'temperature of',
  'degrees celsius',
  'degrees fahrenheit',
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

  // Time period words
  for (const word of TIME_PERIOD_WORDS) {
    if (lower.includes(word)) score += 1;
  }

  // Weather context phrases — strong signal
  for (const phrase of WEATHER_CONTEXT_PHRASES) {
    if (lower.includes(phrase)) score += 3;
  }

  // Negative signals
  const codeBlockCount = (text.match(/```/g) || []).length / 2;
  if (codeBlockCount >= 1) score -= 8;
  if (text.length > 3000) score -= 4;
  if (text.length > 5000) score -= 6;

  return score >= 8;
}

// ── Extraction helpers ─────────────────────────────────────────────────────

function extractTemperature(text) {
  const match = text.match(/(-?\d+[\u2013\u2014\u2012–-]?\d*)\s*°\s*([CF])/);
  if (match) return `${match[1]}°${match[2]}`;
  return null;
}

function extractAllTemperatures(text) {
  const results = [];
  const regex = /(-?\d+[\u2013\u2014\u2012–-]?\d*)\s*°\s*([CF])/g;
  let m;
  while ((m = regex.exec(text)) !== null) {
    results.push({ raw: m[0], value: m[1], unit: m[2], index: m.index });
  }
  return results;
}

function extractLocation(text) {
  const patterns = [
    // "weather for/in Toronto, Canada (today..."
    /(?:weather\s+(?:for|in)\s+)([A-Z][A-Za-z\s,.']+?)(?:\s*[\(:.!]|\s+today|\s+on\s)/i,
    // "for Toronto, Canada (today, March..."
    /(?:for|in)\s+([A-Z][A-Za-z\s]+(?:,\s*[A-Z][A-Za-z\s]+)?)\s*\(?today/i,
    // "for London, United Kingdom:"
    /(?:for|in)\s+([A-Z][A-Za-z\s]+(?:,\s*[A-Z][A-Za-z\s]+))\s*[:.]/i,
    // **Toronto, Canada** (bold locations)
    /\*\*([A-Z][A-Za-z\s]+(?:,\s*[A-Z][A-Za-z\s]+)?)\*\*/,
    // "in Toronto today" or "in London, UK:"
    /\bin\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*(?:,\s*[A-Z][A-Za-z\s]+)?)\s*(?:today|tonight|this|right now|currently|:|\()/i,
    // City, Country pattern at line start
    /(?:^|\n)\s*(?:\*\*)?([A-Z][A-Za-z]+(?:\s+[A-Za-z]+)*,\s*[A-Z][A-Za-z\s]+?)(?:\*\*)?(?:\s*[\(:.!]|\s*$)/m,
    // Standalone well-known pattern: "Here's the current weather for X"
    /(?:current\s+weather\s+(?:for|in)\s+)([A-Z][A-Za-z\s,.']+?)(?:\s*[\(:.])/i,
  ];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) {
      let loc = m[1]
        .trim()
        .replace(/[,\s]+$/, '')
        .replace(/\*+/g, '');
      // Filter out generic words that aren't locations
      if (loc.length > 2 && loc.length < 80 && !/^(Here|The|Current|Today|This)/i.test(loc)) {
        return loc;
      }
    }
  }
  return null;
}

function extractDate(text) {
  const patterns = [
    // "(today, March 6, 2026)"
    /\(?\s*today,?\s+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})\s*\)?/i,
    // "March 6, 2026" in parentheses
    /\(([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})\)/i,
    // "Friday, March 6, 2026"
    /(\w+day,?\s+[A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
    // "March 6, 2026"
    /([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
    // "6 March 2026"
    /(\d{1,2}\s+[A-Z][a-z]+\s+\d{4})/i,
    // "2026-03-06" ISO
    /(\d{4}-\d{2}-\d{2})/,
  ];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) return m[1].trim();
  }
  // Fallback: use today's date
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function inferCondition(text) {
  const lower = text.toLowerCase();
  const conditions = [
    { keywords: ['thunderstorm', 'thunder', 'lightning'], label: 'Thunderstorm' },
    { keywords: ['heavy rain', 'downpour', 'torrential'], label: 'Heavy Rain' },
    { keywords: ['frequent showers'], label: 'Rain' },
    {
      keywords: ['rain', 'rainy', 'raining', 'showers', 'drizzle', 'precipitation'],
      label: 'Rain',
    },
    { keywords: ['snow', 'snowy', 'snowing', 'blizzard'], label: 'Snow' },
    { keywords: ['sleet', 'hail', 'freezing rain'], label: 'Sleet' },
    { keywords: ['fog', 'foggy', 'mist', 'misty', 'haze', 'hazy'], label: 'Fog' },
    { keywords: ['partly cloudy', 'mostly sunny', 'some clouds'], label: 'Partly Cloudy' },
    {
      keywords: ['cloudy', 'overcast', 'mostly cloudy', 'grey skies', 'gray skies'],
      label: 'Cloudy',
    },
    { keywords: ['sunny', 'clear', 'sunshine', 'bright', 'fine weather'], label: 'Sunny' },
    { keywords: ['windy', 'gusty', 'breezy', 'strong winds'], label: 'Windy' },
  ];
  for (const { keywords, label } of conditions) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return label;
    }
  }
  return null;
}

/**
 * Extract a detail value by scanning line-by-line for flexible patterns.
 * Handles: "- Humidity: 82%", "**Humidity:** 82%", "Humidity is around 82%", etc.
 */
function extractDetailLine(text, labels) {
  const lines = text.split('\n');
  for (const line of lines) {
    const stripped = line
      .replace(/\*\*/g, '')
      .replace(/^[\s\-*•]+/, '')
      .trim();
    const lower = stripped.toLowerCase();
    for (const label of labels) {
      const labelLower = label.toLowerCase();
      if (!lower.includes(labelLower)) continue;

      // "Label: value" or "Label value"
      const colonPat = new RegExp(label + '\\s*[:\\-]\\s*(.+)', 'i');
      let m = stripped.match(colonPat);
      if (m) {
        let val = m[1].trim().replace(/[,.]$/, '');
        // Take first meaningful chunk (stop at parenthetical or next label)
        const paren = val.indexOf('(');
        if (paren > 0) val = val.substring(0, paren).trim();
        if (val.length > 0 && val.length < 60) return val;
      }

      // Natural language: "Label is/around/about VALUE"
      const nlPat = new RegExp(
        label + '\\s+(?:is|of|around|about|at|approximately|roughly)\\s+(.+)',
        'i'
      );
      m = stripped.match(nlPat);
      if (m) {
        let val = m[1].trim().replace(/[,.]$/, '');
        const paren = val.indexOf('(');
        if (paren > 0) val = val.substring(0, paren).trim();
        // Just take the first few words
        val = val.split(/\s+/).slice(0, 4).join(' ');
        if (val.length > 0 && val.length < 60) return val;
      }
    }
  }
  return null;
}

function extractPeriods(text) {
  const periods = [];
  const lines = text.split('\n');
  const periodKeywords = [
    'morning',
    'afternoon',
    'evening',
    'overnight',
    'tonight',
    'today',
    'tomorrow',
    'this afternoon',
    'this evening',
    'this morning',
    'late afternoon',
    'early morning',
    'early afternoon',
    'late evening',
    'afternoon/evening',
    'late night',
    'night',
  ];

  for (const line of lines) {
    const stripped = line
      .replace(/\*\*/g, '')
      .replace(/^[\s\-*•]+/, '')
      .trim();
    const lower = stripped.toLowerCase();
    if (!lower) continue;

    for (const kw of periodKeywords) {
      // Check if line starts with or prominently features the period keyword
      const kwIdx = lower.indexOf(kw);
      if (kwIdx === -1 || kwIdx > 15) continue;

      // Extract the rest after the period label
      const afterLabel = stripped
        .substring(kwIdx + kw.length)
        .replace(/^[\s:,\-]+/, '')
        .trim();
      if (!afterLabel) continue;

      const temp = extractTemperature(afterLabel) || extractTemperature(stripped);
      let condition = inferCondition(afterLabel);
      if (!condition) {
        // Use the description text as condition, cleaned up
        condition = afterLabel
          .replace(/-?\d+[\u2013\u2014\u2012–-]?\d*\s*°\s*[CF]/g, '')
          .replace(/\([^)]*\)/g, '')
          .replace(/^[\s:,\-]+|[\s:,\-]+$/g, '')
          .replace(/temperatures?\s*/i, '')
          .trim();
        if (condition.length > 60) condition = condition.substring(0, 60) + '...';
      }

      const label = kw.charAt(0).toUpperCase() + kw.slice(1);
      // Avoid duplicates
      if (!periods.find((p) => p.label.toLowerCase() === label.toLowerCase())) {
        periods.push({ label, temp, condition: condition || null });
      }
      break;
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
    const stripped = line
      .replace(/\*\*/g, '')
      .replace(/^[\s\-*•]+/, '')
      .trim();
    const lower = stripped.toLowerCase();
    if (!lower) continue;

    for (const day of dayNames) {
      if (lower.startsWith(day) || lower.startsWith(`${day}:`)) {
        const temps = extractAllTemperatures(stripped);
        const condition = inferCondition(stripped);
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
    /(?:source|sources?)\s*[:\-]\s*(.+?)(?:\.|$)/im,
    /(?:data\s+from|data\s+source)\s*[:\-]\s*(.+?)(?:\.|$)/im,
    /(?:live\s+weather\s+data\s+(?:for|from)\s+.+)/im,
  ];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) return m[0].trim().replace(/^\*\*|\*\*$/g, '');
  }
  return null;
}

// ── Remaining text extraction ──────────────────────────────────────────────

/**
 * Identify which lines are "consumed" by the weather card extraction
 * and return everything else as remaining text for markdown rendering.
 */
function extractRemainingText(text, weatherData) {
  const lines = text.split('\n');
  const consumed = new Set();
  const lower = text.toLowerCase();

  // Mark header/intro line (first 1-2 lines with location/weather context)
  for (let i = 0; i < Math.min(lines.length, 3); i++) {
    const l = lines[i].toLowerCase();
    if (
      l.includes('weather') ||
      l.includes('current conditions') ||
      l.includes("here's the") ||
      l.includes('here is the') ||
      (weatherData.location && l.includes(weatherData.location.toLowerCase()))
    ) {
      consumed.add(i);
    }
  }

  // Mark lines with primary temperature data
  const tempRegex = /-?\d+[\u2013\u2014\u2012–-]?\d*\s*°\s*[CF]/;
  const periodKeywords = [
    'morning',
    'afternoon',
    'evening',
    'overnight',
    'tonight',
    'today',
    'tomorrow',
    'afternoon/evening',
    'night',
  ];
  const detailKeywords = [
    'humidity',
    'wind',
    'feels like',
    'feel like',
    'dew point',
    'precipitation',
    'visibility',
    'pressure',
    'uv index',
    'wind chill',
    'heat index',
    'wind speed',
  ];
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

  for (let i = 0; i < lines.length; i++) {
    if (consumed.has(i)) continue;
    const stripped = lines[i]
      .replace(/\*\*/g, '')
      .replace(/^[\s\-*•]+/, '')
      .trim()
      .toLowerCase();
    if (!stripped) {
      consumed.add(i);
      continue;
    }

    // Bullet/line with temperature + weather condition
    if (tempRegex.test(lines[i])) {
      // Check if it's a weather data line (has condition or is a detail)
      const hasConditionWord = CONDITION_WORDS.some((w) => stripped.includes(w));
      const hasPeriodWord = periodKeywords.some(
        (w) => stripped.startsWith(w) || stripped.includes(w + ':')
      );
      const hasDetailWord = detailKeywords.some((w) => stripped.includes(w));
      const hasDayName = dayNames.some((w) => stripped.startsWith(w));
      if (hasConditionWord || hasPeriodWord || hasDetailWord || hasDayName) {
        consumed.add(i);
        continue;
      }
    }

    // Lines that are pure weather details without temp
    const isDetailLine = detailKeywords.some((w) => stripped.includes(w));
    if (isDetailLine && stripped.length < 80) {
      consumed.add(i);
      continue;
    }

    // Source lines
    if (
      stripped.startsWith('source') ||
      stripped.startsWith('live weather data') ||
      stripped.startsWith('data from')
    ) {
      consumed.add(i);
      continue;
    }

    // "Current conditions:" header
    if (stripped.startsWith('current conditions') || stripped.startsWith('current weather')) {
      consumed.add(i);
      continue;
    }
  }

  // Collect remaining lines
  const remaining = [];
  for (let i = 0; i < lines.length; i++) {
    if (!consumed.has(i)) {
      remaining.push(lines[i]);
    }
  }

  // Trim leading/trailing blank lines
  let result = remaining.join('\n').trim();
  return result || null;
}

// ── Main extraction ────────────────────────────────────────────────────────

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

  // Alt temp from parenthetical: "11°C (51°F)"
  let altTemp = null;
  const altMatch = text.match(/\d+\s*°\s*[CF]\s*\((\d+[\u2013\u2014\u2012–-]?\d*\s*°\s*[CF])\)/);
  if (altMatch) altTemp = altMatch[1].replace(/\s/g, '');

  // Extract details using line-by-line scanning
  const feelsLike = extractDetailLine(text, [
    'feels like',
    'feel like',
    'real feel',
    'apparent temperature',
  ]);
  const humidity = extractDetailLine(text, ['humidity']);
  const wind = extractDetailLine(text, ['wind', 'wind speed', 'winds']);
  const visibility = extractDetailLine(text, ['visibility']);
  const pressure = extractDetailLine(text, ['pressure', 'barometric']);
  const uvIndex = extractDetailLine(text, ['uv index', 'uv']);
  const dewPoint = extractDetailLine(text, ['dew point']);

  const weatherData = {
    location,
    date,
    current: {
      temp: currentTemp,
      altTemp,
      feelsLike,
      condition: mainCondition,
      humidity,
      wind,
      visibility,
      pressure,
      uvIndex,
      dewPoint,
    },
    periods: periods.length > 0 ? periods : null,
    forecast: forecast.length > 0 ? forecast : null,
    source,
  };

  // Extract text not consumed by the card
  weatherData.remainingText = extractRemainingText(text, weatherData);

  return weatherData;
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
