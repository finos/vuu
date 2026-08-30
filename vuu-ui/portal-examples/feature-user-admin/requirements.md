# User Admin UI - Vuu-First Requirements

## Purpose
Refactor the feature-user-admin sample application into a Vuu-native admin screen.

The previous tabbed UI can be discarded. The replacement UI must consume data
from the standalone user-admin VUU server, where `KeycloakAdminModule` owns the
Keycloak integration.

## Scope
- Applies to portal-examples/feature-user-admin in vuu-ui.
- UI behavior and data flow only.
- No direct browser calls to Keycloak Admin REST endpoints.

## Architecture

### Data Source of Truth
- The Vuu server is the only data source used by the UI.
- The UI subscribes to VUU tables exposed by the `KEYCLOAK_ADMIN` module in the
  standalone `vuu-user-admin` server.
- `KeycloakAdminModule` in `vuu-user-admin` remains the backend integration
  boundary for Keycloak operations.

### Client Integration Constraints
- Do not use fetch/axios/XHR from the browser to Keycloak endpoints.
- Do not read REACT_APP_KEYCLOAK_URL or REACT_APP_KEYCLOAK_REALM in this module.
- Use Vuu data APIs and table subscriptions only.

## Layout Requirements

### Main Composition
- Use a two-pane layout based on DockLayout + right inline Drawer behavior.
- The main content area displays the Users table.
- A right slide-out drawer hosts secondary tables.

### Drawer Content
- Drawer content is a vertical flexbox.
- The first table in the drawer is the Groups table.
- The second table below it is the Roles table.
- Drawer should be inline (not modal) and aligned to the right.

### Drawer Interaction
- Follow the usage pattern from showcase RightInlineDrawerPeek in TableLayout.examples.tsx.
- Selecting a row in the Users table opens the drawer.
- Clearing user selection closes the drawer.

## Table Requirements

### Users Table (Primary)
- Subscribed to KEYCLOAK_ADMIN users.
- This is the main table visible on load.
- Supports row selection to drive drawer state.

### Groups Table (Drawer, Top)
- Subscribed to KEYCLOAK_ADMIN user_group_roles table.
- Column subscription includes all columns from the table schema.
- TableConfig marks all columns as hidden except `group_name`.
- Displayed in top section of the drawer.
- Future: when a user is selected in the Users table, filter the Groups table by the selected user's id.

### Roles Table (Drawer, Bottom)
- Subscribed to KEYCLOAK_ADMIN roles.
- Displayed in bottom section of the drawer.

### Common Table Behavior
- Use Vuu table components and config patterns consistent with feature-basket-trading.
- Use row separators and zebra stripes unless module style conventions dictate otherwise.
- Exclude internal transport/meta columns from visible table columns where appropriate (for example vuuMsg).

## UX Requirements
- The screen should be usable as a single-page admin view with no tabs.
- The drawer must not obscure the Users table when inline mode is active.
- The layout must work at typical desktop sizes and remain functional on smaller widths.

## Non-Goals
- Recreating the old create/edit/delete dialog workflow in this refactor.
- Directly implementing Keycloak REST logic in the frontend.
- Preserving previous visual styling.

## Dependency References
- Backend module: `vuu-websocket/packages/vuu-user-admin`
  `KeycloakAdminModule`.
- Drawer behavior example: showcase/src/examples/Table/TableLayout.examples.tsx RightInlineDrawerPeek.
- Vuu table usage reference: portal-examples/feature-basket-trading.

## Acceptance Criteria
- feature-user-admin renders a Users Vuu table as the primary view.
- A right inline drawer is present and wired to user selection.
- Drawer contains Groups table above Roles table in a vertical flex layout.
- UI performs no direct Keycloak API calls.
- Data is obtained exclusively via Vuu server subscriptions.