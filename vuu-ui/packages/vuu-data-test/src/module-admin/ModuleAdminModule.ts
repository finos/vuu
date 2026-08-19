import {
  DEFAULT_MODULE_DEFINITIONS,
  MODULE_ADMIN_RPC,
  MODULE_NAV_ICONS,
  executeModuleAdminRpc,
  toManagedModules,
  type ManagedModule,
  type ModuleAccessRole,
  type ModuleAdminRpcName,
} from "@heswell/module-admin/contracts";
import type { TableSchema } from "@vuu-ui/vuu-data-types";
import {
  VuuModule,
  type RpcService,
  type ServiceHandler,
} from "../core/module/VuuModule";
import tableContainer from "../core/table/TableContainer";
import { buildDataColumnMapFromSchema, type Table } from "../Table";
import {
  MODULE_ADMIN_MODULE_NAME,
  MODULE_ADMIN_TABLE_SCHEMAS,
  type ModuleAdminTableName,
} from "./module-admin-schemas";
import {
  reconcileModuleAdminTables,
  type ModuleAdminSnapshot,
} from "./snapshot-projection";

type ModuleAdminTables = Record<ModuleAdminTableName, Table>;

const createTable = (tableName: ModuleAdminTableName) => {
  const schema = MODULE_ADMIN_TABLE_SCHEMAS[tableName] satisfies TableSchema;
  return tableContainer.createTable(
    schema,
    [],
    buildDataColumnMapFromSchema(schema),
  );
};

const createTables = (): ModuleAdminTables => ({
  modulePermissions: createTable("modulePermissions"),
  modules: createTable("modules"),
});

const INITIAL_TIMESTAMP = 1_710_000_000_000;

/** The child module `vuu-table-viewer` has no role and inherits its parent's. */
const INITIAL_ACCESS_ROLES: readonly ModuleAccessRole[] = [
  { moduleName: "moduleAdmin", role: "module-admin-access" },
  { moduleName: "userAdmin", role: "user-admin-access" },
  { moduleName: "basket-trading", role: "basket-trading-access" },
  { moduleName: "vuu-table-browser", role: "vuu-table-browser-access" },
];

/** Local-only examples: a disabled module without an access role. */
const EXAMPLE_MODULES: readonly ManagedModule[] = [
  {
    id: 6,
    parentModuleId: 0,
    name: "order-blotter",
    title: "Order blotter",
    description: "Monitor parent and child orders across all desks.",
    version: 3,
    enabled: false,
    location: "/Trading/Orders",
    path: "/trading/orders",
    mfComponent: "OrderBlotter",
    mfScope: "orderBlotter",
    mfUrl: "http://localhost:5009",
    navIconUrl: MODULE_NAV_ICONS.tables,
    vuuConnectionId: "orders",
    vuuWebsocketUrl: "wss://localhost:8095/websocket-orders",
    vuuRestUrl: "https://localhost:8447/api/authn",
    accessRole: "",
    created: INITIAL_TIMESTAMP,
    updated: INITIAL_TIMESTAMP,
  },
];

export const MODULE_ADMIN_INITIAL_SNAPSHOT: ModuleAdminSnapshot = {
  modules: [
    ...toManagedModules(
      DEFAULT_MODULE_DEFINITIONS,
      INITIAL_ACCESS_ROLES,
      INITIAL_TIMESTAMP,
    ),
    ...EXAMPLE_MODULES,
  ],
};

/**
 * In-browser MODULE_DISCOVERY server. Supports the module admin RPCs from
 * `@heswell/module-admin/contracts` on both tables; state is held in memory.
 */
export class ModuleAdminModule extends VuuModule<ModuleAdminTableName> {
  #modules: readonly ManagedModule[];
  #tables: ModuleAdminTables;

  constructor(
    snapshot: ModuleAdminSnapshot = MODULE_ADMIN_INITIAL_SNAPSHOT,
    private readonly now: () => number = Date.now,
  ) {
    super(MODULE_ADMIN_MODULE_NAME);
    this.#modules = snapshot.modules;
    this.#tables = createTables();
    reconcileModuleAdminTables(snapshot, this.#tables);
  }

  /** Current module state. */
  get modules() {
    return this.#modules;
  }

  get menus() {
    return {
      modulePermissions: undefined,
      modules: undefined,
    };
  }

  protected get includeDefaultServices() {
    return false;
  }

  get menuServices() {
    return undefined;
  }

  get schemas(): Record<ModuleAdminTableName, Readonly<TableSchema>> {
    return MODULE_ADMIN_TABLE_SCHEMAS;
  }

  private service =
    (rpcName: ModuleAdminRpcName): ServiceHandler =>
    async (request) => {
      try {
        if (request.type !== "RPC_REQUEST" || request.rpcName !== rpcName) {
          throw new Error(`Expected ${rpcName} RPC request`);
        }
        const { modules, result } = executeModuleAdminRpc(
          this.#modules,
          rpcName,
          request.params,
          this.now,
        );
        this.#modules = modules;
        reconcileModuleAdminTables({ modules }, this.#tables);
        return { data: result, type: "SUCCESS_RESULT" };
      } catch (error) {
        return {
          errorMessage:
            error instanceof Error
              ? error.message
              : "Module admin request failed",
          type: "ERROR_RESULT",
        };
      }
    };

  get services(): Record<ModuleAdminTableName, RpcService[]> {
    const services = (
      Object.keys(MODULE_ADMIN_RPC) as ModuleAdminRpcName[]
    ).map((rpcName) => ({ rpcName, service: this.service(rpcName) }));
    return {
      modulePermissions: services,
      modules: services,
    };
  }

  get tables() {
    return this.#tables;
  }

  get visualLinks() {
    return undefined;
  }
}

export const moduleAdminModule = new ModuleAdminModule();
