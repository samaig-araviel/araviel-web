import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_LOCALE,
  SITE_TWITTER,
  DEFAULT_OG_IMAGE,
  buildCanonicalUrl,
  composeTitle,
} from '../lib/seo';

/**
 * Managed meta-tag attribute used to distinguish tags owned by this hook
 * from static tags authored in `index.html`. Tags marked with this attribute
 * are removed on unmount so a navigation away from a route does not leave
 * behind stale descriptions or OG images.
 */
const OWNED_ATTR = 'data-seo-managed';

function setMeta(selector, attr, value) {
  if (!value) return null;
  const head = document.head;
  let tag = head.querySelector(selector);
  if (!tag) {
    tag = document.createElement('meta');
    const [attrName, attrValue] = selector.replace(/^meta\[|\]$/g, '').split('=');
    tag.setAttribute(attrName, attrValue.replace(/"/g, ''));
    tag.setAttribute(OWNED_ATTR, 'true');
    head.appendChild(tag);
  }
  tag.setAttribute(attr, value);
  return tag;
}

function setLink(rel, href) {
  if (!href) return null;
  const head = document.head;
  let tag = head.querySelector(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', rel);
    tag.setAttribute(OWNED_ATTR, 'true');
    head.appendChild(tag);
  }
  tag.setAttribute('href', href);
  return tag;
}

function setJsonLd(id, data) {
  if (!data) return null;
  const head = document.head;
  let tag = head.querySelector(`script[type="application/ld+json"][data-id="${id}"]`);
  if (!tag) {
    tag = document.createElement('script');
    tag.setAttribute('type', 'application/ld+json');
    tag.setAttribute('data-id', id);
    tag.setAttribute(OWNED_ATTR, 'true');
    head.appendChild(tag);
  }
  tag.textContent = JSON.stringify(data);
  return tag;
}

/**
 * Synchronize document head with the current route's metadata.
 *
 * Implementation notes:
 * - Runs only on the client, gated by `typeof document`. This keeps the
 *   hook safe under SSR or static pre-rendering should either be added later.
 * - Uses imperative DOM calls rather than a 3rd-party helmet library to
 *   avoid a render-path dependency and an extra bundle.
 * - On unmount, tags authored by this hook for this invocation are removed
 *   so navigating away returns the head to the site defaults, preventing
 *   stale descriptions/OG images from leaking across routes.
 *
 * @param {object} options
 * @param {string} [options.title] - Page section title. Composed into "Section · Araviel".
 * @param {string} [options.description]
 * @param {string} [options.canonical] - Explicit canonical path. Defaults to current location.
 * @param {string} [options.ogImage]
 * @param {string} [options.ogType] - OpenGraph type. Defaults to "website".
 * @param {object} [options.jsonLd] - JSON-LD document to inject on this route.
 * @param {string} [options.jsonLdId] - Stable id used to de-duplicate JSON-LD tags.
 * @param {boolean} [options.noindex] - Emit robots meta requesting no indexing.
 */
export function useSEO({
  title,
  description,
  canonical,
  ogImage,
  ogType = 'website',
  jsonLd,
  jsonLdId,
  noindex = false,
} = {}) {
  const location = useLocation();

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const resolvedTitle = composeTitle(title);
    const resolvedDescription = description || SITE_DESCRIPTION;
    const resolvedCanonical = buildCanonicalUrl(canonical || location.pathname);
    const resolvedImage = ogImage || DEFAULT_OG_IMAGE;
    const absoluteImage = resolvedImage.startsWith('http')
      ? resolvedImage
      : `${resolvedCanonical.split('/').slice(0, 3).join('/')}${resolvedImage}`;

    const previousTitle = document.title;
    document.title = resolvedTitle;

    const created = [];

    const track = (tag) => {
      if (tag && tag.getAttribute(OWNED_ATTR)) created.push(tag);
    };

    track(setMeta('meta[name="description"]', 'content', resolvedDescription));
    track(setMeta('meta[property="og:site_name"]', 'content', SITE_NAME));
    track(setMeta('meta[property="og:title"]', 'content', resolvedTitle));
    track(setMeta('meta[property="og:description"]', 'content', resolvedDescription));
    track(setMeta('meta[property="og:type"]', 'content', ogType));
    track(setMeta('meta[property="og:url"]', 'content', resolvedCanonical));
    track(setMeta('meta[property="og:image"]', 'content', absoluteImage));
    track(setMeta('meta[property="og:locale"]', 'content', SITE_LOCALE));

    track(setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image'));
    track(setMeta('meta[name="twitter:site"]', 'content', SITE_TWITTER));
    track(setMeta('meta[name="twitter:title"]', 'content', resolvedTitle));
    track(setMeta('meta[name="twitter:description"]', 'content', resolvedDescription));
    track(setMeta('meta[name="twitter:image"]', 'content', absoluteImage));

    track(setMeta('meta[name="robots"]', 'content', noindex ? 'noindex,nofollow' : 'index,follow'));

    track(setLink('canonical', resolvedCanonical));

    let jsonLdTag = null;
    if (jsonLd) {
      const id = jsonLdId || location.pathname || 'page';
      jsonLdTag = setJsonLd(id, jsonLd);
    }

    return () => {
      document.title = previousTitle;
      for (const tag of created) {
        if (tag && tag.parentNode) tag.parentNode.removeChild(tag);
      }
      if (jsonLdTag && jsonLdTag.parentNode) {
        jsonLdTag.parentNode.removeChild(jsonLdTag);
      }
    };
  }, [
    title,
    description,
    canonical,
    ogImage,
    ogType,
    jsonLd,
    jsonLdId,
    noindex,
    location.pathname,
  ]);
}
