import { useData } from "@vuu-ui/core";
import {
  PortalModuleRegistryProvider,
  type RemoteModuleDescriptor,
} from "@vuu-ui/core/portal";
import type { TableConfig } from "@vuu-ui/vuu-table-types";
import {
  createMemoryRouter,
  MemoryRouter,
  RouterProvider,
} from "react-router-dom";
import { type ReactNode, useCallback, useMemo, useState } from "react";
import { ModulePicker } from "user-admin";
import {
  CreateGroupForm,
  GroupEditForm,
} from "user-admin/src/components/groups-edit-form/GroupsEditForm";
import {
  CreateRoleForm,
  RoleEditForm,
} from "user-admin/src/components/roles-edit-form/RolesEditForm";
import { UserEditForm } from "user-admin/src/components/user-edit-form/UserEditForm";
import { ModulePickerModuleDescriptor } from "user-admin/src/components/module-picker/ModulePicker";
import { ApplicationModelProvider } from "user-admin/src/data/ApplicationModelProvider";
import { ApplicationsPage } from "user-admin/src/pages/applications/ApplicationsPage";
import { GroupsPage } from "user-admin/src/pages/groups/GroupsPage";
import { RolesPage } from "user-admin/src/pages/roles/RolesPage";
import { UsersPage } from "user-admin/src/pages/users/UsersPage";
import {
  USER_COLUMNS,
  USER_ROW_HEIGHT,
  usersTableConfig,
} from "user-admin/src/pages/users/usersTable";
import {
  TableEditorForm,
  TableEditorNewButton,
  TableEditorPlaceholder,
  TableEditorTable,
  TableWithEditForm,
} from "@vuu-ui/vuu-table-extras";
import UserAdmin from "user-admin/src/UserAdmin";

import "user-admin/src/UserAdmin.css";

const remoteModules: RemoteModuleDescriptor[] = [
  {
    clientIdentifier: "vuu-user-admin",
    description: "User administration",
    id: "user-admin",
    navLocation: "/Administration",
    accessRole: "user-admin-access",
    mfComponent: "UserAdmin",
    mfScope: "userAdmin",
    mfUrl: "http://localhost:5001/user-admin/mf-manifest.json",
    name: "user-admin",
    path: "/administration/users",
    title: "User Admin",
    version: 1,
  },
  {
    clientIdentifier: "vuu-module-admin",
    description: "Module administration",
    id: "module-admin",
    navLocation: "/Administration",
    accessRole: "module-admin-access",
    mfComponent: "ModuleAdmin",
    mfScope: "moduleAdmin",
    mfUrl: "http://localhost:5001/module-admin/mf-manifest.json",
    name: "module-admin",
    path: "/administration/modules",
    title: "Module Admin",
    version: 1,
  },
  {
    clientIdentifier: "vuu-basket-trading",
    description: "Basket trading",
    id: "basket-trading",
    navLocation: "/Trading",
    accessRole: "basket-trading-access",
    mfComponent: "BasketTrading",
    mfScope: "basketTrading",
    mfUrl: "http://localhost:5001/basket-trading/mf-manifest.json",
    name: "basket-trading",
    path: "/trading/baskets",
    title: "Basket Trading",
    version: 1,
  },
];

/**
 * The context the admin pages expect: routing for `?application=`, the portal
 * module registry, and the application model derived from both.
 */
const AdminContext = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>
    <PortalModuleRegistryProvider remoteModules={remoteModules}>
      <ApplicationModelProvider>
        <div className="vuuIdentityAdmin">{children}</div>
      </ApplicationModelProvider>
    </PortalModuleRegistryProvider>
  </MemoryRouter>
);

const modulePickerModules: ModulePickerModuleDescriptor[] = remoteModules.map(
  ({ accessRole, title }) => ({
    label: title,
    name: accessRole,
    permissions: [],
    selectedPermissions: [],
  }),
);

export const DefaultModulePicker = () => {
  const [selectedModules, setSelectedModules] = useState<
    ModulePickerModuleDescriptor[]
  >([]);

  const onSelectedModulesChange = useCallback(
    (newSelectedModules: ModulePickerModuleDescriptor[]) => {
      console.log(
        `onSelectedModulesChange ${JSON.stringify(newSelectedModules, null, 2)}`,
      );
      setSelectedModules(newSelectedModules);
    },
    [],
  );

  return (
    <ModulePicker
      allModules={modulePickerModules}
      style={{ width: 300 }}
      selectedModules={selectedModules}
      onSelectedModulesChange={onSelectedModulesChange}
    />
  );
};

/**
 * UserEditForm renders within a TableEditorForm, editing the row selected in
 * the TableEditorTable alongside it.
 */
/** tags=data-consumer */
export const DefaultUserEditForm = () => {
  const { VuuDataSource } = useData();
  const dataSource = useMemo(
    () =>
      new VuuDataSource({
        columns: USER_COLUMNS,
        table: { module: "USER_ADMIN", table: "users" },
      }),
    [VuuDataSource],
  );
  const config = useMemo(() => usersTableConfig({ compact: true }), []);

  return (
    <AdminContext>
      <TableWithEditForm dataSource={dataSource}>
        <div style={{ display: "flex", gap: 16, height: 800 }}>
          <div style={{ flex: "1 1 auto", minWidth: 0 }}>
            <TableEditorTable config={config} rowHeight={USER_ROW_HEIGHT} />
          </div>
          <div style={{ flex: "0 0 480px" }}>
            <TableEditorPlaceholder>Select a user</TableEditorPlaceholder>
            <TableEditorForm>
              <UserEditForm />
            </TableEditorForm>
          </div>
        </div>
      </TableWithEditForm>
    </AdminContext>
  );
};

