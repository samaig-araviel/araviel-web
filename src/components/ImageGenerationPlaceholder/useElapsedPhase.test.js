import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useElapsedPhase, { PHASES } from './useElapsedPhase';

describe('useElapsedPhase', () => {
  let nowMs;

  beforeEach(() => {
    nowMs = 1_000_000;
    vi.useFakeTimers();
    vi.setSystemTime(nowMs);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts at phase 0 with the first label', () => {
    const { result } = renderHook(() => useElapsedPhase(nowMs));
    expect(result.current.phaseIndex).toBe(0);
    expect(result.current.label).toBe(PHASES[0].label);
  });

  it('advances through phases as time passes', () => {
    const { result } = renderHook(() => useElapsedPhase(nowMs));

    act(() => {
      vi.advanceTimersByTime(PHASES[1].atMs - 1);
    });
    expect(result.current.phaseIndex).toBe(0);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.phaseIndex).toBe(1);

    act(() => {
      vi.advanceTimersByTime(PHASES[2].atMs - PHASES[1].atMs);
    });
    expect(result.current.phaseIndex).toBe(2);

    act(() => {
      vi.advanceTimersByTime(PHASES[3].atMs - PHASES[2].atMs);
    });
    expect(result.current.phaseIndex).toBe(3);

    act(() => {
      vi.advanceTimersByTime(PHASES[4].atMs - PHASES[3].atMs);
    });
    expect(result.current.phaseIndex).toBe(4);
  });

  it('snaps to the correct phase when mounted after a delay', () => {
    const startedAt = nowMs - PHASES[2].atMs - 100;
    const { result } = renderHook(() => useElapsedPhase(startedAt));
    expect(result.current.phaseIndex).toBe(2);
    expect(result.current.label).toBe(PHASES[2].label);
  });

  it('stays at the final phase forever after the last boundary', () => {
    const startedAt = nowMs - PHASES[4].atMs - 60_000;
    const { result } = renderHook(() => useElapsedPhase(startedAt));
    expect(result.current.phaseIndex).toBe(PHASES.length - 1);

    act(() => {
      vi.advanceTimersByTime(120_000);
    });
    expect(result.current.phaseIndex).toBe(PHASES.length - 1);
  });

  it('returns phase 0 when startedAt is not provided', () => {
    const { result } = renderHook(() => useElapsedPhase(undefined));
    expect(result.current.phaseIndex).toBe(0);
    expect(result.current.label).toBe(PHASES[0].label);
  });

  it('cleans up pending timeouts on unmount', () => {
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout');
    const { unmount } = renderHook(() => useElapsedPhase(nowMs));
    unmount();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  it('reschedules timeouts when startedAt changes', () => {
    const { result, rerender } = renderHook(({ startedAt }) => useElapsedPhase(startedAt), {
      initialProps: { startedAt: nowMs },
    });

    expect(result.current.phaseIndex).toBe(0);

    rerender({ startedAt: nowMs - PHASES[3].atMs });
    expect(result.current.phaseIndex).toBe(3);
  });
});
