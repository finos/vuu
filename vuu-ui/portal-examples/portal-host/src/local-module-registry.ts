import type { PortalModuleRegistry } from "@vuu-ui/core";
import { simulModule } from "@vuu-ui/vuu-data-test";
import type { AdminConfig } from "../../user-admin/src/data/admin-contract";


export const dashBoardIcon =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWxheW91dC1kYXNoYm9hcmQgcHJldmlldy1pY29uIj48cmVjdCB3aWR0aD0iNyIgaGVpZ2h0PSI5IiB4PSIzIiB5PSIzIiByeD0iMSIvPjxyZWN0IHdpZHRoPSI3IiBoZWlnaHQ9IjUiIHg9IjE0IiB5PSIzIiByeD0iMSIvPjxyZWN0IHdpZHRoPSI3IiBoZWlnaHQ9IjkiIHg9IjE0IiB5PSIxMiIgcng9IjEiLz48cmVjdCB3aWR0aD0iNyIgaGVpZ2h0PSI1IiB4PSIzIiB5PSIxNiIgcng9IjEiLz48L3N2Zz4=";
export const ordersIcon =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWxvZ3MgcHJldmlldy1pY29uIj48cGF0aCBkPSJNMyA1aDEiLz48cGF0aCBkPSJNMyAxMmgxIi8+PHBhdGggZD0iTTMgMTloMSIvPjxwYXRoIGQ9Ik04IDVoMSIvPjxwYXRoIGQ9Ik04IDEyaDEiLz48cGF0aCBkPSJNOCAxOWgxIi8+PHBhdGggZD0iTTEzIDVoOCIvPjxwYXRoIGQ9Ik0xMyAxMmg4Ii8+PHBhdGggZD0iTTEzIDE5aDgiLz48L3N2Zz4=";
export const positionsIcon =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXdhbGxldC1jYXJkcyBwcmV2aWV3LWljb24iPjxwYXRoIGQ9Ik0zIDExaDMuNzVhMiAyIDAgMCAxIDEuNi44bC40NS42YTQgNCAwIDAgMCA2LjQgMGwuNDUtLjZhMiAyIDAgMCAxIDEuNi0uOEgyMSIvPjxwYXRoIGQ9Ik0zIDdoMTgiLz48cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHJ4PSIyIi8+PC9zdmc+";


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
      clientIdentifier: "vuu-module-admin",
      description: "Manage local module discovery entries",
      enabled: true,
      id: "local-module-admin",
      navIconUrl: positionsIcon,
      navLocation: "/Administration/Modules",
      accessRole: "module-admin-access",
      mfComponent: "ModuleAdminLocal",
      mfScope: "moduleAdmin",
      mfUrl: "http://localhost:5002",
      name: "module-admin",
      path: "/administration/modules",
      title: "Module administration",
      version: 1,
    },

    {
      clientIdentifier: "vuu-user-admin",
      ComponentProps: { config: localUserAdminConfig },
      description: "Manage local users, groups and roles",
      enabled: true,
      id: "local-user-admin",
      navIconUrl: dashBoardIcon,
      navLocation: "/Administration/Users",
      accessRole: "user-admin-access",
      mfComponent: "UserAdminLocal",
      mfScope: "userAdmin",
      mfUrl: "http://localhost:5003",
      name: "user-admin",
      path: "/administration/users",
      title: "User administration",
      version: 1,
    },
    {
      clientIdentifier: "vuu-table-browser",
      description: "Browse vuu tables",
      enabled: true,
      id: "vuu-table-browser",
      navIconUrl: positionsIcon,
      navLocation: "/Tables/Browse",
      accessRole: "vuu-table-browser-access",
      mfComponent: "VuuTableBrowser",
      mfScope: "VuuTableBrowser",
      mfUrl: "http://localhost:5004",
      name: "vuu-table-browser",
      path: "/tables/browse",
      title: "Vuu Table Browser",
      version: 1,
    },
    {
      clientIdentifier: "vuu-table-viewer",
      description: "Browse instruments with local test data",
      enabled: true,
      id: "vuu-table-viewer",
      navIconUrl: positionsIcon,
      navLocation: "/Table",
      accessRole: "vuu-table-viewer-access",
      mfComponent: "VuuTableViewer",
      mfScope: "VuuTableViewer",
      mfUrl: "http://localhost:5005",
      name: "vuu-table-viewer",
      path: "/tables/view",
      title: "Vuu Table",
      version: 1,
    },
    {
      clientIdentifier: "vuu-basket-trading",
      description: "Trade baskets with local test data",
      enabled: true,
      id: "local-basket-trading",
      navIconUrl: ordersIcon,
      navLocation: "/Trading/Baskets",
      accessRole: "basket-trading-access",
      mfComponent: "VuuBasketTradingFeatureLocal",
      mfScope: "basketTrading",
      mfUrl: "http://localhost:5006",
      name: "basket-trading",
      path: "/trading/baskets",
      title: "Basket Trading",
      version: 1,
    },
    {
      clientIdentifier: "vuu-feature-simple-div",
      description: "Try out saved state with usePersistentState",
      enabled: true,
      id: "local-feature-simple-div",
      navIconUrl: positionsIcon,
      navLocation: "/Examples/Saved state demo",
      accessRole: "feature-simple-div-access",
      mfComponent: "SimpleDivLocal",
      mfScope: "simpleDiv",
      mfUrl: "http://localhost:5007",
      name: "feature-simple-div",
      path: "/examples/saved-state-demo",
      title: "Saved state demo",
      version: 1,
    },
  ],
} satisfies PortalModuleRegistry;
