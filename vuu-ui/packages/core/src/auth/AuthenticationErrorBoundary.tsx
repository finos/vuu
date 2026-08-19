import React, { type ErrorInfo, type ReactNode } from "react";

export interface AuthenticationErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode | ((error: Error) => ReactNode);
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface AuthenticationErrorBoundaryState {
  error?: Error;
}

export class AuthenticationErrorBoundary extends React.Component<
  AuthenticationErrorBoundaryProps,
  AuthenticationErrorBoundaryState
> {
  state: AuthenticationErrorBoundaryState = {};

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }

  render() {
    const { children, fallback } = this.props;
    const { error } = this.state;
    if (!error) {
      return children;
    }
    return typeof fallback === "function" ? fallback(error) : fallback;
  }
}
