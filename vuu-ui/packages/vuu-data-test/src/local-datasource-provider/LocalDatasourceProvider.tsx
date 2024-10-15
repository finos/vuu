import type {
  DataSourceConfig,
  DataSourceConstructorProps,
  ServerAPI,
} from "@finos/vuu-data-types";
import type {
  VuuCreateVisualLink,
  VuuRemoveVisualLink,
  VuuRpcMenuRequest,
  VuuRpcServiceRequest,
  VuuRpcViewportRequest,
  VuuTable,
} from "@finos/vuu-protocol-types";
import { basketModule, basketSchemas, isBasketTable } from "../basket";
import { isSimulTable, simulModule, simulSchemas } from "../simul";
import { ReactNode } from "react";
import { DataSourceProvider } from "@finos/vuu-utils";

const serverAPI: Pick<
  ServerAPI,
  "getTableList" | "getTableSchema" | "rpcCall"
> = {
  getTableList: async () => {
    return {
      tables: Object.values(simulSchemas)
        .concat(Object.values(basketSchemas))
        .map((schema) => schema.table),
    };
  },
  getTableSchema: async (vuuTable: VuuTable) => {
    if (isSimulTable(vuuTable)) {
      return simulSchemas[vuuTable.table];
    } else if (isBasketTable(vuuTable)) {
      return basketSchemas[vuuTable.table];
    } else {
      throw Error(
        `unsupported module/table ${vuuTable.module}/${vuuTable.table}`,
      );
    }
  },
  rpcCall: async <T = unknown,>(
    message:
      | VuuRpcServiceRequest
      | VuuRpcMenuRequest
      | VuuRpcViewportRequest
      | VuuCreateVisualLink
      | VuuRemoveVisualLink,
  ) => {
    if (
      message.type === "RPC_CALL" &&
      message.service === "TypeAheadRpcHandler"
    ) {
      const [vuuTable] = message.params;

      if (isSimulTable(vuuTable)) {
        const typeahead = simulModule.typeaheadHook();
        return typeahead(message.params) as T;
      } else if (isBasketTable(vuuTable)) {
        const typeahead = basketModule.typeaheadHook();
        return typeahead(message.params) as T;
      }
    }
    throw Error("LocalDataSource provider only handles TypeAhead rpc calls");
  },
};

const getServerAPI = async () => serverAPI;

class VuuDataSource {
  constructor({
    aggregations,
    columns,
    filterSpec,
    groupBy,
    sort,
    table,
    viewport,
    visualLink,
  }: DataSourceConstructorProps) {
    const config: DataSourceConfig = {
      aggregations,
      columns,
      filterSpec,
      groupBy,
      sort,
      visualLink,
    };

    if (isSimulTable(table)) {
      return simulModule.createDataSource(table.table, viewport, config);
    } else if (isBasketTable(table)) {
      return basketModule.createDataSource(table.table, viewport, config);
    } else {
      throw Error(`unsupported module/table ${table.module}/${table.table}`);
    }
  }
}

export const LocalDataSourceProvider = ({
  children,
  modules,
}: {
  children: ReactNode;
  modules: string[];
}) => {
  return (
    <DataSourceProvider
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      VuuDataSource={VuuDataSource as any}
      vuuModuleNames={modules}
      getServerAPI={getServerAPI}
    >
      {children}
    </DataSourceProvider>
  );
};
