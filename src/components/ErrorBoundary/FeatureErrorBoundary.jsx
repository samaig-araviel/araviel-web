import React from 'react';
import { logger, generateRequestId } from '../../lib/logger';
import ErrorFallback from './ErrorFallback';

/**
 * In-tree boundary for feature areas (chat, projects, analytics, pricing).
 * Unlike the route boundary, it does not remount via the router — it
 * re-renders children after a retry so sibling state (auth, theme) is
 * preserved.
 *
 * The `resetKey` prop lets the caller clear the error automatically when
 * something external changes (e.g. route navigation). Without it a caught
 * error would persist across navigations, leaving the fallback stuck on
 * unrelated pages.
 *
 * @param {object} props
 * @param {string} props.feature - Short label used in log lines (e.g. "chat").
 * @param {React.ReactNode} props.children
 * @param {string} [props.title]
 * @param {string} [props.description]
 * @param {string} [props.resetKey] - Changing this value clears the error.
 */
export default class FeatureErrorBoundary extends React.Component {
  state = { error: null, requestId: null, retryKey: 0, lastResetKey: undefined };

  static getDerivedStateFromError(error) {
    return { error, requestId: generateRequestId() };
  }

  static getDerivedStateFromProps(props, state) {
    if (state.lastResetKey === undefined) {
      return { lastResetKey: props.resetKey };
    }
    if (props.resetKey !== state.lastResetKey) {
      return {
        error: null,
        requestId: null,
        lastResetKey: props.resetKey,
      };
    }
    return null;
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
