import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  resendSignupEmail,
  selectAuthLoading,
  selectAuthError,
  setAuthError,
} from '../../store/slices/authSlice';
import authStyles from './AuthModal.module.css';
import styles from './CheckEmailView.module.css';

const RESEND_COOLDOWN_SECONDS = 30;

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

const MailIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <polyline points="3 7 12 13 21 7" />
  </svg>
);

/**
 * CheckEmailView — Mounted at /signup/check-email after a successful
 * signUp call that returned no session (i.e. Supabase has email
 * confirmation enabled). Tells the user to click the link in their
 * inbox and provides a rate-limited resend so they can recover from
 * a delayed or lost email without burning through Supabase's
 * project-wide email quota.
 */
export default function CheckEmailView() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const isLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);

  const email = location.state?.email;

  // No email in transit means the user landed here directly. Send them
  // back to the start of signup so the flow stays linear.
  useEffect(() => {
    if (!email) {
      navigate('/signup', { replace: true });
    }
  }, [email, navigate]);

  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [resentMessage, setResentMessage] = useState('');
  const [localError, setLocalError] = useState('');
  const tickRef = useRef(null);

  // Run the cooldown countdown. Restarted whenever the user resends.
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    tickRef.current = window.setInterval(() => {
      setCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => window.clearInterval(tickRef.current);
  }, [cooldown]);

  const handleResend = useCallback(async () => {
    if (!email || cooldown > 0 || isLoading) return;
    setLocalError('');
    setResentMessage('');
    dispatch(setAuthError(null));

    const result = await dispatch(resendSignupEmail({ email }));

    if (result.meta.requestStatus === 'fulfilled') {
      setResentMessage('Confirmation email sent. Check your inbox again.');
      setCooldown(RESEND_COOLDOWN_SECONDS);
      return;
    }

    const raw = (result.payload || '').toString().toLowerCase();
    if (raw.includes('rate limit') || raw.includes('over_email_send_rate_limit')) {
      setLocalError(
        "We've hit the email rate limit. Please wait a few minutes before trying again."
      );
      // Bump the cooldown so the button stays disabled a little longer.
      setCooldown(60);
    }
  }, [email, cooldown, isLoading, dispatch]);

  if (!email) return null;

  const errorMessage = localError || authError;
  const canResend = cooldown <= 0 && !isLoading;

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
          <MailIcon />
        </div>
        <h1 className={styles.heading}>Check your email</h1>
        <p className={styles.subtitle}>
          We sent a confirmation link to <span className={styles.email}>{email}</span>. Click the
          link to finish setting up your account.
        </p>

        <div className={styles.actions}>
          <button
            type="button"
            className={authStyles.submitBtn}
            onClick={handleResend}
            disabled={!canResend}
          >
            {isLoading ? (
              <span className={authStyles.spinner} aria-hidden="true" />
            ) : canResend ? (
              'Resend confirmation email'
            ) : (
              `Resend in ${cooldown}s`
            )}
          </button>

          {errorMessage && <div className={authStyles.error}>{errorMessage}</div>}
          {resentMessage && <div className={authStyles.success}>{resentMessage}</div>}
        </div>

        <p className={styles.footer}>
          Already confirmed?{' '}
          <Link to="/login" className={styles.footerLink}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
