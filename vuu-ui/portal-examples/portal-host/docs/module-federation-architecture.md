# Module Federation Architecture

```mermaid
flowchart LR
    user([User])

    subgraph browser["Browser"]
        portal["portal-host<br/>Module federation host<br/>Keycloak public client"]
        userAdmin["user-admin<br/>Separate permissions"]
        moduleAdmin["module-admin<br/>Separate permissions"]
        basketTrading["basket-trading<br/>Separate permissions"]

        portal -->|loads and hosts| userAdmin
        portal -->|loads and hosts| moduleAdmin
        portal -->|loads and hosts| basketTrading
    end

    nginx["Nginx<br/>Serves host and remote modules<br/>at separate URLs"]
    keycloak["Keycloak<br/>Authentication and authorization"]

    subgraph servers["VUU servers"]
        portalServer["vuu-portal VUU server<br/>Confidential Keycloak client"]
        discoveryModule["Module discovery<br/>Included in vuu-portal server"]
        registry["Module registry<br/>Returned by LOGIN_SUCCESS"]
        userAdminServer["vuu-user-admin<br/>Dedicated VUU server<br/>Confidential Keycloak client"]
        basketServer["vuu-basket-trading<br/>Dedicated VUU server<br/>Confidential Keycloak client"]

        portalServer --- discoveryModule
        discoveryModule -->|provides| registry
    end

    user -->|opens portal| nginx
    nginx -->|serves host bundle| portal
    nginx -->|serves remote bundle| userAdmin
    nginx -->|serves remote bundle| moduleAdmin
    nginx -->|serves remote bundle| basketTrading

    portal <-->|login, logout and token refresh| keycloak
    portal -->|portal VUU connection| portalServer
    userAdmin -->|VUU tables and RPCs| userAdminServer
    moduleAdmin -->|views module entries| discoveryModule
    basketTrading -->|basket-trading VUU connection| basketServer
    portalServer -->|LOGIN_SUCCESS| portal

    portalServer <-->|server-side authentication<br/>and permission checks| keycloak
    userAdminServer <-->|server-side authentication<br/>and permission checks| keycloak
    basketServer <-->|server-side authentication<br/>and permission checks| keycloak

    classDef infrastructure fill:#e8eef7,stroke:#355070,color:#111;
    classDef frontend fill:#e9f5db,stroke:#588157,color:#111;
    classDef backend fill:#fff3bf,stroke:#b08900,color:#111;
    classDef auth fill:#fce1e4,stroke:#9d0208,color:#111;

    class nginx infrastructure;
    class portal,userAdmin,moduleAdmin,basketTrading frontend;
    class portalServer,discoveryModule,userAdminServer,registry,basketServer backend;
    class keycloak auth;
```

The host authenticates the browser through its **public** Keycloak client. Each
VUU server authenticates server-side through its own **confidential** Keycloak
client. Permissions are assigned independently for the portal and each remote
module. `module-admin` shares the portal VUU server, while
`user-admin` uses its standalone VUU server.
