import { RestDataSource, ConnectionManager } from "@finos/vuu-data-remote";
import { DataSourceProvider } from "@finos/vuu-utils";
import { ReactNode } from "react";

const getServerAPI = () => ConnectionManager.serverAPI;

export const RestDataSourceProvider = ({
  children,
  url,
}: {
  children: ReactNode;
  url: string;
}) => {
  // url is a static property
  RestDataSource.api = url;
  return (
    <DataSourceProvider
      VuuDataSource={RestDataSource}
      getServerAPI={getServerAPI}
      isLocalData={false}
    >
      {children}
    </DataSourceProvider>
  );
};
