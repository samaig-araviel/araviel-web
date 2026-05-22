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
