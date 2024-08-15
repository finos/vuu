import { uuid } from "@finos/vuu-utils";
import { VuuTable } from "@finos/vuu-protocol-types";
import {
  RpcService,
  RpcServiceRequest,
  VuuModule,
  VuuModuleConstructorProps,
  withParams,
} from "../VuuModule";
import { SimulTableName } from "./simul-schemas";

/**
 * This is an example of how we might extend the built-in VuuModule to
 * implement a module-specific service in such a way that it can invoke
 * methods on the VuuModule.
 */
export class SimulModule extends VuuModule<SimulTableName> {
  constructor(props: VuuModuleConstructorProps) {
    super(props);
  }

  getServices(tableName: SimulTableName) {
    return this.#services.concat(super.getServices(tableName));
  }

  private openEditSession = async (rpcRequest: RpcServiceRequest) => {
    if (withParams(rpcRequest)) {
      const { namedParams, selectedRowIds } = rpcRequest;
      if (selectedRowIds && namedParams.table) {
        const table = namedParams.table as VuuTable;
        const dataTable = this.tables[table.table as SimulTableName];

        const sessionTable = this.createSessionTableFromSelectedRows(
          dataTable,
          selectedRowIds
        );

        const sessionTableName = `${table.table}-${uuid()}`;
        this.sessionTableMap[sessionTableName] = sessionTable;

        return {
          table: {
            module: "SIMUL",
            table: sessionTableName,
          },
          tableSchema: dataTable.schema,
          type: "VIEW_PORT_RPC_REPONSE",
          requestId: "request_id",
          rpcName: "openEditSession",
        };
      }
    }
  };

  #services: RpcService[] = [
    {
      rpcName: "openEditSession",
      service: this.openEditSession,
    },
  ];
}
