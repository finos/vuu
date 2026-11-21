# Vuu Identity Admin

The `./UserAdmin` federation export is an embedded remote module. The host owns
authentication, the router and the Vuu connection context. Only the standalone
bootstrap creates a `BrowserRouter`.

The host scopes the authenticated portal module registry through the typed
`PortalModuleRegistryProvider` context around the user-admin remote. The
descriptor includes remote loading fields plus the stable `clientIdentifier`
and module access-role metadata in `accessRole`; VUU connection details come
from the remote's `config.json`. User-admin does not authenticate against
Keycloak, receive the registry as component props, or fetch a second module
list; this host-provided contract is reserved for module-oriented access work.
The provider and hook are also the role-check enforcement boundary.

## Navigation and layout

Every task follows one of two workflows, application or user, so Overview is
the module's only list page and there is no navigation rail. Overview links
straight to each application and user; their pages link back to it. Groups
and roles have no pages of their own; they are defined and assigned inside an
application or a user.

| Route                                      | Page                                                                                   |
| ------------------------------------------ | -------------------------------------------------------------------------------------- |
| `overview` (index)                         | Two panels: applications to set up, and users to create or change (see Overview below) |
| `applications/:applicationName`            | Application workflow, with `?tab=users\|groups` (Users is the default)                 |
| `users/new`                                | User workflow: create a user                                                           |
| `users/:userId`                            | User workflow: an existing user's access and details                                   |
| `applications`, `users`, `groups`, `roles` | Redirect to the application named by `?application=`, else to Overview                 |

Routes are relative to wherever the host mounts the module. Links are built
from the mount path (`useAdminPaths`), so they work from any nested route.
The module has no dependency on `@vuu-ui/vuu-layout`; semantic HTML/CSS
provides the layout, with Salt components throughout.

The module has no header or global search: the portal's navigation names the
module, and each Overview panel has its own filter. Vuu's filter grammar
cannot represent double quotes, backslashes, tabs or line breaks inside string
values; the UI reports those values as unsupported rather than constructing
malformed filters.

Every shared admin table uses `columnDefaultWidth: 120`. Rendered columns named
`email`, either by logical alias or server name, have an explicit width of 150.

## Overview

The overview is two side-by-side panels that fill the page, with large titles:
it is the entry point where the admin user picks a workflow. The users panel
is wider, because there are a handful of applications and many users.

- **Set up an application** lists every application as a card, filtered by a
  search box. The whole card opens the application and has a hover state. It
  shows the application's description, any configuration issues, and its
  user, group and role counts. The counts are links: users open the Users
  tab, groups and roles the Groups & roles tab.
- **Set up a user** has New user, a search by name, username or email, a
  Sort by menu (Recently changed, Name, Last sign-in, Most applications) and,
  on its own line, a multiselect combo box of applications. Choosing several
  applications lists the users who can open all of them. The last table
  column follows the sort: Last sign-in, or Changed for every other sort.

User rows show at most three application tags, then a "+N more" tag naming
the rest. Applications chosen in the filter are shown first.

Below the panels, Overview shows the **Unassigned** groups and roles, which
match no application, and a banner for configuration issues outside any
application. Both appear only when there is something to show.

## Applications

Admin users think in terms of access to applications, while all permissioning is
done through Keycloak groups and client roles. Keycloak is the only store, so
there is no persisted application entity: applications are derived at runtime
from the host-provided module descriptors (`PortalModuleRegistryProvider`)
combined with the Keycloak read models. Realm roles and Keycloak administrator
roles are never loaded. For now the admin user sees all applications.
The naming rules are summarised in [keycloak-naming.md](./keycloak-naming.md)
and the derived model is described in
[application-model.md](./application-model.md).

