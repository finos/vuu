import { getServerAPI, ServerAPI, VuuDataSource } from "@finos/vuu-data-remote";
import { DataSource, DataSourceConstructorProps } from "@finos/vuu-data-types";
import { createContext, ReactNode, useContext } from "react";

export type DataSourceConstructor = {
  new (props: DataSourceConstructorProps): DataSource;
};

export interface DataSourceContextProps {
  isLocalData: boolean;
  VuuDataSource: DataSourceConstructor;
  vuuModuleName?: string;
  getServerAPI: () => Promise<
    Pick<ServerAPI, "getTableList" | "getTableSchema">
  >;
}

const DataSourceContext = createContext<DataSourceContextProps>({
  isLocalData: false,
  getServerAPI,
  VuuDataSource,
});

/**
 * If a client is adding a DataSOurceProvider, it will ususlly be
 * to install local test data, so we default isLocalData to true
 */
export const DataSourceProvider = ({
  children,
  getServerAPI,
  isLocalData = true,
  VuuDataSource,
  vuuModuleName,
}: Omit<DataSourceContextProps, "isLocalData"> & {
  children: ReactNode;
  isLocalData?: boolean;
}) => {
  return (
    <DataSourceContext.Provider
      value={{ isLocalData, vuuModuleName, VuuDataSource, getServerAPI }}
    >
      {children}
    </DataSourceContext.Provider>
  );
};

export const useDataSource = () => useContext(DataSourceContext);
