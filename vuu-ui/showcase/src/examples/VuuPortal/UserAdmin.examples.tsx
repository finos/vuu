import { useData } from "@vuu-ui/core";
import {
  PortalModuleRegistryProvider,
  type RemoteModuleDescriptor,
} from "@vuu-ui/core/portal";
import type {
  DataSourceSubscribeCallback,
  SchemaColumn,
} from "@vuu-ui/vuu-data-types";
import { dataRowFactory, type DataRowFunc } from "@vuu-ui/vuu-table";
import type { DataRow } from "@vuu-ui/vuu-table-types";
import { Range } from "@vuu-ui/vuu-utils";
import { MemoryRouter } from "react-router-dom";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ModulePicker } from "user-admin";
import { GroupsEditForm } from "user-admin/src/components/groups-edit-form/GroupsEditForm";
import { RolesEditForm } from "user-admin/src/components/roles-edit-form/RolesEditForm";
import { UserEditForm } from "user-admin/src/components/user-edit-form/UserEditForm";
import { ModulePickerModuleDescriptor } from "user-admin/src/components/module-picker/ModulePicker";
import { ApplicationModelProvider } from "user-admin/src/data/ApplicationModelProvider";
import { ApplicationsPage } from "user-admin/src/pages/applications/ApplicationsPage";
import { GroupsPage } from "user-admin/src/pages/groups/GroupsPage";
import { RolesPage } from "user-admin/src/pages/roles/RolesPage";
import { UsersPage } from "user-admin/src/pages/users/UsersPage";
import { EditModeProvider } from "@vuu-ui/vuu-data-editing";

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
      console.log(`onSelectedModulesChange ${JSON.stringify(newSelectedModules, null, 2)}`)
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

const USER_COLUMNS = [
  "user_id",
  "username",
  "email",
  "first_name",
  "last_name",
  "enabled",
  "email_verified",
  "password_update_required",
  "last_login",
  "group_count",
  "role_count",
  "module_access",
  "module_access_count",
];

/** tags=data-consumer */
export const DefaultUserEditForm = () => {
  const { VuuDataSource } = useData();
  const [dataRow, setDataRow] = useState<DataRow>();
  const dataSource = useMemo(
    () =>
      new VuuDataSource({
        columns: USER_COLUMNS,
        table: { module: "USER_ADMIN", table: "users" },
      }),
    [VuuDataSource],
  );

  useEffect(() => {
    let active = true;
    let DataRow: DataRowFunc | undefined;
    const subscribe: DataSourceSubscribeCallback = (message) => {
      if (!active) return;
      if (message.type === "subscribed") {
        [DataRow] = dataRowFactory(
          message.columns,
          message.tableSchema.columns as readonly SchemaColumn[],
        );
      } else if (message.type === "subscribe-failed") {
        console.error(`User editor data source subscription failed: ${message.msg}`);
      } else if (message.type === "viewport-update" && message.rows?.[0]) {
        if (!DataRow) {
          console.error(
            "The user table sent rows before supplying its column metadata.",
          );
          return;
        }
        setDataRow(DataRow(message.rows[0]));
      }
    };

    void dataSource
      .subscribe({ range: Range(0, 1) }, subscribe)
      .catch((cause: unknown) => {
        if (active) {
          console.error("User editor data source subscription failed:", cause);
        }
      });

    return () => {
      active = false;
      dataSource.unsubscribe();
    };
  }, [dataSource]);


  return (
    <div style={{ width: 480, height: 800 }}>
      {dataRow ? (
        <AdminContext>
          <EditModeProvider>
            <UserEditForm dataRow={dataRow} dataSource={dataSource} />
          </EditModeProvider>
        </AdminContext>
      ) : (
        <p role="status">Loading user...</p>
      )}
    </div>
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

/** tags=data-consumer */
export const DefaultRolesEditPage = () => {
  const { VuuDataSource } = useData();
  const [dataRow, setDataRow] = useState<DataRow>();
  const dataSource = useMemo(
    () =>
      new VuuDataSource({
        columns: ROLE_COLUMNS,
        table: { module: "USER_ADMIN", table: "roles" },
      }),
    [VuuDataSource],
  );

  useEffect(() => {
    let active = true;
    let DataRow: DataRowFunc | undefined;
    const subscribe: DataSourceSubscribeCallback = (message) => {
      if (!active) return;
      if (message.type === "subscribed") {
        [DataRow] = dataRowFactory(
          message.columns,
          message.tableSchema.columns as readonly SchemaColumn[],
        );
      } else if (message.type === "subscribe-failed") {
        console.error(
          `Role editor data source subscription failed: ${message.msg}`,
        );
      } else if (message.type === "viewport-update" && message.rows?.[0]) {
        if (!DataRow) {
          console.error(
            "The role table sent rows before supplying its column metadata.",
          );
          return;
        }
        setDataRow(DataRow(message.rows[0]));
      }
    };

    void dataSource
      .subscribe({ range: Range(0, 1) }, subscribe)
      .catch((cause: unknown) => {
        if (active) {
          console.error("Role editor data source subscription failed:", cause);
        }
      });

    return () => {
      active = false;
      dataSource.unsubscribe();
    };
  }, [dataSource]);

  return (
    <div style={{ width: 480, height: 500 }}>
      {dataRow ? (
        <AdminContext>
          <EditModeProvider>
            <RolesEditForm dataRow={dataRow} dataSource={dataSource} />
          </EditModeProvider>
        </AdminContext>
      ) : (
        <p role="status">Loading role...</p>
      )}
    </div>
  );
};

/** tags=data-consumer */
export const DefaultRolesPage = () => (
  <AdminContext>
    <RolesPage />
  </AdminContext>
);

/** tags=data-consumer */
export const DefaultGroupsEditPage = () => {
  const { VuuDataSource } = useData();
  const [dataRow, setDataRow] = useState<DataRow>();
  const dataSource = useMemo(
    () =>
      new VuuDataSource({
        columns: GROUP_COLUMNS,
        table: { module: "USER_ADMIN", table: "groups" },
      }),
    [VuuDataSource],
  );

  useEffect(() => {
    let active = true;
    let DataRow: DataRowFunc | undefined;
    const subscribe: DataSourceSubscribeCallback = (message) => {
      if (!active) return;
      if (message.type === "subscribed") {
        [DataRow] = dataRowFactory(
          message.columns,
          message.tableSchema.columns as readonly SchemaColumn[],
        );
      } else if (message.type === "subscribe-failed") {
        console.error(
          `Group editor data source subscription failed: ${message.msg}`,
        );
      } else if (message.type === "viewport-update" && message.rows?.[0]) {
        if (!DataRow) {
          console.error(
            "The group table sent rows before supplying its column metadata.",
          );
          return;
        }
        setDataRow(DataRow(message.rows[0]));
      }
    };

    void dataSource
      .subscribe({ range: Range(0, 1) }, subscribe)
      .catch((cause: unknown) => {
        if (active) {
          console.error("Group editor data source subscription failed:", cause);
        }
      });

    return () => {
      active = false;
      dataSource.unsubscribe();
    };
  }, [dataSource]);

  return (
    <div style={{ width: 480, height: 600 }}>
      {dataRow ? (
        <AdminContext>
          <EditModeProvider>
            <GroupsEditForm dataRow={dataRow} dataSource={dataSource} />
          </EditModeProvider>
        </AdminContext>
      ) : (
        <p role="status">Loading group...</p>
      )}
    </div>
  );
};

/** tags=data-consumer */
export const DefaultGroupsPage = () => (
  <AdminContext>
    <GroupsPage />
  </AdminContext>
);
