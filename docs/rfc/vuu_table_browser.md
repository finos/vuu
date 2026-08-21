# Vuu Table Browser Requirements

## Status

Draft

## Implementation baseline

1. All implementation work MUST be performed on a feature branch created from
   the `ui-portal` branch.
2. The `ui-portal` branch's module registry, portal routing, remote-module
   loading, authentication, and multi-connection contracts MUST be treated as
   the implementation baseline.
3. The implementation MUST extend those contracts where required for
   `vuu-table-browser`; it MUST NOT recreate parallel portal infrastructure.

## Summary

The table-browser feature consists of two Module Federation layers:

- the higher-level `vuu-table-browser`, which discovers registered Vuu servers,
  builds navigation and owns routing;
- a reusable lower-level table remote, instantiated once for each activated Vuu
  server, which loads that server's table list and displays its selected table.

This separation ensures that the browser never opens or directly consumes a
remote Vuu connection. Each lower remote is wrapped in the host's existing
connection-scoped `RemoteModule` boundary.

The browser has a split-panel layout:

- a `VerticalNav` on the left, populated from the module registry;
- a main content area on the right, containing the selected `FilterTable`.

## Goals

- Discover available Vuu modules at runtime.
- Instantiate a connection-scoped lower remote lazily for each activated Vuu
  server.
- Register each lower remote's table list with the higher-level browser.
- Display data from a selected table with standard Vuu filtering and table
  interactions.
- Keep server-specific connections, metadata, and subscriptions isolated.
- Package and deploy both layers independently as Module Federation remotes.

## Non-goals

- Editing server data.
- Administering or configuring Vuu servers.
- Creating joins or combined views across Vuu servers.
- Persisting discovery results between browser sessions.
- Displaying more than one table at a time in the initial release.
- Defining or changing module-registry versioning. Registry version negotiation,
  compatibility policy, and schema evolution will be covered by a follow-up
  specification.
- Detecting or refreshing expired identity or Vuu access tokens. Token-expiry
  behavior will be covered by a follow-up change.
- Defining UI, retry, recovery, or user-action behavior for authentication,
  authorization, and token-exchange failures. Authentication failure handling
  will be covered by a follow-up change.

## Terminology

- **Registry module**: an entry returned by the existing portal module registry.
- **Connectable Vuu module**: a registry module whose `vuu` metadata can be
  normalized by the existing host `normalizeVuuAuthTarget` behavior.
- **Vuu server**: the WebSocket endpoint associated with a connectable Vuu
  module.
- **Table identity**: the Vuu table's `module` and `table` values.
- **Browser remote**: the higher-level Module Federation package named
  `vuu-table-browser`.
- **Table remote**: the reusable lower-level Module Federation remote that is
  packaged as `vuu-table-viewer`, scoped to one Vuu server, and able to display
  one selected table.
- **Table registration context**: a shared React context through which table
  remotes register and unregister table lists with the browser.

## Architecture requirements

1. The feature MUST be implemented as two separately built Module Federation
   remotes: the browser remote and the table remote.
2. The browser remote MUST own:
   - module-registry loading and filtering;
   - top-level and nested navigation;
   - React Router integration and selected-table state;
   - the table-registration provider;
   - creation and lifecycle of table-remote instances.
3. The browser remote MUST NOT call Vuu server APIs, create Vuu data sources, or
   consume a remote Vuu connection directly.
4. Each table-remote instance MUST be scoped to exactly one connectable registry
   module.
5. The browser MUST render each table remote through the existing host
   `RemoteModule` component, passing the registry entry's `vuu.connectionId`,
   `vuu.websocketUrl`, and optional `vuu.restUrl` as its dynamic connection
   configuration.
6. Rendering the host `RemoteModule` boundary MUST be the only action by which
   the browser initiates acquisition of a server connection.
7. On first expansion of a top-level item, the browser MUST create the
   corresponding table-remote instance without a selected table.
8. The table remote MUST load its table list, register that list with the
   browser, and render no table content until the browser supplies a selected
   table.
9. When the user selects a nested table, the browser MUST pass that table to the
   table-remote instance associated with the owning registry module.
