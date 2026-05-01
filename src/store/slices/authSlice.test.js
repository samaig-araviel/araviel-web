import { describe, it, expect } from 'vitest';
import authReducer, {
  setAuth,
  clearAuth,
  setAuthLoading,
  setAuthError,
  setUserAvatarUrl,
  selectAuthUser,
  selectAuthSession,
  selectAuthLoading,
  selectAuthError,
  selectIsAuthenticated,
  selectIsAnonymous,
} from './authSlice';

describe('authSlice', () => {
  const initialState = {
    user: null,
    session: null,
    isLoading: true,
    error: null,
  };

  describe('initial state', () => {
    it('starts with null user and session, loading true', () => {
      const state = authReducer(undefined, { type: 'unknown' });
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });
  });

  describe('setAuth', () => {
    it('sets user and session', () => {
      const user = { id: 'u1', email: 'test@test.com', isAnonymous: false };
      const session = { access_token: 'token' };
      const state = authReducer(initialState, setAuth({ user, session }));
      expect(state.user).toEqual(user);
      expect(state.session).toEqual(session);
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
    });
  });

  describe('clearAuth', () => {
    it('clears all auth state', () => {
      const prev = {
        user: { id: 'u1' },
        session: { access_token: 'token' },
        isLoading: true,
        error: 'some error',
      };
      const state = authReducer(prev, clearAuth());
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
    });
  });

  describe('setAuthLoading', () => {
    it('sets loading flag', () => {
      const state = authReducer(initialState, setAuthLoading(false));
      expect(state.isLoading).toBe(false);
    });
  });

  describe('setAuthError', () => {
    it('sets error message', () => {
      const state = authReducer(initialState, setAuthError('Auth failed'));
      expect(state.error).toBe('Auth failed');
    });
  });

  describe('setUserAvatarUrl', () => {
    it('updates avatar on existing user', () => {
      const prev = {
        ...initialState,
        user: { id: 'u1', avatarUrl: null },
      };
      const state = authReducer(prev, setUserAvatarUrl('https://img.test/avatar.png'));
      expect(state.user.avatarUrl).toBe('https://img.test/avatar.png');
    });

    it('does nothing when no user exists', () => {
      const state = authReducer(initialState, setUserAvatarUrl('https://img.test/avatar.png'));
      expect(state.user).toBeNull();
    });
  });

  describe('async thunk reducers', () => {
    it('handles initializeAuth.pending', () => {
      const state = authReducer(initialState, {
        type: 'auth/initializeAuth/pending',
      });
      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('handles initializeAuth.fulfilled', () => {
      const user = { id: 'u1', email: 'test@test.com' };
      const session = { access_token: 'tok' };
      const state = authReducer(initialState, {
        type: 'auth/initializeAuth/fulfilled',
        payload: { user, session },
      });
      expect(state.user).toEqual(user);
      expect(state.session).toEqual(session);
      expect(state.isLoading).toBe(false);
    });

    it('handles initializeAuth.rejected', () => {
      const state = authReducer(initialState, {
        type: 'auth/initializeAuth/rejected',
        payload: 'Init failed',
      });
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Init failed');
    });

    it('handles signInWithGoogle.pending', () => {
      const state = authReducer(initialState, {
        type: 'auth/signInWithGoogle/pending',
      });
      expect(state.isLoading).toBe(true);
    });

    it('handles signInWithGoogle.rejected', () => {
      const state = authReducer(initialState, {
        type: 'auth/signInWithGoogle/rejected',
        payload: 'Google failed',
      });
      expect(state.error).toBe('Google failed');
      expect(state.isLoading).toBe(false);
    });

    it('handles signInWithEmail.fulfilled', () => {
      const user = { id: 'u1' };
      const session = { access_token: 'tok' };
      const state = authReducer(initialState, {
        type: 'auth/signInWithEmail/fulfilled',
        payload: { user, session },
      });
      expect(state.user).toEqual(user);
      expect(state.isLoading).toBe(false);
    });

    it('handles signInWithEmail.rejected', () => {
      const state = authReducer(initialState, {
        type: 'auth/signInWithEmail/rejected',
        payload: 'Wrong password',
      });
      expect(state.error).toBe('Wrong password');
    });

    it('handles signUpWithEmail.fulfilled', () => {
      const state = authReducer(initialState, {
        type: 'auth/signUpWithEmail/fulfilled',
        payload: { user: { id: 'new' }, session: null },
      });
      expect(state.user.id).toBe('new');
      expect(state.isLoading).toBe(false);
    });

    it('handles signOut.fulfilled', () => {
      const prev = {
        user: { id: 'u1' },
        session: { access_token: 'tok' },
        isLoading: false,
        error: null,
      };
      const state = authReducer(prev, { type: 'auth/signOut/fulfilled' });
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
    });

    it('handles signOut.rejected', () => {
      const state = authReducer(initialState, {
        type: 'auth/signOut/rejected',
        payload: 'Sign out failed',
      });
      expect(state.error).toBe('Sign out failed');
    });

    it('handles resetPassword.pending', () => {
      const state = authReducer(initialState, {
        type: 'auth/resetPassword/pending',
      });
      expect(state.isLoading).toBe(true);
    });

    it('handles resetPassword.fulfilled', () => {
      const state = authReducer(
        { ...initialState, isLoading: true },
        { type: 'auth/resetPassword/fulfilled' }
      );
      expect(state.isLoading).toBe(false);
    });

    it('handles resetPassword.rejected', () => {
      const state = authReducer(initialState, {
        type: 'auth/resetPassword/rejected',
        payload: 'Reset failed',
      });
      expect(state.error).toBe('Reset failed');
    });
  });

  describe('selectors', () => {
    const authenticatedState = {
      auth: {
        user: { id: 'u1', email: 'test@test.com', isAnonymous: false },
        session: { access_token: 'tok' },
        isLoading: false,
        error: null,
      },
    };

    const anonymousState = {
      auth: {
        user: { id: 'anon-1', isAnonymous: true },
        session: { access_token: 'anon-tok' },
        isLoading: false,
        error: null,
      },
    };

    const emptyState = {
      auth: { user: null, session: null, isLoading: true, error: 'err' },
    };

    it('selectAuthUser returns user', () => {
      expect(selectAuthUser(authenticatedState).id).toBe('u1');
    });

    it('selectAuthSession returns session', () => {
      expect(selectAuthSession(authenticatedState).access_token).toBe('tok');
    });

    it('selectAuthLoading returns loading state', () => {
      expect(selectAuthLoading(emptyState)).toBe(true);
    });

    it('selectAuthError returns error', () => {
      expect(selectAuthError(emptyState)).toBe('err');
    });

    it('selectIsAuthenticated returns true for non-anonymous user', () => {
      expect(selectIsAuthenticated(authenticatedState)).toBe(true);
    });

    it('selectIsAuthenticated returns false for anonymous user', () => {
      expect(selectIsAuthenticated(anonymousState)).toBe(false);
    });

    it('selectIsAuthenticated returns false for null user', () => {
      expect(selectIsAuthenticated(emptyState)).toBe(false);
    });

    it('selectIsAnonymous returns true for anonymous user', () => {
      expect(selectIsAnonymous(anonymousState)).toBe(true);
    });

    it('selectIsAnonymous returns false for authenticated user', () => {
      expect(selectIsAnonymous(authenticatedState)).toBe(false);
    });

    it('selectIsAnonymous returns false for null user', () => {
      expect(selectIsAnonymous(emptyState)).toBe(false);
    });
  });
});
