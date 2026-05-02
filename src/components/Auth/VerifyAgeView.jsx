import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  signUpWithEmail,
  updateBirthDate,
  selectAuthLoading,
  selectAuthError,
  selectIsAuthenticated,
  setAuthError,
} from '../../store/slices/authSlice';
import authStyles from './AuthModal.module.css';
import styles from './VerifyAgeView.module.css';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MIN_AGE = 13;
const ITEM_HEIGHT = 36;

function daysInMonth(monthIndex, year) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function calculateAge(year, monthIndex, day) {
  const today = new Date();
  let age = today.getFullYear() - year;
  const monthDelta = today.getMonth() - monthIndex;
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < day)) age -= 1;
  return age;
}

const ArrowLeftIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

/**
 * Vertical scroll-snap wheel picker. Renders a column of items where the
 * one in the middle band is the selection. Padding above and below allows
 * the first and last items to centre.
 */
function WheelPicker({ items, value, onChange, label, getLabel = (i) => String(i) }) {
  const containerRef = useRef(null);
  const programmaticRef = useRef(false);
  const scrollTimeoutRef = useRef(null);

  const valueIndex = items.indexOf(value);

  // Sync external value changes back into scroll position.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || valueIndex < 0) return;
    const target = valueIndex * ITEM_HEIGHT;
    if (Math.abs(el.scrollTop - target) > 1) {
      programmaticRef.current = true;
      el.scrollTop = target;
      // Release the programmatic guard after the smooth scroll settles.
      window.setTimeout(() => {
        programmaticRef.current = false;
      }, 200);
    }
  }, [valueIndex]);

  const handleScroll = useCallback(
    (event) => {
      if (programmaticRef.current) return;
      const { scrollTop } = event.target;
      window.clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = window.setTimeout(() => {
        const idx = Math.round(scrollTop / ITEM_HEIGHT);
        const clamped = Math.max(0, Math.min(items.length - 1, idx));
        if (items[clamped] !== value) onChange(items[clamped]);
      }, 80);
    },
    [items, value, onChange]
  );

  return (
    <div className={styles.wheel} role="listbox" aria-label={label}>
      <div className={styles.wheelHighlight} aria-hidden="true" />
      <div ref={containerRef} className={styles.wheelScroll} onScroll={handleScroll}>
        <div className={styles.wheelPad} aria-hidden="true" />
        {items.map((item, i) => (
          <div
            key={item}
            role="option"
            aria-selected={i === valueIndex}
            className={`${styles.wheelItem} ${i === valueIndex ? styles.wheelItemSelected : ''}`}
          >
            {getLabel(item)}
          </div>
        ))}
        <div className={styles.wheelPad} aria-hidden="true" />
      </div>
    </div>
  );
}

/**
 * VerifyAgeView — Mounted at /signup/verify-age. Collects the user's
 * date of birth and only completes signup when they are at least
 * MIN_AGE years old. The Supabase signUp call is intentionally deferred
 * to this step so under-age users never have an account created.
 */
