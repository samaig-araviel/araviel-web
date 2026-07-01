import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  updatePassword,
  selectAuthLoading,
  selectAuthError,
  selectIsAuthenticated,
  setAuthError,
} from '../../store/slices/authSlice';
import {
  PASSWORD_MIN_LENGTH,
  getPasswordRuleViolations,
  formatPasswordError,
} from '../../utils/password';
import authStyles from './AuthModal.module.css';
import styles from './CheckEmailView.module.css';

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

const LockIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

/**
 * ResetPasswordView — Mounted at /reset-password. Lands here from the
 * password-reset email link, at which point Supabase has hydrated a
 * recovery session into the client. The user picks a new password and
 * we call updateUser({ password }) to persist it.
 *
 * If the user arrives without an active session (recovery link expired,
 * direct visit, etc.) we send them back to /login so they can request a
 * fresh email instead of being stuck on a form that can't possibly
 * succeed.
 */
export default function ResetPasswordView() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Give Supabase a brief moment to parse the recovery tokens out of
  // the URL hash and fire the PASSWORD_RECOVERY auth event before we
  // decide whether the user is "authenticated" enough to be here.
  const [checkedSession, setCheckedSession] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setCheckedSession(true), 400);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!checkedSession) return;
    if (!isAuthenticated) {
      navigate('/login', {
        replace: true,
        state: {
          passwordError:
            'Your password reset link has expired or is no longer valid. Please request a new one.',
        },
      });
    }
  }, [checkedSession, isAuthenticated, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError('');
    setSuccessMessage('');
    dispatch(setAuthError(null));

    const violations = getPasswordRuleViolations(password);
    if (violations.length > 0) {
      setLocalError(formatPasswordError(violations));
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("Passwords don't match — re-enter to confirm.");
      return;
    }

    const result = await dispatch(updatePassword({ password }));
    if (result.meta.requestStatus === 'fulfilled') {
      setSuccessMessage('Password updated. Taking you to the app…');
      window.setTimeout(() => navigate('/', { replace: true }), 900);
    }
  };

  if (!checkedSession) return null;
  if (!isAuthenticated) return null;

  const errorMessage = localError || authError;

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={authStyles.backBtn}
        onClick={() => navigate('/login', { replace: true })}
      >
        <ArrowLeftIcon />
        <span>Back to sign in</span>
      </button>

      <div className={styles.panel}>
        <div className={styles.iconWrap} aria-hidden="true">
          <LockIcon />
        </div>
        <h1 className={styles.heading}>Set a new password</h1>
        <p className={styles.subtitle}>
          Choose a new password for your account. You'll be signed in straight after.
        </p>

        <form className={authStyles.form} onSubmit={handleSubmit} noValidate>
          <div className={authStyles.fieldGroup}>
            <label className={authStyles.label} htmlFor="reset-password">
              New password
            </label>
            <input
              id="reset-password"
              type="password"
              className={authStyles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={`At least ${PASSWORD_MIN_LENGTH} characters`}
              autoComplete="new-password"
              minLength={PASSWORD_MIN_LENGTH}
              required
              disabled={isLoading}
            />
          </div>

          <div className={authStyles.fieldGroup}>
            <label className={authStyles.label} htmlFor="reset-password-confirm">
              Confirm new password
            </label>
            <input
              id="reset-password-confirm"
              type="password"
              className={authStyles.input}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your new password"
              autoComplete="new-password"
              minLength={PASSWORD_MIN_LENGTH}
              required
              disabled={isLoading}
            />
          </div>

          {errorMessage && <div className={authStyles.error}>{errorMessage}</div>}
          {successMessage && <div className={authStyles.success}>{successMessage}</div>}

          <button className={authStyles.submitBtn} type="submit" disabled={isLoading}>
            {isLoading ? <span className={authStyles.spinner} aria-hidden="true" /> : 'Update password'}
          </button>
        </form>

        <p className={styles.footer}>
          Remembered it after all?{' '}
          <Link to="/login" className={styles.footerLink}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
