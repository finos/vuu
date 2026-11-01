import React, { type ErrorInfo, type ReactNode } from "react";

export interface RemoteModuleErrorBoundaryProps {
  children: ReactNode;
  mfComponent: string;
  mfScope: string;
  mfUrl: string;
  onError?: (error: Error) => void;
}

interface RemoteModuleErrorBoundaryState {
  errorMessage: string | null;
  remoteModuleKey: string;
}

const getRemoteModuleKey = ({
  mfComponent,
  mfScope,
  mfUrl,
}: RemoteModuleErrorBoundaryProps) => `${mfUrl}|${mfScope}/${mfComponent}`;

export class RemoteModuleErrorBoundary extends React.Component<
  RemoteModuleErrorBoundaryProps,
  RemoteModuleErrorBoundaryState
> {
  state: RemoteModuleErrorBoundaryState = {
    errorMessage: null,
    remoteModuleKey: getRemoteModuleKey(this.props),
  };

  static getDerivedStateFromError(error: Error) {
    return { errorMessage: error.message };
  }

  static getDerivedStateFromProps(
    props: RemoteModuleErrorBoundaryProps,
    state: RemoteModuleErrorBoundaryState,
  ): Partial<RemoteModuleErrorBoundaryState> | null {
    const remoteModuleKey = getRemoteModuleKey(props);
    return remoteModuleKey === state.remoteModuleKey
      ? null
      : { errorMessage: null, remoteModuleKey };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error creating remote module at ${this.props.mfUrl}`);
    console.error(error, errorInfo);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.errorMessage !== null) {
      return (
        <>
          <h1>An error occurred while creating the remote module.</h1>
          <p>{this.state.errorMessage}</p>
        </>
      );
    }

    return this.props.children;
  }
}