export default function VerifyAgeView() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const isLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const pendingSignup = location.state?.pendingSignup;
  // Two operating modes:
  //   - "signup":  user came from /signup with credentials in transit;
  //                we'll call signUpWithEmail with the chosen DOB.
  //   - "update":  user is already authenticated (e.g. signed in via
  //                Google but has no birth_date in user_metadata); we'll
  //                call updateBirthDate to attach the chosen DOB.
  const mode = pendingSignup ? 'signup' : isAuthenticated ? 'update' : null;

  // No credentials and no session means the user landed here directly
  // (refresh, shared link, history). Bounce them back to /signup so the
  // flow stays linear.
  useEffect(() => {
    if (!mode) {
      navigate('/signup', { replace: true });
    }
  }, [mode, navigate]);

  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear() - 18);
  const [monthIndex, setMonthIndex] = useState(today.getMonth());
  const [day, setDay] = useState(today.getDate());
  const [error, setError] = useState('');

  const yearOptions = useMemo(
    () => Array.from({ length: 100 }, (_, i) => today.getFullYear() - i),
    [today]
  );
  const monthOptions = useMemo(() => MONTHS.map((_, i) => i), []);
  const dayOptions = useMemo(
    () => Array.from({ length: daysInMonth(monthIndex, year) }, (_, i) => i + 1),
    [monthIndex, year]
  );

  // Clamp day when the chosen month/year has fewer days (e.g. Feb 31 → 28/29).
  useEffect(() => {
    const max = daysInMonth(monthIndex, year);
    if (day > max) setDay(max);
  }, [monthIndex, year, day]);

  const handleBack = () => {
    if (mode === 'update') {
      navigate('/', { replace: true });
      return;
    }
    navigate('/signup', { state: { from: location.state?.from } });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    dispatch(setAuthError(null));

    const age = calculateAge(year, monthIndex, day);
    if (age < MIN_AGE) {
      setError(`Sorry, you must be at least ${MIN_AGE} years old to use Araviel.`);
      return;
    }

    const birthDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    if (mode === 'update') {
      // Already-authenticated user (typically Google OAuth where the
      // People API didn't return a complete DOB). Just persist the
      // chosen date and drop them into the app.
      const result = await dispatch(updateBirthDate({ birthDate }));
      if (result.meta.requestStatus === 'fulfilled') {
        navigate(location.state?.from || '/', { replace: true });
      }
      return;
    }

    const result = await dispatch(
      signUpWithEmail({
        email: pendingSignup.email,
        password: pendingSignup.password,
        displayName: pendingSignup.displayName,
        birthDate,
      })
    );

    if (result.meta.requestStatus === 'fulfilled') {
      // Supabase returned a session → email confirmation is disabled in
      // this project, the user is already authenticated. Drop them
      // straight into the app.
      if (result.payload?.session) {
        navigate(location.state?.from || '/', { replace: true });
        return;
      }
      // No session → email confirmation is on. Hand off to a dedicated
      // "check your email" screen so the user can't accidentally retry
      // and burn through Supabase's email rate limit.
      navigate('/signup/check-email', {
        replace: true,
        state: { email: pendingSignup.email },
      });
      return;
    }

    // Friendly retry message for the project-wide email rate limit. The
    // signUp call did NOT create a user when this fires, so it's safe to
    // try again with the same email later.
    const raw = (result.payload || '').toString().toLowerCase();
    if (raw.includes('rate limit') || raw.includes('over_email_send_rate_limit')) {
      setError(
        "We couldn't send the confirmation email right now — try again in a few minutes. " +
          "Your details haven't been submitted yet."
      );
    }
  };

  if (!mode) return null;

  const errorMessage = error || authError;

  return (
    <div className={styles.container}>
      <button type="button" className={authStyles.backBtn} onClick={handleBack}>
        <ArrowLeftIcon />
        <span>Back</span>
      </button>

      <div className={styles.panel}>
        <h1 className={styles.heading}>Verify your age</h1>
        <p className={styles.subtitle}>
          This information will not be made public and will only be used as described in our{' '}
          <a
            href="/legal/privacy"
            className={styles.privacyLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            privacy policy
          </a>
          .
        </p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <p className={styles.dobLabel}>Choose your date of birth</p>

          <div className={styles.wheels}>
            <WheelPicker
              label="Month"
              items={monthOptions}
              value={monthIndex}
              onChange={setMonthIndex}
              getLabel={(i) => MONTHS[i]}
            />
            <WheelPicker label="Day" items={dayOptions} value={day} onChange={setDay} />
            <WheelPicker label="Year" items={yearOptions} value={year} onChange={setYear} />
          </div>

          {errorMessage && <div className={authStyles.error}>{errorMessage}</div>}

          <button className={authStyles.submitBtn} type="submit" disabled={isLoading}>
            {isLoading ? <span className={authStyles.spinner} aria-hidden="true" /> : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