/** tags=data-consumer */
export const DefaultUsersPage = () => (
  <AdminContext>
    <UsersPage />
  </AdminContext>
);

/** tags=data-consumer */
export const DefaultApplicationsPage = () => (
  <AdminContext>
    <ApplicationsPage />
  </AdminContext>
);

const ROLE_COLUMNS = [
  "role_id",
  "role_name",
  "role_display_name",
  "client_id",
  "client_identifier",
  "client_name",
  "description",
  "group_count",
];
const GROUP_COLUMNS = [
  "group_id",
  "group_display_name",
  "group_path",
  "parent_group_id",
  "user_count",
  "role_count",
];

const ROLE_TABLE_CONFIG: TableConfig = {
  columns: [
    { name: "role_name", label: "Role", width: 220 },
    { name: "client_identifier", label: "Client", width: 180 },
    { name: "group_count", label: "Groups", width: 100 },
  ],
  columnLayout: "fit",
};

/**
 * RoleEditForm renders within a TableEditorForm, editing the row selected
 * in the TableEditorTable alongside it. CreateRoleForm is shown instead
 * while a role is being created.
 */
/** tags=data-consumer */
export const DefaultRolesEditPage = () => {
  const { VuuDataSource } = useData();
  const dataSource = useMemo(
    () =>
      new VuuDataSource({
        columns: ROLE_COLUMNS,
        table: { module: "USER_ADMIN", table: "roles" },
      }),
    [VuuDataSource],
  );

  return (
    <AdminContext>
      <TableWithEditForm dataSource={dataSource}>
        <div style={{ display: "flex", gap: 16, height: 800 }}>
          <div
            style={{
              display: "flex",
              flex: "1 1 auto",
              flexDirection: "column",
              gap: 8,
              minWidth: 0,
            }}
          >
            <TableEditorNewButton style={{ alignSelf: "flex-start" }}>
              Create role
            </TableEditorNewButton>
            <TableEditorTable config={ROLE_TABLE_CONFIG} />
          </div>
          <div style={{ flex: "0 0 480px" }}>
            <TableEditorPlaceholder>Select a role</TableEditorPlaceholder>
            <TableEditorForm>
              <RoleEditForm />
            </TableEditorForm>
            <CreateRoleForm />
          </div>
        </div>
      </TableWithEditForm>
    </AdminContext>
  );
};

/** tags=data-consumer */
export const DefaultRolesPage = () => (
  <AdminContext>
    <RolesPage />
  </AdminContext>
);

const GROUP_TABLE_CONFIG: TableConfig = {
  columns: [
    { name: "group_display_name", label: "Group", width: 200 },
    { name: "user_count", label: "Members", width: 100 },
    { name: "role_count", label: "Roles", width: 100 },
  ],
  columnLayout: "fit",
};

/**
 * GroupEditForm renders within a TableEditorForm, editing the row selected
 * in the TableEditorTable alongside it. CreateGroupForm is shown instead
 * while a group is being created.
 */
/** tags=data-consumer */
export const DefaultGroupsEditPage = () => {
  const { VuuDataSource } = useData();
  const dataSource = useMemo(
    () =>
      new VuuDataSource({
        columns: GROUP_COLUMNS,
        table: { module: "USER_ADMIN", table: "groups" },
      }),
    [VuuDataSource],
  );

  return (
    <AdminContext>
      <TableWithEditForm dataSource={dataSource}>
        <div style={{ display: "flex", gap: 16, height: 800 }}>
          <div
            style={{
              display: "flex",
              flex: "1 1 auto",
              flexDirection: "column",
              gap: 8,
              minWidth: 0,
            }}
          >
            <TableEditorNewButton style={{ alignSelf: "flex-start" }}>
              Create group
            </TableEditorNewButton>
            <TableEditorTable config={GROUP_TABLE_CONFIG} />
          </div>
          <div style={{ flex: "0 0 480px" }}>
            <TableEditorPlaceholder>Select a group</TableEditorPlaceholder>
            <TableEditorForm>
              <GroupEditForm />
            </TableEditorForm>
            <CreateGroupForm />
          </div>
        </div>
      </TableWithEditForm>
    </AdminContext>
  );
};

/** tags=data-consumer */
export const DefaultGroupsPage = () => (
  <AdminContext>
    <GroupsPage />
  </AdminContext>
);

/** The complete Identity Admin module, as mounted by the portal. */
export const DefaultUserAdmin = () => {
  const router = useMemo(
    () =>
      createMemoryRouter(
        [
          {
            path: "/admin/*",
            element: (
              <PortalModuleRegistryProvider remoteModules={remoteModules}>
                <div style={{ height: "100vh" }}>
                  <UserAdmin />
                </div>
              </PortalModuleRegistryProvider>
            ),
          },
        ],
        { initialEntries: ["/admin/overview"] },
      ),
    [],
  );
  return <RouterProvider router={router} />;
};
