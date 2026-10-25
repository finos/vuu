# Workspace components

A workspace is a GridLayout document. Each item in it is a component with a
type and settings, decoded by a `GridComponentSettingsRegistry` codec and
rendered by a `GridComponentRendererRegistry` renderer. Items are added by
dragging a `TypedComponentTemplate` into the workspace:

```ts
{ label, component: { type, version, settings } }
```

The same shape is persisted in the document, so whatever a template carries
is saved with the workspace. Templates never carry anything that can go stale,
such as a module's Module Federation URL or a table's schema.

The APIs below are exported from `@vuu-ui/core/portal`.

## Component types

### `portal-module`

```ts
{ moduleId: string; props?: JsonValue }
```

Renders a registered portal module with `RemoteModule`. `moduleId` is the
module's `id` (its `clientIdentifier` or `name` also match). The module is
resolved against the live module registry (`PortalModuleRegistryProvider`,
else the identity provider's registry) each time the item renders. If the
module is unknown, disabled or not available to the user, the item shows a
placeholder instead. `props` (an object) are passed to the module's
component; they can't override the module's descriptor.

`portalModuleTemplate(descriptor, props?)` builds the template. A host
that renders modules some other way, e.g. modules bundled with the host, or
a showcase without Module Federation remotes, can pass `renderModule` to
`createPortalComponentRegistries`.

### `vuu-table`

```ts
{ serverId: string; module: string; table: string; tableState?: JsonValue }
```

Renders a Vuu `Table`. `serverId` is the `connectionId` of the Vuu server. It
is resolved, in order, as:

1. the current Vuu connection;
2. `resolveServer(serverId)`, an option of `createPortalComponentRegistries`,
   for servers the portal doesn't know about, e.g. ones the user added;
3. in local mode, a local server;
4. the portal's own server, or a server used by a registered module
   (`useVuuServers`).

The schema is fetched from the server every time the item mounts; settings
that embed a `tableSchema` are rejected. The table's column configuration is
saved in `tableState` as `{ config }` and persisted with the document (see
`useGridComponentSettingsUpdater` below), so two items showing the same table
keep separate state.

If the server isn't available, can't be connected to, or doesn't have the
table, the item shows an error with **Retry** and **Change server**. Change
server calls the `onChangeServer` option and dispatches a bubbling
`vuu-table-change-server` `CustomEvent` from the item. Both receive a
`VuuTableChangeServerRequest`; call its `setServerId(serverId)` to point the
item at another server, keeping its `tableState`.

`vuuTableTemplate({ serverId, module, table, label? })` builds the template.

## Registries

```ts
const { renderers, settingsCodecs } = createPortalComponentRegistries({
  additional: [myComponentRegistration],
  onChangeServer,
  renderModule,
  resolveServer,
});

<WorkspaceHost componentRenderers={renderers} settingsCodecs={settingsCodecs} />
```

`createPortalComponentRegistries` builds on
`createWorkspaceComponentRegistries`, with `portal-module` and `vuu-table`
registered. Register the host's own types with `additional`; registering a
type twice throws.

Components rendered from the registries can update their own persisted
settings with `useGridComponentSettingsUpdater()` from `@vuu-ui/grid-layout`.
The update is published as a `GridLayoutDocumentChange` with
`kind: "settings"`. The rendered item isn't re-rendered with the new
settings, so a component keeps any state it derives from them.

## Drag sources

```tsx
const PaletteRow = ({ template }: { template: TypedComponentTemplate }) => {
  const dragSource = usePortalDragSource(template);
  return <div {...dragSource}>{template.label}</div>;
};

<GridLayoutProvider {...workspaceProps}>
  <PortalDragSourceScope>
    <PaletteRow template={vuuTableTemplate(table)} />
  </PortalDragSourceScope>
  <GridLayout id="workspace" />
</GridLayoutProvider>
```

`usePortalDragSource(template, { onDragEnd? })` returns the props that make an
element drag `template`. It builds on GridLayout's `useDraggable` and the
`TemplateDragSession` of the nearest `GridLayoutProvider`.

A drag reaches a workspace GridLayout only if the drag source and the
GridLayout share that `GridLayoutProvider`. So:

- render palettes and other drag sources outside a GridLayout within
  `PortalDragSourceScope`, which supplies the drag runtime, under the same
  `GridLayoutProvider` as the workspace;
- the host and every remote module that renders a drag source must use the
  same instance of `@vuu-ui/grid-layout`.

## Module Federation

`@vuu-ui/grid-layout` must be a shared singleton in the host and in every
remote that renders a drag source or a workspace component, alongside
`@vuu-ui/core` and `@vuu-ui/core/portal`:

```json
"@vuu-ui/grid-layout": {
  "requiredVersion": "package:@vuu-ui/core",
  "singleton": true,
  "strictVersion": true
}
```

The portal examples' `portal-build.json` files, and `portal-build-all.json`,
declare it. A remote that bundles its own copy gets its own React contexts,
so its drags never reach the host's workspace.

## Palette

A module descriptor's optional `workspace` field makes the module available
in the workspace palette:

```ts
workspace?: {
  paletteGroup: string;
  iconUrl?: string;
  defaultSize?: { cols?: number; rows?: number };
};
```

`getPaletteModules(modules)` returns the enabled modules that have a
`workspace` field, grouped by `paletteGroup` in order of first appearance.
Each entry has the module's `label`, `iconUrl` (falling back to
`navIconUrl`), `defaultSize` and a `portal-module` `template`.
`usePaletteModules()` does the same for the registered modules.
