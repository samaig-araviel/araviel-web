const NETWORK_PATTERNS = /(network|connection|failed to fetch|offline|reach araviel)/i;
const INTERNAL_PATTERNS = /(internal error|unexpected|went wrong)/i;

const STATIC = {
  AUTH_EXPIRED: {
    title: 'Your session has expired.',
    hint: 'Sign in to continue.',
  },
  NETWORK_ERROR: {
    title: 'Network connection issue.',
    hint: 'Check your internet and try again.',
  },
  INTERNAL_ERROR: {
    title: 'Araviel ran into a problem while replying.',
    hint: 'This is usually temporary. Try again, or pick a different model.',
  },
  NO_PROVIDER: {
    title: 'No model is available for this request right now.',
    hint: 'Try a different prompt or pick a model manually.',
  },
  MODEL_RETIRED: {
    title: null,
    hint: 'Pick a different model from the picker above.',
  },
  UNSUPPORTED_TASK: {
    title: null,
    hint: null,
  },
  CREDIT_CHARGE_FAILED: {
    title: "We couldn't complete that image. Your credits weren't charged.",
    hint: 'Try again — if it keeps happening, contact support.',
  },
  INSUFFICIENT_CREDITS: {
    title: null,
    hint: 'Buy more credits or pick a lower-quality option.',
  },
  MONTHLY_CREDITS_EXHAUSTED: { title: null, hint: null },
  WINDOW_CREDITS_EXHAUSTED: {
    title: null,
    hint: 'Try again in a bit.',
  },
  GUEST_LIMIT: { title: null, hint: null },
  NOT_FOUND: { title: null, hint: null },
  VALIDATION_ERROR: {
    title: null,
    hint: 'Adjust your prompt and try again.',
  },
};

const DEFAULT = {
  title: 'Something went wrong.',
  hint: 'Try again, or pick a different model.',
};

export function getFriendlyError(error) {
  if (!error) return null;
  const code = error.code;
  const rawMessage = typeof error.message === 'string' ? error.message.trim() : '';

  if (code && STATIC[code]) {
    return {
      title: STATIC[code].title || rawMessage || DEFAULT.title,
      hint: STATIC[code].hint,
      code,
    };
  }

  if (rawMessage && NETWORK_PATTERNS.test(rawMessage)) {
    return { ...STATIC.NETWORK_ERROR, code: code || 'NETWORK_ERROR' };
  }

  if (rawMessage && INTERNAL_PATTERNS.test(rawMessage)) {
    return { ...STATIC.INTERNAL_ERROR, code: code || 'INTERNAL_ERROR' };
  }

  return {
    title: rawMessage || DEFAULT.title,
    hint: DEFAULT.hint,
    code: code || null,
  };
}