10. Only the table remote for the selected table MUST render content in the main
    area. Other activated table remotes MUST remain available as non-visible
    table-list loaders.
11. An activated table-remote instance SHOULD remain mounted for the lifetime of
    the browser so its registered table list and host-managed connection scope
    can be reused.
12. Multiple activated table remotes MUST be able to coexist, each under its own
    host-owned connection scope.
13. The table remote is an implementation layer of the browser and MUST NOT
    appear as an independently selectable portal navigation feature.

## Table registration context

1. `VuuTableBrowser` MUST render a table-registration provider above both the
   navigation and all table-remote instances.
2. The provider MUST expose stable callbacks equivalent to:

   ```typescript
   interface TableRegistrationContextValue {
     registerTables(sourceId: string, tables: VuuTable[]): void;
     reportSourceStatus(
       sourceId: string,
       status: "loading" | "ready" | "error",
       message?: string,
     ): void;
     unregisterTables(sourceId: string): void;
   }
   ```

3. `sourceId` MUST identify the registry module, not only the Vuu table module,
   so identical table identities from different servers remain distinct.
   Source IDs MUST be unique within a browser instance.
4. Each table remote MUST consume the context and call `registerTables` after a
   successful `GET_TABLE_LIST` response.
5. Each table remote MUST use `reportSourceStatus` to publish its table-list
   loading, ready, and error state for the browser navigation.
6. A table remote MUST call `unregisterTables` when it is unmounted or when its
   source identity changes.
7. Re-registration for a source MUST atomically replace its previous table list.
8. Registrations and status reports from stale or unmounted table-remote
   instances MUST NOT modify navigation state.
9. The context definition MUST live in the shared singleton `@vuu-ui/core`
   package so both Module Federation remotes consume the same React context
   instance.
10. Missing provider usage MUST fail visibly during development rather than
   silently discarding a table list.

## Functional requirements

### 1. Module discovery

1. The browser MUST use the existing module registry used by the portal shell.
   It MUST NOT define or depend on a second discovery endpoint or schema.
2. The browser's own registry descriptor MUST provide `moduleRegistryUrl`.
3. On startup, the browser MUST use `useIdentityToken()` from `@vuu-ui/core`,
   then call `getRegisteredModules(moduleRegistryUrl, identityToken)` from
   `@vuu-ui/vuu-shell`, following the same flow as
   `vuu-ui/sample-apps/vuu-portal/src/App.tsx`.
4. `moduleRegistryUrl` MUST be supplied through the browser's registry metadata
   and MUST NOT be embedded in the production bundle.
5. A registry entry MUST have `vuu.connectionId` to be considered connectable.
6. A non-portal connection MUST provide both `vuu.restUrl` and
   `vuu.websocketUrl`.
7. A connection whose `connectionId` matches the portal connection MAY omit
   `restUrl` and `websocketUrl`; the host MUST inherit the portal endpoints.
8. The `vuu-table-browser` entry MUST NOT define `vuu.connectionId` or
   `vuu.websocketUrl`, because it has no dedicated Vuu server. This is valid
   metadata and MUST NOT be reported as a registry error.
9. The browser's own registry entry and any other non-connectable entries MUST
   be excluded from the server navigation.
10. Connection metadata MUST be normalized by the existing
   `normalizeVuuAuthTarget` contract. A non-portal entry that cannot be
   normalized is not browsable and MUST be excluded without failing the
   complete registry request.
11. Registry results MUST be rendered in ascending order by `title`.
12. The browser MUST provide loading, empty, and error states for module
   discovery.
13. A failed discovery request MUST offer a retry action without requiring the
   browser remote to be reloaded.
14. The browser MUST NOT implement a separate registry fetch or duplicate the
   identity-token and response-handling logic from `getRegisteredModules`.
15. `getRegisteredModules` MUST request a fresh module registry response on
   startup and retry using fetch semantics equivalent to `cache: "no-store"`.
   Neither the helper nor the browser may read a registry response from or
   write one to browser storage, service-worker caches, or application caches.

The browser consumes the portal registry response, logically equivalent to:

