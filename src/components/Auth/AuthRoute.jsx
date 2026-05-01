import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../../store/slices/authSlice';
import AuthModal from './AuthModal';

/**
 * AuthRoute — Full-page auth surface mounted at /login and /signup.
 *
 * Reuses AuthModal as the visual layer (it already renders a fixed,
 * full-viewport panel that covers the sidebar). Once the user is
 * authenticated, redirects to `location.state.from` if a caller passed
 * one when navigating here, otherwise back to '/'.
 */
export default function AuthRoute({ initialTab = 'signin' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const redirectTo = location.state?.from || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo]);

  return (
    <AuthModal isOpen onClose={() => navigate('/')} initialTab={initialTab} />
  );
}
