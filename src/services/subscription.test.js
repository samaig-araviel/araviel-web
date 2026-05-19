import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./authHeaders', () => ({
  getAuthHeaders: vi.fn().mockResolvedValue({
    'Content-Type': 'application/json',
    Authorization: 'Bearer test-token',
  }),
}));

import { fetchSubscription } from './subscription';

/** Build a minimal Response-shaped mock for fetch. */
function mockResponse(status, body = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  };
}

describe('subscription service', () => {
  let fetchSpy;

  beforeEach(() => {
    vi.useFakeTimers();
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('fetchSubscription', () => {
    it('returns parsed JSON on first-attempt success', async () => {
      fetchSpy.mockResolvedValue(mockResponse(200, { tier: 'pro' }));

      const result = await fetchSubscription();

      expect(result).toEqual({ tier: 'pro' });
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('retries once after a 500 and returns the second attempt', async () => {
      fetchSpy
        .mockResolvedValueOnce(mockResponse(500))
        .mockResolvedValueOnce(mockResponse(200, { tier: 'pro' }));

      const promise = fetchSubscription();
      await vi.advanceTimersByTimeAsync(500);

      await expect(promise).resolves.toEqual({ tier: 'pro' });
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('retries once after a 429', async () => {
      fetchSpy
        .mockResolvedValueOnce(mockResponse(429))
        .mockResolvedValueOnce(mockResponse(200, { tier: 'lite' }));

      const promise = fetchSubscription();
      await vi.advanceTimersByTimeAsync(500);

      await expect(promise).resolves.toEqual({ tier: 'lite' });
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('retries once after a 408', async () => {
      fetchSpy
        .mockResolvedValueOnce(mockResponse(408))
        .mockResolvedValueOnce(mockResponse(200, { tier: 'pro' }));

      const promise = fetchSubscription();
      await vi.advanceTimersByTimeAsync(500);

      await expect(promise).resolves.toEqual({ tier: 'pro' });
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('retries once after a network error', async () => {
      fetchSpy
        .mockRejectedValueOnce(new TypeError('Network error'))
        .mockResolvedValueOnce(mockResponse(200, { tier: 'pro' }));

      const promise = fetchSubscription();
      await vi.advanceTimersByTimeAsync(500);

      await expect(promise).resolves.toEqual({ tier: 'pro' });
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('does NOT retry on 401 — surfaces auth errors immediately', async () => {
      fetchSpy.mockResolvedValue(mockResponse(401));

      await expect(fetchSubscription()).rejects.toThrow(/401/);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('does NOT retry on 403', async () => {
      fetchSpy.mockResolvedValue(mockResponse(403));

      await expect(fetchSubscription()).rejects.toThrow(/403/);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('does NOT retry on 404', async () => {
      fetchSpy.mockResolvedValue(mockResponse(404));

      await expect(fetchSubscription()).rejects.toThrow(/404/);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('throws after both attempts fail with 5xx', async () => {
      fetchSpy.mockResolvedValue(mockResponse(503));

      const promise = fetchSubscription();
      // Pre-attach a noop handler so the rejection isn't reported as
      // unhandled while we advance the fake-timer delay between attempts.
      promise.catch(() => {});
      await vi.advanceTimersByTimeAsync(500);

      await expect(promise).rejects.toThrow(/503/);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('attaches status code to the thrown error', async () => {
      fetchSpy.mockResolvedValue(mockResponse(401));

      try {
        await fetchSubscription();
        throw new Error('expected fetchSubscription to throw');
      } catch (err) {
        expect(err.status).toBe(401);
      }
    });
  });
});
