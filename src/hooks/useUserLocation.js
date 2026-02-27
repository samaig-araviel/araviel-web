import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'araviel-user-location';
const PERMISSION_KEY = 'araviel-location-permission';

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

  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setPermission('unavailable');
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const geo = await reverseGeocode(latitude, longitude);

          const locationData = {
            latitude,
            longitude,
            city: geo?.city || null,
            region: geo?.region || null,
            country: geo?.country || null,
            countryCode: geo?.countryCode || null,
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
  }, [reverseGeocode]);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setPermission('prompt');
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PERMISSION_KEY);
  }, []);

  return { location, permission, requestLocation, clearLocation };
}
