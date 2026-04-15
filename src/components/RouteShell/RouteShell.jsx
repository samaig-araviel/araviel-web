import FeatureErrorBoundary from '../ErrorBoundary/FeatureErrorBoundary';
import SEO from '../SEO/SEO';

/**
 * Route-level shell used by the router to compose SEO metadata and a
 * feature-scoped error boundary around a route's element. Keeping this in
 * one place means individual views don't need to know about either
 * concern — they remain focused on their own rendering.
 *
 * @param {object} props
 * @param {string} props.feature - Short label for logs (e.g. "chat").
 * @param {object} [props.seo] - Props forwarded to the SEO helper.
 * @param {React.ReactNode} props.children
 */
export default function RouteShell({ feature, seo, children }) {
  return (
    <FeatureErrorBoundary feature={feature}>
      {seo && <SEO {...seo} />}
      {children}
    </FeatureErrorBoundary>
  );
}
