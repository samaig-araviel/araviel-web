import { useState, useEffect, useCallback, useRef } from 'react';
import { readBooleanSetting } from '../lib/localSettings';

const STORAGE_KEY = 'araviel-user-location';
const PERMISSION_KEY = 'araviel-location-permission';
const ASKED_KEY = 'araviel-location-asked';
const SETTINGS_UPDATE_EVENT = 'araviel-settings-updated';
const WEATHER_STALE_MS = 30 * 60 * 1000; // 30 minutes

// The user-facing "Location metadata" toggle (Settings > Data & privacy)
// is the single source of truth for whether this hook is allowed to do
// anything. Default OFF — the hook stays inert until the user explicitly
// opts in, matching the privacy-by-default posture enforced server-side.
const CONSENT_SETTING = 'locationMetadata';

function hasConsent() {
  return readBooleanSetting(CONSENT_SETTING, false);
}

/**
 * Map WMO weather codes to ADE Weather enum values.
 * https://open-meteo.com/en/docs — WMO Weather interpretation codes
 */
function mapWeatherCode(code, tempC) {
  if (code <= 1) return tempC >= 35 ? 'hot' : tempC <= 0 ? 'cold' : 'sunny';
  if (code <= 3) return 'cloudy';
  if (code >= 51 && code <= 67) return 'rainy';
  if (code >= 71 && code <= 77) return 'snowy';
  if (code >= 80 && code <= 82) return 'rainy';
  if (code >= 85 && code <= 86) return 'snowy';
  if (code >= 95) return 'stormy';
  if (code >= 45 && code <= 48) return 'cloudy'; // fog
  return 'cloudy';
}

/**
 * Custom hook for detecting user location via browser Geolocation API.
 * Stores the result in localStorage so we don't re-prompt on every page load.
 * Returns { location, permission, requestLocation, clearLocation }
 *
 * location: { latitude, longitude, city, region, country } | null
 * permission: 'granted' | 'denied' | 'prompt' | 'unavailable'
 *
 * The entire pipeline is gated on the `locationMetadata` privacy toggle.
 * Without consent the hook never prompts, never reads cached coordinates,
 * and never fires the reverse-geocode / weather network calls.
 */
