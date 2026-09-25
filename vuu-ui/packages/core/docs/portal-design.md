# VUU Portal

## Purpose

`@vuu-ui/core/portal` provides the reusable components, types, and utilities
needed to build VUU portals with Module Federation. It is the package boundary
for portal host behavior and remote-module integration.


## PortalShell

`PortalShell` is the top-level UI container for a portal host. It receives the
portal title and the descriptors for its registered remote modules, then:

- applies the VUU Salt theme and creates the portal-level data source context;
- renders the portal branding, header, and navigation;
- builds navigation entries from the registered remote-module descriptors; and
- creates routes that render each remote module through `RemoteModule`.

`PortalShell` is supported by `PortalHeader`, `PortalNav`, their styles, and the
public `RemoteModuleDescriptor` type. Together these define the visual shell,
navigation model, and route metadata for a portal.

## WindowHost and module launch menus

`PortalNav` module links provide **Open in new Tab** and **Open in new Window**
via right-click, the context-menu key, or Shift+F10. Navigation groups retain
their normal expand/collapse behavior. Opening a module leaves the current
portal route unchanged.

Hosts using these actions must mount `WindowHost` at `WINDOW_HOST_ROUTE`
(`/window/:moduleId/*`) inside their existing router and
`AuthenticationProvider`. The portal-host example registers this route for
both authenticated and local bootstraps. `getWindowHostPath(id)` generates the
launch path; navigation honors a router basename.

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

## WindowShell

`WindowShell` is the presentation shell for a single-module window. It owns
its layout and styles, renders `PortalHeader` and its supplied `children`, and
has no portal navigation rail or module-routing logic. `WindowHost` forwards
the optional shell ID, theme settings, and data-source provider to it.

`PortalShell` retains its portal-specific branding, navigation, and routes.
Both shells use the internal `ShellProviders` component for the same Salt
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

## Package Structure

```text
core/
|-- src/
|   |-- auth/
|   |-- connection-management/
|   |-- portal-header/
|   |-- portal-nav/
|   |-- portal-shell/
|   |-- remote-module/
|   |-- shell-providers/
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
