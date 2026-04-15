import React from 'react';
import { logger, generateRequestId } from '../../lib/logger';
import ErrorFallback from './ErrorFallback';

/**
 * In-tree boundary for feature areas (chat, projects, analytics, pricing).
 * Unlike the route boundary, it does not remount via the router — it
 * re-renders children after a retry so sibling state (auth, theme) is
 * preserved.
 *
 * @param {object} props
 * @param {string} props.feature - Short label used in log lines (e.g. "chat").
 * @param {React.ReactNode} props.children
 * @param {string} [props.title]
 * @param {string} [props.description]
 */
export default class FeatureErrorBoundary extends React.Component {
  state = { error: null, requestId: null, retryKey: 0 };

  static getDerivedStateFromError(error) {
    return { error, requestId: generateRequestId() };
  }

  componentDidCatch(error, info) {
    logger.error('Feature render error', error, {
      componentStack: info?.componentStack,
      requestId: this.state.requestId,
      scope: 'feature',
      feature: this.props.feature,
    });
  }

  handleRetry = () => {
    this.setState((prev) => ({
      error: null,
      requestId: null,
      retryKey: prev.retryKey + 1,
    }));
  };

  render() {
    if (this.state.error) {
      return (
        <ErrorFallback
          variant="inline"
          title={this.props.title || 'Something went wrong'}
          description={
            this.props.description ||
            "We couldn't load this part of Araviel. Try again — your other work is safe."
          }
          requestId={this.state.requestId}
          actions={[{ label: 'Try again', onClick: this.handleRetry, variant: 'primary' }]}
        />
      );
    }
    // `key` forces a clean remount of children on retry so any cached hook
    // state inside the subtree is discarded along with the failing render.
    return <React.Fragment key={this.state.retryKey}>{this.props.children}</React.Fragment>;
  }
}
