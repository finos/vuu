import { DynamicFeatureProps } from "@vuu-ui/vuu-utils";
import React, { ErrorInfo, ReactNode } from "react";

export interface FeatureErrorBoundaryProps extends DynamicFeatureProps {
  children: ReactNode;
}

export class FeatureErrorBoundary extends React.Component<
  FeatureErrorBoundaryProps,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
> {
  constructor(props: FeatureErrorBoundaryProps) {
    super(props);
    this.state = { errorMessage: null };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI.
    return { errorMessage: error.message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.log(`error creating component at ${this.props.url}`);
    console.log(error, errorInfo);
  }

  render() {
    if (this.state.errorMessage) {
      return (
        <>
          <h1>An error occured while creating component.</h1>
          <p>{this.state.errorMessage}</p>
        </>
      );
    }

    return this.props.children;
  }
}
