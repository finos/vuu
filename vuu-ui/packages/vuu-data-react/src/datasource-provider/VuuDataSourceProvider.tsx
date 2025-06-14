import { ConnectionManager, VuuDataSource } from "@vuu-ui/vuu-data-remote";
import { DataProvider } from "@vuu-ui/vuu-utils";
import { ReactNode } from "react";
import { useAutoLoginToVuuServer } from "./useAutoLoginToVuuServer";

const getServerAPI = () => ConnectionManager.serverAPI;

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
