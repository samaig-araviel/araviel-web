import { useNavigate } from 'react-router-dom';
import { useSEO } from '../../hooks/useSEO';
import ErrorFallback from './ErrorFallback';

/**
 * 404 page rendered when React Router throws a 404 response or a catch-all
 * route matches. Kept deliberately minimal — no dead links, no app chrome,
 * no marketing copy. Offers a single clear path back to the home screen.
 */
export default function NotFound() {
  const navigate = useNavigate();
  useSEO({
    title: 'Page not found',
    description: 'The page you were looking for could not be found.',
    noindex: true,
  });
  return (
    <ErrorFallback
      variant="page"
      title="Page not found"
      description="The page you were looking for does not exist or has been moved."
      actions={[{ label: 'Go home', onClick: () => navigate('/'), variant: 'primary' }]}
    />
  );
}
