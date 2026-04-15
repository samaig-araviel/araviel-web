import React from 'react';
import { logger, generateRequestId } from '../../lib/logger';
import ErrorFallback from './ErrorFallback';

/**
 * Top-level error boundary. Mounted outside the router so it also catches
 * render failures in the providers/router setup. Recovery is offered by
 * reloading the page — at this depth the React tree is unknown-bad and
 * partial recovery would leave stale state behind.
 */
export default class AppErrorBoundary extends React.Component {
  state = { error: null, requestId: null };

  static getDerivedStateFromError(error) {
    return { error, requestId: generateRequestId() };
  }

  componentDidCatch(error, info) {
    logger.error('Unhandled render error', error, {
      componentStack: info?.componentStack,
      requestId: this.state.requestId,
      scope: 'app',
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = '/';
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <ErrorFallback
        variant="page"
        title="Something went wrong"
        description="We hit an unexpected issue loading Araviel. Reloading the page usually fixes it."
        requestId={this.state.requestId}
        actions={[
          { label: 'Reload', onClick: this.handleReload, variant: 'primary' },
          { label: 'Go home', onClick: this.handleHome, variant: 'secondary' },
        ]}
      />
    );
  }
}
