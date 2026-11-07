import {
  managedModuleColumnValues,
  managedModulePermissionValues,
  type ManagedModule,
} from "@heswell/module-admin/contracts";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import type { Table } from "../Table";
import type { ModuleAdminTableName } from "./module-admin-schemas";

type Row = Array<bigint | VuuRowDataItemType>;
type Tables = Record<ModuleAdminTableName, Table>;

export type ModuleAdminSnapshot = {
  modules: readonly ManagedModule[];
};

const rowsEqual = (left: Row, right: Row) =>
  left.length === right.length &&
  left.every((value, index) => value === right[index]);

const toRow = (table: Table, values: Record<string, VuuRowDataItemType>) =>
  table.schema.columns.map(
    ({ name }) => values[name] ?? "",
  ) as VuuRowDataItemType[];

export const projectModuleAdminSnapshot = (
  snapshot: ModuleAdminSnapshot,
  tables: Tables,
): Record<ModuleAdminTableName, Row[]> => ({
  modulePermissions: managedModulePermissionValues(snapshot.modules).map(
    (values) => toRow(tables.modulePermissions, values),
  ),
  modules: snapshot.modules.map((module) =>
    toRow(tables.modules, managedModuleColumnValues(module)),
  ),
});

/** Brings the tables into line with the snapshot, emitting row-level updates. */
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
