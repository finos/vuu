# Keycloak naming conventions

Keycloak is the only store for portal permissions. User Admin links groups and
roles to portal applications (remote modules) purely by the naming rules below,
combined with each module descriptor's `accessRole` and `clientIdentifier`.

## Rules

| Item | Rule | Example |
| --- | --- | --- |
| Client | Every portal client identifier starts with `vuu-`. Each application has its own client, named by the descriptor's `clientIdentifier`. | `vuu-basket-trading` |
| Access role | Exactly one per application, on the `vuu-portal` client, named `<app>-access`. It is the descriptor's `accessRole`. | `basket-trading-access` |
| Application roles | One or more per application, on the application's own client. Only the owning client links a role to its application, but `<app>-<permission>` is the recommended name. | `basket-trading-trade` |
| Group | One or more per application, named `<app>-<suffix>`. `<app>-` is the access role with `-access` removed. Each group belongs to exactly one application. | `basket-trading-read` |
| Group contents | Each group contains its application's access role plus any of that application's own roles. It never contains roles from another application. | `basket-trading-trade` = `basket-trading-access` + `basket-trading-trade` |
| Users | Users join groups only. They are never assigned roles directly. | |

## How names are matched

- A group's name is the last segment of its path (`/vuu/basket-trading-read` → `basket-trading-read`).
- A group belongs to the application whose `<app>-` prefix it starts with. If more than one prefix matches, the longest one wins.
- A role on `vuu-portal` is an access role when its name equals a descriptor's `accessRole`.
- Any other role belongs to the application whose `clientIdentifier` is the role's client.
- Groups and roles that match no application are shown as **Unassigned**. They grant no application access.
- Display names are the final hyphen-separated segment of the name, for example `basket-trading-read` → `read`.
- User Admin never loads realm roles or Keycloak administrator roles.

## Naming guidance

- Choose `<app>` values that are not prefixes of each other. For example, `trading` and `trading-desk` would make `trading-desk-*` groups ambiguous.
- Name read-only groups `<app>-read`. They usually contain only the access role, so members can open the application with no extra permissions.
- Don't use spaces or `/` in group names.

## Checks

The Applications page reports breaches of these rules:

- a descriptor access role without `-access`, or one used by two descriptors
- group prefixes that overlap between applications
- an access role missing from `vuu-portal`, or an application client missing from Keycloak
- an application with no groups
- a group without its access role, or containing another application's roles
- application roles that are in no group
- groups and roles that match no application
