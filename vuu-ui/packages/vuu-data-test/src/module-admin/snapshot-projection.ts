import {
  moduleDefinitionsToRows,
  modulePermissionsFor,
  type ModuleAccessRole,
  type ModuleDefinition,
  type ModulePermissionRow,
  type ModuleRow,
} from "@heswell/module-admin/contracts";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import type { Table } from "../Table";
import type { ModuleAdminTableName } from "./module-admin-schemas";

type Row = Array<bigint | VuuRowDataItemType>;
type Tables = Record<ModuleAdminTableName, Table>;

export type ModuleAdminSnapshot = {
  moduleAccessRoles: readonly ModuleAccessRole[];
  modules: readonly ModuleDefinition[];
  timestamp: number;
};

const rowsEqual = (left: Row, right: Row) =>
  left.length === right.length &&
  left.every((value, index) => value === right[index]);

const systemValues = (timestamp: number) => ({
  vuuCreatedTimestamp: timestamp,
  vuuMsg: "",
  vuuUpdatedTimestamp: timestamp,
});

const toRow = (table: Table, values: Record<string, VuuRowDataItemType>) =>
  table.schema.columns.map(
    ({ name }) => values[name] ?? "",
  ) as VuuRowDataItemType[];

const moduleValues = (
  [
    id,
    name,
    title,
    description,
    version,
    enabled,
    location,
    path,
    mfComponent,
    mfScope,
    mfUrl,
    vuuConnectionId,
    vuuWebsocketUrl,
    vuuRestUrl,
  ]: ModuleRow,
  timestamp: number,
) => ({
  ...systemValues(timestamp),
  description,
  enabled,
  id,
  location,
  mfComponent,
  mfScope,
  mfUrl,
  name,
  path,
  title,
  version,
  vuuConnectionId,
  vuuRestUrl,
  vuuWebsocketUrl,
});

const permissionValues = (
  [id, moduleId, role]: ModulePermissionRow,
  timestamp: number,
) => ({
  ...systemValues(timestamp),
  id,
  module_id: moduleId,
  role,
});

export const projectModuleAdminSnapshot = (
  snapshot: ModuleAdminSnapshot,
  tables: Tables,
): Record<ModuleAdminTableName, Row[]> => ({
  modulePermissions: modulePermissionsFor(
    snapshot.modules,
    snapshot.moduleAccessRoles,
  ).map((row) =>
    toRow(tables.modulePermissions, permissionValues(row, snapshot.timestamp)),
  ),
  modules: moduleDefinitionsToRows(snapshot.modules).map((row) =>
    toRow(tables.modules, moduleValues(row, snapshot.timestamp)),
  ),
});

export const reconcileModuleAdminTables = (
  snapshot: ModuleAdminSnapshot,
  tables: Tables,
) => {
  const projected = projectModuleAdminSnapshot(snapshot, tables);

  for (const tableName of Object.keys(tables) as ModuleAdminTableName[]) {
    const table = tables[tableName];
    const desiredRows = projected[tableName];
    const keyIndex = table.map[table.schema.key];
    const desiredKeys = new Set(
      desiredRows.map((row) => String(row[keyIndex])),
    );

    for (const existingRow of [...table.data]) {
      const key = String(existingRow[keyIndex]);
      if (!desiredKeys.has(key)) {
        table.delete(key);
      }
    }

    for (const row of desiredRows) {
      const key = String(row[keyIndex]);
      const existingRow = table.findByKey(key);
      if (existingRow === undefined) {
        table.insert(row);
      } else if (!rowsEqual(existingRow, row)) {
        table.updateRow(row);
      }
    }
  }
};
