import type { DataSource } from "@vuu-ui/vuu-data-types";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { isRpcError } from "@vuu-ui/vuu-utils";

export const MODULE_ACCESS_OPTIONS_RPC = "getUserModuleAccessOptions";
export const MODULE_ACCESS_RECONCILE_RPC = "setUserModuleAccess";

export interface ModuleAccessGroup {
  groupId: string;
  groupName: string;
  groupPath?: string;
  roleId: string;
  roleName: string;
  privilege?: string;
  isDefault: boolean;
}

export interface ModuleAccessModule {
  clientIdentifier: string;
  loginRole: string;
  groups: ModuleAccessGroup[];
  selectedGroupId?: string;
}

export interface ModuleAccessAssignment {
  groupId: string;
  loginRole: string;
}

export interface UserModuleAccess {
  modules: ModuleAccessModule[];
  assignments: ModuleAccessAssignment[];
}

export const sortModuleAccessAssignments = (
  assignments: readonly ModuleAccessAssignment[],
) =>
  [...assignments].sort((left, right) =>
    left.loginRole.localeCompare(right.loginRole),
  );

export const equalModuleAccessAssignments = (
  left: readonly ModuleAccessAssignment[],
  right: readonly ModuleAccessAssignment[],
) =>
  JSON.stringify(sortModuleAccessAssignments(left)) ===
  JSON.stringify(sortModuleAccessAssignments(right));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const requiredString = (
  value: unknown,
  field: string,
  context: string,
): string => {
  if (typeof value !== "string" || !value) {
    throw new Error(
      `Backend contract unavailable: ${context} is missing "${field}".`,
    );
  }
  return value;
};

const optionalString = (value: unknown): string | undefined =>
  typeof value === "string" && value ? value : undefined;

const parseGroup = (value: unknown, index: number): ModuleAccessGroup => {
  if (!isRecord(value)) {
    throw new Error(
      `Backend contract unavailable: module access group ${index} is invalid.`,
    );
  }
  const context = `module access group ${index}`;
  if (typeof value.isDefault !== "boolean") {
    throw new Error(
      `Backend contract unavailable: ${context} is missing "isDefault".`,
    );
  }
  return {
    groupId: requiredString(value.groupId, "groupId", context),
    groupName: requiredString(value.groupName, "groupName", context),
    groupPath: optionalString(value.groupPath),
    roleId: requiredString(value.roleId, "roleId", context),
    roleName: requiredString(value.roleName, "roleName", context),
    privilege: optionalString(value.privilege),
    isDefault: value.isDefault,
  };
};

const parseModule = (value: unknown, index: number): ModuleAccessModule => {
  if (!isRecord(value)) {
    throw new Error(
      `Backend contract unavailable: module access module ${index} is invalid.`,
    );
  }
  const context = `module access module ${index}`;
  if (!Array.isArray(value.groups)) {
    throw new Error(
      `Backend contract unavailable: ${context} is missing "groups".`,
    );
  }
  const groups = value.groups.map(parseGroup);
  const selectedGroupId = optionalString(value.selectedGroupId);
  if (
    selectedGroupId &&
    !groups.some(({ groupId }) => groupId === selectedGroupId)
  ) {
    throw new Error(
      `Backend contract unavailable: ${context} selectedGroupId is not eligible.`,
    );
  }
  return {
    clientIdentifier: requiredString(
      value.clientIdentifier,
      "clientIdentifier",
      context,
    ),
    loginRole: requiredString(value.loginRole, "loginRole", context),
    groups,
    selectedGroupId,
  };
};

export const parseUserModuleAccess = (value: unknown): UserModuleAccess => {
  if (!isRecord(value) || !Array.isArray(value.modules)) {
    throw new Error(
      'Backend contract unavailable: module access response is missing "modules".',
    );
  }
  const modules = value.modules.map(parseModule);
  const assignments = modules.flatMap(({ loginRole, selectedGroupId }) =>
    selectedGroupId ? [{ loginRole, groupId: selectedGroupId }] : [],
  );
  return { modules, assignments };
};

const rpc = async (
  dataSource: Pick<DataSource, "rpcRequest">,
  rpcName: string,
  params: Record<string, VuuRowDataItemType>,
) => {
  if (!dataSource.rpcRequest) {
    throw new Error(
      "Backend contract unavailable: module access RPCs are not supported.",
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

export const loadUserModuleAccess = async (
  dataSource: Pick<DataSource, "rpcRequest">,
  userId: string,
) =>
  parseUserModuleAccess(
    await rpc(dataSource, MODULE_ACCESS_OPTIONS_RPC, { userId }),
  );

export const saveUserModuleAccess = async (
  dataSource: Pick<DataSource, "rpcRequest">,
  userId: string,
  assignments: readonly ModuleAccessAssignment[],
) => {
  const orderedAssignments = sortModuleAccessAssignments(assignments);
  await rpc(dataSource, MODULE_ACCESS_RECONCILE_RPC, {
    userId,
    assignments: JSON.stringify(orderedAssignments),
  });
};
