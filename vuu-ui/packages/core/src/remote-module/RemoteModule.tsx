import {
  AuthenticationProvider,
  type RemoteModuleConnection,
} from "@vuu-ui/core";
import {
  loadRemote,
  registerRemotes,
} from "@module-federation/enhanced/runtime";
import React, { lazy } from "react";
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
  title?: string;
  vuu?: RemoteModuleConnection;
  width?: number;
}

const portalConnection = { connectionId: "portal" };

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

const getRemoteComponent = (
  mfUrl: string,
  mfScope: string,
  mfComponent: string,
) => {
  const componentPath = `${mfScope}/${mfComponent}`;
  let component = components.get(componentPath);

  if (component === undefined) {
    component = getLazyComponent(
      mfScope,
      mfComponent,
      `${mfUrl}/mf-manifest.json`,
    );
    components.set(componentPath, component);
  }

  return component;
};

function RawRemoteModule<ComponentProps extends object | undefined>({
  ComponentProps: componentProps,
  css: _css,
  mfComponent,
  mfScope,
  mfUrl,
  vuu,
  ...remoteProps
}: RemoteModuleProps<ComponentProps>) {
  const RemoteComponent = getRemoteComponent(mfUrl, mfScope, mfComponent);

  return (
    <RemoteModuleErrorBoundary
      mfComponent={mfComponent}
      mfScope={mfScope}
      mfUrl={mfUrl}
    >
      <AuthenticationProvider
        mode="vuu-connection"
        connection={vuu ?? portalConnection}
      >
        <RemoteComponent {...remoteProps} {...componentProps} />
      </AuthenticationProvider>
    </RemoteModuleErrorBoundary>
  );
}

export const RemoteModule = React.memo(RawRemoteModule);
RemoteModule.displayName = "RemoteModule";
