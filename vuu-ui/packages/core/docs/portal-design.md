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
omitted on standalone window routes. Without a `PortalLandingPage`, the root
route is empty. The optional `id` is applied to the portal root element. The
`title` prop does not create a heading; supply branding through children.

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

`PortalHeader` renders `PortalUserMenu`, which offers **Saved state…** and
**Log out**. Additional items go in its `userMenuItems` prop. Log out saves
pending saved state before signing the user out.

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
its layout and styles, renders `PortalHeader` and its supplied `children`, and
has no portal navigation rail or module-routing logic. `WindowHost` forwards
the optional shell ID, theme settings, and data-source provider to it.

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

Remotes use `usePersistentState`, `useApplicationState` or
`useOptionalApplicationState`, and export `stateMigrations` when a release
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
|   |-- persistence/
|   |-- portal-app-switcher/
|   |-- portal-header/
|   |-- portal-module-registry/
|   |-- portal-nav/
|   |-- portal-shell/
|   |-- remote-module/
|   |-- saved-state/
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
