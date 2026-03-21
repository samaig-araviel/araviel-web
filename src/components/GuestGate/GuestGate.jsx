import { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../../store/slices/authSlice';
import { AuthModal } from '../Auth';
import styles from './GuestGate.module.css';

/**
 * GuestGate — A beautiful inline login prompt shown to guest users
 * when they try to access features that require authentication.
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
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <>
      <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
        <div className={styles.content}>
          {icon && <div className={styles.icon}>{icon}</div>}
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.description}>{description}</p>
          <button className={styles.signInBtn} onClick={() => setAuthModalOpen(true)}>
            {actionLabel}
          </button>
          <button
            className={styles.signUpLink}
            onClick={() => setAuthModalOpen(true)}
          >
            Don&apos;t have an account? <span>Sign up for free</span>
          </button>
        </div>
      </div>
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab="signup"
      />
    </>
  );
}

/**
 * useGuestGate — Hook that returns whether the user is a guest
 * and a function to show the auth modal.
 */
export function useGuestGate() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const requireAuth = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return true; // blocked
    }
    return false; // allowed
  };

  const GateModal = () => (
    <AuthModal
      isOpen={authModalOpen}
      onClose={() => setAuthModalOpen(false)}
      initialTab="signup"
    />
  );

  return { isGuest: !isAuthenticated, requireAuth, GateModal, setAuthModalOpen };
}
