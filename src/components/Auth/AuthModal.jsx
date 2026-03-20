import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  resetPassword,
  selectAuthLoading,
  selectAuthError,
  setAuthError,
} from '../../store/slices/authSlice';
import { CloseIcon } from '../Icons';
import styles from './AuthModal.module.css';

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

/**
 * AuthModal — Premium login/signup modal with Google OAuth + email/password.
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - initialTab: 'signin' | 'signup' (default: 'signin')
 */
export default function AuthModal({ isOpen, onClose, initialTab = 'signin' }) {
  const dispatch = useDispatch();
  const isLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);

  const [activeTab, setActiveTab] = useState(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const clearState = useCallback(() => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setLocalError('');
    setSuccessMessage('');
    dispatch(setAuthError(null));
  }, [dispatch]);

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    clearState();
    setShowForgotPassword(false);
  };

  const handleClose = () => {
    clearState();
    setShowForgotPassword(false);
    onClose();
  };

  const handleGoogleSignIn = async () => {
    setLocalError('');
    dispatch(setAuthError(null));
    dispatch(signInWithGoogle());
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
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
      const result = await dispatch(
        signInWithEmail({ email: email.trim(), password })
      );
      if (result.meta.requestStatus === 'fulfilled') {
        handleClose();
      }
    } else {
      const result = await dispatch(
        signUpWithEmail({
          email: email.trim(),
          password,
          displayName: displayName.trim() || undefined,
        })
      );
      if (result.meta.requestStatus === 'fulfilled') {
        setSuccessMessage('Account created! Check your email to confirm.');
      }
    }
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    setLocalError('');
    setSuccessMessage('');
    setPassword('');
  };

  const handleBackToSignIn = () => {
    setShowForgotPassword(false);
    setLocalError('');
    setSuccessMessage('');
  };

  if (!isOpen) return null;

  const errorMessage = localError || authError;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
          <CloseIcon />
        </button>

        <div className={styles.header}>
          <div className={styles.logoMark}>A</div>
          <h2 className={styles.title}>
            {showForgotPassword
              ? 'Reset password'
              : activeTab === 'signin'
              ? 'Welcome back'
              : 'Create your account'}
          </h2>
          <p className={styles.subtitle}>
            {showForgotPassword
              ? "Enter your email and we'll send you a reset link."
              : activeTab === 'signin'
              ? 'Sign in to access all your conversations and settings.'
              : 'Get started with Araviel for free.'}
          </p>
        </div>

        {!showForgotPassword && (
          <>
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${activeTab === 'signin' ? styles.tabActive : ''}`}
                onClick={() => handleTabSwitch('signin')}
              >
                Sign in
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'signup' ? styles.tabActive : ''}`}
                onClick={() => handleTabSwitch('signup')}
              >
                Sign up
              </button>
            </div>

            <div className={styles.oauthSection}>
              <button
                className={styles.googleBtn}
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <GoogleIcon />
                <span>Continue with Google</span>
              </button>
            </div>

            <div className={styles.divider}>
              <div className={styles.dividerLine} />
              <span className={styles.dividerText}>or</span>
              <div className={styles.dividerLine} />
            </div>
          </>
        )}

        <form className={styles.form} onSubmit={handleEmailSubmit}>
          {activeTab === 'signup' && !showForgotPassword && (
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
              <input
                id="auth-password"
                className={styles.input}
                type="password"
                placeholder={activeTab === 'signup' ? 'Min. 6 characters' : 'Your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={activeTab === 'signup' ? 'new-password' : 'current-password'}
                required
              />
              {activeTab === 'signin' && (
                <div className={styles.forgotLink}>
                  <button type="button" onClick={handleForgotPassword}>
                    Forgot password?
                  </button>
                </div>
              )}
            </div>
          )}

          {errorMessage && <div className={styles.error}>{errorMessage}</div>}
          {successMessage && <div className={styles.success}>{successMessage}</div>}

          <button className={styles.submitBtn} type="submit" disabled={isLoading}>
            {isLoading ? (
              <span className={styles.spinner} />
            ) : showForgotPassword ? (
              'Send reset link'
            ) : activeTab === 'signin' ? (
              'Sign in'
            ) : (
              'Create account'
            )}
          </button>
        </form>

        {showForgotPassword ? (
          <div className={styles.footerLink}>
            <button onClick={handleBackToSignIn}>Back to sign in</button>
          </div>
        ) : (
          <div className={styles.footerLink}>
            {activeTab === 'signin' ? (
              <>
                Don&apos;t have an account?{' '}
                <button onClick={() => handleTabSwitch('signup')}>Sign up</button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button onClick={() => handleTabSwitch('signin')}>Sign in</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
