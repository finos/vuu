import { useCallback, useMemo, useRef, useState } from "react";
import { useSessionDataSource } from "@vuu-ui/vuu-data-react";
import type { DataSource, TableSchema } from "@vuu-ui/vuu-data-types";
import { useViewContext } from "@vuu-ui/vuu-layout";
import type { SelectionChangeHandler, TableConfig } from "@vuu-ui/vuu-table-types";
import type { SelectRowRequest } from "@vuu-ui/vuu-protocol-types";
import { useData } from "@vuu-ui/vuu-utils2";

const KEYCLOAK_ADMIN_MODULE = "KEYCLOAK_ADMIN";

const INTERNAL_COLUMN_NAMES = new Set([
  "vuuCreatedTimestamp",
  "vuuUpdatedTimestamp",
  "vuuMsg",
]);

type KeycloakAdminSchemas = {
  groups: TableSchema;
  roles: TableSchema;
  users: TableSchema;
};

type KeycloakAdminDataSources = {
  groups: DataSource;
  roles: DataSource;
  users: DataSource;
};

export type UserAdminHookResult = {
  dataSources: KeycloakAdminDataSources;
  drawerOpen: boolean;
  groupsConfig: TableConfig;
  handleUserSelectionChange: SelectionChangeHandler;
  rolesConfig: TableConfig;
  usersConfig: TableConfig;
};

const buildTableConfig = (schema: TableSchema): TableConfig => ({
  columnLayout: "fit",
  columns: schema.columns.filter(({ name }) => !INTERNAL_COLUMN_NAMES.has(name)),
  rowSeparators: true,
  zebraStripes: true,
});

export const useUserAdmin = (): UserAdminHookResult | undefined => {
  const { getServerAPI } = useData();
  const { getDataSource } = useSessionDataSource();
  const { id, title } = useViewContext();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [schemas, setSchemas] = useState<KeycloakAdminSchemas>();
  const groupsDataSourceRef = useRef<DataSource | undefined>(undefined);

  useMemo(async () => {
    const serverAPI = await getServerAPI();
    const [users, userGroupRoles, groupRoles] = await Promise.all([
      serverAPI.getTableSchema({ module: KEYCLOAK_ADMIN_MODULE, table: "users" }),
      serverAPI.getTableSchema({ module: KEYCLOAK_ADMIN_MODULE, table: "user_group_roles" }),
      serverAPI.getTableSchema({ module: KEYCLOAK_ADMIN_MODULE, table: "group_roles" }),
    ]);
    setSchemas({ groups: userGroupRoles, roles: groupRoles, users });
  }, [getServerAPI]);

  const dataSources = useMemo<KeycloakAdminDataSources | undefined>(() => {
    if (!schemas) return undefined;
    const sessionPrefix = `${id ?? "feature-user-admin"}-keycloak-admin`;
    const getColumns = (schema: TableSchema) => schema.columns.map(({ name }) => name);
    const groupsDataSource = getDataSource(`${sessionPrefix}-groups`, {
      bufferSize: 200,
      columns: getColumns(schemas.groups),
      table: schemas.groups.table,
      title,
      viewport: `${sessionPrefix}-groups`,
    });
    groupsDataSourceRef.current = groupsDataSource;
    return {
      groups: groupsDataSource,
      roles: getDataSource(`${sessionPrefix}-roles`, {
        bufferSize: 200,
        columns: getColumns(schemas.roles),
        table: schemas.roles.table,
        title,
        viewport: `${sessionPrefix}-roles`,
      }),
      users: getDataSource(`${sessionPrefix}-users`, {
        bufferSize: 200,
        columns: getColumns(schemas.users),
        table: schemas.users.table,
        title,
        viewport: `${sessionPrefix}-users`,
      }),
    };
  }, [getDataSource, id, schemas, title]);

  const usersConfig = useMemo(
    () => (schemas ? buildTableConfig(schemas.users) : undefined),
    [schemas],
  );

  const groupsConfig = useMemo<TableConfig | undefined>(
    () =>
      schemas
        ? {
            columnLayout: "fit",
            columns: schemas.groups.columns.map(({ name }) => ({
              name,
              hidden: name !== "group_name" && name !== "role_name",
            })),
            rowSeparators: true,
            zebraStripes: true,
          }
        : undefined,
    [schemas],
  );

  const rolesConfig = useMemo<TableConfig | undefined>(
    () =>
      schemas
        ? {
            columnLayout: "fit",
            columns: ["role_name", "group_name"].map((name) => ({
              name,
              hidden: false,
            })).concat(
              schemas.roles.columns
                .filter(({ name }) => name !== "role_name" && name !== "group_name")
                .map(({ name }) => ({ name, hidden: true }))
            ),
            rowSeparators: true,
            zebraStripes: true,
          }
        : undefined,
    [schemas],
  );

  const handleUserSelectionChange = useCallback<SelectionChangeHandler>(
    (selectionChange) => {
      if (selectionChange.type === "SELECT_ROW") {
        const { rowKey } = selectionChange as SelectRowRequest;
        setDrawerOpen(true);
        groupsDataSourceRef.current?.setFilter?.({ op: "=", column: "user_id", value: rowKey });
      } else if (
        selectionChange.type === "SELECT_ROW_RANGE"
      ) {
        setDrawerOpen(true);
      } else if (selectionChange.type === "DESELECT_ALL") {
        setDrawerOpen(false);
        groupsDataSourceRef.current?.clearFilter?.();
      }
    },
    [],
  );

  if (!dataSources || !usersConfig || !groupsConfig || !rolesConfig) {
    return undefined;
  }

  return { dataSources, drawerOpen, groupsConfig, handleUserSelectionChange, rolesConfig, usersConfig };
};
