import type { TableSchema } from "@vuu-ui/vuu-data-types";
import type { Filter } from "@vuu-ui/vuu-filter-types";
import type { VuuRowDataItemType, VuuTable } from "@vuu-ui/vuu-protocol-types";

export type Entity = "users" | "groups" | "roles";
export type AdminTableName =
  | Entity
  | "clients"
  | "user_groups"
  | "group_roles"
  | "user_group_roles";
export type AdminRecord = Record<string, VuuRowDataItemType>;
export interface AdminTableContract {
  table?: VuuTable;
  /** Logical field name to server schema column name. */
  columns?: Record<string, string>;
}
export type AdminConfig = Partial<Record<AdminTableName, AdminTableContract>>;
export const EMPTY_CONFIG: AdminConfig = {};
export const ENTITY_LABELS: Record<Entity, string> = {
  users: "Users",
  groups: "Groups",
  roles: "Roles",
};
export const ENTITY_NAMES: Record<Entity, string> = {
  users: "User",
  groups: "Group",
  roles: "Role",
};
export const NAME_FIELDS = {
  users: "username",
  groups: "group_name",
  roles: "role_name",
  clients: "client_name",
} as const;
export const SEARCH_FIELDS = {
  users: ["username", "email", "first_name", "last_name"],
  groups: ["group_name", "group_path"],
  roles: ["role_name", "client_identifier", "client_name", "description"],
  clients: ["client_identifier", "client_name"],
} as const;
export const INTERNAL_COLUMNS = new Set([
  "vuuMsg",
  "vuu_action",
  "vuuCreatedTimestamp",
  "vuuUpdatedTimestamp",
]);

export const tableFor = (config: AdminConfig, name: AdminTableName): VuuTable =>
  config[name]?.table ?? { module: "KEYCLOAK_ADMIN", table: name };

export const columnFor = (
  config: AdminConfig,
  name: AdminTableName,
  field: string,
) => config[name]?.columns?.[field] ?? field;

export const hasField = (
  schema: TableSchema,
  config: AdminConfig,
  name: AdminTableName,
  field: string,
) =>
  schema.columns.some(
    ({ name: column }) => column === columnFor(config, name, field),
  );

export const requireField = (
  schema: TableSchema,
  config: AdminConfig,
  name: AdminTableName,
  field: string,
) => {
  const column = columnFor(config, name, field);
  if (!hasField(schema, config, name, field)) {
    throw new Error(
      `${schema.table.module}.${schema.table.table} is missing required column "${column}".`,
    );
  }
  return column;
};

export interface AdminQuery {
  search?: string;
  equals?: { field: string; value: string | boolean };
}

const validateFilterValue = (value: string | boolean) => {
  // Vuu's filter grammar has no escaped string literal syntax.
  if (typeof value === "string" && /["\\\t\r\n]/.test(value)) {
    throw new Error(
      "Search values cannot contain double quotes, backslashes, tabs or line breaks.",
    );
  }
};

export const buildFilter = (
  schema: TableSchema,
  config: AdminConfig,
  name: AdminTableName,
  query: AdminQuery,
): Filter | undefined => {
  const filters: Filter[] = [];
  if (query.equals) {
    validateFilterValue(query.equals.value);
    filters.push({
      op: "=",
      column: requireField(schema, config, name, query.equals.field),
      value: query.equals.value,
    });
  }
  const search = query.search?.trim();
  if (search) {
    validateFilterValue(search);
    const fields =
      name in SEARCH_FIELDS
        ? SEARCH_FIELDS[name as keyof typeof SEARCH_FIELDS]
        : [];
    const searchFilters: Filter[] = fields
      .filter((field) => hasField(schema, config, name, field))
      .map((field) => ({
        op: "contains",
        column: columnFor(config, name, field),
        value: search,
      }));
    if (!searchFilters.length) {
      throw new Error(
        `No searchable columns are available in ${schema.table.table}.`,
      );
    }
    filters.push(
      searchFilters.length === 1
        ? searchFilters[0]
        : { op: "or", filters: searchFilters },
    );
  }
  return filters.length > 1 ? { op: "and", filters } : filters[0];
};

export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);
