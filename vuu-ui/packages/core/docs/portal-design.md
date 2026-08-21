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
|   |-- portal-header/
|   |-- portal-nav/
|   |-- portal-shell/
|   |-- remote-module/
|   |-- index.ts
|   |-- portal.ts
|   `-- RemoteModuleDescriptor.ts
|-- docs/
|-- README.md
|-- package.json
`-- tsconfig.json
```
