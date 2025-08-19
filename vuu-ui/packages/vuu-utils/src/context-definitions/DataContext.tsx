import type {
  DataSource,
  DataSourceConstructorProps,
  ServerAPI,
  TableSchema,
} from "@vuu-ui/vuu-data-types";
import { createContext } from "react";

export type DataSourceConstructor = {
  new (props: DataSourceConstructorProps): DataSource;
};

export interface DataContextProps {
  VuuDataSource: DataSourceConstructor;
  dataSourceExtensions?: unknown;
  isLocalData: boolean;
  getServerAPI: () => Promise<
    Pick<ServerAPI, "getTableList" | "getTableSchema" | "rpcCall">
  >;
  /**
   * A tableSchema would normally be requested via the serverAPI.
   * schemas can be injected, in which case these 'local' schemas
   * will be returned from the getTableSchema API call.
   * The key is formed from concatenation of module and tableName
   * from VuuTable e.g 'SIMUL:instruments'
   */
  tableSchemas?: Record<string, TableSchema>;
}

const getServerAPI = () => {
  throw Error("no DataProvider has been installed");
};

class NullDataSourceConstructor {
  constructor(_: DataSourceConstructorProps) {
    throw Error("no DataProvider has been installed");
  }
}

export const DataContext = createContext<DataContextProps>({
  isLocalData: false,
  getServerAPI,
  VuuDataSource: NullDataSourceConstructor as DataSourceConstructor,
});
