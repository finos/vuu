import type { PortalModuleRegistry } from "@vuu-ui/core";
import { simulModule } from "@vuu-ui/vuu-data-test";
import type { AdminConfig } from "../../user-admin/src/data/admin-contract";

const localUserAdminConfig = {
  clients: { table: { module: "USER_ADMIN", table: "clients" } },
  group_roles: { table: { module: "USER_ADMIN", table: "group_roles" } },
  groups: { table: { module: "USER_ADMIN", table: "groups" } },
  roles: { table: { module: "USER_ADMIN", table: "roles" } },
  user_group_roles: {
    table: { module: "USER_ADMIN", table: "user_group_roles" },
  },
  user_groups: { table: { module: "USER_ADMIN", table: "user_groups" } },
  users: { table: { module: "USER_ADMIN", table: "users" } },
} satisfies AdminConfig;

export const localPortalModuleRegistry = {
  modules: [
    {
      clientIdentifier: "local-user-admin",
      ComponentProps: { config: localUserAdminConfig },
      description: "Manage local users, groups and roles",
      enabled: true,
      id: "local-user-admin",
      location: "/Administration/Users",
      loginRole: "local",
      mfComponent: "UserAdminLocal",
      mfScope: "userAdmin",
      mfUrl: "http://localhost:5007",
      name: "user-admin",
      path: "/administration/users",
      title: "User administration",
      version: 1,
    },
    {
      clientIdentifier: "local-basket-trading",
      description: "Trade baskets with local test data",
      enabled: true,
      id: "local-basket-trading",
      location: "/Trading/Baskets",
      loginRole: "local",
      mfComponent: "VuuBasketTradingFeatureLocal",
      mfScope: "basketTrading",
      mfUrl: "http://localhost:5005",
      name: "basket-trading",
      path: "/trading/baskets",
      title: "Basket Trading",
      version: 1,
    },
    {
      clientIdentifier: "local-feature-filter-table",
      ComponentProps: {
        tableSchema: simulModule.schemas.instruments,
      },
      description: "Browse instruments with local test data",
      enabled: true,
      id: "local-feature-filter-table",
      location: "/Tables/Instruments",
      loginRole: "local",
      mfComponent: "VuuFilterTableFeatureLocal",
      mfScope: "filterTable",
      mfUrl: "http://localhost:5003",
      name: "feature-filter-table",
      path: "/tables/instruments",
      title: "Instruments",
      version: 1,
    },
  ],
} satisfies PortalModuleRegistry;
