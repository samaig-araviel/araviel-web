import { describe, it, expect } from 'vitest';
import { extractWeatherData } from './weatherParser';

describe('extractWeatherData — condition inference', () => {
  it('treats "Sky: sunny intervals" as Partly Cloudy even when rain chance is mentioned', () => {
    const text = `Kent, UK
- Sky: sunny intervals
- Temperature: 22°C
- Rain: under 5%
- Wind: light, with gusts around 17 mph from the SSW
- Gusts: 17 mph`;
    const data = extractWeatherData(text);
    expect(data.current.condition).toBe('Partly Cloudy');
  });

  it('treats "Sky: sunny intervals" as Partly Cloudy with explicit chance phrasing', () => {
    const text = `Today's weather in London
- Sky: intermittent clouds
- Temperature: 21°C
- Chance of rain: 5%
- Wind: 8 km/h SW`;
    const data = extractWeatherData(text);
    expect(data.current.condition).toBe('Partly Cloudy');
  });

  it('does not classify a sunny day as Rain just because rain chance is mentioned', () => {
    const text = `Marrakech, Morocco
Condition: Sunny
Temperature: 31°C
Rain chance: 0%
UV Index: 9`;
    const data = extractWeatherData(text);
    expect(data.current.condition).toBe('Sunny');
  });

  it('does not classify a sunny day as Rain when "no rain" is mentioned', () => {
    const text = `Currently: clear
Temperature: 28°C
No rain expected today.`;
    const data = extractWeatherData(text);
    expect(data.current.condition).toBe('Sunny');
  });

  it('still detects actual rain when it is the current condition', () => {
    const text = `Vancouver
- Sky: light rain
- Temperature: 13°C
- Humidity: 77%`;
    const data = extractWeatherData(text);
    expect(data.current.condition).toBe('Rain');
  });

  it('detects heavy rain over plain rain', () => {
    const text = `Lagos
Condition: Heavy rain
Temperature: 27°C`;
    const data = extractWeatherData(text);
    expect(data.current.condition).toBe('Heavy Rain');
  });

  it('detects thunderstorms', () => {
    const text = `Currently: thunderstorm
Temperature: 27°C
Rain chance: 95%`;
    const data = extractWeatherData(text);
    expect(data.current.condition).toBe('Thunderstorm');
  });

  it('detects snow', () => {
    const text = `Reykjavík
Sky: snow
Temperature: -3°C`;
    const data = extractWeatherData(text);
    expect(data.current.condition).toBe('Snow');
  });

  it('detects fog over rain mention in probability', () => {
    const text = `London
Conditions: foggy
Temperature: 8°C
Probability of rain: 10%`;
    const data = extractWeatherData(text);
    expect(data.current.condition).toBe('Fog');
  });

  it('falls back to keyword detection when no explicit condition line is present', () => {
    const text = `It is sunny today with a temperature of 28°C and humidity of 40%.`;
    const data = extractWeatherData(text);
    expect(data.current.condition).toBe('Sunny');
  });

  it('handles "0% rain" without triggering Rain', () => {
    const text = `Marrakech
Sky: sunny
Temperature: 31°C
0% rain`;
    const data = extractWeatherData(text);
    expect(data.current.condition).toBe('Sunny');
  });
});

