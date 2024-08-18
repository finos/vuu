import { DataSourceContext, DataSourceContextProps } from "@finos/vuu-utils";
import { ReactNode, useContext } from "react";

export const DataSourceProvider = ({
  children,
  getServerAPI,
  isLocalData = true,
  VuuDataSource,
  vuuModuleNames,
}: Omit<DataSourceContextProps, "isLocalData"> & {
  children: ReactNode;
  isLocalData?: boolean;
}) => {
  return (
    <DataSourceContext.Provider
      value={{ isLocalData, vuuModuleNames, VuuDataSource, getServerAPI }}
    >
      {children}
    </DataSourceContext.Provider>
  );
};

export const useDataSource = () => useContext(DataSourceContext);
