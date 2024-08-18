import type { ServerAPI } from "@finos/vuu-data-remote";
import type {
  DataSource,
  DataSourceConstructorProps,
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
    Pick<ServerAPI, "getTableList" | "getTableSchema">
  >;
}

const getServerAPI = () => {
  throw Error("no DataSourceProvider has been installed");
};

class NullDataSource {
  constructor() {
    throw Error("no DataSourceProvider has been installed");
  }
}

export const DataSourceContext = createContext<DataSourceContextProps>({
  isLocalData: false,
  getServerAPI,
  VuuDataSource: NullDataSource as any,
});
