import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  clearPendingEmailVerification,
  resendConfirmationEmail,
  selectIsAuthenticated,
  selectPendingEmailVerification,
} from '../../store/slices/authSlice';
import styles from './PendingEmailBanner.module.css';

const RESEND_COOLDOWN_SECONDS = 30;

/**
 * Thin top banner shown while a user has signed up but has not yet
 * clicked the confirmation link in their email.
 *
 * Mounted globally inside <App />. Only renders when:
 *  - `pendingEmailVerification` is set in Redux (signup just happened
 *    and Supabase did NOT issue a session — the standard flow), and
 *  - the user is not yet authenticated (a real sign-in clears the flag
 *    via the auth listener anyway, but we double-check here to avoid
 *    flicker).
 *
 * Dismissing the banner clears `pendingEmailVerification` permanently
 * for this session — the user is telling us they don't want the prompt
 * anymore. They can still confirm via the email link itself, which is
 * what actually authenticates them.
 */
export default function PendingEmailBanner() {
  const dispatch = useDispatch();
  const pending = useSelector(selectPendingEmailVerification);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [feedback, setFeedback] = useState('');

  const handleResend = useCallback(async () => {
    if (!pending?.email || resendCooldown > 0) return;
    setFeedback('');
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    const tickInterval = setInterval(() => {
      setResendCooldown((value) => {
        if (value <= 1) {
          clearInterval(tickInterval);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    const result = await dispatch(resendConfirmationEmail({ email: pending.email }));
    if (result.meta.requestStatus === 'fulfilled') {
      setFeedback('Sent. Check your inbox.');
    } else {
      setFeedback("Couldn't resend. Please try again.");
    }
  }, [dispatch, pending?.email, resendCooldown]);

  const handleDismiss = useCallback(() => {
    dispatch(clearPendingEmailVerification());
  }, [dispatch]);

  if (!pending?.email || isAuthenticated) return null;

  return (
    <div className={styles.banner} role="status" aria-live="polite">
      <span className={styles.message}>
        Verify <strong className={styles.email}>{pending.email}</strong> to activate your account.
      </span>
      <span className={styles.actions}>
        {feedback && <span className={styles.feedback}>{feedback}</span>}
        <button
          type="button"
          className={styles.actionBtn}
          onClick={handleResend}
          disabled={resendCooldown > 0}
        >
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend email'}
        </button>
        <button
          type="button"
          className={styles.dismissBtn}
          onClick={handleDismiss}
          aria-label="Dismiss"
        >
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
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </span>
    </div>
  );
}
