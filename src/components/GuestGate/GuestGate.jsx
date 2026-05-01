import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { selectIsAuthenticated } from '../../store/slices/authSlice';
import styles from './GuestGate.module.css';

/**
 * GuestGate — Inline sign-in prompt shown to guest users on routes that
 * require authentication. Sends visitors to the dedicated /signup or
 * /login route, preserving the current path as `location.state.from`
 * so they are redirected back after authenticating.
 *
 * Props:
 * - icon: ReactNode — Icon component to display
 * - title: string — Main heading
 * - description: string — Supporting text
 * - actionLabel: string — Button label (default: "Sign in to continue")
 * - compact: boolean — Use a smaller layout (default: false)
 */
export default function GuestGate({
  icon,
  title = 'Sign in to continue',
  description = 'Create a free account to unlock this feature.',
  actionLabel = 'Sign in to continue',
  compact = false,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const goToLogin = useCallback(() => {
    navigate('/login', { state: { from: location.pathname + location.search } });
  }, [navigate, location.pathname, location.search]);

  const goToSignup = useCallback(() => {
    navigate('/signup', { state: { from: location.pathname + location.search } });
  }, [navigate, location.pathname, location.search]);

  return (
    <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
      <div className={styles.content}>
        {icon && <div className={styles.icon}>{icon}</div>}
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>
        <button className={styles.signInBtn} onClick={goToLogin}>
          {actionLabel}
        </button>
        <button className={styles.signUpLink} onClick={goToSignup}>
          Don&apos;t have an account? <span>Sign up for free</span>
        </button>
      </div>
    </div>
  );
}

/**
 * useGuestGate — Hook that returns whether the user is a guest and a
 * `requireAuth` function that navigates to /signup (preserving the
 * current path as `state.from`) when called for a non-authenticated
 * user. `GateModal` is a no-op kept for back-compat with existing
 * callers; safe to drop once all sites have migrated.
 */
export function useGuestGate() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const navigate = useNavigate();
  const location = useLocation();

  const requireAuth = useCallback(() => {
    if (!isAuthenticated) {
      navigate('/signup', { state: { from: location.pathname + location.search } });
      return true; // blocked
    }
    return false; // allowed
  }, [isAuthenticated, navigate, location.pathname, location.search]);

  const GateModal = () => null;

  return { isGuest: !isAuthenticated, requireAuth, GateModal };
}
