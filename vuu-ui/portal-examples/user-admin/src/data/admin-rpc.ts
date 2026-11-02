import type { DataSource } from "@vuu-ui/vuu-data-types";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { isRpcError } from "@vuu-ui/vuu-utils";
import { createContext, useContext } from "react";
import { errorMessage } from "./admin-contract";

/** The USER_ADMIN RPCs this module writes with. */
export type AdminRpcName =
  | "addClientRole"
  | "addGroup"
  | "addUser"
  | "assignGroupRole"
  | "assignUserToGroup"
  | "getUserModuleAccessOptions"
  | "removeGroupRole"
  | "removeUserFromGroup"
  | "setUserModuleAccess"
  | "updateUser";

export type AdminRpcParams = Record<string, VuuRowDataItemType>;

export type AdminRpc = (
  rpcName: AdminRpcName,
  params: AdminRpcParams,
) => Promise<unknown>;

/**
 * Calls a USER_ADMIN RPC on the viewport of `dataSource`, which must be
 * subscribed. Every USER_ADMIN table serves every RPC.
 */
export const callAdminRpc = async (
  dataSource: Pick<DataSource, "rpcRequest"> | undefined,
  rpcName: AdminRpcName,
  params: AdminRpcParams,
) => {
  if (!dataSource?.rpcRequest) {
    throw new Error(
      `Backend contract unavailable: the ${rpcName} RPC is not supported.`,
    );
  }
  const result = await dataSource.rpcRequest({
    type: "RPC_REQUEST",
    rpcName,
    params,
  });
  if (!result) {
    throw new Error(`The ${rpcName} RPC returned no result.`);
  }
  if (isRpcError(result)) throw new Error(result.errorMessage);
  return result.data;
};

const unavailable: AdminRpc = async (rpcName) => {
  throw new Error(
    `Backend contract unavailable: the ${rpcName} RPC has no connection.`,
  );
};

export const AdminRpcContext = createContext<AdminRpc>(unavailable);

/** Calls USER_ADMIN RPCs over the module's shared connection. */
export const useAdminRpc = () => useContext(AdminRpcContext);

/** One write, described for the person making it. */
export interface AdminOperation {
  /** What the operation does, e.g. `Add trade to basket-trading-risk`. */
  label: string;
  params: AdminRpcParams;
  rpcName: AdminRpcName;
}

export interface OperationsResult {
  completed: AdminOperation[];
  /** The first operation that failed; later ones were not attempted. */
  failed?: { error: string; operation: AdminOperation };
  /** Operations not yet saved, starting with the failed one. */
  remaining: AdminOperation[];
}

/**
 * Runs `operations` in order and stops at the first failure, since later
 * operations may depend on earlier ones (e.g. a group must exist before
 * roles are added to it). The RPCs are not atomic: completed operations stay
 * saved when a later one fails.
 */
export const runOperations = async (
  rpc: AdminRpc,
  operations: readonly AdminOperation[],
): Promise<OperationsResult> => {
  const completed: AdminOperation[] = [];
  for (const [index, operation] of operations.entries()) {
    try {
      await rpc(operation.rpcName, operation.params);
      completed.push(operation);
    } catch (cause) {
      return {
        completed,
        failed: { error: errorMessage(cause), operation },
        remaining: operations.slice(index),
      };
    }
  }
  return { completed, remaining: [] };
};

/** A notification message for a partly saved set of operations. */
export const describeFailure = ({ completed, failed }: OperationsResult) =>
  failed
    ? `${failed.operation.label} failed: ${failed.error}${
        completed.length > 0
          ? ` ${completed.length} earlier ${completed.length === 1 ? "change was" : "changes were"} saved.`
          : ""
      }`
    : "";
