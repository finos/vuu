# Vuu Identity Admin

The `./UserAdmin` federation export is an embedded remote module. The host owns
authentication, the router and the Vuu connection context. Only the standalone
bootstrap creates a `BrowserRouter`.

## Navigation and layout

Relative nested routes expose `overview`, `users`, `groups` and `roles`; the index
redirects to Overview. The module has no dependency on `@vuu-ui/vuu-layout` and
does not use GridLayout. Semantic HTML/CSS provides the layout, with inline Salt
SidePanels for read-only details and create/edit forms.

Overview contains four live count cards (users, groups, client roles, clients),
quick actions and grouped cross-entity search. There is no activity panel or
access map. Selecting a result opens relationship details. Entity pages and
relationship lists use virtualized Vuu Tables and DataSourceStats footers, not
paging controls.

Search uses VuuInput `onCommit`, `commitOnBlur={false}` and
`commitWhenCleared={false}`. Typing, blur and clearing do not issue searches:
press Enter to apply or reset. Vuu's current filter grammar cannot represent
double quotes, backslashes, tabs or line breaks inside string values; the UI
reports those values as unsupported rather than constructing malformed filters.

## Server-driven data contract

All reads and writes use the host-scoped Vuu APIs. There are no browser calls to
Keycloak, arbitrary URLs or REST endpoints. The default module is
`KEYCLOAK_ADMIN` and the default tables are:

| Table | Purpose |
| --- | --- |
| `users` | User identities and account flags |
| `groups` | Groups and membership/role counts |
| `roles` | Client roles only, including owning client metadata |
| `clients` | Known clients for role creation |
| `user_groups` | User/group memberships |
| `group_roles` | Group/client-role assignments |
| `user_group_roles` | Flattened compatibility read model for inherited access |

`getTableSchema` is authoritative for subscription columns, keys and table
identifiers. Pass a stable `config` prop to override table identifiers and map
logical column names to actual server columns, for example:

```tsx
const config = {
  users: {
    table: { module: "IDENTITY", table: "accounts" },
    columns: { user_id: "id", username: "login" },
  },
};

<UserAdmin config={config} />
```

Logical names follow the agreed contract: `user_id`, `group_id`, `role_id`,
`client_id`, `username`, `email`, `first_name`, `last_name`, `enabled`,
`password_update_required`, `group_name`, `group_path`, `role_name`,
`client_identifier`, `client_name`, `description` and relationship/count fields.
Only searchable fields present in the actual schema are used. Missing required
relationship columns fail closed with an explicit error, never an unfiltered
list. Missing tables and subscription errors are visible and produce
Notifications Toasts.

Each rendered table owns an independent scoped data source. Counts subscribe
to a one-row viewport and use server totals; no full client-side identity cache
is loaded. Relationship lists filter by stable entity ID on the server. The
flattened compatibility model can contain multiple paths to the same user/role;
its table footer counts access paths, not necessarily unique identities.

## Editing and backend prerequisites

Read-only selection never creates an EditSession. Create/Edit opens the generic
`AdminEditForm` shell with a page-specific `UserForm`, `GroupForm` or `RoleForm`.
The editor owns one lazy entity-scoped session. Saving or discarding ends the
session; unmounting cancels it. Session errors remain visible and produce Toasts.
Navigation, searching and entity switching inside the module are disabled while
an editor is open. Every form control has a Salt FormField label and messaging.

Generic Vuu session saves do **not** persist to Keycloak. The form retains an
entity-scoped EditSession for lifecycle isolation, but keeps drafts local and
saves through the confirmed source-viewport domain RPCs: `addUser`/`updateUser`,
`addGroup`/`updateGroup`, and `addClientRole`/`updateRole`. After persistence it
discards the generic session with `end(false)`. A cleanup retry never repeats a
successful domain mutation. The server must support generic session creation,
subscription and discard as well as these persistent domain RPCs.

Temporary passwords are write-only RPC parameters; they are never added to a
read subscription or loaded from a record. Standalone
`password_update_required` changes, group hierarchy changes and changing an
existing role's client are unavailable because the confirmed backend does not
support these operations. Client role creation requires a Vuu-sourced client
selection.

Existing-user membership edits use `assignUserToGroup`/`removeUserFromGroup`.
Existing-group client-role edits use `assignGroupRole`/`removeGroupRole`, with
stable group, role and client IDs selected from Vuu tables. These changes are
staged locally until Save and discarded without RPCs on Cancel/Discard.
Identity and relationship RPCs are not atomic: successful operations remain
saved if a later operation fails. The editor reports partial persistence and
retries only the failed/remaining operations. Close abandons remaining operations
without claiming to undo confirmed changes.

Create RPCs do not return a stable identity ID, and the current UI protocol types
do not support the backend's bulk `group_ids` array parameter. Therefore, save a
new user/group and reopen it before assigning relationships. No unsafe array
coercions or guessed IDs are used. This module does not currently expose delete
actions, client administration, or direct user-role assignments.

The old DockLayout/drawer and editable-users-grid requirements are superseded
by this routed Identity Admin design.

## Local checks

From `vuu-ui`:

```sh
npm run test --workspace user-admin
npm run lint --workspace user-admin
npm run typecheck --workspace user-admin
npm run build --workspace user-admin
```

A live end-to-end mutation check additionally requires the standalone
`vuu-user-admin` server with the complete schemas and persistent mutation
contract, plus a host-authenticated connection.
