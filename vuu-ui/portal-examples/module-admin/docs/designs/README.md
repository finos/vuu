# Module Admin – UI designs

High-resolution mockups (3200×2000, 2× density) for the module-admin rewrite.
They use the Salt `theme-next` and Vuu theme tokens at high density, matching
the portal and `user-admin`. Data is the `DEFAULT_MODULE_DEFINITIONS` seed,
plus two example rows: `notifications` and `order-blotter` (disabled, with problems).

| # | Screen | Purpose |
| --- | --- | --- |
| 01 | `01-overview.png` | Default card view: summary metrics, status filter, group/sort, view switcher, one card per module, and a "New module" tile |
| 02 | `02-detail.png` | Selected card opens a read-only details panel with navigation, module federation (including a remote check), Vuu connection, access and last-change sections |
| 03 | `03-create.png` | Full-page create form with numbered sections, inline validation (duplicate scope), a live card preview and a portal menu preview |
| 04 | `04-edit.png` | Edit in a side panel: modified fields are marked, the version is incremented, enabling is blocked until an access role is set |
| 05 | `05-menu.png` | Menu structure view: modules arranged by menu section, with child modules nested and drag-to-reorder |
| 06 | `06-disable.png` | Disable confirmation listing the users, menu entries and Vuu connection affected |
| 07 | `07-delete-menu.png` | Card overflow menu (view, edit, duplicate, check remote, enable/disable, delete) |
| 08 | `08-delete.png` | Delete confirmation: impact summary, option to delete child modules, type-to-confirm, and "Disable instead" |
| 09 | `09-overview-dark.png` | Overview in dark mode |
| 10 | `10-empty.png` | Empty state when no modules are registered |

## Key ideas

- **Cards are the default view.** We expect fewer than 100 modules. Each card
  shows identity (icon, title, name, version), status, menu location, route,
  remote (`mfScope/mfComponent`), host reachability, the access role and the
  Vuu connection. The view switcher also offers a menu-structure view and a
  table view.
- **Problems appear on the card.** Examples are an unreachable remote, a
  missing access role, or a scope or name that is already in use. The
  "Needs attention" filter and the warning metric collect these modules.
- **Parent/child modules.** `parentModuleId` is shown as "Opened from …" on
  the child and as a "Child module" strip on the parent. Child modules have no
  menu entry and inherit the parent's access role.
- **Fields are grouped by the server contract**: identity (`name`, `title`,
  `description`, `navIconUrl`), portal navigation (`location`, `path`,
  `parentModuleId`), module federation (`mfUrl`, `mfScope`, `mfComponent`), Vuu
  connection (`vuuConnectionId`, `vuuWebsocketUrl`, `vuuRestUrl`) and access
  (`modulePermissions.role`).
- **Helpful defaults.** The route is suggested from the menu location, and the
  access role from the name (`<name>-access`, following the `user-admin`
  naming rules). The exposed component is chosen from the remote's manifest.
- **Patterns follow `user-admin`.** These include the page header and actions,
  icon tiles with category colours, lock-icon access-role tags, Salt
  SidePanel details and edit forms, and a link to User Admin for the users who
  hold a role.

## Decisions

- **Modules can be deleted.** Delete is a hard delete, confirmed by typing the
  module name. Child modules can be deleted along with their parent. The
  access role is not deleted; it is managed in User Admin. Server-side audit
  history is planned for a later iteration. Until then the dialog says a
  deleted module can't be restored and offers "Disable instead". The details
  panel has no History tab, and shows only created/updated timestamps.
- **Remote checks run in the browser, not on the server.** In a container
  deployment the server may not be able to reach `mfUrl`, or may reach it by a
  different route than users do. The UI fetches each remote's
  `mf-manifest.json`, which needs CORS, as module federation already does. It
  runs the check on load and on demand ("Check all remotes" or "Check remote"),
  and confirms the scope and the exposed components. Results are labelled
  "checked from this browser" and are not saved.

## Open questions

- Should `name` be immutable after creation? The designs assume it is.
- Should the version increase automatically on every save, or only when
  remote or loading details change?
- Where does the "users with access" count come from? It could be a
  cross-module lookup against `USER_ADMIN`, or we could drop it.
