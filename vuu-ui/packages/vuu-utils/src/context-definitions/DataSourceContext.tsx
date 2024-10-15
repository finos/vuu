import type {
  DataSource,
  DataSourceConstructorProps,
  ServerAPI,
} from "@finos/vuu-data-types";
import { createContext } from "react";

export type DataSourceConstructor = {
  new (props: DataSourceConstructorProps): DataSource;
};

export interface DataSourceContextProps {
  isLocalData: boolean;
  VuuDataSource: DataSourceConstructor;
  vuuModuleNames?: string[];
  getServerAPI: () => Promise<
    Pick<ServerAPI, "getTableList" | "getTableSchema" | "rpcCall">
  >;
}

const getServerAPI = () => {
  throw Error("no DataSourceProvider has been installed");
};

class NullDataSource {
  constructor(_: DataSourceConstructorProps) {
    throw Error("no DataSourceProvider has been installed");
  }
}

export const DataSourceContext = createContext<DataSourceContextProps>({
  isLocalData: false,
  getServerAPI,
  VuuDataSource: NullDataSource as DataSourceConstructor,
});
