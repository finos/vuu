import React, { type ErrorInfo, type ReactNode } from "react";

export class LegacyFeatureErrorBoundary extends React.Component<
  { children: ReactNode; url: string },
  { errorMessage: string | null }
> {
  state = { errorMessage: null };

  static getDerivedStateFromError(error: Error) {
    return { errorMessage: error.message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      `Error creating legacy feature at ${this.props.url}`,
      error,
      errorInfo,
    );
  }

  render() {
    return this.state.errorMessage ? (
      <>
        <h1>An error occurred while creating the feature.</h1>
        <p>{this.state.errorMessage}</p>
      </>
    ) : (
      this.props.children
    );
  }
}
