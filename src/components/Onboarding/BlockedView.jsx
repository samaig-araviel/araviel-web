import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { signOut } from '../../store/slices/authSlice';
import {
  selectOnboardingEnabled,
  selectOnboardingMinimumAge,
  selectOnboardingStatus,
} from '../../store/slices/onboardingSlice';
import styles from './Onboarding.module.css';

/**
 * Calm, non-punitive screen shown to users whose stored DOB makes them
 * younger than the configured minimum. Signs the Supabase session out on
 * mount so the user is fully signed out — no retry, no edit-date affordance.
 *
 * Because verification is derived live from the stored DOB, a user who
 * lands here today but returns once they've aged past the threshold will
 * progress straight into the app on their next sign-in. No DB cleanup or
 * "unblock" path is needed.
 */
export default function BlockedView() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const status = useSelector(selectOnboardingStatus);
  const enabled = useSelector(selectOnboardingEnabled);
  const minimumAge = useSelector(selectOnboardingMinimumAge);
  const signOutFiredRef = useRef(false);

  // Sign the user out on first mount. Guard against double-firing in
  // React 18 strict mode by latching with a ref.
  useEffect(() => {
    if (signOutFiredRef.current) return;
    signOutFiredRef.current = true;
    dispatch(signOut());
  }, [dispatch]);

  // If the gate sends someone here who shouldn't be (e.g. status flipped
  // to verified after a clock skew), bounce them home.
  useEffect(() => {
    if (!enabled || status === 'verified') {
      navigate('/', { replace: true });
    }
  }, [enabled, status, navigate]);

  return (
    <div className={styles.root} role="dialog" aria-modal="true" aria-labelledby="blockedHeading">
      <div className={styles.panel}>
        <div className={styles.logoMark} aria-hidden="true">
          A
        </div>
        <h1 id="blockedHeading" className={styles.heading}>
          Araveil isn’t available to you yet.
        </h1>
        <p className={styles.subtitle}>
          Araveil is for people {minimumAge} and older. We’ll be here when the time comes.
        </p>
      </div>
    </div>
  );
}
