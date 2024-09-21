import { ConnectionManager, VuuDataSource } from "@finos/vuu-data-remote";
import { DataSourceProvider } from "@finos/vuu-utils";
import { ReactNode } from "react";

const getServerAPI = () => ConnectionManager.serverAPI;

export const VuuDataSourceProvider = ({
  children,
}: {
  children: ReactNode;
}) => (
  <DataSourceProvider
    VuuDataSource={VuuDataSource}
    getServerAPI={getServerAPI}
    isLocalData={false}
  >
    {children}
  </DataSourceProvider>
);
