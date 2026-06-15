import { describe, it, expect } from 'vitest';
import { getFriendlyError } from './chatErrorMessages';

describe('getFriendlyError', () => {
  it('returns null when error is null', () => {
    expect(getFriendlyError(null)).toBeNull();
    expect(getFriendlyError(undefined)).toBeNull();
  });

  it('uses the static mapping for a known code', () => {
    const result = getFriendlyError({ code: 'AUTH_EXPIRED' });
    expect(result.title).toBe('Your session has expired.');
    expect(result.hint).toBe('Sign in to continue.');
    expect(result.code).toBe('AUTH_EXPIRED');
  });

  it('returns the server message as title when the static mapping has no title', () => {
    const result = getFriendlyError({
      code: 'MODEL_RETIRED',
      message: 'gpt-4o-mini was retired.',
    });
    expect(result.title).toBe('gpt-4o-mini was retired.');
    expect(result.hint).toBe('Pick a different model from the picker above.');
  });

  it('falls back to a generic title when neither static nor message is present', () => {
    const result = getFriendlyError({ code: 'MODEL_RETIRED' });
    expect(result.title).toBe('Something went wrong.');
  });

  it('classifies network-flavored messages as NETWORK_ERROR', () => {
    const result = getFriendlyError({ message: 'Failed to fetch' });
    expect(result.code).toBe('NETWORK_ERROR');
    expect(result.title).toBe('Network connection issue.');
  });

  it('classifies "something went wrong"-flavored messages as INTERNAL_ERROR', () => {
    const result = getFriendlyError({
      message: 'Something went wrong. Please try again.',
    });
    expect(result.code).toBe('INTERNAL_ERROR');
    expect(result.title).toBe('Araviel ran into a problem while replying.');
  });

  it('falls back to the raw message + generic hint for unknown errors', () => {
    const result = getFriendlyError({ message: 'Unparseable JSON' });
    expect(result.title).toBe('Unparseable JSON');
    expect(result.hint).toBe('Try again, or pick a different model.');
    expect(result.code).toBeNull();
  });

  it('preserves the original code field when a message-only classifier matches', () => {
    const result = getFriendlyError({
      code: 'CUSTOM_CODE',
      message: 'connection refused',
    });
    expect(result.code).toBe('CUSTOM_CODE');
    expect(result.title).toBe('Network connection issue.');
  });

  it('trims whitespace from incoming messages before classifying', () => {
    const result = getFriendlyError({ message: '   network error   ' });
    expect(result.code).toBe('NETWORK_ERROR');
  });
});