export default function useUserLocation() {
  const [location, setLocation] = useState(() => {
    if (!hasConsent()) return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [permission, setPermission] = useState(() => {
    return localStorage.getItem(PERMISSION_KEY) || 'prompt';
  });

  // Reverse geocode coordinates to get city/region/country
  const reverseGeocode = useCallback(async (latitude, longitude) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`,
        { headers: { 'User-Agent': 'Araviel-Web/1.0' } }
      );
      if (!res.ok) return null;
      const data = await res.json();
      const addr = data.address || {};
      return {
        city: addr.city || addr.town || addr.village || addr.municipality || null,
        region: addr.state || addr.county || null,
        country: addr.country || null,
        countryCode: addr.country_code?.toUpperCase() || null,
      };
    } catch {
      return null;
    }
  }, []);

  // Fetch current weather from Open-Meteo (free, no API key)
  const fetchWeather = useCallback(async (latitude, longitude) => {
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`
      );
      if (!res.ok) return null;
      const data = await res.json();
      const current = data.current;
      if (!current) return null;
      const tempC = current.temperature_2m;
      const code = current.weather_code;
      return {
        weather: mapWeatherCode(code, tempC),
        temperatureC: tempC,
        weatherCode: code,
        weatherTimestamp: Date.now(),
      };
    } catch {
      return null;
    }
  }, []);

  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setPermission('unavailable');
      return null;
    }
    // Belt-and-braces: even if a caller invokes this directly, refuse
    // when the user hasn't consented. Keeps the consent gate impossible
    // to bypass from inside the app.
    if (!hasConsent()) return null;

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const [geo, weatherData] = await Promise.all([
            reverseGeocode(latitude, longitude),
            fetchWeather(latitude, longitude),
          ]);

          const locationData = {
            latitude,
            longitude,
            city: geo?.city || null,
            region: geo?.region || null,
            country: geo?.country || null,
            countryCode: geo?.countryCode || null,
            weather: weatherData?.weather || null,
            temperatureC: weatherData?.temperatureC ?? null,
            weatherTimestamp: weatherData?.weatherTimestamp || null,
            timestamp: Date.now(),
          };

          setLocation(locationData);
          setPermission('granted');
          localStorage.setItem(STORAGE_KEY, JSON.stringify(locationData));
          localStorage.setItem(PERMISSION_KEY, 'granted');
          resolve(locationData);
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setPermission('denied');
            localStorage.setItem(PERMISSION_KEY, 'denied');
          }
          resolve(null);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
      );
    });
  }, [reverseGeocode, fetchWeather]);

  // Keep refs so effect handlers can call the latest versions without
  // re-subscribing every render.
  const requestLocationRef = useRef(requestLocation);
  requestLocationRef.current = requestLocation;

  const clearLocation = useCallback(() => {
    setLocation(null);
    setPermission('prompt');
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PERMISSION_KEY);
    localStorage.removeItem(ASKED_KEY);
  }, []);

  const clearLocationRef = useRef(clearLocation);
  clearLocationRef.current = clearLocation;

  // Check permission state on mount and auto-request location at most once,
  // but only when the user has explicitly opted in via Settings.
  //
  // We only auto-prompt the very first time the user lands on the app. After
  // that, browsers keep `permission.state === 'prompt'` for "Just this time"
  // grants, dismissals (X), and "Continue blocking" denials that don't persist
  // — so re-firing getCurrentPosition() on every reload would re-show the OS
  // prompt indefinitely. The ASKED_KEY flag marks "we've already had our one
  // chance to ask"; the user can opt back in by calling clearLocation().
  useEffect(() => {
    if (!navigator.geolocation) {
      setPermission('unavailable');
      return;
    }
    if (!hasConsent()) return;

    const tryAutoRequest = (state) => {
      if (state === 'granted') {
        // Persistent grant — refresh data without re-prompting (the browser
        // suppresses the UI when permission is already granted).
        if (!localStorage.getItem(STORAGE_KEY)) requestLocationRef.current();
        return;
      }
      if (state === 'denied') return;
      if (localStorage.getItem(STORAGE_KEY)) return;
      if (localStorage.getItem(ASKED_KEY) === 'true') return;
      localStorage.setItem(ASKED_KEY, 'true');
      requestLocationRef.current();
    };

    if (navigator.permissions) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((result) => {
          setPermission(result.state);
          localStorage.setItem(PERMISSION_KEY, result.state);

          result.addEventListener('change', () => {
            setPermission(result.state);
            localStorage.setItem(PERMISSION_KEY, result.state);
            if (result.state === 'denied') {
              setLocation(null);
              localStorage.removeItem(STORAGE_KEY);
            }
          });

          tryAutoRequest(result.state);
        })
        .catch(() => tryAutoRequest('prompt'));
    } else {
      tryAutoRequest('prompt');
    }
  }, []);

  // React to consent changes:
  //   • toggle OFF → wipe cached coordinates and permission state.
  //   • toggle ON  → prompt for permission if we don't already have data.
  //
  // The `araviel-settings-updated` custom event covers same-tab saves; the
  // native `storage` event covers cross-tab changes. Both end up at the same
  // sync function so behaviour is identical regardless of origin.
  useEffect(() => {
    const sync = () => {
      if (hasConsent()) {
        if (!localStorage.getItem(STORAGE_KEY)) {
          requestLocationRef.current();
        }
      } else {
        clearLocationRef.current();
      }
    };

    const handleStorage = (event) => {
      if (event.key === 'araviel-settings') sync();
    };

    window.addEventListener(SETTINGS_UPDATE_EVENT, sync);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(SETTINGS_UPDATE_EVENT, sync);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Refresh weather if stale (every 30 min)
  useEffect(() => {
    if (!hasConsent()) return;
    if (!location?.latitude || !location?.longitude) return;
    const age = Date.now() - (location.weatherTimestamp || 0);
    if (age < WEATHER_STALE_MS) return;

    fetchWeather(location.latitude, location.longitude).then((weatherData) => {
      if (weatherData) {
        setLocation((prev) => {
          const updated = {
            ...prev,
            weather: weatherData.weather,
            temperatureC: weatherData.temperatureC,
            weatherTimestamp: weatherData.weatherTimestamp,
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          return updated;
        });
      }
    });
  }, [location?.latitude, location?.longitude, location?.weatherTimestamp, fetchWeather]);

  return { location, permission, requestLocation, clearLocation };
}
