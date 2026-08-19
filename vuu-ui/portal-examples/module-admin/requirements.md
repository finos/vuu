# Module Admin

Module Admin is a portal remote module for managing the remote modules that
module discovery publishes, such as `user-admin` and `basket-trading`.
Administrators can register new remotes, edit existing ones, enable or disable
them, and delete them.

The approved designs are in [`docs/designs`](docs/designs/README.md).

## Data

Module Admin reads two `MODULE_DISCOVERY` tables:

| Table               | Purpose                                                            |
| ------------------- | ------------------------------------------------------------------ |
| `modules`           | One row per module: identity, menu location, route, federation details, Vuu connection, `enabled`, `version` and timestamps |
| `modulePermissions` | Effective access role for each module. Child modules inherit their parent's role. |

Changes go through RPCs on the `modules` table. The request and response shapes
come from the shared contract `@heswell/module-admin/contracts`:

| RPC                | Params                               | Result               |
| ------------------ | ------------------------------------ | -------------------- |
| `createModule`     | `module` (JSON `ModuleConfig`)       | `{ id, version }`    |
| `updateModule`     | `id`, `changes` (JSON partial config), `expectedVersion` | `{ id, version }` |
| `setModuleEnabled` | `id`, `enabled`                      | `{ id, version }`    |
| `deleteModule`     | `id`, `deleteChildren`               | `{ deletedIds }`     |

- `updateModule` uses optimistic concurrency. If `expectedVersion` is stale, the
  server rejects the call and the UI shows the error.
- The server checks every RPC with `validateModuleConfig`. It requires unique
  names and routes, valid URLs, and all three Vuu connection fields once a
  connection id is set. The UI runs the same validation as the user types.

## UI

- **Overview.** A card grid with KPIs (total, enabled, disabled, needs
  attention), search, status filter, group-by (none, menu section or status) and
  sort. Each card shows the title, name, route, location, access role,
  enabled state and remote-check status. Cards are the default because there
  are only a small number of modules.
- **Alternative views.** A menu tree that previews the portal navigation, and a
  compact table.
- **Details panel.** Opens when a card is selected. It shows the federation
  details, the Vuu connection, the access role (inherited or explicit),
  child modules and the remote check result.
- **Create.** A full page form. The module name, route, scope and access role
  are derived from the title until the user edits them. Validation messages
  appear only after a field has been touched or the user tries to save.
- **Edit.** A side panel that shows which fields have changed, with save and
  reset. Saving bumps the module's version.
- **Enable/disable.** A confirmation dialog. Disabled modules stay listed but
  are hidden from users of the portal.
- **Delete.** A confirmation dialog. If the module has children, the user can
  delete them too ("Delete N modules"). The server will keep an audit history
  in a later iteration.

## Remote checks

The browser checks that a remote is reachable, not the server, because in
containerised deployments only the user's browser may be able to reach the
remote URL. The check:

1. Fetches the remote's federation manifest from `mfUrl` and records the response time.
2. Parses the module federation manifest.
3. Compares the manifest with the configured `mfScope` and exposed component.

The result is shown on the card and in the details panel. A failed check is
only advisory and never blocks saving.

## Server (vuu-websocket `vuu-portal`)

- Module definitions are stored in a writable YAML file, set by
  `vuu.portal.modulesFile` (default `modules.yaml`). On first start the file is
  seeded from the built-in module definitions and `module-access.yaml`.
- Saves are atomic: the server writes a temp file and renames it. A change is
  persisted before the `MODULE_DISCOVERY` tables are updated, so a failed save
  leaves the tables unchanged.
- Admin RPCs require the role set by `vuu.portal.moduleAdminRole` (default
  `module-admin-access`). Without this check, any user could register a remote
  URL that other users' browsers would load.

A more robust store may replace the YAML file later.

## Local data

`ModuleAdminLocal.ts` registers `moduleAdminModule` from `@vuu-ui/vuu-data-test`.
It provides the same tables and RPCs in memory, so the UI can run without a
server, for example in the showcase or standalone with
`LocalDataSourceProvider`.

## Development

```sh
npm run typecheck
npm run lint
npm run test        # vitest (happy-dom), tests in ./test
npm run build       # outputs to vuu-ui/dist_portal/module-admin
npm start           # serves the build on port 5002 (requires the `ws` package)
```

The standalone entry (`src/bootstrap.tsx`) imports `@vuu-ui/vuu-theme`. When the
module is hosted in the portal, the host provides the theme instead.