```typescript
interface RegistryModule {
  id: string;
  name: string;
  title: string;
  description: string;
  location: string;
  version: number;
  mfComponent: string;
  mfScope: string;
  mfUrl: string;
  path: string;
  moduleRegistryUrl?: string;
  vuu?: {
    connectionId: string;
    restUrl?: string;
    websocketUrl?: string;
  };
}

interface ModuleRegistryResponse {
  modules: RegistryModule[];
}
```

The browser's registry descriptor is expected to be equivalent to:

```json
{
  "name": "vuu-table-browser",
  "title": "Vuu Table Browser",
  "description": "Browse tables exposed by registered Vuu servers",
  "location": "/Developer Tools/Tables",
  "version": 1,
  "mfComponent": "VuuTableBrowser",
  "mfScope": "vuuTableBrowser",
  "mfUrl": "http://localhost:5009",
  "path": "/tools/tables/*",
  "moduleRegistryUrl": "/module-registry.json"
}
```

The descriptor intentionally has no `vuu` property.

### 2. Navigation

1. The left panel MUST use the `VerticalNav` component.
2. Each connectable Vuu module MUST create one top-level navigation item.
3. A top-level item MUST be expandable and collapsible.
4. Module items MUST initially be collapsed.
5. Expanding a module for the first time MUST create its table-remote instance
   under a host `RemoteModule` boundary configured from that registry entry.
6. While the connection and table-list request are in progress, the expanded
   item MUST display a loading state.
7. After the host connection becomes available, the table remote MUST send
   `GET_TABLE_LIST` to its scoped Vuu server.
8. The table remote MUST register the tables from `TABLE_LIST_RESP` through the
   table-registration context.
9. The browser MUST create one nested navigation item for each registered table
   beneath its owning registry module.
10. Nested table items MUST be sorted deterministically by Vuu module name and
   table name.
11. The nested item label SHOULD use the table name. If duplicate table names
    exist within the same registry module, the label MUST include the Vuu
    module name to disambiguate them.
12. Re-expanding a module MUST reuse its mounted table remote and registered
    table list. It MUST NOT create duplicate remote instances, connection
    acquisitions, or simultaneous duplicate `GET_TABLE_LIST` requests.
13. A connection or table-list failure reported by a table remote MUST be shown
    by the browser against the affected
    module and MUST provide a retry action. Failures in one module MUST NOT
    prevent other modules from being used.

### 3. Opening a table

1. Selecting a nested table item MUST mark it as the active navigation item.
2. Selecting a nested table item MUST navigate to that table's relative route.
3. The browser MUST pass the selected table identity to the existing table
   remote associated with its registry module.
4. The table remote MUST obtain the selected table's schema from the same scoped
   Vuu server that supplied its table list.
5. The table remote MUST create the table data source and viewport within that
   same host-provided connection scope.
6. The table remote MUST render a `FilterTable` bound to the selected table and
   its schema in the browser's main content area.
7. Selecting another table MUST replace the current table in the main content
   area.
8. The table MUST support the standard `FilterTable` capabilities available
   for a remote Vuu data source, including filtering, sorting, column
   configuration, and server-provided menu actions.
9. The content area MUST show an initial prompt before a table is selected.
10. The content area MUST show table-specific loading and error states.
11. If table loading fails, the selected navigation context MUST be retained and
   the user MUST be able to retry.
12. A stale response from an earlier selection MUST NOT replace a more recently
   selected table.
13. When a displayed table is replaced, its viewport subscription MUST be
   released according to the Vuu data-source lifecycle.

### 4. Host-owned multi-server connection management

1. The host MUST always own Vuu connection creation, authentication,
   connection state, reconnection, and disconnection.
2. The browser MUST use the shared host `RemoteModule` component to create each
   dynamically configured table-remote boundary.
3. The `RemoteModule` boundary MUST supply the table remote with the host's
   connection-management, authentication, and data contexts.
4. Neither remote MUST create a WebSocket, worker, connection manager, or
   authentication lifecycle of its own.
5. Host-managed connections MUST be keyed by `connectionId` and WebSocket URL.
6. The host MUST coalesce concurrent acquisition requests for the same
   connection and return the same scoped connection or server API.
