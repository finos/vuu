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

The portal and module-admin logical connections both use
`wss://localhost:8091/websocket-portal`. User-admin uses
`wss://localhost:8092/websocket-user-admin`, and basket-trading uses
`wss://localhost:8093/websocket-basket-trading`.

## Local portal

The local host keeps the same asynchronous Module Federation entry boundary and
the same `App`/`PortalShell` UI as the authenticated host. Its bootstrap calls
the federation runtime `init({ name: "host", remotes: [] })`, installs
`AuthenticationProvider` in local mode, and injects `LocalDataSourceProvider`
into `PortalShell`. It does not initialize Keycloak, exchange tokens, or open
VUU websocket connections.

The checked-in local registry loads the `module-admin`, `user-admin`,
`feature-filter-table`, and `basket-trading` manifests from ports 5002, 5003,
5005, and 5006. Their production exposures are unchanged; additional local
adapter exposures explicitly ensure `userAdminModule`, `basketModule`,
`simulModule`, or `moduleAdminModule` is registered and then export the
production feature. The local user-admin descriptor maps its tables to the
browser-only `USER_ADMIN` module; module-admin uses the browser-only
`MODULE_DISCOVERY` module.
`@vuu-ui/vuu-data-test` is a strict Module Federation singleton so the host
provider and all adapters resolve the same module container.

Build the local proof and all producer artifacts from `vuu-ui`:

```sh
npm run build:mf:local
```

The workspace `build:mf` script invokes the reusable `portal-build` CLI with
the project-level `portal-build-all.json`. That manifest declares the
`portal-host` package first and `module-admin` second, so the host and remote
are built in deterministic order. `npm run build:mf:local` passes `--local`;
the host uses its local entry and manifest while the remote still uses its
remote-module build. Use `npm run build:mf -- --target module-admin` to build
only the configured remote. The workspace prebuilds the tool distribution
before invoking the CLI, so the top-level entry point has no
portal-host-specific orchestration or Rsbuild implementation.

Remote modules use the same package with `"target": "remote-module"`. For
example, `module-admin/portal-build.json` declares its standalone entry,
output/public URL, exposed modules, shared dependencies, HTML title, and CORS
origins; its `build` script invokes the same `portal-build` CLI. Independent
portal applications can publish and consume this package without importing any
VUU repository-relative build script.

Serve the four generated artifacts in separate terminals:

```sh
npm --prefix portal-examples/feature-filter-table run start
npm --prefix portal-examples/basket-trading run start
npm --prefix portal-examples/user-admin run start
npm --prefix portal-examples/module-admin run start
npm --prefix portal-examples/portal-host run start:local
```

Open `http://localhost:5001`. The local build deliberately replaces the
`dist_portal/portal-host` artifact so an existing nginx mapping can serve it
without configuration changes. To rebuild only the local host, run
`npm run build:mf -- --target portal-host --local`. The existing
`npm run build:mf` or `portal-host` `build` command restores the authenticated
remote host.

When serving through nginx, map ports 5003, 5005, and 5006 to `user-admin`,
`feature-filter-table`, and `basket-trading` respectively, and
allow the host origin in each remote manifest response.
`vuu-table-viewer` retains port 5004 and is not part of this local proof.