Each remote module (an application from the user's perspective) has:

- a Keycloak client, identified by the descriptor's `clientIdentifier`, which
  owns the application's own client roles;
- exactly one access role, the descriptor's `accessRole`, on the `vuu-portal`
  client. Access roles use the `-access` suffix, for example
  `module-admin-access`;
- one or more groups. Groups are associated with exactly one application by
  naming convention: the group name (the last `group_path` segment) starts with
  the access role minus `-access`, plus `-` (for example `module-admin-`).
  When prefixes overlap the longest match wins.

Users are only ever assigned to groups, never directly to roles. A user can open
an application when one of their groups includes its access role. The model
(`src/data/applications.ts`) classifies every group and role as belonging to an
application, or as Unassigned when it matches no naming convention.

### Application workflow

The application page shows the client, access role and group prefix, and two
tabs, Users first because it is used most:

- **Users**: everyone with access, with their groups and the roles those
  grant. Users can be selected in batches to add to, move to or remove from a
  group, or to have access revoked (confirmed first), using
  `assignUserToGroup`/`removeUserFromGroup`. **Manage users** opens a dialog to
  add users or change the groups of existing ones. A toggle filters the
  user list to All, With access or Without access; each row shows the user's current groups. A click selects one user,
  Shift extends the selection and Ctrl/Cmd toggles a user. The group
  checkboxes show the selected users' groups; a group only some of them are in
  shows a dash, and clicking it puts them all in it, leaving their other
  groups alone. Changes are kept per user until saved, and each changed user
  is marked Granted, Updated or Revoked. Saving runs the joins and leaves with
  `assignUserToGroup`/`removeUserFromGroup`.
- **Groups & roles**: a card per group, showing its name, description, member
  count and its roles as chips. The access role chip is locked once the group
  has it. **Add role** adds an existing role or creates one; × removes a role.
  Changes are staged locally and saved together with
  `assignGroupRole`/`removeGroupRole` (`clientId` is `vuu-portal` for the
  access role, the application's client otherwise). Below the cards, the
  Roles list shows every application role and the groups it is in. **New
  role** creates one with `addClientRole` on the application's client, named
  with the application prefix. **New group**
  opens a side panel: the name is a suffix after the fixed prefix, the access
  role is always included, roles can be copied from an existing group, and
  members can be picked. It runs `addGroup`, then `assignGroupRole` and
  `assignUserToGroup` by `groupName`, because the create RPC returns no ID.

When an application has configuration issues, a collapsible warning above the
tabs lists them, as Overview does for issues outside any application. They
report: a descriptor access role without the `-access` suffix,
duplicate access roles, ambiguous group prefixes, a missing access role or
client, an application with no groups, a group missing the access role or
containing roles from another application, application roles not in any
group, and groups/roles that match no application.

### User workflow

**New user** takes username, name, email, an optional temporary password (with
a Generate button) and Enabled, alongside every application. Ticking an
application puts the user in its least-privileged group; the groups can then be
changed, and the roles they grant are shown. Create runs `addUser`, then
`assignUserToGroup` by `username`.

An existing user's page has an **Application access** tab, loaded with
`getUserModuleAccessOptions({ userId })` and saved with one
`setUserModuleAccess({ userId, assignments })`, which replaces the user's
application groups; and a **Details** tab saved with `updateUser`. The header
enables or disables the user.

The Overview users panel filters on `module_access` for each chosen
application, and an application's Users tab on its own `module_access`.

## Server-driven data contract

All reads and writes use the host-scoped Vuu APIs. There are no browser calls to
Keycloak, arbitrary URLs or REST endpoints. The tables are known to the module
and are not passed in by the host: the default module is `USER_ADMIN` and the
default tables are:

| Table              | Purpose                                                 |
| ------------------ | ------------------------------------------------------- |
| `users`            | User identities and account flags                       |
| `groups`           | Groups and membership/role counts                       |
| `roles`            | Client roles only, including owning client metadata     |
| `clients`          | Known clients for role creation                         |
| `user_groups`      | User/group memberships                                  |
| `group_roles`      | Group/client-role assignments                           |
| `user_group_roles` | Flattened compatibility read model for inherited access |

Roles are client roles only. Roles on clients that match no application are
shown as Unassigned in the configuration checks; new roles are only created on
an application's own client.

Columns use the agreed server names: `user_id`, `username`, `email`,
`first_name`, `last_name`, `enabled`, `module_access` (comma-separated access
roles) and `module_access_count` on `users`; `group_id`, `group_path` and
`user_count` on `groups`; `role_id`, `role_name`, `client_identifier` and
`description` on `roles`; `user_id`/`group_id` on `user_groups`; and
`group_id`/`role_id` on `group_roles`. The `config` prop's table and column
aliases are not applied by the workflow screens.

Counts subscribe to a one-row viewport and use server totals. The users list
is a virtualized Vuu Table filtered on the server. The application model and
batch lists use lookup subscriptions of at most 1000 rows. Missing tables and
subscription errors are shown on the page.

## Editing and backend prerequisites

Writes go through USER_ADMIN RPCs on a subscribed viewport (any USER_ADMIN
table serves every RPC); generic Vuu edit sessions are not used, because they
do not persist to Keycloak. Each screen keeps a local draft. Saving turns the
difference between the saved state and the draft into a list of RPCs
(`src/data/admin-plans.ts`), shown in a save bar before it runs. While a draft
has changes, leaving the page asks to discard them.

The RPCs are not atomic. They run in order and stop at the first failure;
completed calls stay saved, the screen reports what failed, and Retry runs
only the calls that are left. Lists refresh from the live tables afterwards.

Temporary passwords are write-only RPC parameters; they are never added to a
read subscription. The module does not delete users, groups or roles, edit
group hierarchy, or assign roles to users directly.

`getUserModuleAccessOptions` must return, per portal module, its
`clientIdentifier`, `accessRole`, eligible groups (each with `groupId`,
`groupName`, `groupDisplayName`, `roleId`, `roleName`, `roleDisplayName` and
`isDefault`) and the selected group IDs. The server's `isDefault` sets the
default group on an existing user's page. If the RPC is missing or returns
malformed data, the access tab reports the gap and does not guess membership.

Lists that support batch selection (application users, pickers) load at most
1000 rows through a lookup subscription.

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