7. Each distinct remote Vuu server connection MUST perform a separate token
   exchange against its normalized `restUrl`.
8. A Vuu access token obtained for one `connectionId` MUST NOT be reused to
   authenticate a different `connectionId`.
9. Repeated consumers of the same coalesced host connection MUST reuse that
   connection's exchanged session rather than performing duplicate exchanges.
10. Requests, schemas, data sources, viewports, and responses MUST remain scoped
   to their host-managed connection.
11. Two registry modules exposing identical Vuu table identities MUST still be
   treated as distinct table sources.
12. Expanding multiple modules MUST allow their host-managed connections to
   coexist.
13. A dropped connection MUST expose host connection state to its table remote,
    which MUST report a visible reconnect state for the browser to render.
14. The host MUST detect an unexpected WebSocket closure and perform
    reconnection using the host's connection retry policy.
15. Neither remote may implement its own WebSocket reconnection loop or retry
    schedule.
16. Reconnection MUST not route an existing or new subscription to a different
    registry module.
17. The host MUST monitor browser inactivity and disconnect server connections
    after the host-defined long-term inactivity threshold.
18. Inactivity disconnection MUST remain a host policy; neither remote may own
    the inactivity timer or directly initiate the disconnect.
19. A table-remote instance MAY remain mounted after an inactivity disconnect.
    Subsequent browser activity requiring that server MUST cause the host to
    reacquire or reconnect the same connection before the table remote resumes
    requests.
20. Loss or invalidation of the host identity session MUST immediately close all
    host-managed Vuu server connections and invalidate their exchanged Vuu
    sessions.
21. Neither remote may retain or use a Vuu access token after the identity
    session is lost.
22. On unmount, `VuuTableViewer` MUST unsubscribe every Vuu table subscription
    and release every viewport and data source it created.
23. On unmount, `VuuTableViewer` MUST call
    `unregisterTables(sourceId)` and prevent completion of pending requests from
    registering tables or updating source status.
24. On unmount, the surrounding host `RemoteModule`/
    `AuthenticationProvider` lifecycle MUST release the viewer's connection
    reference and notify the host that the connection has one fewer consumer.
25. Releasing the viewer's connection reference MUST NOT directly disconnect
    the connection. The host MUST apply reference-count, reconnection, and
    inactivity policies to decide whether and when to disconnect it.
26. Neither remote may directly disconnect an underlying host-managed
    connection. The host alone determines when an unused connection is
    disconnected.

### 5. Routing

1. The browser MUST use React Router to map the current URL to the selected
   registry module and Vuu table.
2. All routes declared by the browser remote MUST be relative routes. The
   browser remote MUST support being mounted beneath an arbitrary higher-level
   host route and MUST NOT assume that it owns the application root.
3. The browser remote MUST use the routing context supplied by the host. It MUST
   NOT create its own `BrowserRouter` or otherwise replace the host router.
4. The route MUST contain enough information to identify:
   - the registry module;
   - the table's Vuu module;
   - the table name.
5. Route segments MUST use stable identifiers and MUST be safely encoded and
   decoded.
6. The initial route contract SHOULD be equivalent to:

   ```text
   :registryModuleId/:vuuModule/:tableName
   ```

   For example, when nested beneath `/tools/table-browser/*`, a selected table
   may have the complete URL:

   ```text
   /tools/table-browser/orders-server/SIMUL/instruments
   ```

7. The index route MUST render the initial prompt without selecting a table.
8. Loading a valid table URL directly MUST discover the relevant module,
   expand its navigation item, mount its connection-scoped table remote, load
   its table list and schema, select the nested item, and open the `FilterTable`.
9. Browser back and forward navigation MUST update both the active navigation
   item and displayed table without creating duplicate connections or
   subscriptions.
10. If a route references an unknown registry module or a table not returned
    by that module's Vuu server, the content area MUST show a not-found state
    while leaving the rest of the browser usable.
11. Query parameters and route segments owned by higher-level host routes MUST
    be preserved.
12. The host and remote MUST share a compatible React Router instance through
    Module Federation.

## Layout and interaction requirements

