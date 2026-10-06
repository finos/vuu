import type { UserAdminSnapshot } from "@heswell/user-admin";

export const USER_ADMIN_INITIAL_SNAPSHOT: UserAdminSnapshot = {
  clients: [
    {
      clientId: "vuu-portal",
      description: "VUU portal",
      enabled: true,
      id: "client-portal",
      name: "VUU Portal",
    },
    {
      clientId: "vuu-user-admin",
      description: "User administration",
      enabled: true,
      id: "client-user-admin",
      name: "User Admin",
    },
    {
      clientId: "vuu-basket-trading",
      description: "Basket trading",
      enabled: true,
      id: "client-basket-trading",
      name: "Basket Trading",
    },
    {
      clientId: "vuu-module-admin",
      description: "Module administration",
      enabled: true,
      id: "client-module-admin",
      name: "Module Admin",
    },
    {
      clientId: "vuu-feature-filter-table",
      description: "Instrument tables",
      enabled: true,
      id: "client-feature-filter-table",
      name: "Instruments",
    },
  ],
  clientRoles: [
    {
      client: {
        clientId: "vuu-portal",
        id: "client-portal",
        name: "VUU Portal",
      },
      role: {
        clientRole: true,
        containerId: "client-portal",
        id: "role-user-admin-access",
        name: "user-admin-access",
        roleDisplayName: "access",
      },
    },
    {
      client: {
        clientId: "vuu-portal",
        id: "client-portal",
        name: "VUU Portal",
      },
      role: {
        clientRole: true,
        containerId: "client-portal",
        id: "role-feature-filter-table-access",
        name: "feature-filter-table-access",
        roleDisplayName: "access",
      },
    },
    {
      client: {
        clientId: "vuu-portal",
        id: "client-portal",
        name: "VUU Portal",
      },
      role: {
        clientRole: true,
        containerId: "client-portal",
        id: "role-module-admin-access",
        name: "module-admin-access",
        roleDisplayName: "access",
      },
    },
    {
      client: {
        clientId: "vuu-portal",
        id: "client-portal",
        name: "VUU Portal",
      },
      role: {
        clientRole: true,
        containerId: "client-portal",
        id: "role-basket-trading-access",
        name: "basket-trading-access",
        roleDisplayName: "access",
      },
    },
    {
      client: {
        clientId: "vuu-user-admin",
        id: "client-user-admin",
        name: "User Admin",
      },
      role: {
        clientRole: true,
        containerId: "client-user-admin",
        id: "role-user-admin-admin",
        name: "user-admin-admin",
        roleDisplayName: "admin",
      },
    },
    {
      client: {
        clientId: "vuu-module-admin",
        id: "client-module-admin",
        name: "Module Admin",
      },
      role: {
        clientRole: true,
        containerId: "client-module-admin",
        id: "role-module-admin-admin",
        name: "module-admin-admin",
        roleDisplayName: "admin",
      },
    },
    {
      client: {
        clientId: "vuu-basket-trading",
        id: "client-basket-trading",
        name: "Basket Trading",
      },
      role: {
        clientRole: true,
        containerId: "client-basket-trading",
        id: "role-basket-trading-trade",
        name: "basket-trading-trade",
        roleDisplayName: "trade",
      },
    },
  ],
  groupRoles: [
    {
      client: {
        clientId: "vuu-portal",
        id: "client-portal",
        name: "VUU Portal",
      },
      group: {
        id: "group-user-admin-read",
        name: "user-admin-read",
        groupDisplayName: "read",
        moduleAccessDefaultRoles: ["user-admin-access"],
        path: "/vuu/user-admin-read",
      },
      role: {
        id: "role-user-admin-access",
        name: "user-admin-access",
        roleDisplayName: "access",
      },
    },
    {
      client: {
        clientId: "vuu-portal",
        id: "client-portal",
        name: "VUU Portal",
      },
      group: {
        id: "group-feature-filter-table-read",
        name: "feature-filter-table-read",
        groupDisplayName: "read",
        moduleAccessDefaultRoles: ["feature-filter-table-access"],
        path: "/vuu/feature-filter-table-read",
      },
      role: {
        id: "role-feature-filter-table-access",
        name: "feature-filter-table-access",
        roleDisplayName: "access",
      },
    },
    {
      client: {
        clientId: "vuu-portal",
        id: "client-portal",
        name: "VUU Portal",
      },
      group: {
        id: "group-module-admin-read",
        name: "module-admin-read",
        groupDisplayName: "read",
        moduleAccessDefaultRoles: ["module-admin-access"],
        path: "/vuu/module-admin-read",
      },
      role: {
        id: "role-module-admin-access",
        name: "module-admin-access",
        roleDisplayName: "access",
      },
    },
    {
      client: {
        clientId: "vuu-portal",
        id: "client-portal",
        name: "VUU Portal",
      },
      group: {
        id: "group-basket-trading-read",
        name: "basket-trading-read",
        groupDisplayName: "read",
        moduleAccessDefaultRoles: ["basket-trading-access"],
        path: "/vuu/basket-trading-read",
      },
      role: {
        id: "role-basket-trading-access",
        name: "basket-trading-access",
        roleDisplayName: "access",
      },
    },
    {
      client: {
        clientId: "vuu-portal",
        id: "client-portal",
        name: "VUU Portal",
      },
      group: {
        id: "group-user-admin-admin",
        name: "user-admin-admin",
        groupDisplayName: "admin",
        path: "/vuu/user-admin-admin",
      },
      role: {
        id: "role-user-admin-access",
        name: "user-admin-access",
        roleDisplayName: "access",
      },
    },
    {
      client: {
        clientId: "vuu-user-admin",
        id: "client-user-admin",
        name: "User Admin",
      },
      group: {
        id: "group-user-admin-admin",
        name: "user-admin-admin",
        groupDisplayName: "admin",
        path: "/vuu/user-admin-admin",
      },
      role: {
        id: "role-user-admin-admin",
        name: "user-admin-admin",
        roleDisplayName: "admin",
      },
    },
    {
      client: {
        clientId: "vuu-portal",
        id: "client-portal",
        name: "VUU Portal",
      },
      group: {
        id: "group-module-admin-admin",
        name: "module-admin-admin",
        groupDisplayName: "admin",
        path: "/vuu/module-admin-admin",
      },
      role: {
        id: "role-module-admin-access",
        name: "module-admin-access",
        roleDisplayName: "access",
      },
    },
    {
      client: {
        clientId: "vuu-module-admin",
        id: "client-module-admin",
        name: "Module Admin",
      },
      group: {
        id: "group-module-admin-admin",
        name: "module-admin-admin",
        groupDisplayName: "admin",
        path: "/vuu/module-admin-admin",
      },
      role: {
        id: "role-module-admin-admin",
        name: "module-admin-admin",
        roleDisplayName: "admin",
      },
    },
    {
      client: {
        clientId: "vuu-portal",
        id: "client-portal",
        name: "VUU Portal",
      },
      group: {
        id: "group-basket-trading-trade",
        name: "basket-trading-trade",
        groupDisplayName: "trade",
        path: "/vuu/basket-trading-trade",
      },
      role: {
        id: "role-basket-trading-access",
        name: "basket-trading-access",
        roleDisplayName: "access",
      },
    },
    {
      client: {
        clientId: "vuu-basket-trading",
        id: "client-basket-trading",
        name: "Basket Trading",
      },
      group: {
        id: "group-basket-trading-trade",
        name: "basket-trading-trade",
        groupDisplayName: "trade",
        path: "/vuu/basket-trading-trade",
      },
      role: {
        id: "role-basket-trading-trade",
        name: "basket-trading-trade",
        roleDisplayName: "trade",
      },
    },
  ],
  groups: [
    {
      id: "group-user-admin-read",
      name: "user-admin-read",
      groupDisplayName: "read",
      moduleAccessDefaultRoles: ["user-admin-access"],
      path: "/vuu/user-admin-read",
    },
    {
      id: "group-module-admin-read",
      name: "module-admin-read",
      groupDisplayName: "read",
      moduleAccessDefaultRoles: ["module-admin-access"],
      path: "/vuu/module-admin-read",
    },
    {
      id: "group-basket-trading-read",
      name: "basket-trading-read",
      groupDisplayName: "read",
      moduleAccessDefaultRoles: ["basket-trading-access"],
      path: "/vuu/basket-trading-read",
    },
    {
      id: "group-feature-filter-table-read",
      name: "feature-filter-table-read",
      groupDisplayName: "read",
      moduleAccessDefaultRoles: ["feature-filter-table-access"],
      path: "/vuu/feature-filter-table-read",
    },
    {
      id: "group-user-admin-admin",
      name: "user-admin-admin",
      groupDisplayName: "admin",
      path: "/vuu/user-admin-admin",
    },
    {
      id: "group-module-admin-admin",
      name: "module-admin-admin",
      groupDisplayName: "admin",
      path: "/vuu/module-admin-admin",
    },
    {
      id: "group-basket-trading-trade",
      name: "basket-trading-trade",
      groupDisplayName: "trade",
      path: "/vuu/basket-trading-trade",
    },
  ],
  timestamp: 1_710_000_000_000,
  userGroups: [
    {
      group: {
        id: "group-user-admin-read",
        name: "user-admin-read",
        groupDisplayName: "read",
        moduleAccessDefaultRoles: ["user-admin-access"],
        path: "/vuu/user-admin-read",
      },
      user: {
        email: "alice@example.com",
        id: "user-alice",
        username: "alice",
      },
    },
    {
      group: {
        id: "group-module-admin-read",
        name: "module-admin-read",
        groupDisplayName: "read",
        moduleAccessDefaultRoles: ["module-admin-access"],
        path: "/vuu/module-admin-read",
      },
      user: {
        email: "bob@example.com",
        id: "user-bob",
        username: "bob",
      },
    },
    {
      group: {
        id: "group-basket-trading-read",
        name: "basket-trading-read",
        groupDisplayName: "read",
        moduleAccessDefaultRoles: ["basket-trading-access"],
        path: "/vuu/basket-trading-read",
      },
      user: {
        email: "alice@example.com",
        id: "user-alice",
        username: "alice",
      },
    },
  ],
  users: [
    {
      email: "alice@example.com",
      emailVerified: true,
      enabled: true,
      firstName: "Alice",
      id: "user-alice",
      lastName: "Admin",
      username: "alice",
    },
    {
      email: "bob@example.com",
      emailVerified: true,
      enabled: true,
      firstName: "Bob",
      id: "user-bob",
      lastName: "Builder",
      username: "bob",
    },
  ],
};
