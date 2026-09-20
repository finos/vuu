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
                clientId: "vuu-portal",
                id: "client-portal",
                name: "VUU Portal",
            },
            role: {
                clientRole: true,
                containerId: "client-portal",
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
            role: {
                clientRole: true,
                containerId: "client-portal",
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
            role: {
                clientRole: true,
                containerId: "client-portal",
                id: "role-basket-trading-trade",
                name: "basket-trading-trade",
                roleDisplayName: "trade",
            },
        },
        {
            client: {
                clientId: "realm",
                id: "realm",
                name: "Realm",
            },
            role: {
                id: "role-admin",
                name: "admin",
                roleDisplayName: "admin",
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
                id: "role-basket-trading-trade",
                name: "basket-trading-trade",
                roleDisplayName: "trade",
            },
        },
        {
            group: {
                id: "group-admins",
                name: "administrators",
                groupDisplayName: "administrators",
                path: "/vuu/administrators",
            },
            role: {
                id: "role-admin",
                name: "admin",
                roleDisplayName: "admin",
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
        {
            id: "group-admins",
            name: "administrators",
            groupDisplayName: "administrators",
            path: "/vuu/administrators",
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
        {
            group: {
                id: "group-admins",
                name: "administrators",
                groupDisplayName: "administrators",
                path: "/vuu/administrators",
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
