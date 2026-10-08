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

## RemoteModule

`RemoteModule` is the runtime loader and connection boundary for a federated
module. It registers the remote manifest, lazy-loads and caches the exposed
React component, reports loading errors, and passes configured component props
to the remote.

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
|   |-- persistence/
|   |-- portal-app-switcher/
|   |-- portal-header/
|   |-- portal-module-registry/
|   |-- portal-nav/
|   |-- portal-shell/
|   |-- remote-module/
|   |-- saved-state/
|   |-- server-monitor/
|   |-- window-host/
|   |-- window-shell/
|   |-- index.ts
|   |-- portal.ts
|   `-- RemoteModuleDescriptor.ts
|-- docs/
|-- README.md
|-- package.json
`-- tsconfig.json
```
