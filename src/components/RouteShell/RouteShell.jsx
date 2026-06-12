import { useLocation } from 'react-router-dom';
import FeatureErrorBoundary from '../ErrorBoundary/FeatureErrorBoundary';
import SEO from '../SEO/SEO';

/**
 * Route-level shell used by the router to compose SEO metadata and a
 * feature-scoped error boundary around a route's element. Keeping this in
 * one place means individual views don't need to know about either
 * concern — they remain focused on their own rendering.
 *
 * `pathname` is passed as the boundary's reset key so a caught error on one
 * route doesn't leak into the next — navigating away clears the fallback.
 *
 * @param {object} props
 * @param {string} props.feature - Short label for logs (e.g. "chat").
 * @param {object} [props.seo] - Props forwarded to the SEO helper.
 * @param {React.ReactNode} props.children
 */
export default function RouteShell({ feature, seo, children }) {
  const { pathname } = useLocation();
  return (
    <FeatureErrorBoundary feature={feature} resetKey={pathname}>
      {seo && <SEO {...seo} />}
      {children}
    </FeatureErrorBoundary>
  );
}
