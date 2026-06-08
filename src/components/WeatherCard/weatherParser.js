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

// Hard suppressors — when any of these are present the card MUST NOT render
// regardless of how many weather words appear in the response. The model is
// either being honest that it doesn't have real data, or already presenting
// structured data the card extractor would only mangle.
const SUPPRESS_PHRASES = [
  'illustrative',
  'example only',
  'not real-time',
  'not real time',
  'cannot access',
  'cannot fetch',
  "can't access",
  "can't fetch",
  "i can't access",
  "i can't fetch",
  "i don't have access",
  'i do not have access',
  'no real-time',
  'no real time',
  "here's how to get",
  'here is how to get',
  'you can run',
  'you can use the',
  'set this in your environment',
];

// Template-literal syntax (Python f-strings, JS template literals, env vars)
// means the model is showing code, not data.
const TEMPLATE_LITERAL = /\{[^}\n]*\}|\$\{[^}]*\}|f"[^"]*\{[^}]*\}/;

export function detectWeatherResponse(text) {
  if (!text || text.length < 30) return false;

  const lower = text.toLowerCase();

  // Fail-closed gates: any of these and the card stays hidden, the response
  // renders as plain markdown. Better to show no card than a broken one.
  //
  // A markdown table is no longer a suppressor on its own — real multi-day
  // forecasts often ship a `| DAY | HIGH | LOW | CONDITIONS |` table that
  // the card's forecast extractor reads correctly. The phrase suppressors
  // still catch the fabricated/illustrative cases we actually care about.
  for (const phrase of SUPPRESS_PHRASES) {
    if (lower.includes(phrase)) return false;
  }
  if (TEMPLATE_LITERAL.test(text)) return false;

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

// Phrases like "chance of rain: 5%", "rain probability", "no rain", "rain: under 5%"
// describe the *probability* of rain, not the current sky condition. We need
// to strip these before scanning for condition keywords, otherwise a sunny day
// with a low rain chance is misclassified as "Rain".
function stripProbabilityContexts(text) {
  return (
    text
      // "chance of rain / precipitation / showers / snow ... 5%"
      .replace(
        /\b(?:chance|probability|likelihood|odds|risk)\s+of\s+(?:rain|precipitation|showers?|snow|storms?|thunder(?:storms?)?)\b[^.\n]*/gi,
        ' '
      )
      // "rain chance", "precipitation probability", "snow chance"
      .replace(
        /\b(?:rain|precipitation|snow|shower|thunderstorm)\s+(?:chance|probability)\b[^.\n]*/gi,
        ' '
      )
      // "rain: under 5%", "snow: 10%", "showers: 0%"
      .replace(
        /\b(?:rain|snow|showers?|precipitation)\s*[:\-]\s*(?:under|less than|below|near|about|around|approximately|~)?\s*<?\s*\d+(?:\.\d+)?\s*%/gi,
        ' '
      )
      // "X% rain", "5% chance of rain", "0% precipitation"
      .replace(
        /\b\d+(?:\.\d+)?\s*%\s*(?:chance of\s+)?(?:rain|precipitation|snow|showers?)\b/gi,
        ' '
      )
      // "no rain", "no precipitation", "0 chance of rain"
      .replace(/\bno\s+(?:rain|precipitation|showers?|snow|storms?)\b/gi, ' ')
      // "dry — no rain"
      .replace(
        /\b(?:rain|precipitation|snow)\s+expected\s*[:\-]?\s*(?:no|none|0|low|minimal)\b/gi,
        ' '
      )
  );
}

// Read explicit condition labels like "Sky: sunny intervals" / "Condition: Rain".
// These take precedence over keyword scanning since they describe the sky directly.
function extractExplicitCondition(text) {
  const labels = [
    'sky',
    'skies',
    'condition',
    'conditions',
    'current condition',
    'current conditions',
    'current weather',
    'currently',
    'now',
    'present weather',
    'present conditions',
    'outlook',
  ];
  const lines = text.split('\n');
  for (const raw of lines) {
    const stripped = raw
      .replace(/\*\*/g, '')
      .replace(/^[\s\-*•]+/, '')
      .trim();
    if (!stripped) continue;
    for (const label of labels) {
      const re = new RegExp('^' + label + '\\s*[:\\-—–]\\s*(.+)', 'i');
      const m = stripped.match(re);
      if (m) {
        const value = m[1].trim().replace(/[,.;]$/, '');
        if (value.length > 0 && value.length < 120) return value;
      }
    }
  }
  return null;
}

function matchConditionKeywords(text) {
  const lower = text.toLowerCase();
  // Order matters: more-specific phrases checked before generic ones, and
  // partly-cloudy variants checked before bare "sunny" or "cloudy" so that
  // "sunny intervals" maps to Partly Cloudy rather than Sunny.
  const conditions = [
    { keywords: ['thunderstorm', 'thunder', 'lightning'], label: 'Thunderstorm' },
    { keywords: ['heavy rain', 'downpour', 'torrential'], label: 'Heavy Rain' },
    {
      keywords: [
        'sunny intervals',
        'sunny spells',
        'bright spells',
        'bright intervals',
        'partly cloudy',
        'partly sunny',
        'mostly sunny',
        'some clouds',
        'some sunshine',
        'broken clouds',
        'scattered clouds',
        'intermittent clouds',
        'intermittent sunshine',
        'intervals of clouds',
        'intervals of sunshine',
        'clouds and sunshine',
        'clouds and sun',
        'sun and clouds',
        'sunshine and clouds',
      ],
      label: 'Partly Cloudy',
    },
    { keywords: ['frequent showers'], label: 'Rain' },
    {
      keywords: ['raining', 'rainy', 'showers', 'drizzle', 'rain'],
      label: 'Rain',
    },
    { keywords: ['snowing', 'snowy', 'snow', 'blizzard', 'flurries'], label: 'Snow' },
    { keywords: ['sleet', 'hail', 'freezing rain'], label: 'Sleet' },
    { keywords: ['fog', 'foggy', 'mist', 'misty', 'haze', 'hazy'], label: 'Fog' },
    {
      keywords: ['mostly cloudy', 'overcast', 'cloudy', 'grey skies', 'gray skies'],
      label: 'Cloudy',
    },
    {
      keywords: [
        'sunny',
        'clear skies',
        'clear',
        'sunshine',
        'bright',
        'fine weather',
        'fair weather',
      ],
      label: 'Sunny',
    },
    { keywords: ['windy', 'gusty', 'breezy', 'strong winds'], label: 'Windy' },
  ];
  for (const { keywords, label } of conditions) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return label;
    }
  }
  return null;
}

