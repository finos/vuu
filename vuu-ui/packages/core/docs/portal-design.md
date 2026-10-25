# VUU Portal

## Purpose

`@vuu-ui/core/portal` provides the reusable components, types, and utilities
needed to build VUU portals with Module Federation. It is the package boundary
for portal host behavior and remote-module integration.


## PortalShell

`PortalShell` is the top-level UI container for a portal host. It receives the
portal title and the descriptors for its registered remote modules, then:

- applies the VUU Salt theme and creates the portal-level data source context;
- renders caller-supplied `children` for branding, headers, and navigation; and
- creates the browser router, including routes that render each remote module
  through `RemoteModule` and the standalone `WindowHost` route.

Compose `NavContainer` with `PortalLogo` and `PortalAppSwitcher`, and add
`PortalHeader` as children as needed; the shell does not add them automatically.
Pass a single direct `PortalLandingPage` child to supply content for the default
`/` route:

```tsx
<PortalShell remoteModules={remoteModules} title="Portal">
  <NavContainer>{/* portal navigation */}</NavContainer>
  <PortalLandingPage>
    <MyLandingPage />
  </PortalLandingPage>
  <PortalHeader />
</PortalShell>
```

The landing page is rendered inside the routed content area, not as shell
chrome. Other children render inside the shared providers and router, and are
omitted on standalone window routes. A future opt-in attribute may allow
selected chrome elements to render alongside the remote in a window. Without a
`PortalLandingPage`, the root route is empty. The optional `id` is applied to
the portal root element. The `title` prop does not create a heading; supply
branding through children.

Render `PortalShell` directly beneath the host's `AuthenticationProvider`, without
an external router. The router persists across shell prop and registry updates,
preserving the active route and mounted module state.
Wrapping the shell in another router fails at runtime with React Router's
nested-router error; remove the outer router rather than adding a second one.
The shell requires a browser DOM and history and does not support server-side
rendering or an injected memory router. Tests should render it directly in a DOM
environment and set the initial URL through browser history.

`PortalShell` is supported by `PortalHeader`, `NavContainer`, `PortalAppSwitcher`,
`PortalLandingPage`, and the public `RemoteModuleDescriptor` type. Together
these define the visual shell, navigation model, and route metadata for a
portal.

A descriptor's `navLocation` places the module in the navigation, e.g.
`/Trading/Baskets`. A module with an empty `navLocation` (`""` or `"/"`) is a
nested module: the shell still registers and routes it, but the navigation
omits it, and another module renders it with `RemoteModule`. The table viewer
nested in the table browser is an example. `isNestedModule(descriptor)` tests
for this.

### Layout

