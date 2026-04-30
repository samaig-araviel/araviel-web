import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  clearOnboardingError,
  selectOnboardingEnabled,
  selectOnboardingError,
  selectOnboardingLoading,
  selectOnboardingMinimumAge,
  selectOnboardingStatus,
  submitDateOfBirth,
} from '../../store/slices/onboardingSlice';
import { selectIsAuthenticated } from '../../store/slices/authSlice';
import styles from './Onboarding.module.css';

const MAX_AGE_YEARS = 120;

function clampNumeric(value, max) {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const n = parseInt(digits, 10);
  if (Number.isNaN(n)) return '';
  if (max !== undefined && n > max) return digits.slice(0, -1);
  return digits;
}

function isValidPastDate(month, day, year) {
  const m = parseInt(month, 10);
  const d = parseInt(day, 10);
  const y = parseInt(year, 10);
  if (!Number.isFinite(m) || !Number.isFinite(d) || !Number.isFinite(y)) return false;
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;
  const today = new Date();
  if (y < today.getFullYear() - MAX_AGE_YEARS) return false;
  if (y > today.getFullYear()) return false;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return false;
  }
  // Disallow future dates.
  const todayUtc = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );
  return date.getTime() <= todayUtc.getTime();
}

function pad2(value) {
  return value.length === 1 ? `0${value}` : value;
}

/**
 * Single-screen DOB entry. Three numeric inputs (Month/Day/Year) with
 * auto-advancing focus, submit disabled until the date parses to a real
 * past calendar date. On submit:
 *   - status 'verified' → navigate home
 *   - status 'blocked'  → navigate to /onboarding/blocked
 *   - 409 (already set) → fall back to fetched status; the gate redirects
 */
export default function AgeEntryView() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isLoading = useSelector(selectOnboardingLoading);
  const error = useSelector(selectOnboardingError);
  const status = useSelector(selectOnboardingStatus);
  const enabled = useSelector(selectOnboardingEnabled);
  const minimumAge = useSelector(selectOnboardingMinimumAge);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [year, setYear] = useState('');

  const monthRef = useRef(null);
  const dayRef = useRef(null);
  const yearRef = useRef(null);

  // If the user lands here with a status that should bypass the screen,
  // bounce them out. Keeps deep-linking idempotent.
  useEffect(() => {
    if (!isAuthenticated) return;
    if (!enabled || status === 'verified') {
      navigate('/', { replace: true });
    } else if (status === 'blocked') {
      navigate('/onboarding/blocked', { replace: true });
    }
  }, [enabled, status, isAuthenticated, navigate]);

  useEffect(() => {
    monthRef.current?.focus();
  }, []);

  const isFormValid = useMemo(() => isValidPastDate(month, day, year), [month, day, year]);

  const handleMonthChange = useCallback(
    (event) => {
      const next = clampNumeric(event.target.value, 12);
      setMonth(next);
      if (error) dispatch(clearOnboardingError());
      if (next.length === 2) dayRef.current?.focus();
    },
    [dispatch, error]
  );

  const handleDayChange = useCallback(
    (event) => {
      const next = clampNumeric(event.target.value, 31);
      setDay(next);
      if (error) dispatch(clearOnboardingError());
      if (next.length === 2) yearRef.current?.focus();
    },
    [dispatch, error]
  );

  const handleYearChange = useCallback(
    (event) => {
      const next = clampNumeric(event.target.value).slice(0, 4);
      setYear(next);
      if (error) dispatch(clearOnboardingError());
    },
    [dispatch, error]
  );

  const handleKeyDown = useCallback((event, fieldRef, value) => {
    if (event.key === 'Backspace' && value.length === 0 && fieldRef?.current) {
      fieldRef.current.focus();
    }
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!isFormValid || isLoading) return;
      const dateOfBirth = `${year}-${pad2(month)}-${pad2(day)}`;
      const result = await dispatch(submitDateOfBirth({ dateOfBirth }));
      if (result.meta.requestStatus !== 'fulfilled') return;
      const next = result.payload?.status;
      if (next === 'verified') {
        navigate('/', { replace: true });
      } else if (next === 'blocked') {
        navigate('/onboarding/blocked', { replace: true });
      }
    },
    [dispatch, navigate, isFormValid, isLoading, month, day, year]
  );

  return (
    <div className={styles.root} role="dialog" aria-modal="true" aria-labelledby="ageHeading">
      <div className={styles.panel}>
        <div className={styles.logoMark} aria-hidden="true">
          A
        </div>
        <h1 id="ageHeading" className={styles.heading}>
          How old are you?
        </h1>
        <p className={styles.subtitle}>
          Araveil is for people {minimumAge} and older. Enter your date of birth to continue.
        </p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.dobRow} role="group" aria-labelledby="dobLabel">
            <span id="dobLabel" className={styles.dobLegend}>
              Date of birth
            </span>
            <div className={styles.dobFields}>
              <input
                ref={monthRef}
                className={`${styles.dobInput} ${styles.dobInputShort}`}
                value={month}
                onChange={handleMonthChange}
                onKeyDown={(e) => handleKeyDown(e, null, month)}
                inputMode="numeric"
                autoComplete="bday-month"
                placeholder="MM"
                aria-label="Month"
                maxLength={2}
              />
              <span className={styles.dobSep} aria-hidden="true">
                /
              </span>
              <input
                ref={dayRef}
                className={`${styles.dobInput} ${styles.dobInputShort}`}
                value={day}
                onChange={handleDayChange}
                onKeyDown={(e) => handleKeyDown(e, monthRef, day)}
                inputMode="numeric"
                autoComplete="bday-day"
                placeholder="DD"
                aria-label="Day"
                maxLength={2}
              />
              <span className={styles.dobSep} aria-hidden="true">
                /
              </span>
              <input
                ref={yearRef}
                className={`${styles.dobInput} ${styles.dobInputLong}`}
                value={year}
                onChange={handleYearChange}
                onKeyDown={(e) => handleKeyDown(e, dayRef, year)}
                inputMode="numeric"
                autoComplete="bday-year"
                placeholder="YYYY"
                aria-label="Year"
                maxLength={4}
              />
            </div>
          </div>

          {error ? <div className={styles.error}>{error}</div> : null}

          <button type="submit" className={styles.submitBtn} disabled={!isFormValid || isLoading}>
            {isLoading ? <span className={styles.spinner} aria-hidden="true" /> : 'Continue'}
          </button>
          <p className={styles.legalNote}>
            By continuing, you confirm this is accurate. We use your date of birth to verify your
            age and personalize your experience.
          </p>
        </form>
      </div>
    </div>
  );
}
