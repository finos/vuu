import { useCallback, useMemo, useState } from "react";
import { useSessionDataSource } from "@vuu-ui/vuu-data-react";
import type { DataSource, TableSchema } from "@vuu-ui/vuu-data-types";
import { DockLayout, Drawer, useViewContext } from "@vuu-ui/vuu-layout";
import { Table } from "@vuu-ui/vuu-table";
import type { SelectionChangeHandler, TableConfig } from "@vuu-ui/vuu-table-types";
import { useData } from "@vuu-ui/vuu-utils2";
import "./UserAdmin.css";

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

const buildTableConfig = (schema: TableSchema): TableConfig => ({
  columnLayout: "fit",
  columns: schema.columns.filter(
    ({ name }) => !INTERNAL_COLUMN_NAMES.has(name),
  ),
  rowSeparators: true,
  zebraStripes: true,
});

const UserAdmin = () => {
  const { getServerAPI } = useData();
  const { getDataSource } = useSessionDataSource();
  const { id, title } = useViewContext();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [schemas, setSchemas] = useState<KeycloakAdminSchemas>();

  useMemo(async () => {
    const serverAPI = await getServerAPI();
    const [users, groups, roles] = await Promise.all([
      serverAPI.getTableSchema({ module: KEYCLOAK_ADMIN_MODULE, table: "users" }),
      serverAPI.getTableSchema({ module: KEYCLOAK_ADMIN_MODULE, table: "groups" }),
      serverAPI.getTableSchema({ module: KEYCLOAK_ADMIN_MODULE, table: "roles" }),
    ]);
    setSchemas({ groups, roles, users });
  }, [getServerAPI]);

  const dataSources = useMemo<KeycloakAdminDataSources | undefined>(() => {
    if (!schemas) {
      return undefined;
    }

    const sessionPrefix = `${id ?? "feature-user-admin"}-keycloak-admin`;
    const getColumns = (schema: TableSchema) => schema.columns.map(({ name }) => name);

    return {
      groups: getDataSource(`${sessionPrefix}-groups`, {
        bufferSize: 200,
        columns: getColumns(schemas.groups),
        table: schemas.groups.table,
        title,
        viewport: `${sessionPrefix}-groups`,
      }),
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

  const groupsConfig = useMemo(
    () => (schemas ? buildTableConfig(schemas.groups) : undefined),
    [schemas],
  );

  const rolesConfig = useMemo(
    () => (schemas ? buildTableConfig(schemas.roles) : undefined),
    [schemas],
  );

  const handleUserSelectionChange = useCallback<SelectionChangeHandler>(
    (selectionChange) => {
      if (
        selectionChange.type === "SELECT_ROW" ||
        selectionChange.type === "SELECT_ROW_RANGE"
      ) {
        setDrawerOpen(true);
      } else if (selectionChange.type === "DESELECT_ALL") {
        setDrawerOpen(false);
      }
    },
    [],
  );

  if (!dataSources || !usersConfig || !groupsConfig || !rolesConfig) {
    return <div className="vuuUserAdmin-loading">Loading keycloak admin tables...</div>;
  }

  return (
    <div className="vuuUserAdmin">
      <header className="vuuUserAdmin-header">
        <h1>User Admin</h1>
        <p>Users table with groups and roles in a right-side drawer</p>
      </header>

      <DockLayout className="vuuUserAdmin-layout">
        <Drawer
          inline
          open={drawerOpen}
          position="right"
          title="Groups and Roles"
          defaultOpen={false}
        >
          <div className="vuuUserAdmin-drawerContent">
            <section className="vuuUserAdmin-drawerSection">
              <h2>Groups</h2>
              <div className="vuuUserAdmin-tableContainer">
                <Table
                  config={groupsConfig}
                  dataSource={dataSources.groups}
                  height="100%"
                  navigationStyle="row"
                  renderBufferSize={20}
                  rowHeight={21}
                  width="100%"
                />
              </div>
            </section>
            <section className="vuuUserAdmin-drawerSection">
              <h2>Roles</h2>
              <div className="vuuUserAdmin-tableContainer">
                <Table
                  config={rolesConfig}
                  dataSource={dataSources.roles}
                  height="100%"
                  navigationStyle="row"
                  renderBufferSize={20}
                  rowHeight={21}
                  width="100%"
                />
              </div>
            </section>
          </div>
        </Drawer>

        <div className="vuuUserAdmin-main">
          <Table
            config={usersConfig}
            dataSource={dataSources.users}
            height="100%"
            navigationStyle="row"
            onSelectionChange={handleUserSelectionChange}
            renderBufferSize={20}
            rowHeight={21}
            width="100%"
          />
        </div>
      </DockLayout>
    </div>
  );
};

export default UserAdmin;