1. The browser remote MUST fill the dimensions provided by its host container.
2. The minimum supported host size MUST be 800 CSS pixels wide by 600 CSS
   pixels high.
3. The left and right panels MUST remain usable at 800 by 600 CSS pixels and at
   all larger supported sizes.
4. The navigation panel MUST have a defined minimum and default width.
5. If the divider is resizable, its width SHOULD be retained for the lifetime
   of the mounted browser.
6. Long module and table names MUST not break the layout and MUST remain
   discoverable, for example through truncation with a tooltip.
7. Keyboard users MUST be able to expand modules, select tables, move between
   navigation items, and operate retry actions.
8. Loading, error, expanded, and selected states MUST be exposed to assistive
   technologies.

## Component requirements

1. Existing `@vuu-ui` and `@salt-ds` components MUST be used wherever they
   provide the required behavior.
2. New bespoke UI components MUST only be introduced where no suitable
   `@vuu-ui` or `@salt-ds` component exists or where composition of existing
   components cannot meet the requirement.
3. Bespoke components MUST follow the interaction, accessibility, theming, and
   styling conventions of the existing Vuu and Salt design systems.
4. The implementation MUST use the existing Vuu `VerticalNav`, `FilterTable`,
   remote data-source, layout, loading, notification, and error-display
   facilities where applicable rather than duplicating them.
5. Both remotes MUST consume host theme and density settings and MUST NOT
   introduce an independent design system or global style reset.

## Browser compatibility requirements

1. Both remotes MUST support browsers in the **Baseline Widely Available** set
   at the time of release.
2. The build target and compatibility configuration MUST represent Baseline
   Widely Available rather than a fixed list of browser versions.
3. Browsers outside Baseline Widely Available are not supported by the initial
   release.

## Module Federation requirements

1. The higher-level package and remote MUST be named `vuu-table-browser`.
2. The Module Federation scope (`mfScope`) MUST be `vuuTableBrowser`.
3. The exposed component name (`mfComponent`) MUST be `VuuTableBrowser`.
4. `VuuTableBrowser` MUST be a React component that can be mounted by a
   compatible Vuu host application.
5. The `vuu-table-browser` `package.json` MUST declare:

   ```json
   {
     "vuu": {
       "module-federation": {
         "exposes": {
           "./VuuTableBrowser": "src/VuuTableBrowser"
         }
       }
     }
   }
   ```

6. The portal MUST pass the browser entry's `moduleRegistryUrl` metadata to the
   exposed component.
7. The table remote MUST be separately built and exposed as a Module Federation
   remote that can be instantiated repeatedly with different connection and
   selected-table configuration.
8. The lower remote package MUST be named `vuu-table-viewer` and located at
   `vuu-ui/sample-apps/vuu-table-viewer`.
9. The lower remote Module Federation scope (`mfScope`) MUST be
   `vuuTableViewer`.
10. The lower remote exposed component (`mfComponent`) MUST be `VuuTableViewer`.
11. The `vuu-table-viewer` `package.json` MUST declare:

   ```json
   {
     "vuu": {
       "module-federation": {
         "exposes": {
           "./VuuTableViewer": "src/VuuTableViewer"
         }
       }
     }
   }
   ```

12. The `vuu-table-browser` development server MUST use port `5009`, the next
   available remote-development port after the existing remotes, and its local
   `mfUrl` MUST be `http://localhost:5009`.
13. The `vuu-table-viewer` development server MUST use port `5010`, the next
   available port after `vuu-table-browser`, and its local `mfUrl` MUST be
   `http://localhost:5010`.
14. For the initial release, `VuuTableBrowser` MUST hardcode the viewer loading
   metadata:

   ```typescript
   const vuuTableViewerRemote = {
     mfComponent: "VuuTableViewer",
     mfScope: "vuuTableViewer",
     mfUrl: "http://localhost:5010",
   };
   ```

15. The viewer loading metadata MUST be independent of registry entries and Vuu
   connection metadata. Dynamic discovery or configuration of the viewer
   remote is outside the initial release.
16. The browser MUST load table-remote instances through the shared host
   `RemoteModule` implementation rather than implementing nested Module
   Federation loading itself.
