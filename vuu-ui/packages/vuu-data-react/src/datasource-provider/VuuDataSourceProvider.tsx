import { ConnectionManager, VuuDataSource } from "@finos/vuu-data-remote";
import { DataSourceProvider } from "@finos/vuu-utils";
import { ReactNode } from "react";
import { useAutoLoginToVuuServer } from "./useAutoLoginToVuuServer";

const getServerAPI = () => ConnectionManager.serverAPI;

export const VuuDataSourceProvider = ({
  authenticate,
  autoLogin = false,
  children,
  websocketUrl,
}: {
  authenticate?: boolean;
  autoLogin?: boolean;
  children: ReactNode;
  websocketUrl?: string;
}) => {
  useAutoLoginToVuuServer({
    authenticate,
    autoLogin,
    websocketUrl,
  });
  return (
    <DataSourceProvider
      VuuDataSource={VuuDataSource}
      getServerAPI={getServerAPI}
      isLocalData={false}
    >
      {children}
    </DataSourceProvider>
  );
};
