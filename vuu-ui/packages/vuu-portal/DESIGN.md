# VUU Portal

## Purpose

`@vuu-ui/vuu-portal` provides the reusable components, types, and utilities
needed to build VUU portals with Module Federation. It is the package boundary
for portal host behavior and remote-module integration.

The package exposes its public API from `src/index.ts`. Portal layout
components are grouped by responsibility, while the remote-module connection
boundary is kept separate from the visual shell.

## PortalShell

`PortalShell` is the top-level UI container for a portal host. It receives the
portal title and the descriptors for its registered remote modules, then:

- applies the VUU Salt theme and creates the portal-level data source context;
- renders the portal branding, header, and navigation;
- builds navigation entries from the registered remote-module descriptors; and
- creates routes that render each remote module through `Feature`.

`PortalShell` is supported by `PortalHeader`, `PortalNav`, their styles, and the
public `RemoteModuleDescriptor` type. Together these define the visual shell,
navigation model, and route metadata for a portal.

## RemoteModule

`RemoteModule` is the runtime boundary around a federated module. It accepts a
`RemoteModuleConnection` and wraps the remote component with an
`AuthenticationProvider` in `vuu-connection` mode.

This gives the remote module its own VUU connection context. Data sources
created inside the remote therefore use the connection selected for that
module instead of implicitly using the portal host's connection.

## Package Structure

```text
vuu-portal/
|-- src/
|   |-- portal-header/
|   |-- portal-nav/
|   |-- portal-shell/
|   |-- remote-module/
|   |-- index.ts
|   `-- RemoteModuleDescriptor.ts
|-- DESIGN.md
|-- README.md
|-- package.json
`-- tsconfig.json
```