17. Both remotes MUST use the same centralized Module Federation shared-dependency
   configuration as every existing remote module on the `ui-portal` baseline,
   currently `getSharedDependencies("producer")` from
   `vuu-ui/scripts/module-federation-utils.ts`.
18. Neither remote may define a module-specific shared-dependency list. Any
   additional shared dependency required by either remote MUST be added to the
   centralized configuration and applied consistently to all remote modules
   and the host.
19. Neither remote may bundle a second incompatible instance of shared React
   context providers.
20. Both remotes SHOULD use the existing
   `vuu-ui/scripts/build-remote-module.ts` build script and declare their
   Module Federation settings through the existing `package.json`
   `vuu.module-federation` contract.
21. If either remote cannot use the existing script unchanged, the build
   capability MUST be added as a shared enhancement to that script. A
   remote-specific fork or parallel build script MUST NOT be introduced.
   The shared script MUST normalize approved `src/...` expose values to
   Rspack-compatible relative requests.
22. For both remotes, the canonical Module Federation entry point MUST be
   `${mfUrl}/mf-manifest.json`.
23. The host `RemoteModule` loader MUST register and load both remotes from that
   manifest rather than from a JavaScript remote-entry filename.
24. Both remote builds MUST use stable, unhashed artifact filenames, equivalent
   to the existing build script's `filenameHash: false`.
25. Cache invalidation MUST NOT depend on content hashes for this release.
26. Module Federation declaration generation MUST remain disabled for both
   remotes using `dts: false`.
27. The component contracts in this document MUST be maintained manually for
   this release.
28. Each build MUST produce a deployable remote manifest and associated
   assets.
29. The host MUST be able to load both remotes without rebuilding the host
   application.
30. Failure to load the browser remote or an individual table remote MUST be
   containable by the host's feature error boundary.
31. In production, both remotes MUST use the same public-path, asset-path, CORS,
   and Content Security Policy configuration as the existing remote modules.
   Neither remote requires a deployment-policy exception.
32. `react-router-dom` MUST be configured as a singleton shared dependency for
   the host and both remotes so router hooks consume the host routing context.

An initial public contract is expected to be equivalent to:

```typescript
export interface VuuTableBrowserProps {
  moduleRegistryUrl: string;
}

export default function VuuTableBrowser(
  props: VuuTableBrowserProps,
): JSX.Element;
```

The lower remote's public contract is expected to be equivalent to:

```typescript
export interface VuuTableViewerProps {
  selectedTable?: VuuTable;
  sourceId: string;
}

export default function VuuTableViewer(
  props: VuuTableViewerProps,
): JSX.Element | null;
```

The lower component receives its `connectionId`, `websocketUrl`, and optional
`restUrl` from the surrounding host `RemoteModule`/`AuthenticationProvider`
scope, not through `VuuTableViewerProps`.

Authentication and connection management MUST be supplied by the host's shared
runtime contexts rather than component props.

## Security and configuration requirements

1. HTTP and WebSocket endpoints MUST support secure `https` and `wss`
   deployments.
2. Authentication material MUST be supplied through an agreed runtime
   mechanism and MUST NOT be committed to source or embedded in built assets.
3. URLs and error messages displayed in the UI MUST not expose credentials,
   tokens, or other secrets.
4. HTTP CORS, WebSocket origin, and Content Security Policy settings MUST follow
   the existing remote-module deployment configuration.
5. Data returned by one server MUST never be sent to another registered server.

## Observability

The browser SHOULD make the following failures distinguishable in logs and in
user-facing states:

- browser-remote load failure;
- individual table-remote load failure;
- module registry failure or invalid response;
- Vuu WebSocket connection failure;
- `GET_TABLE_LIST` failure;
- table-schema request failure;
- table subscription or viewport failure.

Diagnostic logging MUST identify the registry module and operation but MUST
not include credentials or complete sensitive payloads.

## Testing requirements

The hardcoded registry at
`vuu-ui/sample-apps/vuu-portal/public/module-registry.json` MUST be used as the
canonical local-development and integration-test registry. Tests MAY extend or
override its entries for an individual scenario, but MUST retain the production
registry response shape.

