import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'araviel-user-location';
const PERMISSION_KEY = 'araviel-location-permission';
const WEATHER_STALE_MS = 30 * 60 * 1000; // 30 minutes

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
 */
export default function useUserLocation() {
  const [location, setLocation] = useState(() => {
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

  // Check permission state on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setPermission('unavailable');
      return;
    }

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
        })
        .catch(() => {
          // permissions API not fully supported
        });
    }
  }, []);

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

  // Refresh weather if stale (every 30 min)
  useEffect(() => {
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

  const clearLocation = useCallback(() => {
    setLocation(null);
    setPermission('prompt');
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PERMISSION_KEY);
  }, []);

  return { location, permission, requestLocation, clearLocation };
}