describe('extractWeatherData — forecast extraction', () => {
  it('extracts a multi-line numbered 4-day forecast (the user-reported case)', () => {
    const text = `London — 80°F (26°C), Sunny.

4-day forecast (dates shown)
1. Friday — May 22, 2026
   - Conditions: Intervals of clouds and sunshine, very warm
   - High: 80°F (26°C) · Low: 64°F (18°C).
2. Saturday — May 23, 2026
   - Conditions: Mostly sunny and very warm
   - High: 83°F (28°C) · Low: 60°F (16°C).
3. Sunday — May 24, 2026
   - Conditions: Very warm with sunshine
   - High: 85°F (30°C) · Low: 62°F (17°C).
4. Monday — May 25, 2026
   - Conditions: Very warm with sunshine
   - High: 89°F (32°C) · Low: 64°F (18°C).

Note: Monday looks the hottest of the period.`;
    const data = extractWeatherData(text);
    expect(data.forecast).not.toBeNull();
    expect(data.forecast).toHaveLength(4);
    expect(data.forecast[0]).toMatchObject({ day: 'Fri', high: '80°F', low: '64°F' });
    expect(data.forecast[1]).toMatchObject({ day: 'Sat', high: '83°F', low: '60°F' });
    expect(data.forecast[2]).toMatchObject({ day: 'Sun', high: '85°F', low: '62°F' });
    expect(data.forecast[3]).toMatchObject({ day: 'Mon', high: '89°F', low: '64°F' });
  });

  it('removes the consumed forecast block from remainingText (Note still kept)', () => {
    const text = `London — 80°F, Sunny.

4-day forecast
1. Friday — May 22, 2026
   - High: 80°F · Low: 64°F.
2. Saturday — May 23, 2026
   - High: 83°F · Low: 60°F.

Note: Monday looks the hottest of the period.`;
    const data = extractWeatherData(text);
    expect(data.forecast).toHaveLength(2);
    // The note should still be present in remainingText
    expect(data.remainingText || '').toContain('Monday looks the hottest');
    // But the forecast day lines should NOT be in remainingText
    expect(data.remainingText || '').not.toContain('Friday — May 22');
    expect(data.remainingText || '').not.toContain('Saturday — May 23');
    expect(data.remainingText || '').not.toContain('High: 80°F');
    // And the forecast header itself should be gone
    expect(data.remainingText || '').not.toContain('4-day forecast');
  });

  it('extracts compact single-line forecast format', () => {
    const text = `Toronto
Currently: 11°C, Sunny.

- Mon: 21°C / 11°C, Sunny
- Tue: 19°C / 10°C, Partly Cloudy
- Wed: 16°C / 8°C, Rain`;
    const data = extractWeatherData(text);
    expect(data.forecast).toHaveLength(3);
    expect(data.forecast[0]).toMatchObject({ day: 'Mon', high: '21°C', low: '11°C' });
    expect(data.forecast[1]).toMatchObject({ day: 'Tue', high: '19°C', low: '10°C' });
    expect(data.forecast[2]).toMatchObject({ day: 'Wed', high: '16°C', low: '8°C' });
  });

  it('handles bold day headers with details on the next lines', () => {
    const text = `Weather report

**Friday**
- High: 22°C
- Low: 14°C
- Cloudy

**Saturday**
- High: 25°C
- Low: 16°C
- Sunny`;
    const data = extractWeatherData(text);
    expect(data.forecast).toHaveLength(2);
    expect(data.forecast[0]).toMatchObject({ day: 'Fri', high: '22°C', low: '14°C' });
    expect(data.forecast[1]).toMatchObject({ day: 'Sat', high: '25°C', low: '16°C' });
  });

  it('does not treat "Sunday" as the Sunny condition', () => {
    const text = `Forecast

1. Sunday — May 24
   - High: 18°C · Low: 9°C
   - Conditions: Heavy rain`;
    const data = extractWeatherData(text);
    expect(data.forecast).toHaveLength(1);
    expect(data.forecast[0].condition).toBe('Heavy Rain');
  });

  it('returns null forecast for text with no day headers', () => {
    const text = `It's currently 22°C and sunny in Paris with low humidity.`;
    const data = extractWeatherData(text);
    expect(data.forecast).toBeNull();
  });

  it('maps "Intervals of clouds and sunshine" to Partly Cloudy', () => {
    const text = `Friday
- Conditions: Intervals of clouds and sunshine, very warm
- High: 80°F · Low: 64°F`;
    const data = extractWeatherData(text);
    expect(data.forecast).toHaveLength(1);
    expect(data.forecast[0].condition).toBe('Partly Cloudy');
  });

  it('maps "Mostly sunny" to Partly Cloudy in a forecast block', () => {
    const text = `Saturday
- Conditions: Mostly sunny and very warm
- High: 83°F · Low: 60°F`;
    const data = extractWeatherData(text);
    expect(data.forecast[0].condition).toBe('Partly Cloudy');
  });
});