The fixture MUST include:

- a `vuu-table-browser` descriptor with `moduleRegistryUrl` and no `vuu`
  connection metadata;
- at least two entries with distinct `vuu.connectionId` and
  `vuu.websocketUrl` values;
- at least one portal-scoped entry without dedicated endpoint URLs, to verify
  portal endpoint inheritance.

The integration-test configuration MUST provide loading metadata for
`vuu-table-viewer` using `mfScope: "vuuTableViewer"` and
`mfComponent: "VuuTableViewer"`.

Automated tests MUST cover:

- discovery loading, success, empty, invalid-response, failure, and retry
  states;
- reuse of the portal's existing `moduleRegistryUrl` loading contract;
- use of `useIdentityToken()` and
  `getRegisteredModules(moduleRegistryUrl, identityToken)` exactly as in the
  portal application;
- absence of a browser-specific registry fetch implementation;
- no-store registry requests on startup and retry;
- absence of module registry persistence in browser or application caches;
- acceptance of the `vuu-table-browser` descriptor without a `vuu` property;
- exclusion of the browser and other non-connectable registry entries from the
  navigation;
- portal endpoint inheritance and explicit endpoint requirements for non-portal
  connections;
- exclusion of non-portal entries without complete connection metadata;
- creation and deterministic ordering of top-level module items;
- creation of exactly one dynamically configured table remote on first
  expansion;
- absence of direct Vuu API, data-source, or connection usage in the browser
  remote;
- `GET_TABLE_LIST` execution by the connection-scoped table remote;
- table registration, atomic replacement, unregistration, and stale-instance
  protection through the shared context;
- table-list loading, ready, and error status reporting through the shared
  context;
- table-list caching and prevention of duplicate requests;
- nested table rendering and duplicate-name disambiguation;
- independent success and failure behavior for multiple servers;
- coexistence of multiple mounted table remotes under distinct host connection
  scopes;
- table remotes waiting without rendering content until selected;
- rendering the selected table through only its owning table remote;
- use of host-managed connections without remote-created WebSockets, workers,
  connection managers, or authentication flows;
- coalescing of repeated host connection acquisition requests;
- one token exchange per distinct remote Vuu server connection;
- prevention of Vuu access-token reuse across connection IDs;
- reuse of the exchanged session by consumers of the same host connection;
- host recovery from unexpected WebSocket closure without a remote-owned
  reconnect loop;
- host-initiated disconnection after long-term browser inactivity;
- transparent host reacquisition when activity resumes after an inactivity
  disconnect;
- closure of every Vuu connection and invalidation of exchanged sessions when
  the host identity session is lost;
- schema and data-source creation through the selected module's connection;
- rapid table selection with out-of-order responses;
- table loading, failure, retry, replacement, and cleanup;
- release of table-remote-created subscriptions without disconnecting
  host-managed connections;
- viewer unmount cleanup of subscriptions, viewports, data sources, table
  registration, pending requests, and the host connection reference;
- relative route generation when a table is selected;
- direct loading of a nested table route;
- synchronization of URL, navigation selection, and displayed table during
  browser back and forward navigation;
- unknown module and table routes;
- mounting beneath representative higher-level host routes;
- usable split-panel layout at exactly 800 by 600 CSS pixels;
- execution in representative Baseline Widely Available browsers;
- use of the same centralized shared-dependency configuration as existing
  remote modules;
- use of `vuu-ui/scripts/build-remote-module.ts` by both remotes, or a justified
  shared enhancement without a remote-specific build fork;
- keyboard navigation and accessible state;
- registry and Module Federation metadata using `mfScope: "vuuTableBrowser"`
  and `mfComponent: "VuuTableBrowser"`;
- browser expose mapping `./VuuTableBrowser` to `src/VuuTableBrowser`;
- loading both remotes through `${mfUrl}/mf-manifest.json`;
- stable, unhashed artifact filenames from both remote builds;
- disabled Module Federation type generation (`dts: false`) for both remotes;
- lower-remote metadata using package `vuu-table-viewer`,
  `mfScope: "vuuTableViewer"`, `mfComponent: "VuuTableViewer"`, and hardcoded
  local `mfUrl: "http://localhost:5010"`;
