import { ReactNode, useContext } from "react";
import { DataContext, DataContextProps } from "./DataContext";

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

export const useData = () => useContext(DataContext);
