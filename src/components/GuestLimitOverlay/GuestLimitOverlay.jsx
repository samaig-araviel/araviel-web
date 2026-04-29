import { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  selectAuthLoading,
  selectAuthError,
  setAuthError,
} from '../../store/slices/authSlice';
import styles from './GuestLimitOverlay.module.css';

const GoogleIcon = () => (
  <svg className={styles.googleIcon} viewBox="0 0 24 24">
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
 * GuestLimitOverlay — Full-screen, glassy sign-up surface shown when an
 * unauthenticated visitor needs to authenticate to keep using Araviel.
 *
 * Replaces the inline "free prompts remaining" banner with a focused,
 * page-level moment that mirrors the elegance of the rest of the product.
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void  — dismiss back to the previous screen
 */
export default function GuestLimitOverlay({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const isLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);

  const [mode, setMode] = useState('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const clearState = useCallback(() => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setLocalError('');
    setSuccessMessage('');
    setShowPassword(false);
    dispatch(setAuthError(null));
  }, [dispatch]);

  const handleClose = useCallback(() => {
    clearState();
    setMode('signup');
    onClose();
  }, [clearState, onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, handleClose]);

  const handleModeSwitch = (next) => {
    setMode(next);
    clearState();
  };

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
    if (!password) {
      setLocalError('Please enter your password.');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    if (mode === 'signin') {
      const result = await dispatch(
        signInWithEmail({ email: email.trim(), password, rememberMe: true })
      );
      if (result.meta.requestStatus === 'fulfilled') {
        handleClose();
      }
      return;
    }

    const result = await dispatch(
      signUpWithEmail({
        email: email.trim(),
        password,
        displayName: displayName.trim() || undefined,
      })
    );
    if (result.meta.requestStatus === 'fulfilled') {
      setSuccessMessage('Account created. Check your email to confirm.');
    }
  };

  if (!isOpen) return null;

  const errorMessage = localError || authError;
  const isSignUp = mode === 'signup';
  const heading = isSignUp ? 'Continue with a free account' : 'Welcome back';
  const subtitle = isSignUp
    ? 'Sign up to keep chatting and unlock the full Araviel experience.'
    : 'Sign in to pick up where you left off.';

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={heading}
      onClick={handleClose}
    >
      <button type="button" className={styles.backBtn} onClick={handleClose}>
        <ArrowLeftIcon />
        <span>Back</span>
      </button>

      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.logoMark} aria-hidden="true">
          A
        </div>
        <h1 className={styles.heading}>{heading}</h1>
        <p className={styles.subtitle}>{subtitle}</p>

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

        <form className={styles.form} onSubmit={handleEmailSubmit} noValidate>
          {isSignUp && (
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="guest-overlay-name">
                Name
              </label>
              <input
                id="guest-overlay-name"
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
            <label className={styles.label} htmlFor="guest-overlay-email">
              Email
            </label>
            <input
              id="guest-overlay-email"
              className={styles.input}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="guest-overlay-password">
              Password
            </label>
            <div className={styles.passwordWrapper}>
              <input
                id="guest-overlay-password"
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
          </div>

          {errorMessage && <div className={styles.error}>{errorMessage}</div>}
          {successMessage && <div className={styles.success}>{successMessage}</div>}

          <button className={styles.submitBtn} type="submit" disabled={isLoading}>
            {isLoading ? (
              <span className={styles.spinner} aria-hidden="true" />
            ) : isSignUp ? (
              'Create account'
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <p className={styles.footer}>
          {isSignUp ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                className={styles.footerLink}
                onClick={() => handleModeSwitch('signin')}
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              New to Araviel?{' '}
              <button
                type="button"
                className={styles.footerLink}
                onClick={() => handleModeSwitch('signup')}
              >
                Create an account
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