function inferCondition(text) {
  // 1. Prefer an explicit "Sky:" / "Condition:" / "Currently:" line if present.
  const explicit = extractExplicitCondition(text);
  if (explicit) {
    const fromExplicit = matchConditionKeywords(explicit);
    if (fromExplicit) return fromExplicit;
  }

  // 2. Fall back to scanning the whole text, but first strip out probability
  //    contexts so "chance of rain: 5%" doesn't classify a sunny day as Rain.
  return matchConditionKeywords(stripProbabilityContexts(text));
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

const DAY_NAMES = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
  'mon',
  'tue',
  'tues',
  'wed',
  'thu',
  'thur',
  'thurs',
  'fri',
  'sat',
  'sun',
];

function stripListPrefix(s) {
  return s
    .replace(/\*\*/g, '')
    .replace(/^\s+/, '')
    .replace(/^(?:\d+\s*[.)\]]\s+|[\-*•◦▪–—]\s+)/, '')
    .trim();
}

function matchesDayHeader(stripped) {
  const lower = stripped.toLowerCase();
  for (const day of DAY_NAMES) {
    // day name followed by word boundary (space, comma, dash, colon, end)
    if (new RegExp('^' + day + '\\b').test(lower)) {
      return day;
    }
  }
  return null;
}

function normalizeTempString(raw) {
  if (!raw) return null;
  const m = raw.match(/(-?\d+(?:\.\d+)?)\s*°?\s*([CF])/i);
  if (!m) return null;
  return `${m[1]}°${m[2].toUpperCase()}`;
}

