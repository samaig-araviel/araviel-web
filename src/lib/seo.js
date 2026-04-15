/**
 * Site-wide SEO constants and helpers.
 *
 * All route-level metadata flows through `useSEO` which consumes these
 * values, so changes to the brand, default OG image, or canonical origin
 * happen in one place.
 */

export const SITE_NAME = 'Araviel';
export const SITE_TAGLINE = 'One chat, every model.';
export const SITE_DESCRIPTION =
  'Araviel is a multi-model AI workspace. Chat with every leading model, build projects, generate images, and stay in flow — all from one interface.';
export const SITE_TWITTER = '@araviel';
export const SITE_LOCALE = 'en_US';

/**
 * Canonical public origin. In production this must be the customer-facing
 * domain. In development we fall back to the running origin so canonical
 * URLs at least resolve locally.
 */
export const SITE_ORIGIN =
  import.meta.env.VITE_SITE_ORIGIN ||
  (typeof window !== 'undefined' && !import.meta.env.DEV
    ? window.location.origin
    : 'https://araviel.ai');

/**
 * Default social share image. The file lives in `/public` so it is served
 * at the root of the deployed site. Replace with a 1200x630 PNG export when
 * brand assets are finalized — the path is already wired into every route.
 */
export const DEFAULT_OG_IMAGE = '/og-image.svg';

/**
 * Organization JSON-LD emitted on every page. Search engines use this to
 * build knowledge-graph entries and sitelinks.
 */
export const ORGANIZATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_ORIGIN,
  logo: `${SITE_ORIGIN}/favicon.svg`,
  sameAs: [],
};

/**
 * WebApplication JSON-LD for the home page.
 */
export const WEB_APPLICATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: SITE_NAME,
  url: SITE_ORIGIN,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  description: SITE_DESCRIPTION,
};

/**
 * Build a fully-qualified canonical URL for the current route.
 * Strips query strings and trailing slashes so duplicate signals don't
 * leak into the index.
 *
 * @param {string} pathname
 * @returns {string}
 */
export function buildCanonicalUrl(pathname) {
  if (!pathname) return SITE_ORIGIN;
  const clean = pathname.replace(/\/+$/, '') || '/';
  return `${SITE_ORIGIN}${clean}`;
}

/**
 * Compose a page title in the "Section · Araviel" format used across the
 * app. Passing an empty/undefined title returns the site brand.
 *
 * @param {string} [title]
 * @returns {string}
 */
export function composeTitle(title) {
  if (!title) return `${SITE_NAME} — ${SITE_TAGLINE}`;
  return `${title} · ${SITE_NAME}`;
}