The shell is a grid with a nav column, then header, banners and content rows.
The nav column is `56px` by default. Set the `navWidth` prop (a number of
pixels or a CSS length), or the `--vuuPortalShell-navWidth` CSS variable, to
change it. Width changes animate over
`--vuuPortalShell-navTransitionDuration` (default `0s`, i.e. none) with
`--vuuPortalShell-navTransitionTimingFunction` (default `ease`). A
`PortalNav` child sizes the column itself and animates by default (see
[PortalNav](#portalnav)).

Set `header={false}` to remove the header row, so the navigation and content
take the full height. The root then has the `vuuPortalShell-noHeader` class.
Don't render a `PortalHeader` in this case.

### Navigation sections

`buildNavSections(modules)` builds the model for a sectioned navigation from
the descriptors. `buildNavItems`, used by `PortalAppSwitcher`, is unchanged.

- Each first `navLocation` segment is a section (`id` `/Trading`, `title`
  `Trading`). The remaining segments, joined with `": "`, are the item title.
  A single-segment location (`/Reports`) gives an item titled `Reports` in the
  `Reports` section.
- Nested modules are excluded.
- Items are ordered by `navOrder`, lowest first, then registration order.
- Sections are ordered by the lowest `navOrder` of their items. Sections with
  no `navOrder` follow, in order of first appearance. Number `navOrder`
  across the whole registry to order sections and items together.
- Each item carries `moduleId`, `title`, `href` (the `path` without a trailing
  `/*`), `navIconName`, `navIconUrl`, `navOrder`, `navBadge` (a key the app
  maps to a live value) and `notificationTopics`.

### PortalNav

`PortalNav` is a sectioned left navigation built on `buildNavSections`. It is
an alternative to `NavContainer` with `PortalAppSwitcher`, which are
unchanged. Render it as a child of `PortalShell`, typically with
`header={false}`:

```tsx
<PortalShell header={false} remoteModules={remoteModules} title="Portal">
  <PortalNav
    brand={<MyBrand />}
    footer={({ displayMode }) => <MyFooter compact={displayMode === "icons"} />}
    remoteModules={remoteModules}
    renderBadge={(item) => liveValues[item.navBadge ?? ""]}
  />
  <PortalLandingPage>…</PortalLandingPage>
</PortalShell>
```

| Prop | Default | |
| --- | --- | --- |
| `remoteModules` | | Descriptors, as for `PortalShell`. |
| `displayMode` / `onDisplayModeChange` | | Controlled mode. |
| `defaultDisplayMode` | `icons-and-text` | Uncontrolled initial mode, when nothing is saved. |
| `allowedDisplayModes` | all four | Modes the user can switch to. A mode that isn't allowed falls back to the first allowed mode. |
| `collapseTo` | `icons` | `icons` or `minimized`: the target of the collapse button and ⌘B / Ctrl+B. |
| `autoCollapseBelow` | | Below this viewport width (px) an expanded mode shows as the `icons` rail. The user's chosen mode is kept. |
| `density` | `comfortable` | 32px rows, or 26px for `compact`. |
| `sections` | `headings` | `headings`, `collapsible` headings, or `none`. |
| `brand`, `footer` | | Nodes, or functions of `{ displayMode, allowedDisplayModes, setDisplayMode }`. The footer is pinned at the bottom. |
| `renderBadge` | | A live value for an item, usually chosen by `item.navBadge`. |
| `width` | `248` | Width (px) of `icons-and-text`. |
| `workspaces` | `true` | Show the [Workspaces](#workspaces) section when a workspace model is provided. |

**Display modes.** `icons-and-text` (248px), `text` (208px), `icons` (a 60px
rail) and `minimized` (0px). The widths are exported as `PORTAL_NAV_WIDTHS`.
⌘B / Ctrl+B and the header chevron toggle between the last expanded mode and
`collapseTo`. In the rail, items show a tooltip on hover and sections are
separated by rules. When minimized, a 14px handle on the left edge opens the
nav as an overlay. The overlay closes on navigation, Escape, or a click
outside it. Its pin button keeps the nav open, in `icons-and-text` (or `text` if that is the only expanded mode allowed). Arrow keys,
Home and End move between the nav's links and buttons.

**Shell width.** `PortalShell` provides a `PortalShellNavContext`
(`usePortalShellNav()`). `PortalNav` reports its mode's width through
`setNavWidth`. The shell sets `--vuuPortalShell-navWidth` on its root and adds
`vuuPortalShell-managedNav`. That class animates the column over
`--vuuPortalShell-navTransitionDuration`, which defaults to `180ms`
(`--vuuPortalShell-navTransitionTimingFunction`, default `ease`). An explicit
`navWidth` prop on the shell wins. Outside a shell, `PortalNav` sizes itself.

**Saved state.** The uncontrolled mode is saved under `nav/displayMode`
(labelled **Navigation display mode**). Collapsed sections are saved under
`nav/collapsedSections`. `nav/expanded`, used by `PortalAppSwitcher`, is
unchanged. The exported key constants are `NAV_DISPLAY_MODE_KEY` and
`NAV_COLLAPSED_SECTIONS_KEY`.

**Badges and indicators.**

- `renderBadge` output is shown after the label in `icons-and-text` and
  `text`. A number shows as a count chip.
- In the rail, a count above zero shows as a pip on the icon, and other
  badge content is hidden.
- The notification indicator is a dot on the icon, or after the label in
  `text` mode. A collapsed section heading shows a dot for its items, and the
  minimized handle shows one for the whole nav.
- The dot replaces the rail pip. It is not shown for the active item.
- An application whose server is unavailable is greyed out, with the same
  status badge and **Retry** detail as in `PortalAppSwitcher`. It shows no
  badge or dot.

`usePortalNavIndicator(moduleIds)` is the single seam for the dot. It returns
`{ count, severity }` or `undefined`: the unread notifications attributed to
the modules and their worst severity, `error` > `warning` > `unread` (info or
success), from `useModulesUnreadSeverity`. Only unread notifications count.
The dot renders as `vuuPortalNav-indicator-{severity}`.

Notifications reach entries by **topic** when modules declare
`notificationTopics`: a server notification with a `topic` is attributed to
the modules on its server that claim the topic (see §7.4 of
[portal-notifications-design.md](./portal-notifications-design.md)). With no
topic, or no module declaring topics, attribution stays connection-wide. A
topic no module claims badges no entry. If the open module claims a topic,
its notifications are read, so no other entry shows a dot for them.

**Bell.** With `PortalShell header={false}` there is no `PortalHeader`, so
place `NotificationsIndicator` in the `brand` slot, with `scope="unclaimed"`
so its badge counts only notifications no entry claims:

```tsx
<PortalNav
  brand={({ displayMode }) => (
    <>
      <MyLogo />
      {displayMode === "icons" ? null : <MyProductName />}
      <NotificationsIndicator compactStyle="bell" scope="unclaimed" />
    </>
  )}
  remoteModules={modules}
/>
```

The brand is shown in every mode. In `icons-and-text` and `text` the bell
sits at the end of the brand row (the ticker is hidden there). In the
`icons` rail the brand content is stacked (logo, then bell) above the expand
button, so render compact content for `displayMode === "icons"`.

Use `PortalLink` from `@vuu-ui/core/portal` for links within a remote module.
It behaves like React Router's `NavLink` in the portal and maps absolute links
under the module's portal route to the matching path under `/window/:moduleId`
when the module is opened in a standalone window. Relative links retain React
Router's normal behavior. Set `routeScope="portal"` for an absolute link that
intentionally navigates outside the current module.

`PortalHeader` renders `PortalUserMenu`, which offers **Saved state…** and
**Log out**. Additional items go in its `userMenuItems` prop. Log out saves
pending saved state before signing the user out. Before the user menu it
renders `NotificationsIndicator`, a bell with the unread count (see
[Server status and notifications](#server-status-and-notifications)). Set
`notificationsIndicator={false}` to hide it, or pass an object of
`NotificationsIndicatorProps`.

For a left-nav footer, `@vuu-ui/core/portal` provides two components that take
`variant="expanded"` or `variant="rail"` (the icons-only nav):

- `PortalConnectionStatus` shows a dot for the worst state across the
  monitored Vuu connections, and a label such as "Connected" or "Trading
  reconnecting…". Click it, or hover for 400ms, for a breakdown with a row per
  connection and Retry. Pass `connections` to give connections friendly
  labels, an `impact` and a `detail`.
- `PortalNavUserMenu` is a hover menu (opening after 300ms) with the user's
  identity and roles, **Saved state…** with the time state was last saved,
  any `PortalNavUserMenuItem` children, and **Log out**. Pass `account` for
  app-supplied text such as the trading account.

## Workspaces

A workspace is a named grid layout of panels, managed by the workspace model
in `src/workspace` (`WorkspaceProvider`, `useWorkspace`). The portal shows
them in a Workspaces section of `PortalNav` and renders the open one at
`/workspaces/:workspaceId`. The code is in `src/portal-workspaces`.

Turn workspaces on with the `workspaces` option of `PortalShell`:

```tsx
<PortalShell
  header={false}
  remoteModules={remoteModules}
  title="Portal"
  workspaces={{
    componentRenderers,
    headerActions: <AddPanelButton />,
    settingsCodecs,
    sidePanel: <PanelsPalette />,
    systemWorkspaces: [defaultWorkspace],
  }}
>
  <PortalNav remoteModules={remoteModules} />
</PortalShell>
```

| Option | | |
| --- | --- | --- |
| `systemWorkspaces` | | Workspaces shipped with the portal (`NamedWorkspaceDefinitionV1`). |
| `componentRenderers`, `settingsCodecs` | | The panels a workspace can contain, as for `GridLayout`. |
| `headerActions` | | Content for the actions slot of the workspace header, e.g. **Add panel**. |
| `sidePanel` | | Rendered to the right of the workspace grid, e.g. `<PanelsPalette />`. See [Panels palette](#panels-palette). |
| `persistenceService` | local storage | Where workspaces are saved. The default `LocalWorkspacePersistenceService` is scoped to the portal id and the signed-in user (namespace `PORTAL_WORKSPACE_NAMESPACE`). Pass a stable instance. |

Without the option the shell renders no `WorkspaceProvider` and no
workspace route, and `PortalNav` has no Workspaces section. A
`WorkspaceProvider` rendered by the app works too. `PortalNav` and
`PortalWorkspace` use `useOptionalWorkspace()`, which is `undefined` when no
provider is mounted.

**Kinds.** A *system* workspace ships with the portal. The first edit saves a
personal copy with the same id, and the shipped definition is never changed.
A *named* workspace belongs to the user. `WorkspaceSummary` has `kind`,
`isPersonalCopy` and `isModified` for each.

### Nav section

The Workspaces section comes first in `PortalNav` (`WORKSPACES_SECTION_ID`,
`"workspaces"`). It lists system workspaces, then named ones. The heading has
a count and a **+** button. It follows the `sections` style, so it can
collapse.

- Each row is a link to `/workspaces/:id`. The open workspace is highlighted
  (`aria-current="page"`).
- A system row shows a **default** chip, or a **Your copy** tag (title
  "Your copy · edited") when the user has a personal copy.
- A named row has a ⋯ menu (also on right-click and Shift+F10) with
  **Rename** and **Delete…**. Rename edits the name in place: Enter or blur
  saves, Escape cancels. Delete asks for confirmation in a dialog. Deleting
  the open workspace navigates to another workspace, or to `/`.
- **+ New workspace**, the last row, creates an empty named workspace called
  "Untitled workspace" ("Untitled workspace 2"… when taken), opens it and
  puts its name in edit mode in the header.
- Rows are not drop targets. Panels are dropped on the workspace itself.
- In the `icons` rail, rows show an icon with a tooltip, the section has no
  heading, and named rows have no menu: rename in the header. The section
  works the same in the `minimized` overlay.

### Workspace route

`PortalWorkspace` renders at `WORKSPACE_ROUTE` (`/workspaces/:workspaceId`;
build paths with `getWorkspacePath(id)`). The URL is the source of truth:
opening the route calls `setActiveWorkspace(id)`, so a deep link, the nav,
and back and forward all select the workspace. An id that isn't a known
workspace shows **Workspace not found**, with a button to open the first
workspace. The grid is `PortalWorkspaceGrid`, a `GridLayout` with the
workspace's saved component state; an empty workspace shows
`WorkspaceStartPanel`, or `WorkspaceDropZone` when there is a `sidePanel`.

`PortalWorkspaceHeader` shows a **Workspaces /** crumb and the name. A named
workspace's name is a button that edits it in place, and its status is
**Saved**. A system workspace shows **Default**, or **Your copy** with the
time of the last edit. `headerActions` are rendered before **Reset to
default**.

### Reset to default

When the open workspace is a system workspace with a personal copy, the
header shows **Reset to default**. It opens a popover:

- **Reset** deletes the personal copy (`resetToDefault(id)`), restoring the
  shipped layout.
- **Cancel** closes the popover.
- **Save as new…** asks for a name (default "{name} copy"), saves the current
  layout as a named workspace (`saveActiveWorkspaceAs`), resets the system
  workspace, then opens the new workspace.

### Panels palette

The Panels palette adds panels to the open workspace. It is in
`src/panels-palette`, exported from `@vuu-ui/core/portal`. Put
`<AddPanelButton />` in `headerActions` and `<PanelsPalette />` in
`sidePanel`. `PortalWorkspace` provides the palette's open state
(`PanelsPaletteStateProvider`, `usePanelsPaletteState`) and the click rule
(`OpenPanelProvider`) for the open workspace. **+ New workspace** opens the
palette.

The palette, titled **Panels**, is docked to the right of the grid. **Add
panel** toggles it. It has a search box ("Search panels & tables"), three
tabs and a footer hint.

- **Modules** lists `usePaletteModules()`: modules whose descriptor has
  `workspace.paletteGroup`, grouped by it, with `workspace.iconUrl` or the
  nav icon. Each row is a `portal-module` template.
- **Tables** has a server picker and lists that server's tables, grouped by
  Vuu module, by name only. Each row is a `vuu-table` template. Servers
  are the portal's own server, the current connection and the servers of
  registered modules, or the local servers in local mode. Tables are
  listed through the portal's connection management (`ServerTablesLoader`,
  which uses `useVuuServerConnection`). The chosen server is saved.
- **Recent** lists the last 10 panels the user added.

The search filters the current tab; every word must match a row's name,
description or group. Groups collapse. The list is a listbox: ↑ ↓ Home End
move, Enter opens the active row, Shift+Enter or **+** adds it, and Escape
closes the palette. The search box passes ↑ ↓ Enter and Escape to the list.
The pin button keeps the palette open; otherwise it closes after a panel is
added.

Every row can be:

- **dragged** onto the workspace (`usePortalDragSource`). The GridLayout
  compass and ghost place it. While a template is dragged
  (`useTemplateDragState`), `TemplateDragHint` shows "Drop on a panel edge
  to split, centre to tab", and an empty workspace's `WorkspaceDropZone` is
  highlighted. Dragging never prompts.
- **added** with **+**. This fills the empty workspace's placeholder, or
  splits the focused panel. A module's `workspace.defaultSize` chooses the
  side: wider than tall goes below, taller than wide goes beside, otherwise
  the focused panel's longer side is split (`getSplitPosition`).
- **clicked**, which follows the click rule.

Panels added to a workspace get a header with their title and a close
button (`PortalWorkspace` sets the grid's `newChildItem.header` option).

**The click rule.** With no panels, a click adds the panel. With one, it
replaces it. With several, a prompt anchored to the focused panel offers
**Replace "‹focused panel›"** (R) or **Open as new tab** (T), which stacks
the new panel with the focused one. ↑ ↓ and Enter choose, and Escape or a
click outside cancels. The focused panel is the last panel the user clicked
or focused, or else the last panel.

The rule is `useOpenPanel()`, for any component inside an
`OpenPanelProvider` (`useOptionalOpenPanel()` outside one):

```tsx
const { addPanel, openPanel } = useOpenPanel();
const result = await openPanel(vuuTableTemplate({ module, serverId, table }));
// result.action: "add" | "replace" | "stack" | "cancel", result.itemId
```

`OpenPanelProvider` takes the `gridId` of its GridLayout and uses
`useGridLayoutCommands(gridId)` from `@vuu-ui/grid-layout`. These commands
let code outside the grid read its items and `insertTemplate(template,
placement)`, where placement replaces, splits or stacks with a target item.

Saved state (user-scoped `ApplicationStateProvider` keys):

| Key | |
| --- | --- |
| `workspace/palettePinned` | Whether the palette is pinned open. |
| `workspace/paletteServer` | The server chosen on the Tables tab. |
| `workspace/recentPanels` | The Recent tab. |

The `VuuPortal/PanelsPalette` showcase example combines `PortalShell`
`workspaces`, the palette, a few modules and local tables.

## WindowHost and module launch menus

`PortalAppSwitcher` module links provide **Open in new Tab** and **Open in new
Window** via right-click, the context-menu key, or Shift+F10. Navigation groups
retain their normal expand/collapse behavior. Opening a module leaves the
current portal route unchanged.

`PortalShell` mounts `WindowHost` at `WINDOW_HOST_ROUTE`
(`/window/:moduleId/*`) for both authenticated and local bootstraps. It forwards
the injected data-source provider to the window host, which retains its own
layout and default theme. Hosts that do not use `PortalShell` can register
`WindowHost` in their own router beneath `AuthenticationProvider`.
`getWindowHostPath(id)` generates the launch path; navigation honors a router
basename.

The URL contains only the encoded registry module ID, with an optional
module-relative route for deep links (for example `/window/42/users`). No
descriptor, manifest address, component props, or token is serialized into the
launch URL. Each page performs its normal authentication/bootstrap and
`WindowHost` resolves the ID against that page's current module registry.
Unavailable, disabled, or no-longer-authorized modules show an explicit alert
instead of loading a remote.

`WindowHost` owns route/registry resolution and the unavailable-module state,
and renders its content inside `WindowShell`. The remote receives the complete
registry context and uses the existing `RemoteModule` connection authentication
and error boundary. Nested relative routes remain under the window URL and
can be refreshed or bookmarked.

New pages use `noopener,noreferrer`, with a popup request for a separate
window. Browser preferences and popup policies ultimately determine whether
the page opens as a tab or window; a null return from `window.open` is not a
reliable blocked-popup signal when using `noopener`. Each page owns its
runtime and connections; there is no opener dependency or cross-window
state/token sharing. The web server must serve the host's SPA entry point for
deep-link requests, and the identity provider must allow those host URLs as
redirect targets.

The example host sets `paths.assetPrefix` to `"/"` and uses root-relative
manifest and favicon URLs so a page at `/window/:moduleId` loads assets from
the host root, not `/window/`. Deploy the complete build output, including
`manifest.json`, `config.json`, scripts, styles, and icons. Missing assets
should return 404 rather than the SPA HTML; otherwise browsers report module
MIME-type or manifest JSON parsing errors.

## WindowShell

`WindowShell` is the presentation shell for a single-module window. It owns
its layout and styles and renders only its supplied `children` (normally the
remote module). It adds no default header or portal chrome and has no portal
navigation rail or module-routing logic. `WindowHost` forwards the optional
shell ID, theme settings, and data-source provider to it.

`WindowShell` also shows notifications for its module, as toasts, and marks
them read while the window is open. It has no banners, panel or bell. Its
server monitor only observes: the window opens no connections beyond its
module's own, but the module is still covered by the connection lost overlay
when its server goes down.

`PortalShell` retains its portal-specific branding, navigation, and routes.
Both shells use the internal `CommonShell` component for the same Salt
theme defaults, modal provider, and default or injected data-source provider.
Authentication remains outside the shells. Sharing providers rather than
layout flags allows the two shells to evolve independently.

## Context panel

Both `PortalShell` and `WindowShell` host a context panel: a slide-out drawer
overlaying the right edge of the shell, used for content such as a table
column picker or filter container. It is rendered in the `vuu-shell-context`
landmark element, and the panel itself has the id `context-panel`
(`VuuShellLocation.ContextPanel`).

Any code below the shell, including remote modules, opens and closes it with
the hooks from `@vuu-ui/core`:

```tsx
import { useContextPanel, useHideContextPanel } from "@vuu-ui/core";

const showContextPanel = useContextPanel();
const hideContextPanel = useHideContextPanel();

showContextPanel(<ColumnPicker columnModel={columnModel} />, "Columns");
```

Because `@vuu-ui/core` is a shared Module Federation singleton, remote modules
reach the shell's panel. These are separate from the hooks of the same names in
`@vuu-ui/vuu-ui-controls`, used by `@vuu-ui/vuu-shell`; a remote module must
use the `@vuu-ui/core` versions.

### Content keeps its owner's context

The panel displays content but does not own it. `RemoteModule` gives each
module its own context panel provider, which holds the module's content and
renders it into the panel with a React portal. The content therefore stays in
the module's React tree and sees the module's context (its Vuu connection,
saved state, notification origin and any providers of its own), even though it
is displayed in the shell.

One owner at a time has the panel. If another module, or the shell, opens it,
the previous owner's content is removed, and that owner can no longer close the
panel. The panel also closes when its owner unmounts, on **Escape**, from its
close button, or when the portal navigates to another route. Focus returns to
the element that was focused when it opened.

### Placement

A module's `contextPanelPlacement`, set on its `RemoteModuleDescriptor` or
`RemoteModule`, says where its content is displayed:

- `"shell"` (the default): the shell's panel, in the `vuu-shell-context`
  landmark.
- `"module"`: a panel within the module's frame, overlaying the right edge of
  the module's nearest positioned ancestor. This suits layouts with modules
  side by side. Each module has its own panel, independent of the shell's, and
  it has no landmark ids, which must be unique.

Module code is the same either way: placement is chosen by the host. The
showcase examples `VuuPortal/ContextPanel` demonstrate both placements in a
portal-hosted module.

`ContextPanelProvider` can be nested to customise behaviour for a subtree:
with a `resolveComponent` function, `showContextPanel` also accepts a
component name. Without a shell, it shows content in a dialog.

## RemoteModule

`RemoteModule` is the runtime loader and connection boundary for a federated
module. It registers the remote manifest, lazy-loads and caches the exposed
React component, reports loading errors, and passes configured component props
to the remote.

The component is the module's `default` export. Set `mfExport` (on the
component or the `RemoteModuleDescriptor`) to render a named export instead,
for a remote that exposes several components from one module, such as the
showcase examples remote.

The loaded component is wrapped with an `AuthenticationProvider` in
`vuu-connection` mode.

This gives the remote module its own VUU connection context. Data sources
created inside the remote therefore use the connection selected for that
module instead of implicitly using the portal host's connection.

`RemoteModule` also provides the remote with its `ApplicationStateStore`, keyed
by `persistenceKey ?? clientIdentifier` and `version`. It loads the saved state
in parallel with the remote code, runs the remote's exported
`stateMigrations` when a new version opens for the first time, and renders the
remote only once both are ready. It suspends inside its own `Suspense`
boundary, so the rest of the shell stays visible while a module loads.

While the module's server is offline or refuses the user, `RemoteModule`
covers the module with `ConnectionLostOverlay`, a frosted, blurred layer
holding a dialog that explains the problem and offers **Retry now**. The
module stays mounted but is `inert`, so it can't be used until the server is
back; the rest of the portal stays usable.

## Server status and notifications

`PortalShell` connects to the Vuu server of every application in the
navigation, not just the open one, so that it can show which servers are
unavailable and collect their notifications. A remote that later opens uses
the connection already made.

### Server status

A `VuuServerMonitor` works out each application's server from its
`config.json` and connects to them in priority order: the open application
first, then visible navigation items, then the rest. The portal server is
always connected. The `serverMonitor` prop of `PortalShell` takes
`ServerMonitorOptions`:

| Option                | Default  | Meaning                                                                 |
| --------------------- | -------- | ----------------------------------------------------------------------- |
| `enabled`             | `true`   | `false` (or `serverMonitor={false}`) observes connections but opens none |
| `maxMonitoredServers` | `8`      | Servers connected for monitoring, not counting the portal server        |
| `offlineAfterMs`      | `3000`   | How long a dropped connection is shown as available while it reconnects |
| `releaseDelayMs`      | `30000`  | How long a server that drops out of the top N stays connected            |
| `probeIntervalMs`     | `60000`  | How often a server is checked again after reconnecting has given up     |
| `staggerMs`           | `150`    | Delay between connections at startup                                    |

`PortalAppSwitcher` greys out an application that can't be used and shows a
status badge on it. This happens when its server is offline, refuses the
user, or its `config.json` can't be loaded (a missing config counts as
offline). The item can't be opened. Hovering or focusing it opens an overlay
with the reason, how long the server has been unavailable, when it will
retry, its unread notifications and **Retry now**; clicking the item retries
too. A dropped connection is shown this way once it has been reconnecting for
`offlineAfterMs`. Set `showPresence={false}` on `PortalAppSwitcher` to turn
this off.

Hooks for custom UI: `useVuuServerStatus(connectionId)`,
`useVuuServerStatuses()` and `useModuleServerStatus(moduleId)`. Each returns
`VuuServerStatus` values, whose `presence` is one of `online`, `connecting`,
`degraded`, `offline`, `unauthorized`, `unavailable` or `unknown`.

### Notifications

The portal subscribes to the `NOTIFICATIONS/notifications` table of every
connected server; servers without that table are skipped. It maps these
columns:

- `id`
- `title`
- `message`
- `level`: `INFO`, `SUCCESS`, `WARNING` or `ERROR`
- `type`: `toast` or `banner`; anything else is recorded silently
- `vuuCreatedTimestamp`
- `expiryTime`

Other columns become attributes. Each notification is attributed to the
application whose server sent it. Notifications from a connection a module
opened itself, through a `vuu` override, go to that module, and anything
else goes to the portal.

- **Badges.** `PortalAppSwitcher` shows each application's unread count on
  its item; groups show the total of their children. Set
  `showNotificationBadges={false}` to hide them.
- **Read state.** Opening an application marks its notifications read.
  Read and deleted notifications are saved in the portal's saved state and
  shared with the user's other portal pages in the same browser.
- **Toasts and banners.** A server toast is shown only for the open
  application. Banners are shown across the portal, below the header, until
  the user closes them.
- **Bell and panel.** `NotificationsIndicator` in the header shows the
  unread count and, briefly, the latest notification. It opens
  `NotificationsPanel`, a drawer listing all notifications with filters,
  mark read, delete, **Do not disturb** and a summary of server status. The
  nav item context menu has **Show notifications** and **Mark notifications
  read**.

The `notifications` prop of `PortalShell` takes `PortalNotificationsOptions`:
`enabled`, `maxNotifications` (default 500), `maxPerServer` (rows subscribed
per server, default 200), `attribution` and `policy`. `policy` decides which
notifications are shown as toasts or banners; `notifications={false}` turns
notifications off.

Remotes need no changes. Notifications they raise with
`useNotifications().showNotification` are recorded in the portal's list when
they are errors or warnings, or when `record` is set. A remote can add one to
the list with `usePortalNotifications().publish`. For custom UI, use
`useUnreadCount`, `useModuleUnreadCount`, `useNotificationList` and
`useLatestNotification`.

In local mode, servers are always online and notifications come from local
servers that include `notificationsModule` from `@vuu-ui/vuu-data-test`.
`@vuu-ui/vuu-data-remote` and `@vuu-ui/vuu-notifications` must be shared
singletons, so the portal sees remotes' connections and notifications.

See [portal-notifications-design.md](./portal-notifications-design.md) for
the design and its implementation notes.

## Saved state

The portal saves each application's runtime state (filters, sort order,
layouts and similar) for the user and restores it the next time the
application opens. `CommonShell` creates one `PortalPersistenceService` for the
authenticated user, so `PortalShell`, `WindowShell` and `WindowHost` all
support it:

- `persistence` selects the storage backend. The default is
  `LocalStoragePersistenceBackend`; `false` keeps saved state in memory only.
- `portalId` separates portals on one origin in storage. `PortalShell` uses
  its `id` by default.
- The portal's own state, such as expanded navigation groups, is stored under
  the reserved application key `vuu.portal`.
- The **Saved state** dialog lets users clear saved state for one, several or
  all applications, or for individual items.

Remotes use the `{ load, save }` pair from `usePersistedState` (or, for more
control, `useApplicationState` / `useOptionalApplicationState`), and export `stateMigrations` when a release
changes saved values. See:

- [saved-state-guide.md](./saved-state-guide.md), a guide for remote authors;
  and
- [portal-persistence-design.md](./portal-persistence-design.md), the design
  and its implementation notes.

## Package Structure

```text
core/
|-- src/
|   |-- auth/
|   |-- common-shell/
|   |-- connection-management/
|   |-- context-definitions/
|   |-- modal-provider/
|   |-- notifications/
|   |-- panels-palette/
|   |-- persistence/
|   |-- portal-app-switcher/
|   |-- portal-header/
|   |-- portal-module-registry/
|   |-- portal-nav/
|   |-- portal-shell/
|   |-- portal-workspaces/
|   |-- remote-module/
|   |-- saved-state/
|   |-- server-monitor/
|   |-- window-host/
|   |-- window-shell/
|   |-- workspace/
|   |-- index.ts
|   |-- portal.ts
|   `-- RemoteModuleDescriptor.ts
|-- docs/
|-- README.md
|-- package.json
`-- tsconfig.json
```
