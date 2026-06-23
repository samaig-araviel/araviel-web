import { useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectIsAuthenticated } from '../../store/slices/authSlice';
import useScrollRestoration from '../../hooks/useScrollRestoration';
import GuestGate from '../GuestGate/GuestGate';
import SubscriptionSummary from './SubscriptionSummary';
import styles from './SubscriptionView.module.css';

/**
 * Standalone "/subscription" page — a thin wrapper around SubscriptionSummary
 * providing the full-page chrome (header, back button, hero). The same
 * summary is embedded in `/settings/subscription` so users can access it
 * from either the profile dropdown or the Settings nav.
 */
export default function SubscriptionView() {
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const pageRef = useRef(null);
  useScrollRestoration(pageRef);

  if (!isAuthenticated) {
    return (
      <div ref={pageRef} className={styles.container}>
        <div className={styles.inner}>
          <GuestGate
            title="View your subscription"
            description="Sign in to manage your plan, track usage, and view billing details."
            actionLabel="Sign in to continue"
          />
        </div>
      </div>
    );
  }

  return (
    <div ref={pageRef} className={styles.container}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <button
            className={styles.backBtn}
            onClick={() => navigate('/')}
            aria-label="Back to chat"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
        </div>

        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>My Subscription</h1>
          <p className={styles.heroSubtitle}>
            Manage your plan, monitor credit usage, and access billing.
          </p>
        </div>

        <SubscriptionSummary />
      </div>
    </div>
  );
}
