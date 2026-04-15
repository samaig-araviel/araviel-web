import { useEffect, useMemo } from 'react';
import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom';
import { logger, generateRequestId } from '../../lib/logger';
import ErrorFallback from './ErrorFallback';
import NotFound from './NotFound';

/**
 * Used as `errorElement` on the root route. React Router calls this whenever
 * a loader, action, or rendered component throws. The component stays
 * mounted in place of the failing route, so the shell (sidebar, header)
 * remains usable.
 */
export default function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();
  const requestId = useMemo(() => generateRequestId(), []);

  const is404 = isRouteErrorResponse(error) && error.status === 404;

  useEffect(() => {
    if (!error) return;
    if (is404) return;
    logger.error('Route rendering failed', error, {
      requestId,
      scope: 'route',
    });
  }, [error, is404, requestId]);

  if (is404) {
    return <NotFound />;
  }

  const status = isRouteErrorResponse(error) ? error.status : undefined;
  const title = status === 500 ? "We're having trouble" : 'Something went wrong';
  const description =
    status === 503
      ? 'Araviel is temporarily unavailable. Please try again in a moment.'
      : "We couldn't load this section. Try again — if it keeps happening, please let us know.";

  return (
    <ErrorFallback
      variant="page"
      title={title}
      description={description}
      requestId={requestId}
      actions={[
        { label: 'Try again', onClick: () => navigate(0), variant: 'primary' },
        { label: 'Go home', onClick: () => navigate('/'), variant: 'secondary' },
      ]}
    />
  );
}
