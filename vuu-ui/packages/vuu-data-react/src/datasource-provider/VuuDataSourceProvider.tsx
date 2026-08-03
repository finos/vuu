import { ConnectionManager, VuuDataSource } from "@vuu-ui/vuu-data-remote";
import { DataProvider } from "@vuu-ui/vuu-utils";
import { ReactNode } from "react";
import { useAutoLoginToVuuServer } from "./useAutoLoginToVuuServer";

const getServerAPI = () => ConnectionManager.serverAPI;

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
  websocketUrl,
}: {
  authenticate?: boolean;
  autoConnect?: boolean;
  autoLogin?: boolean;
  children: ReactNode;
  websocketUrl?: string;
}) => {
  useAutoLoginToVuuServer({
    authenticate,
    autoConnect,
    autoLogin,
    websocketUrl,
  });

  return (
    <DataProvider
      VuuDataSource={VuuDataSource}
      getServerAPI={getServerAPI}
      isLocalData={false}
    >
      {children}
    </DataProvider>
  );
};
