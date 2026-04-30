import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { selectAuthLoading, selectIsAuthenticated } from '../../store/slices/authSlice';
import {
  selectOnboardingEnabled,
  selectOnboardingLoading,
  selectOnboardingStatus,
} from '../../store/slices/onboardingSlice';

const ONBOARDING_PREFIX = '/onboarding/';

/**
 * Route gate that redirects authenticated users to the age-verification flow
 * until they pass it. Mounted once around the authenticated `<Outlet />`.
 *
 * The gate is intentionally conservative:
 *  - It is a no-op for guests (anonymous / unauthenticated). The underlying
 *    feature gating already lives in `GuestGate`; we don't want to redirect
 *    a guest who is browsing public surfaces.
 *  - It is a no-op when the server flag is off, so deploys without the
 *    feature enabled behave exactly as before.
 *  - It renders nothing while the initial /me fetch is in flight to avoid
 *    a flash of the app or the onboarding screen on first load.
 *  - It never redirects when the user is already on an `/onboarding/*`
 *    page; the onboarding views own their own navigation from there.
 */
export default function AgeGate({ children }) {
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authLoading = useSelector(selectAuthLoading);
  const enabled = useSelector(selectOnboardingEnabled);
  const status = useSelector(selectOnboardingStatus);
  const isLoading = useSelector(selectOnboardingLoading);

  if (location.pathname.startsWith(ONBOARDING_PREFIX)) {
    return children;
  }

  if (authLoading || !isAuthenticated) {
    return children;
  }

  if (status === 'unknown' || isLoading) {
    return null;
  }

  if (!enabled || status === 'verified') {
    return children;
  }

  if (status === 'blocked') {
    return <Navigate to="/onboarding/blocked" replace />;
  }

  return <Navigate to="/onboarding/age" replace />;
}
