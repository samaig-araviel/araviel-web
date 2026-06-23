import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../../store/slices/authSlice';
import GuestGate from '../GuestGate/GuestGate';

/**
 * Inline auth gate. Renders `children` when the user is signed in,
 * otherwise renders a `GuestGate` prompt with the supplied copy.
 *
 * Designed to wrap the data-driven content of a view that still wants
 * to render its own chrome (page background, header, hero) regardless
 * of auth state. Header actions that only make sense for signed-in
 * users should be gated by the view itself; this wrapper only owns the
 * primary content swap.
 */
export default function RequireAuth({ children, icon, title, description, actionLabel }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  if (isAuthenticated) return children;
  return (
    <GuestGate icon={icon} title={title} description={description} actionLabel={actionLabel} />
  );
}
