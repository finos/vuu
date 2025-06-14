import { DataSource } from "@vuu-ui/vuu-data-types";
import { createContext, ReactNode, useContext } from "react";

export interface DataSourceContextProps {
  dataSource?: DataSource;
}

export const DataSourceContext = createContext<DataSourceContextProps>({
  dataSource: undefined,
});

export const DataSourceProvider = ({
  children,
  dataSource,
}: {
  children: ReactNode;
  dataSource: DataSource;
}) => {
  return (
    <DataSourceContext.Provider value={{ dataSource }}>
      {children}
    </DataSourceContext.Provider>
  );
};

export function useDataSource(throwIfNoDataSource: true): DataSource;
export function useDataSource(
  throwIfNoDataSource: false | undefined,
): DataSource | undefined;
export function useDataSource(throwIfNoDataSource = false) {
  const { dataSource } = useContext(DataSourceContext);
  if (dataSource) {
    return dataSource;
  } else if (throwIfNoDataSource) {
    throw Error(
      `[DataSOurceProvider] useDataSource,no DataSourceProvider has been declared `,
    );
  } else {
    console.warn(
      `[DataSourceProvider] useDataSource: no DataSourceProvider has been declared`,
    );
  }
}
