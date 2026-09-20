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
                path: "/vuu/user-admin-read",
            },
            role: {
                id: "role-user-admin-access",
                name: "user-admin-access",
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
                path: "/vuu/module-admin-read",
            },
            role: {
                id: "role-module-admin-access",
                name: "module-admin-access",
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
                path: "/vuu/basket-trading-read",
            },
            role: {
                id: "role-basket-trading-access",
                name: "basket-trading-access",
            },
        },
        {
            group: {
                id: "group-admins",
                name: "administrators",
                path: "/vuu/administrators",
            },
            role: {
                id: "role-admin",
                name: "admin",
            },
        },
    ],
    groups: [
        {
            id: "group-user-admin-read",
            name: "user-admin-read",
            path: "/vuu/user-admin-read",
        },
        {
            id: "group-module-admin-read",
            name: "module-admin-read",
            path: "/vuu/module-admin-read",
        },
        {
            id: "group-basket-trading-read",
            name: "basket-trading-read",
            path: "/vuu/basket-trading-read",
        },
        {
            id: "group-admins",
            name: "administrators",
            path: "/vuu/administrators",
        },
    ],
    timestamp: 1_710_000_000_000,
    userGroups: [
        {
            group: {
                id: "group-user-admin-read",
                name: "user-admin-read",
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
