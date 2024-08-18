import type {
  DataSourceConstructorProps,
  TableSchema,
} from "@finos/vuu-data-types";
import type { VuuTable, VuuTableList } from "@finos/vuu-protocol-types";
import { basketModule, basketSchemas, isBasketTable } from "../basket";
import { isSimulTable, simulModule, simulSchemas } from "../simul";
import { ReactNode } from "react";
import { DataSourceProvider } from "@finos/vuu-utils";

interface ServerAPI {
  getTableList: () => Promise<VuuTableList>;
  getTableSchema: (table: VuuTable) => Promise<TableSchema>;
}

const serverAPI: ServerAPI = {
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
};

const getServerAPI = async () => serverAPI;

class VuuDataSource {
  constructor({ table }: DataSourceConstructorProps) {
    if (isSimulTable(table)) {
      return simulModule.createDataSource(table.table);
    } else if (isBasketTable(table)) {
      return basketModule.createDataSource(table.table);
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
      VuuDataSource={VuuDataSource as any}
      vuuModuleNames={modules}
      getServerAPI={getServerAPI}
    >
      {children}
    </DataSourceProvider>
  );
};
