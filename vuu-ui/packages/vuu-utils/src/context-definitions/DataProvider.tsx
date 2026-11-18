import { ReactNode, useContext } from "react";
import { DataContext, DataContextProps } from "./DataContext";

/**
 * @deprecated Use `DataProvider` from `@vuu-ui/core`. It uses a different React
 * context from this one, which core's components read.
 */
export const DataProvider = ({
  children,
  getServerAPI,
  isLocalData = true,
  VuuDataSource,
}: Omit<DataContextProps, "isLocalData"> & {
  children: ReactNode;
  isLocalData?: boolean;
}) => {
  return (
    <DataContext.Provider value={{ isLocalData, VuuDataSource, getServerAPI }}>
      {children}
    </DataContext.Provider>
  );
};

/**
 * @deprecated Use `useData` from `@vuu-ui/core`. It uses a different React
 * context from this one, which core's components read.
 */
export const useData = () => useContext(DataContext);
