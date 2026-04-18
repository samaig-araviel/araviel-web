import { describe, it, expect, beforeEach, vi } from 'vitest';

// Silence the logger so test output stays clean. Must be hoisted above the
// `authStorage` import because the module calls `getRememberMePreference`
// synchronously at load time.
vi.mock('./logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Fresh module import for every test so the module-scoped `currentMode` is
// reset and cannot leak between specs.
async function loadModule() {
  vi.resetModules();
  return import('./authStorage');
}

describe('authStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  describe('getRememberMePreference', () => {
    it('defaults to true when no preference is stored', async () => {
      const { getRememberMePreference } = await loadModule();
      expect(getRememberMePreference()).toBe(true);
    });

    it('returns true when the stored value is "true"', async () => {
      window.localStorage.setItem('araviel.auth.rememberMe', 'true');
      const { getRememberMePreference } = await loadModule();
      expect(getRememberMePreference()).toBe(true);
    });

    it('returns false when the stored value is "false"', async () => {
      window.localStorage.setItem('araviel.auth.rememberMe', 'false');
      const { getRememberMePreference } = await loadModule();
      expect(getRememberMePreference()).toBe(false);
    });

    it('falls back to true when localStorage throws', async () => {
      const spy = vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
        throw new Error('denied');
      });
      const { getRememberMePreference } = await loadModule();
      expect(getRememberMePreference()).toBe(true);
      spy.mockRestore();
    });
  });

  describe('setRememberMePreference', () => {
    it('persists the preference to localStorage', async () => {
      const { setRememberMePreference } = await loadModule();
      setRememberMePreference(false);
      expect(window.localStorage.getItem('araviel.auth.rememberMe')).toBe('false');

      setRememberMePreference(true);
      expect(window.localStorage.getItem('araviel.auth.rememberMe')).toBe('true');
    });

    it('flips the active storage mode used by the adapter', async () => {
      const { setRememberMePreference, getActiveStorageMode } = await loadModule();
      setRememberMePreference(false);
      expect(getActiveStorageMode()).toBe('session');
      setRememberMePreference(true);
      expect(getActiveStorageMode()).toBe('local');
    });

    it('does not throw when localStorage.setItem fails', async () => {
      const { setRememberMePreference } = await loadModule();
      const spy = vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
        throw new Error('quota exceeded');
      });
      expect(() => setRememberMePreference(false)).not.toThrow();
      spy.mockRestore();
    });
  });

  describe('conditionalAuthStorage.setItem', () => {
    it('writes to localStorage when remember = true', async () => {
      const { conditionalAuthStorage, setRememberMePreference } = await loadModule();
      setRememberMePreference(true);
      conditionalAuthStorage.setItem('sb-token', 'value-1');
      expect(window.localStorage.getItem('sb-token')).toBe('value-1');
      expect(window.sessionStorage.getItem('sb-token')).toBeNull();
    });

    it('writes to sessionStorage when remember = false', async () => {
      const { conditionalAuthStorage, setRememberMePreference } = await loadModule();
      setRememberMePreference(false);
      conditionalAuthStorage.setItem('sb-token', 'value-2');
      expect(window.sessionStorage.getItem('sb-token')).toBe('value-2');
      expect(window.localStorage.getItem('sb-token')).toBeNull();
    });

    it('clears the inactive storage on write so tokens never live in both', async () => {
      const { conditionalAuthStorage, setRememberMePreference } = await loadModule();

      // Simulate a leftover token from a previous session in localStorage.
      window.localStorage.setItem('sb-token', 'stale');

      setRememberMePreference(false);
      conditionalAuthStorage.setItem('sb-token', 'fresh');

      expect(window.sessionStorage.getItem('sb-token')).toBe('fresh');
      expect(window.localStorage.getItem('sb-token')).toBeNull();
    });

    it('swallows write errors so the auth pipeline never crashes', async () => {
      const { conditionalAuthStorage, setRememberMePreference } = await loadModule();
      setRememberMePreference(true);
      const spy = vi
        .spyOn(window.localStorage, 'setItem')
        .mockImplementationOnce(() => {
          throw new Error('quota');
        })
        // allow the preference write (which happened inside setRememberMePreference
        // already completed), and block just the adapter write above.
        .mockImplementation((k, v) => {
          // default behaviour is swallowed by the adapter anyway.
          Storage.prototype.setItem.call(window.localStorage, k, v);
        });
      expect(() => conditionalAuthStorage.setItem('sb-token', 'boom')).not.toThrow();
      spy.mockRestore();
    });
  });

  describe('conditionalAuthStorage.getItem', () => {
    it('reads from the active storage first', async () => {
      const { conditionalAuthStorage, setRememberMePreference } = await loadModule();
      setRememberMePreference(true);
      window.localStorage.setItem('sb-token', 'local-value');
      window.sessionStorage.setItem('sb-token', 'session-value');
      expect(conditionalAuthStorage.getItem('sb-token')).toBe('local-value');
    });

    it('falls back to the other storage when the active one is empty', async () => {
      const { conditionalAuthStorage, setRememberMePreference } = await loadModule();
      // User previously signed in with Remember = true, then toggled off
      // without re-signing in. The session still lives in localStorage and
      // should remain usable until the next explicit sign-in.
      window.localStorage.setItem('sb-token', 'carryover');
      setRememberMePreference(false);
      expect(conditionalAuthStorage.getItem('sb-token')).toBe('carryover');
    });

    it('returns null when neither storage has the key', async () => {
      const { conditionalAuthStorage } = await loadModule();
      expect(conditionalAuthStorage.getItem('missing')).toBeNull();
    });
  });

  describe('conditionalAuthStorage.removeItem', () => {
    it('clears the key from BOTH storages', async () => {
      const { conditionalAuthStorage } = await loadModule();
      window.localStorage.setItem('sb-token', 'a');
      window.sessionStorage.setItem('sb-token', 'b');

      conditionalAuthStorage.removeItem('sb-token');

      expect(window.localStorage.getItem('sb-token')).toBeNull();
      expect(window.sessionStorage.getItem('sb-token')).toBeNull();
    });

    it('ignores errors thrown by storage.removeItem', async () => {
      const { conditionalAuthStorage } = await loadModule();
      const localSpy = vi.spyOn(window.localStorage, 'removeItem').mockImplementation(() => {
        throw new Error('denied');
      });
      const sessionSpy = vi.spyOn(window.sessionStorage, 'removeItem').mockImplementation(() => {
        throw new Error('denied');
      });
      expect(() => conditionalAuthStorage.removeItem('sb-token')).not.toThrow();
      localSpy.mockRestore();
      sessionSpy.mockRestore();
    });
  });

  describe('mode initialization', () => {
    it('seeds the active mode from the persisted preference at module load', async () => {
      window.localStorage.setItem('araviel.auth.rememberMe', 'false');
      const { getActiveStorageMode } = await loadModule();
      expect(getActiveStorageMode()).toBe('session');
    });

    it('defaults to local mode when no preference has been persisted', async () => {
      const { getActiveStorageMode } = await loadModule();
      expect(getActiveStorageMode()).toBe('local');
    });
  });
});
