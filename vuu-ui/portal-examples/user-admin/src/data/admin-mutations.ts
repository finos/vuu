import type { DataSource } from "@vuu-ui/vuu-data-types";
import type {
  VuuRpcServiceRequest,
  VuuRowDataItemType,
} from "@vuu-ui/vuu-protocol-types";
import { isRpcError } from "@vuu-ui/vuu-utils";
import {
  columnFor,
  type AdminConfig,
  type AdminRecord,
  type Entity,
} from "./admin-contract";

const fields: Record<Entity, Record<string, string>> = {
  users: {
    username: "username",
    email: "email",
    first_name: "firstName",
    last_name: "lastName",
    enabled: "enabled",
    email_verified: "emailVerified",
    temporary_password: "temporary_password",
  },
  groups: { group_name: "name" },
  roles: {
    role_name: "name",
    description: "description",
    client_id: "clientId",
  },
};

export const mutationFields = (entity: Entity) => Object.keys(fields[entity]);

export const buildMutation = (
  entity: Entity,
  values: AdminRecord,
  config: AdminConfig,
  original?: AdminRecord,
): Omit<VuuRpcServiceRequest, "context"> => {
  const params: Record<string, VuuRowDataItemType> = {};
  for (const [field, parameter] of Object.entries(fields[entity])) {
    const column = columnFor(config, entity, field);
    const value = values[column];
    if (value !== undefined && (!original || value !== original[column])) {
      if (field !== "temporary_password" || value !== "")
        params[parameter] = value;
    }
  }
  if (original) {
    const idField =
      entity === "users"
        ? "user_id"
        : entity === "groups"
          ? "group_id"
          : "role_id";
    const id = original[columnFor(config, entity, idField)];
    if (typeof id !== "string" || !id)
      throw new Error(`Cannot update ${entity}: missing ${idField}.`);
    params[
      entity === "users" ? "userId" : entity === "groups" ? "groupId" : "roleId"
    ] = id;
    if (entity === "roles") {
      const client = original[columnFor(config, entity, "client_id")];
      if (typeof client !== "string" || !client)
        throw new Error("Client roles require an owning client ID.");
      params.clientId = client;
    }
  } else {
    const required =
      entity === "users"
        ? ["username"]
        : entity === "roles"
          ? ["name", "clientId"]
          : ["name"];
    for (const parameter of required) {
      if (
        typeof params[parameter] !== "string" ||
        !String(params[parameter]).trim()
      ) {
        throw new Error(`${parameter} is required.`);
      }
    }
  }
  return {
    type: "RPC_REQUEST",
    rpcName:
      entity === "users"
        ? original
          ? "updateUser"
          : "addUser"
        : entity === "groups"
          ? original
            ? "updateGroup"
            : "addGroup"
          : original
            ? "updateRole"
            : "addClientRole",
    params,
  };
};

export const saveAdminEntity = async (
  dataSource: DataSource,
  entity: Entity,
  values: AdminRecord,
  config: AdminConfig,
  original?: AdminRecord,
) => {
  if (!dataSource.rpcRequest)
    throw new Error("This Vuu data source does not support identity RPCs.");
  const result = await dataSource.rpcRequest(
    buildMutation(entity, values, config, original),
  );
  if (!result) throw new Error("The identity mutation returned no result.");
  if (isRpcError(result)) throw new Error(result.errorMessage);
  return result;
};

export interface RelationshipChange {
  action: "add" | "remove";
  id: string;
  label: string;
  clientId?: string;
}

export const saveAdminRelationship = async (
  dataSource: DataSource,
  entity: "users" | "groups",
  config: AdminConfig,
  change: RelationshipChange,
  original: AdminRecord,
) => {
  if (!dataSource.rpcRequest)
    throw new Error("This Vuu data source does not support relationship RPCs.");
  const idField = entity === "users" ? "user_id" : "group_id";
  const id = original[columnFor(config, entity, idField)];
  const params: Record<string, VuuRowDataItemType> = {};
  if (typeof id === "string" && id) {
    params[entity === "users" ? "userId" : "groupId"] = id;
  } else {
    throw new Error(
      "A confirmed identity ID is required for relationship changes. Save the identity and reopen it first.",
    );
  }
  if (entity === "users") {
    params.groupId = change.id;
  } else {
    if (!change.clientId)
      throw new Error("Client-role assignments require an owning client ID.");
    params.roleId = change.id;
    params.clientId = change.clientId;
  }
  const rpcName =
    entity === "users"
      ? change.action === "add"
        ? "assignUserToGroup"
        : "removeUserFromGroup"
      : change.action === "add"
        ? "assignGroupRole"
        : "removeGroupRole";
  const result = await dataSource.rpcRequest({
    type: "RPC_REQUEST",
    rpcName,
    params,
  });
  if (!result) throw new Error("The relationship mutation returned no result.");
  if (isRpcError(result)) throw new Error(result.errorMessage);
};
