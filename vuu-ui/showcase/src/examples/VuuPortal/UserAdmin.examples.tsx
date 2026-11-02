import {
  PortalModuleRegistryProvider,
  type RemoteModuleDescriptor,
} from "@vuu-ui/core/portal";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { useCallback, useMemo, useState } from "react";
import { ModulePicker } from "user-admin";
import type { ModulePickerModuleDescriptor } from "user-admin/src/components/module-picker/ModulePicker";
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

/** The complete Identity Admin module, mounted at /admin, opened at `entry`. */
const UserAdminAt = ({ entry }: { entry: string }) => {
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
        { initialEntries: [entry] },
      ),
    [entry],
  );
  return <RouterProvider router={router} />;
};

/** The complete Identity Admin module, as mounted by the portal. */
/** tags=data-consumer */
export const DefaultUserAdmin = () => <UserAdminAt entry="/admin/overview" />;

/** Application workflow: groups and roles, users and checks of one application. */
/** tags=data-consumer */
export const ApplicationWorkflow = () => (
  <UserAdminAt entry="/admin/applications/basket-trading" />
);

/** Application workflow, Users tab: batch group changes. */
/** tags=data-consumer */
export const ApplicationUsers = () => (
  <UserAdminAt entry="/admin/applications/basket-trading?tab=users" />
);

/** User workflow: create a user and give them application access. */
/** tags=data-consumer */
export const NewUser = () => <UserAdminAt entry="/admin/users/new" />;

/** tags=data-consumer */
export const Users = () => <UserAdminAt entry="/admin/users" />;
