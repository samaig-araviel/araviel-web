import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectTextCredits, selectImageCredits } from '../store/slices/subscriptionSlice';
import { useToast } from '../components/Toast/Toast';
import { readLocalSettings } from '../lib/localSettings';

/**
 * Storage key for the per-cycle record of thresholds we've already alerted on.
 * The record is a map of `${bucket}:${cycleKey}` → `number[]` so a warning
 * fires at most once per (bucket, cycle, threshold) triple.
 */
const NOTIFIED_STORAGE_KEY = 'araviel-usage-notified';
const FALLBACK_THRESHOLDS = Object.freeze([20, 10, 5]);
/** Below this threshold we escalate from warning to error styling. */
const CRITICAL_PCT_CUTOFF = 5;

function readNotifiedRecord() {
  try {
    const raw = localStorage.getItem(NOTIFIED_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeNotifiedRecord(value) {
  try {
    localStorage.setItem(NOTIFIED_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Storage can throw in private-browsing / over-quota scenarios — the
    // worst case is a duplicate warning, which is acceptable.
  }
}

/**
 * Pick the highest threshold the user has crossed that we have not yet
 * alerted them to for the current billing cycle.
 *
 * Thresholds are expressed as the *remaining* percentage — e.g. a value of 20
 * means "warn when 20% of credits are left". We walk from largest to smallest
 * so the user sees the 50% nudge before the 10% nudge when they cross both at
 * once.
 *
 * @param {number} remainingPct - current remaining %, 0..100.
 * @param {readonly number[]} thresholds - user-configured tripwires.
 * @param {readonly number[]} alreadyFired - thresholds already notified this cycle.
 * @returns {number | null} threshold that should fire, or null.
 */
function pickThresholdToFire(remainingPct, thresholds, alreadyFired) {
  if (!Array.isArray(thresholds) || thresholds.length === 0) return null;
  const fired = new Set(alreadyFired);
  const sorted = [...thresholds].sort((a, b) => b - a);
  for (const threshold of sorted) {
    if (remainingPct <= threshold && !fired.has(threshold)) return threshold;
  }
  return null;
}

function buildWarningMessage(bucketLabel, remainingPct, isCritical) {
  if (isCritical) {
    return `Only ${remainingPct}% of your ${bucketLabel} credits are left.`;
  }
  return `Heads up — ${remainingPct}% of your ${bucketLabel} credits remain.`;
}

/**
 * Evaluate a single credit bucket (text or image) against the user's
 * thresholds and fire a toast if a new tripwire was crossed. Mutates
 * `notifiedRecord` in place so the caller can persist the final map once.
 *
 * @returns {boolean} true if a notification was fired.
 */
function evaluateBucket({ bucketLabel, cycleKey, usedPct, thresholds, notifiedRecord, toast }) {
  const remainingPct = Math.max(0, Math.min(100, 100 - usedPct));
  const recordKey = `${bucketLabel}:${cycleKey}`;
  const alreadyFired = notifiedRecord[recordKey] ?? [];
  const threshold = pickThresholdToFire(remainingPct, thresholds, alreadyFired);
  if (threshold == null) return false;

  const isCritical = threshold <= CRITICAL_PCT_CUTOFF;
  const toastFn = isCritical ? toast.showError : toast.showWarning;
  toastFn(buildWarningMessage(bucketLabel, remainingPct, isCritical), { duration: 7000 });

  notifiedRecord[recordKey] = [...alreadyFired, threshold];
  return true;
}

/**
 * Watch the authenticated user's credit balances and surface a toast when a
 * configured usage-warning threshold is crossed.
 *
 * Behaviour:
 *   - Disabled when `notifyUsageLimits === false`.
 *   - Thresholds are "remaining %" tripwires, e.g. [50, 20, 10].
 *   - Each (bucket, cycle, threshold) fires at most once; re-arms on a new
 *     cycle via a storage record keyed by the cycle's reset date.
 *   - The initial render after mount is skipped so page refreshes don't
 *     replay warnings the user has already seen.
 */
export default function useUsageLimitWarnings() {
  const textCredits = useSelector(selectTextCredits);
  const imageCredits = useSelector(selectImageCredits);
  const toast = useToast();
  const hasMountedRef = useRef(false);

  useEffect(() => {
    // Don't fire on the initial render. The first effect run reflects the
    // default Redux state (often zeros) rather than the user's true balance,
    // and a page reload should never re-alert for a warning already shown.
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    const settings = readLocalSettings();
    if (settings.notifyUsageLimits === false) return;

    const thresholds = Array.isArray(settings.usageLimitThresholds)
      ? settings.usageLimitThresholds
      : FALLBACK_THRESHOLDS;
    if (thresholds.length === 0) return;

    const notifiedRecord = readNotifiedRecord();
    let anyFired = false;

    // ── Text credits ──
    const textLimit = textCredits?.monthlyLimit ?? 0;
    const textUsed = textCredits?.monthlyUsed ?? 0;
    if (textLimit > 0) {
      const now = new Date();
      const cycleKey = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}`;
      anyFired =
        evaluateBucket({
          bucketLabel: 'monthly text',
          cycleKey,
          usedPct: Math.round((textUsed / textLimit) * 100),
          thresholds,
          notifiedRecord,
          toast,
        }) || anyFired;
    }

    // ── Image credits ──
    const imgLimit = imageCredits?.limit ?? 0;
    const imgRemaining = imageCredits?.remaining ?? 0;
    if (imgLimit > 0) {
      const cycleKey = imageCredits?.cycleResetsAt ?? 'unknown-cycle';
      anyFired =
        evaluateBucket({
          bucketLabel: 'monthly image',
          cycleKey,
          usedPct: Math.round(((imgLimit - imgRemaining) / imgLimit) * 100),
          thresholds,
          notifiedRecord,
          toast,
        }) || anyFired;
    }

    if (anyFired) writeNotifiedRecord(notifiedRecord);
  }, [
    textCredits?.monthlyLimit,
    textCredits?.monthlyUsed,
    imageCredits?.limit,
    imageCredits?.remaining,
    imageCredits?.cycleResetsAt,
    toast,
  ]);
}
