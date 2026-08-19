import {
  MODULE_ADMIN_RPC,
  type CreateModuleRpcResult,
  type DeleteModuleRpcResult,
  type ModuleAdminRpcName,
  type ModuleConfig,
  type ModuleConfigChanges,
  type SetModuleEnabledRpcResult,
  type UpdateModuleRpcResult,
} from "@heswell/module-admin/contracts";
import type { DataSource } from "@vuu-ui/vuu-data-types";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { isRpcError } from "@vuu-ui/vuu-utils";

export interface ModuleAdminClient {
  createModule: (config: ModuleConfig) => Promise<CreateModuleRpcResult>;
  updateModule: (
    id: number,
    changes: ModuleConfigChanges,
    expectedVersion: number,
  ) => Promise<UpdateModuleRpcResult>;
  setModuleEnabled: (
    id: number,
    enabled: boolean,
  ) => Promise<SetModuleEnabledRpcResult>;
  deleteModule: (
    id: number,
    deleteChildren: boolean,
  ) => Promise<DeleteModuleRpcResult>;
}

/** Calls the module admin RPCs of module discovery via a table data source. */
export const createModuleAdminClient = (
  dataSource: Pick<DataSource, "rpcRequest">,
): ModuleAdminClient => {
  const call = async <T>(
    rpcName: ModuleAdminRpcName,
    params: Record<string, VuuRowDataItemType>,
  ): Promise<T> => {
    if (!dataSource.rpcRequest) {
      throw new Error("Module discovery does not support RPC requests");
    }
    const response = await dataSource.rpcRequest({
      params,
      rpcName: MODULE_ADMIN_RPC[rpcName],
      type: "RPC_REQUEST",
    });
    if (isRpcError(response)) {
      throw new Error(response.errorMessage);
    }
    return response.data as T;
  };

  return {
    createModule: (config) =>
      call("createModule", { module: JSON.stringify(config) }),
    deleteModule: (id, deleteChildren) =>
      call("deleteModule", { deleteChildren, id }),
    setModuleEnabled: (id, enabled) =>
      call("setModuleEnabled", { enabled, id }),
    updateModule: (id, changes, expectedVersion) =>
      call("updateModule", {
        changes: JSON.stringify(changes),
        expectedVersion,
        id,
      }),
  };
};
