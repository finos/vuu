import type {
  DataSourceConfig,
  DataSourceConstructorProps,
  SessionDataSourceOverrides,
  ServerAPI,
} from "@vuu-ui/vuu-data-types";
import type { VuuTable } from "@vuu-ui/vuu-protocol-types";
import {
  DataProvider as CoreDataProvider,
  type LocalVuuServer,
} from "@vuu-ui/core";
import { DataProvider as LegacyDataProvider } from "@vuu-ui/vuu-utils";
import type { ReactNode } from "react";
import moduleContainer, {
  ensureVuuModule,
} from "../core/module/ModuleContainer";
import type { VuuModule } from "../core/module/VuuModule";
import tableContainer from "../core/table/TableContainer";

/**
 * Creates a Provider that installs both legacy and core data contexts,
 * backed by in-browser VuuModules. When `moduleNames` is supplied, only
 * those modules are visible; otherwise every registered module is.
 */
const createLocalDataSourceProvider = (moduleNames?: ReadonlySet<string>) => {
  const getModule = (moduleName: string) => {
    if (moduleNames && !moduleNames.has(moduleName)) {
      throw Error(
        `[LocalDataSourceProvider] module ${moduleName} is not available on this server`,
      );
    }
    return moduleContainer.get(moduleName);
  };

  const serverAPI: Pick<
    ServerAPI,
    "getTableList" | "getTableSchema" | "rpcCall"
  > = {
    getTableList: async () => {
      const tables: VuuTable[] = [];
      for (const moduleName of moduleNames ?? moduleContainer.moduleNames) {
        for (const tableName of getModule(moduleName).getTableList()) {
          tables.push(tableContainer.getTable(tableName).schema.table);
        }
      }
      return { tables };
    },
    getTableSchema: async ({ module, table }: VuuTable) => {
      return getModule(module).getTableSchema(table);
    },
    rpcCall: async () => {
      throw Error(
        "RpcCall no longer supported on LocalDataSourceProvider ServerAPI",
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
      session,
      sort,
      table,
      viewport,
      visualLink,
    }: DataSourceConstructorProps) {
      const config: DataSourceConfig & {
        session?: SessionDataSourceOverrides;
      } = {
        aggregations,
        columns,
        filterSpec,
        groupBy,
        session,
        sort,
        visualLink,
      };

      const module = getModule(table.module);
      // biome-ignore lint/correctness/noConstructorReturn: <This 'class' is acting as a factory for new local DataSources>
      return module.createDataSource(table.table, viewport, config);
    }
  }

  const DataSourceProvider = ({ children }: { children: ReactNode }) => {
    return (
      <LegacyDataProvider
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        VuuDataSource={VuuDataSource as any}
        getServerAPI={getServerAPI}
      >
        <CoreDataProvider
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          VuuDataSource={VuuDataSource as any}
          getServerAPI={getServerAPI}
        >
          {children}
        </CoreDataProvider>
      </LegacyDataProvider>
    );
  };

  return DataSourceProvider;
};

/** Data context covering every VuuModule registered in the browser. */
export const LocalDataSourceProvider = createLocalDataSourceProvider();

export interface LocalVuuServerOptions {
  /** Matches the `vuu.connectionId` of the modules this server serves. */
  connectionId: string;
  // biome-ignore lint/suspicious/noExplicitAny: Modules use different table-name unions.
  modules: VuuModule<any>[];
}

/**
 * Simulates a Vuu server in the browser, publishing the tables of the given
 * modules. Pass the result to a local-mode `AuthenticationProvider` as one of
 * its `localServers`.
 */
export const createLocalVuuServer = ({
  connectionId,
  modules,
}: LocalVuuServerOptions): LocalVuuServer => {
  modules.forEach(ensureVuuModule);
  return {
    connectionId,
    DataSourceProvider: createLocalDataSourceProvider(
      new Set(modules.map(({ name }) => name)),
    ),
  };
};
