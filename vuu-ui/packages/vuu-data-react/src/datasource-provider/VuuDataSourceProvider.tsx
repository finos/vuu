import { ConnectionManager, VuuDataSource } from "@vuu-ui/vuu-data-remote";
import type { DataSourceConstructorProps } from "@vuu-ui/vuu-data-types";
import { DataProvider } from "@vuu-ui/vuu-utils2";
import { useEffect, useMemo, type ReactNode } from "react";
import { useAutoLoginToVuuServer } from "./useAutoLoginToVuuServer";

/**
 * DataSource Providers inject a DataSource constructor, made available
 * to clients via the useData hook. This provider offers the standard
 * VuuDataSource, which will source data from a remote vuu server.
 *
 * In production code, it will generally be used without props, authentication
 * and connection to vuu server will be handled elsewhere. The props are
 * useful for rendering standalone components.
 */
export const VuuDataSourceProvider = ({
  authenticate,
  autoConnect = false,
  autoLogin = false,
  children,
  connectionId = "portal",
  token,
  websocketUrl,
}: {
  authenticate?: boolean;
  autoConnect?: boolean;
  autoLogin?: boolean;
  children: ReactNode;
  connectionId?: string;
  token?: string;
  websocketUrl?: string;
}) => {
  const getServerAPI = useMemo(
    () => () => ConnectionManager.serverAPIFor(connectionId),
    [connectionId],
  );

  const BoundVuuDataSource = useMemo(
    () =>
      class ConnectionScopedVuuDataSource extends VuuDataSource {
        constructor(props: DataSourceConstructorProps) {
          super({
            ...props,
            connectionId,
          });
        }
      },
    [connectionId],
  );

  useEffect(() => {
    if (autoConnect && token && websocketUrl) {
      ConnectionManager.connectTo(connectionId, {
        token,
        url: websocketUrl,
      }).catch((e: unknown) => {
        console.error(`[VuuDataSourceProvider] connection failed`, e);
      });
    }
  }, [autoConnect, connectionId, token, websocketUrl]);

  useAutoLoginToVuuServer({
    authenticate,
    autoConnect: token ? false : autoConnect,
    autoLogin,
    connectionId,
    token,
    websocketUrl,
  });

  return (
    <DataProvider
      VuuDataSource={BoundVuuDataSource}
      getServerAPI={getServerAPI}
      isLocalData={false}
    >
      {children}
    </DataProvider>
  );
};
