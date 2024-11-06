import { ReactNode, useContext } from "react";
import { DataSourceContext, DataSourceContextProps } from "./DataSourceContext";

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
export const useDataSourceExtensions = () => {
  const { dataSourceExtensions } = useContext(DataSourceContext);
  return dataSourceExtensions;
};
