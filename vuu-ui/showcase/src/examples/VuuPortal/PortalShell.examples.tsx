import {
  PortalShell,
  type RemoteModuleDescriptor,
} from "@vuu-ui/core/portal";

const remoteModules: RemoteModuleDescriptor[] = [
  {
    clientIdentifier: "vuu-user-admin",
    description: "User administration",
    id: "user-admin",
    location: "/Administration",
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
    location: "/Administration",
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
    location: "/Trading",
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

export const DefaultPortalShell = () => (
  <PortalShell  
    id="portal-demo"
    remoteModules={remoteModules}
    title="Portal Demo"
/>
);

