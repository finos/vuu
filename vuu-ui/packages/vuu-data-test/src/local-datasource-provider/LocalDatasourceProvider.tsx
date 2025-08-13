import type {
  DataSourceConfig,
  DataSourceConstructorProps,
  ServerAPI,
} from "@vuu-ui/vuu-data-types";
import type { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { DataProvider } from "@vuu-ui/vuu-utils";
import { ReactNode } from "react";
import moduleContainer from "../core/module/ModuleContainer";
import tableContainer from "../core/table/TableContainer";

const serverAPI: Pick<
  ServerAPI,
  "getTableList" | "getTableSchema" | "rpcCall"
> = {
  getTableList: async () => {
    const tables = moduleContainer.moduleNames.reduce<Array<VuuTable>>(
      (tableList, moduleName) => {
        const moduleTables = moduleContainer.get(moduleName).getTableList();
        moduleTables.forEach((tableName) => {
          const table = tableContainer.getTable(tableName);
          tableList.push(table.schema.table);
        });
        return tableList;
      },
      [],
    );
    return { tables };
  },
  getTableSchema: async ({ module, table }: VuuTable) => {
    return moduleContainer.get(module).getTableSchema(table);
  },
  rpcCall: async () => {
    throw Error(
      "RpcCall no longer supported on LocalDataSOurceProvider ServerAPI",
    );
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

    const module = moduleContainer.get(table.module);
    return module.createDataSource(table.table, viewport, config);
  }
}

export const LocalDataSourceProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  return (
    <DataProvider
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      VuuDataSource={VuuDataSource as any}
      getServerAPI={getServerAPI}
    >
      {children}
    </DataProvider>
  );
};