- viewer package location `vuu-ui/sample-apps/vuu-table-viewer` and expose
  mapping `./VuuTableViewer` to `src/VuuTableViewer`;
- successful nested loading of both Module Federation remotes in a
  representative host.

Integration testing MUST use at least two Vuu server endpoints and MUST verify
that requests and subscriptions cannot cross server boundaries.

## Acceptance criteria

The initial release is acceptable when:

1. A host loads `vuu-table-browser` using Module Federation scope
   `vuuTableBrowser` and component `VuuTableBrowser`.
2. The browser loads `vuu-table-viewer` using hardcoded `mfUrl`
   `http://localhost:5010`, Module Federation scope `vuuTableViewer`, and
   component `VuuTableViewer`.
3. The browser registry descriptor provides `moduleRegistryUrl` and no
   `vuu.connectionId` or `vuu.websocketUrl`.
4. The browser remote obtains the identity token with `useIdentityToken()` and
   loads the existing portal module registry with
   `getRegisteredModules(moduleRegistryUrl, identityToken)`.
5. The registry result creates one collapsed top-level navigation item per
   connectable Vuu module.
6. The browser itself and registry entries without Vuu connection metadata do
   not appear in the server navigation.
7. Portal-scoped entries may inherit portal endpoints; non-portal entries
   without explicit REST and WebSocket URLs do not appear in navigation.
8. Expanding a module creates one table remote under a host `RemoteModule`
   boundary configured with that registry entry's Vuu connection metadata.
9. The table remote sends `GET_TABLE_LIST`, registers the response through the
   shared context, and the browser shows the registered tables as nested items.
10. The browser makes no Vuu API calls and expanding one module does not activate
   any other module.
11. Selecting a table passes it to the owning table remote, which retrieves its
   schema and opens a functional `FilterTable` backed by the correct Vuu server.
12. Multiple table remotes and server connections can coexist without mixing
   registrations, metadata, requests, responses, or subscriptions.
13. All connections and authentication lifecycles are owned by the host; neither
   remote creates WebSockets, workers, or connection managers.
14. Each distinct remote Vuu server connection performs its own token exchange,
   and its Vuu access token is not reused for another connection ID.
15. The host reconnects unexpectedly broken WebSockets and disconnects
   connections after long-term browser inactivity.
16. Activity after an inactivity disconnect causes the host to reacquire the
   required connection without remounting the browser.
17. Loss of the identity session immediately closes every host-managed Vuu
   connection and invalidates its exchanged session.
18. Discovery, remote loading, non-authentication connection, table-list,
   schema, and subscription failures are visible, isolated, and retryable.
19. Repeated expansion and selection do not leak remote instances, connections,
   registrations, duplicate requests, or leave obsolete subscriptions active.
20. Unmounting `VuuTableViewer` unsubscribes all viewer-owned Vuu resources,
   unregisters its tables, and releases its host connection reference without
   directly disconnecting the connection.
21. Selecting a table updates the nested React Router route, and directly
   loading that URL restores the same module, navigation selection, and table.
22. The browser remote works beneath an arbitrary host route without creating a
   router or changing route state owned by the host.
23. The UI uses existing `@vuu-ui` and `@salt-ds` components wherever suitable.
24. The split-panel interface remains usable in an 800 by 600 CSS-pixel host.
25. Both remotes use the same centralized Module Federation shared dependencies
   as the other existing remote modules.
26. Both remotes use `vuu-ui/scripts/build-remote-module.ts`, with any required
   new capability implemented as a shared enhancement rather than a fork.
27. Both remotes use the same production public-path, asset-path, CORS, and
   Content Security Policy configuration as existing remote modules.

## Future considerations

Future versions MAY add:

- tabbed table browsing;
- multiple simultaneously displayed tables;
- persisted navigation state;
- persisted table state.
- dynamic discovery or runtime configuration of `vuu-table-viewer` Module
  Federation loading metadata.

These capabilities are outside the initial release and require separate
requirements before implementation.
