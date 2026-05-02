import { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  signInWithGoogle,
  signInWithEmail,
  resetPassword,
  selectAuthLoading,
  selectAuthError,
  setAuthError,
} from '../../store/slices/authSlice';
import { getRememberMePreference, setRememberMePreference } from '../../lib/authStorage';
import styles from './AuthModal.module.css';

const GoogleIcon = () => (
  <svg className={styles.googleIcon} viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

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

const EyeIcon = ({ open }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {open ? (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    ) : (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    )}
  </svg>
);

/**
 * AuthModal — Full-page, glassy auth surface used everywhere a guest
 * needs to sign in or sign up. Single uniform presentation across the
 * app: chat input limits, side-nav Sign up, project/settings/etc.
 * gates, session expiry.
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - initialTab: 'signin' | 'signup' (default 'signin')
 */
export default function AuthModal({ isOpen, onClose, initialTab = 'signin' }) {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const isLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);

  const [activeTab, setActiveTab] = useState(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [rememberMe, setRememberMe] = useState(() => getRememberMePreference());

  useEffect(() => {
    setRememberMePreference(rememberMe);
  }, [rememberMe]);

  const clearState = useCallback(() => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setShowPassword(false);
    setLocalError('');
    setSuccessMessage('');
    dispatch(setAuthError(null));
  }, [dispatch]);

  const handleClose = useCallback(() => {
    clearState();
    setShowForgotPassword(false);
    setActiveTab(initialTab);
    onClose();
  }, [clearState, initialTab, onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;
    setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  // Surface any age-rejection message — either handed in via
  // navigate() (App.jsx age gate) or stashed in sessionStorage by
  // useAuthListener before a hard redirect (Google under-13 path).
  useEffect(() => {
    if (!isOpen) return;
    const rejection = location.state?.ageRejection;
    if (rejection) {
      setLocalError(rejection);
      return;
    }
    if (typeof window === 'undefined') return;
    try {
      const stashed = sessionStorage.getItem('araviel-age-rejection');
      if (stashed) {
        setLocalError(stashed);
        sessionStorage.removeItem('araviel-age-rejection');
      }
    } catch {
      // sessionStorage unavailable → nothing to surface.
    }
  }, [isOpen, location.state]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, handleClose]);

  const handleGoogleSignIn = () => {
    setLocalError('');
    dispatch(setAuthError(null));
    dispatch(signInWithGoogle());
  };

  const handleEmailSubmit = async (event) => {
    event.preventDefault();
    setLocalError('');
    setSuccessMessage('');
    dispatch(setAuthError(null));

    if (!email.trim()) {
      setLocalError('Please enter your email address.');
      return;
    }

    if (showForgotPassword) {
      const result = await dispatch(resetPassword({ email: email.trim() }));
      if (result.meta.requestStatus === 'fulfilled') {
        setSuccessMessage('Password reset email sent. Check your inbox.');
      }
      return;
    }

    if (!password) {
      setLocalError('Please enter your password.');
      return;
    }

    if (activeTab === 'signup' && password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    if (activeTab === 'signin') {
      const result = await dispatch(signInWithEmail({ email: email.trim(), password, rememberMe }));
      if (result.meta.requestStatus === 'fulfilled') {
        handleClose();
      }
      return;
    }

    // Defer the actual Supabase signup until after age verification so
    // under-13 users never have an account created. Hand the credentials
    // to /signup/verify-age via location.state — they live in memory only.
    navigate('/signup/verify-age', {
      state: {
        pendingSignup: {
          email: email.trim(),
          password,
          displayName: displayName.trim() || undefined,
        },
        from: location.state?.from,
      },
    });
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    setLocalError('');
    setSuccessMessage('');
    setPassword('');
  };

  const handleBackFromForgot = () => {
    setShowForgotPassword(false);
    setLocalError('');
    setSuccessMessage('');
  };

  if (!isOpen) return null;

  const errorMessage = localError || authError;
  const isSignUp = activeTab === 'signup';

  let heading;
  let subtitle;
  if (showForgotPassword) {
    heading = 'Reset your password';
    subtitle = "Enter your email and we'll send you a reset link.";
  } else if (isSignUp) {
    heading = 'Create your account';
    subtitle = 'Get started with Araviel for free.';
  } else {
    heading = 'Welcome back';
    subtitle = 'Sign in to access all your conversations and settings.';
  }

  let submitLabel;
  if (showForgotPassword) submitLabel = 'Send reset link';
  else if (isSignUp) submitLabel = 'Create account';
  else submitLabel = 'Sign in';

  const handleBackBtn = showForgotPassword ? handleBackFromForgot : handleClose;
  const backLabel = showForgotPassword ? 'Back to sign in' : 'Back';

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={heading}
      onClick={handleClose}
    >
      <button
        type="button"
        className={styles.backBtn}
        onClick={(e) => {
          e.stopPropagation();
          handleBackBtn();
        }}
      >
        <ArrowLeftIcon />
        <span>{backLabel}</span>
      </button>

      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.logoMark} aria-hidden="true">
          A
        </div>
        <h1 className={styles.heading}>{heading}</h1>
        <p className={styles.subtitle}>{subtitle}</p>

        {!showForgotPassword && (
          <>
            <button
              type="button"
              className={styles.googleBtn}
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <GoogleIcon />
              <span>Continue with Google</span>
            </button>

            <div className={styles.divider}>
              <span className={styles.dividerLine} />
              <span className={styles.dividerText}>or</span>
              <span className={styles.dividerLine} />
            </div>
          </>
        )}

        <form className={styles.form} onSubmit={handleEmailSubmit} noValidate>
          {!showForgotPassword && isSignUp && (
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="auth-name">
                Name
              </label>
              <input
                id="auth-name"
                className={styles.input}
                type="text"
                placeholder="Your name (optional)"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="name"
              />
            </div>
          )}

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="auth-email">
              Email
            </label>
            <input
              id="auth-email"
              className={styles.input}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          {!showForgotPassword && (
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="auth-password">
                Password
              </label>
              <div className={styles.passwordWrapper}>
                <input
                  id="auth-password"
                  className={styles.input}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={isSignUp ? 'Min. 6 characters' : 'Your password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              {!isSignUp && (
                <div className={styles.credentialsRow}>
                  <label className={styles.rememberMe}>
                    <input
                      type="checkbox"
                      className={styles.rememberMeInput}
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span className={styles.rememberMeBox} aria-hidden="true">
                      <svg
                        className={styles.rememberMeCheck}
                        viewBox="0 0 16 16"
                        width="10"
                        height="10"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 8.5 6.5 12 13 4.5" />
                      </svg>
                    </span>
                    <span className={styles.rememberMeLabel}>Remember me</span>
                  </label>
                  <button
                    type="button"
                    className={styles.forgotLinkBtn}
                    onClick={handleForgotPassword}
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>
          )}

          {errorMessage && <div className={styles.error}>{errorMessage}</div>}
          {successMessage && <div className={styles.success}>{successMessage}</div>}

          <button className={styles.submitBtn} type="submit" disabled={isLoading}>
            {isLoading ? <span className={styles.spinner} aria-hidden="true" /> : submitLabel}
          </button>
        </form>

        {!showForgotPassword && (
          <p className={styles.footer}>
            {isSignUp ? (
              <>
                Already have an account?{' '}
                <Link
                  to="/login"
                  state={location.state}
                  className={styles.footerLink}
                >
                  Sign in
                </Link>
              </>
            ) : (
              <>
                New to Araviel?{' '}
                <Link
                  to="/signup"
                  state={location.state}
                  className={styles.footerLink}
                >
                  Create an account
                </Link>
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