/**
 * Extract a multi-day forecast in any of these shapes:
 *   - "Mon: 21°C / 11°C, Cloudy"                         (single-line compact)
 *   - "**Friday**\n   - High: 80°F (26°C)\n   - Low: 64°F" (multi-line, bullet/numbered)
 *   - "1. Friday — May 22, 2026\n   - Conditions: ...\n   - High: 80°F · Low: 64°F"
 *
 * Returns `{ forecast, consumed }` where `consumed` is the set of line
 * indices that fed the extraction so the body-text renderer can skip them.
 */
function extractForecast(text) {
  const forecast = [];
  const consumed = new Set();
  const lines = text.split('\n');

  let i = 0;
  while (i < lines.length) {
    const stripped = stripListPrefix(lines[i]);
    if (!stripped) {
      i++;
      continue;
    }

    const matchedDay = matchesDayHeader(stripped);
    if (!matchedDay) {
      i++;
      continue;
    }

    // Collect this line + any continuation lines until next day header /
    // blank-then-day / clearly-new section.
    const blockLines = [stripped];
    const blockIndices = [i];
    let j = i + 1;
    let blanksSeen = 0;
    while (j < lines.length && j - i <= 8) {
      const nextStripped = stripListPrefix(lines[j]);
      if (!nextStripped) {
        // Allow one blank line within a block; stop on second blank
        blanksSeen++;
        if (blanksSeen >= 2) break;
        j++;
        continue;
      }
      blanksSeen = 0;
      if (matchesDayHeader(nextStripped)) break;
      // Stop at clearly non-forecast continuation
      if (
        /^(summary|note|tip|recommendation|advisory|alert|warning|disclaimer|if you|i can|let me)/i.test(
          nextStripped
        )
      ) {
        break;
      }
      blockLines.push(nextStripped);
      blockIndices.push(j);
      j++;
    }

    const blockText = blockLines.join(' ');

    // Prefer explicit "High:" / "Low:" labels
    let high = null;
    let low = null;
    const highMatch = blockText.match(
      /\b(?:high|hi|max(?:imum)?)\s*[:\-—–]?\s*(-?\d+(?:\.\d+)?\s*°?\s*[CF])/i
    );
    const lowMatch = blockText.match(
      /\b(?:low|lo|min(?:imum)?)\s*[:\-—–]?\s*(-?\d+(?:\.\d+)?\s*°?\s*[CF])/i
    );
    if (highMatch) high = normalizeTempString(highMatch[1]);
    if (lowMatch) low = normalizeTempString(lowMatch[1]);

    // Fallback: first two temps in the block — first is high, second is low.
    // Skip parenthetical temps (e.g. the "(26°C)" alt unit beside "80°F").
    if (!high || !low) {
      const noParen = blockText.replace(/\([^)]*\)/g, ' ');
      const temps = extractAllTemperatures(noParen);
      if (!high && temps.length >= 1) high = `${temps[0].value}°${temps[0].unit}`;
      if (!low && temps.length >= 2) low = `${temps[1].value}°${temps[1].unit}`;
    }

    // Condition: prefer a "Conditions:" line in the block, fall back to inference
    let condition = null;
    const conditionsLineMatch = blockText.match(/\bconditions?\s*[:\-—–]\s*([^\n.;|·]+)/i);
    if (conditionsLineMatch) {
      condition = inferCondition(conditionsLineMatch[1]);
    }
    if (!condition) {
      // Don't use the day name itself as condition input (avoid matching "sun" → Sunny for "Sunday")
      const blockMinusDay = blockText.replace(new RegExp('^' + matchedDay + '\\b', 'i'), '');
      condition = inferCondition(blockMinusDay);
    }

    const dayLabel = matchedDay.charAt(0).toUpperCase() + matchedDay.slice(1, 3);

    if (high) {
      // De-dupe: same day name shouldn't appear twice
      if (!forecast.find((f) => f.day === dayLabel)) {
        forecast.push({
          day: dayLabel,
          high,
          low: low || null,
          condition: condition || null,
        });
        // Mark the lines we used so they're stripped from the body text
        for (const idx of blockIndices) consumed.add(idx);
      }
    }

    i = j;
  }

  // If we extracted a forecast, also consume the header line that introduces
  // it (e.g. "4-day forecast", "Forecast:", "Weekly outlook") and a bare
  // "Summary" header that immediately precedes it.
  if (forecast.length > 0) {
    const minConsumed = Math.min(...consumed);
    for (let k = Math.max(0, minConsumed - 4); k < minConsumed; k++) {
      const stripped = stripListPrefix(lines[k]).toLowerCase();
      if (!stripped) continue;
      const isForecastHeader =
        /^(?:\d+[\-\s]?day\s+)?(?:weekly\s+|extended\s+|multi[\-\s]?day\s+|short[\-\s]?term\s+|long[\-\s]?term\s+)?(?:forecast|outlook)\b/i.test(
          stripped
        );
      const isBareSummary = /^summary\s*[:\-]?\s*$/i.test(stripped);
      if (isForecastHeader || isBareSummary) {
        consumed.add(k);
      }
    }
  }

  return { forecast, consumed };
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
function extractRemainingText(text, weatherData, preConsumed) {
  const lines = text.split('\n');
  const consumed = new Set(preConsumed || []);
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
    'chance of rain',
    'rain chance',
    'sunrise',
    'sunset',
    'gusts',
    'wind gusts',
    'gust',
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

    // Short "label: value" lines whose value is already shown in the card hero.
    // Matches things like "Sky: Sunny", "Temperature: 80°F", "High: 80°F · Low: 64°F",
    // "Condition: Rain", "Currently: Clear".
    const heroLabels = [
      'sky',
      'skies',
      'condition',
      'conditions',
      'current condition',
      'current conditions',
      'temperature',
      'temp',
      'high',
      'hi',
      'low',
      'lo',
      'max',
      'maximum',
      'min',
      'minimum',
      'currently',
      'now',
      'present weather',
      'outlook',
    ];
    if (stripped.length < 100) {
      for (const label of heroLabels) {
        if (new RegExp('^' + label + '\\s*[:\\-—–]').test(stripped)) {
          consumed.add(i);
          break;
        }
      }
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
  const { forecast, consumed: forecastConsumed } = extractForecast(text);
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
  const chanceOfRain = extractDetailLine(text, [
    'chance of rain',
    'rain chance',
    'precipitation chance',
    'probability of rain',
    'chance of precipitation',
  ]);
  const sunrise = extractDetailLine(text, ['sunrise']);
  const sunset = extractDetailLine(text, ['sunset']);
  const gusts = extractDetailLine(text, ['gusts', 'wind gusts', 'gust']);

  // Min/Max temps
  let minTemp = extractDetailLine(text, ['low', 'min', 'minimum']);
  let maxTemp = extractDetailLine(text, ['high', 'max', 'maximum']);
  // Also try "Low: X / High: Y" or "X°C / Y°C" patterns
  if (!minTemp || !maxTemp) {
    const minMaxMatch = text.match(/(?:low|min(?:imum)?)\s*[:\-]?\s*(-?\d+\s*°\s*[CF])/i);
    if (minMaxMatch) minTemp = minTemp || minMaxMatch[1].replace(/\s/g, '');
    const maxMatch = text.match(/(?:high|max(?:imum)?)\s*[:\-]?\s*(-?\d+\s*°\s*[CF])/i);
    if (maxMatch) maxTemp = maxTemp || maxMatch[1].replace(/\s/g, '');
  }

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
      chanceOfRain,
      sunrise,
      sunset,
      gusts,
      minTemp,
      maxTemp,
    },
    periods: periods.length > 0 ? periods : null,
    forecast: forecast.length > 0 ? forecast : null,
    source,
  };

  // Extract text not consumed by the card (start with forecast-block indices
  // so multi-line forecast entries don't leak into the body text below).
  weatherData.remainingText = extractRemainingText(text, weatherData, forecastConsumed);

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
