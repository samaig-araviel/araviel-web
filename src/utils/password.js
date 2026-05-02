/**
 * Password validation that mirrors Supabase Auth's "Lowercase, uppercase
 * letters, and digits" policy plus a minimum length. Returns a list of
 * the rules the input fails (empty array = valid). Callers join the list
 * into a user-friendly message instead of relying on Supabase's verbose
 * error string.
 */

export const PASSWORD_MIN_LENGTH = 8;

export function getPasswordRuleViolations(password) {
  const issues = [];
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    issues.push(`${PASSWORD_MIN_LENGTH} characters`);
  }
  if (!/[a-z]/.test(password || '')) issues.push('1 lowercase letter');
  if (!/[A-Z]/.test(password || '')) issues.push('1 uppercase letter');
  if (!/[0-9]/.test(password || '')) issues.push('1 number');
  return issues;
}

/**
 * Format a list of failing rules as a single line: e.g.
 * "Password must contain at least: 8 characters, 1 uppercase letter,
 * 1 number."
 */
export function formatPasswordError(violations) {
  if (!violations || violations.length === 0) return '';
  return `Password must contain at least: ${violations.join(', ')}.`;
}
