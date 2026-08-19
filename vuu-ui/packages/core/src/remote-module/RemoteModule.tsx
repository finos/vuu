import {
  AuthenticationProvider,
  type RemoteModuleConnection,
} from "@vuu-ui/core";
import {
  loadRemote,
  registerRemotes,
} from "@module-federation/enhanced/runtime";
import React, { lazy } from "react";
import { useInRouterContext, useLocation } from "react-router-dom";
import { RemoteModuleErrorBoundary } from "./RemoteModuleErrorBoundary";

export interface RemoteModuleProps<
  ComponentProps extends object | undefined = object,
> {
  ComponentProps?: ComponentProps;
  ViewProps?: {
    allowRename?: boolean;
    closeable?: boolean;
    header?: boolean;
  };
  css?: string;
  height?: number;
  mfComponent: string;
  mfScope: string;
  mfUrl: string;
  onError?: (error: Error) => void;
  title?: string;
  vuu?: RemoteModuleConnection;
  width?: number;
}

const getLazyComponent = (
  scope: string,
  component: string,
  manifestUrl: string,
) => {
  registerRemotes([
    {
      name: scope,
      entry: manifestUrl,
    },
  ]);

  return lazy(async () => {
    const remote = await loadRemote<{
      default: React.ComponentType<Record<string, unknown>>;
    }>(`${scope}/${component}`, { from: "runtime" });

    if (remote === null) {
      throw Error(`Unable to load remote component ${scope}/${component}`);
    }

    return remote;
  });
};

const components = new Map<string, ReturnType<typeof lazy>>();

const getRemoteComponentKey = (
  mfUrl: string,
  mfScope: string,
  mfComponent: string,
) => `${mfUrl}|${mfScope}/${mfComponent}`;

const getRemoteComponent = (
  mfUrl: string,
  mfScope: string,
  mfComponent: string,
) => {
  const componentKey = getRemoteComponentKey(mfUrl, mfScope, mfComponent);
  let component = components.get(componentKey);

  if (component === undefined) {
    component = getLazyComponent(
      mfScope,
      mfComponent,
      `${mfUrl}/mf-manifest.json`,
    );
    components.set(componentKey, component);
  }

  return component;
};

function RawRemoteModule<ComponentProps extends object | undefined>({
  ComponentProps: componentProps,
  css: _css,
  mfComponent,
  mfScope,
  mfUrl,
  onError,
  vuu,
  ...remoteProps
}: RemoteModuleProps<ComponentProps>) {
  const RemoteComponent = getRemoteComponent(mfUrl, mfScope, mfComponent);
  const remoteComponent = (
    <RemoteComponent {...remoteProps} {...componentProps} />
  );

  return (
    <RemoteModuleErrorBoundary
      mfComponent={mfComponent}
      mfScope={mfScope}
      mfUrl={mfUrl}
      onError={(error) => {
        components.delete(getRemoteComponentKey(mfUrl, mfScope, mfComponent));
        onError?.(error);
      }}
    >
      {vuu ? (
        <AuthenticationProvider mode="vuu-connection" connection={vuu}>
          {remoteComponent}
        </AuthenticationProvider>
      ) : (
        remoteComponent
      )}
    </RemoteModuleErrorBoundary>
  );
}

type RoutedRemoteModuleProps = RemoteModuleProps;

const RoutedRemoteModule = (props: RoutedRemoteModuleProps) => {
  useLocation();
  return <RawRemoteModule {...props} />;
};

export const RemoteModule = React.memo(
  (props: RoutedRemoteModuleProps) =>
    useInRouterContext() ? (
      <RoutedRemoteModule {...props} />
    ) : (
      <RawRemoteModule {...props} />
    ),
);
RemoteModule.displayName = "RemoteModule";
