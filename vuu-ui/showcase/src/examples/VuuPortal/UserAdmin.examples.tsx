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
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ModulePicker } from "user-admin";
import { UserEditForm } from "user-admin/src/components/user-edit-form/UserEditForm";
import { ModulePickerModuleDescriptor } from "user-admin/src/components/module-picker/ModulePicker";
import { UsersPage } from "user-admin/src/pages/users/UsersPage";
import { EditModeProvider } from "@vuu-ui/vuu-data-editing";

const remoteModules: RemoteModuleDescriptor[] = [
  {
    clientIdentifier: "vuu-user-admin",
    description: "User administration",
    id: "user-admin",
    location: "/Administration",
    loginRole: "user-admin-access",
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
    location: "/Administration",
    loginRole: "module-admin-access",
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
    location: "/Trading",
    loginRole: "basket-trading-access",
    mfComponent: "BasketTrading",
    mfScope: "basketTrading",
    mfUrl: "http://localhost:5001/basket-trading/mf-manifest.json",
    name: "basket-trading",
    path: "/trading/baskets",
    title: "Basket Trading",
    version: 1,
  },
];

const modulePickerModules: ModulePickerModuleDescriptor[] = remoteModules.map(
  ({ loginRole, title }) => ({
    label: title,
    name: loginRole,
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
        <PortalModuleRegistryProvider remoteModules={remoteModules}>
          <EditModeProvider>
            <UserEditForm dataRow={dataRow} dataSource={dataSource} />
          </EditModeProvider>
        </PortalModuleRegistryProvider>
      ) : (
        <p role="status">Loading user...</p>
      )}
    </div>
  );
};

/** tags=data-consumer */
export const DefaultUsersPage = () => {
  return (
    <PortalModuleRegistryProvider remoteModules={remoteModules}>
      <UsersPage />
    </PortalModuleRegistryProvider>
  );
};
