/** Minimum age (in years) required to use the app. */
export const MIN_AGE = 13;

/**
 * Compute the user's age in whole years from an ISO yyyy-mm-dd birth
 * date. Returns null if the input is unparseable.
 */
export function calculateAge(birthDate) {
  if (!birthDate) return null;
  const dob = new Date(birthDate);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDelta = today.getMonth() - dob.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

/** True iff the supplied birth date represents someone at least MIN_AGE old. */
export function isAgeAllowed(birthDate) {
  const age = calculateAge(birthDate);
  return age != null && age >= MIN_AGE;
}
