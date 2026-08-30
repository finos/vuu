# Module Admin UI Requirements

## Purpose

Provide a simple module-federated administration feature that displays the modules known to VUU module discovery. Phase 1 is a read-only view of the VUU `modules` table.

## Scope

- Create the UI package at `vuu-ui/sample-apps/feature-module-admin`.
- Follow `vuu-ui/sample-apps/feature-user-admin` for package structure, federation setup, VUU data access, table configuration, and view sizing.
- Render one table only: `{ module: "MODULE_DISCOVERY", table: "modules" }`.

## Package and Federation Identity

- Package name: `feature-module-admin`.
- Primary component and default export: `ModuleAdmin`.
- Module Federation name: `moduleAdmin`.
- Exposed module: `"./ModuleAdmin": "./src/ModuleAdmin"`.
- Development port: `5008`, following the existing sample-feature port sequence.
- Declare the required VUU table in package metadata:

  ```json
  {
    "vuu": {
      "featureProps": {
        "vuuTables": [
          {
            "module": "MODULE_DISCOVERY",
            "table": "modules"
          }
        ]
      }
    }
  }
  ```

## Server and Data Contract

- Backend package: `packages/vuu-portal` in the `heswell/vuu-websocket`
  repository.
- Module discovery is installed in the portal VUU server, so this remote uses
  the host's `portal` connection.
- The UI must discover the schema from the connected VUU server and subscribe to the VUU table identified exactly by `{ module: "MODULE_DISCOVERY", table: "modules" }`.
- The expected server schema, in order, is:

  | Column | Type | Notes |
  | --- | --- | --- |
  | `id` | `int` | Key |
  | `name` | `string` |  |
  | `title` | `string` |  |
  | `description` | `string` |  |
  | `version` | `int` |  |
  | `enabled` | `boolean` |  |
  | `location` | `string` |  |
  | `mfComponent` | `string` |  |
  | `mfScope` | `string` |  |
  | `mfUrl` | `string` |  |

- Subscribe with all schema columns in server-provided order; do not duplicate the schema as the runtime source of column definitions.
- The server currently seeds `module-admin` and `user-admin` rows in an in-memory provider. Server-side changes are not persistent.
- Although `modules` exposes an edit-session service, phase 1 must not invoke it.
- The feature must not hard-code an endpoint or create its own connection; it
  must use the host-provided portal VUU connection scope and configuration.
- Do not fetch a module registry. The raw VUU table remains this screen's data
  source; portal remote discovery is supplied by `LOGIN_SUCCESS`.

## Data Access

- Obtain the server API through `useData().getServerAPI()`.
- Discover the table schema with the server API before creating the data source.
- Create the table subscription with `useSessionDataSource()`, using the discovered schema and all of its columns.
- Use a stable component-local identifier to scope data-source and viewport identifiers.
- Do not depend on `@vuu-ui/vuu-layout` or require a VUU view context.
- Reuse the host VUU session and lifecycle; do not instantiate a separate websocket client or data provider inside the federated feature.

## Table and Layout Behavior

- Render a standard `Table` from `@vuu-ui/vuu-table`.
- Use the discovered schema to construct the table configuration.
- Enable row separators and zebra stripes, consistent with `feature-user-admin`.
- Display the table read-only; row selection, if supplied by the standard table, must not trigger an admin action.
- The feature root and table container must fill the available height and width and preserve `min-height: 0` and `min-width: 0` where needed for embedding in a VUU view.
- Do not add tabs, drawers, forms, toolbars, dialogs, or secondary panels in phase 1.

## Loading and Error Handling

- Show an explicit loading state while server access and schema discovery are pending; do not render the table until its schema, configuration, and data source are ready.
- Show an explicit, user-visible error state if server access, schema discovery, or data-source setup fails.
- Error handling must preserve the original error for diagnostics and must not convert a failure into an empty-table success state.
- Connection and authentication failures remain owned by the host VUU session; the feature may present the surfaced failure but must not implement a separate login or connection fallback.

## Integration Constraints

- The feature is intended to run inside a host that supplies compatible VUU connection and view contexts.
- Standalone use requires a host that supplies the authenticated portal VUU
  connection.
- The UI must not work around this gap by disabling authentication, manufacturing tokens, calling the registry directly, or implementing its own authentication flow. A compatible host/server authentication arrangement is an external integration dependency.

## Non-Goals for Phase 1

- Creating, editing, enabling, disabling, or deleting module records.
- Calling the `modules` edit-session service.
- Displaying permissions, users, or any table other than `modules`.
- Managing or mutating the module registry.
- Fetching or reproducing the portal-login module registry.
- Persisting server data.
- Providing standalone authentication or websocket connection configuration.

## Acceptance Criteria

1. The package and federation metadata use the identities specified above and declare only the `MODULE_DISCOVERY/modules` VUU table.
2. The feature obtains its server API and session data source from the host using `useData()` and `useSessionDataSource()` without depending on `@vuu-ui/vuu-layout` or a view context.
3. The feature discovers the schema from the server and subscribes to exactly `{ module: "MODULE_DISCOVERY", table: "modules" }` with all schema columns.
4. A single read-only VUU `Table` fills the available view and uses row separators and zebra stripes.
5. Loading and failure states are explicit, and failures are not presented as an empty successful table.
6. The browser makes no request to `/module-registry`; discovery arrives in the
   portal `LOGIN_SUCCESS`, and the feature does not create an independent VUU
   connection.
7. No create, edit, delete, permissions, users, registry-management, persistence, or authentication workaround behavior is present.
