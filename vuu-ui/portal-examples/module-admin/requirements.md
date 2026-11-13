# Module Admin

Module Admin is a portal remote module that shows the remote modules module
discovery publishes, such as `user-admin` and `basket-trading`. It is read
only: module config is changed where module discovery reads it (the server's
modules file), not here.

The approved designs are published at
https://claude.ai/artifact/UUubF4dewaiHuZj4jTkdRs. The earlier, editable
designs are in [`docs/designs`](docs/designs/README.md).

## Data

Module Admin reads two `MODULE_DISCOVERY` tables:

| Table               | Purpose                                                            |
| ------------------- | ------------------------------------------------------------------ |
| `modules`           | One row per module: identity, menu location, route, federation details, `enabled`, `version` and timestamps |
| `modulePermissions` | Effective access role for each module. Child modules inherit their parent's role. |

It calls no RPCs.

## UI

A toolbar sits above the content: Modules and Menu tabs, a filter box that
matches title, name, scope, route, menu location and access role, a status
toggle (All, Enabled, Disabled, Issues, each with a count). The filter and
status apply to both views. The toolbar is fixed; each view scrolls inside
the content area.

- **Modules** (`modules`, `modules/:name`). The module list beside the
  selected module's config.
  - The list groups modules by menu section, in menu order, with child
    modules after their parent. Each row shows the icon, title, name, route
    and a status dot (enabled, disabled or needs attention). The list
    scrolls and its section headers stick.
  - The detail pane shows the module named in the route, or the first listed
    module. A sticky header shows identity, status and issue count, a
    Fields / YAML switch, Copy config (as YAML) and a link that opens the
    module in the portal. Fields lists, in one column: portal navigation
    (with any child modules), module federation with the manifest check,
    remote config, access (the role, with a link to User Admin) and
    history. Each section heading names the file its values come from:
    `modules.yaml` for the module config, `config.json` for remote config.
    Issues appear above the fields as messages; there is nothing to fix
    here. YAML shows the module as its entry in the portal's `modules.yaml`,
    line-numbered, and scrolls on both axes.
  - Remote config is what the remote publishes in its `config.json`, read
    by the browser from the remote: the Vuu server's connection id,
    WebSocket URL and auth (REST) URL, or that the remote uses the portal's
    Vuu connection. It is not part of the module config.
- **Menu** (`menu`). The portal navigation as one table: each menu section,
  its entries and the nested modules each entry opens, with route, module,
  access role and status. Column headers stick. A row opens that module.
- **Narrow workspace.** Below 640 px the list and detail stack: `modules`
  shows the list and `modules/:name` shows the module with a back link. The
  status toggle is hidden.
- `overview`, `modules/new` and `modules/:name/edit`, the routes of the
  earlier editable views, redirect to `modules` or the module.

## Remote checks

The browser checks that a remote is reachable, not the server, because in
containerised deployments only the user's browser may be able to reach the
remote URL. The check:

1. Fetches the remote's federation manifest from `mfUrl` and records the response time.
2. Parses the module federation manifest.
3. Compares the manifest with the configured `mfScope` and exposed component.
4. Fetches the remote's `config.json`, shown as remote config.

Every remote is checked once when the modules load; the detail pane can run
the check again. A failed check shows as an issue on the module and is only
advisory.

## Server (vuu-websocket `vuu-portal`)

- Module definitions are stored in a writable YAML file, set by
  `vuu.portal.modulesFile` (default `modules.yaml`). On first start the file is
  seeded from the built-in module definitions and `module-access.yaml`.
- Saves are atomic: the server writes a temp file and renames it. A change is
  persisted before the `MODULE_DISCOVERY` tables are updated, so a failed save
  leaves the tables unchanged.
- Admin RPCs require the role set by `vuu.portal.moduleAdminRole` (default
  `module-admin-access`). Without this check, any user could register a remote
  URL that other users' browsers would load. Module Admin no longer calls
  them.

A more robust store may replace the YAML file later.

## Local data

`ModuleAdminLocal.ts` registers `moduleAdminModule` from `@vuu-ui/vuu-data-test`.
It provides the same tables in memory, so the UI can run without a
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
