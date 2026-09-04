# GridLayout

`GridLayout` renders canonical immutable `GridSnapshot` state through a
per-grid `GridController`. Applications should use `GridLayoutProvider` and the
schema-v2 `GridLayoutDocument` persistence API. The mutable model, v1
descriptors, and React-element serialization are compatibility implementation
details, not persistence authority.

## Versioned persistence

Register a typed settings codec and a separate renderer for every persisted
component type:

```tsx
const settingsCodecs = new GridComponentSettingsRegistry();
settingsCodecs.register("price-tile", {
  version: 1,
  isSettings: isPriceTileSettings,
  encode: (settings) => ({ ok: true, value: settings }),
  decode: (value) =>
    isPriceTileSettings(value)
      ? { ok: true, value }
      : {
          ok: false,
          error: {
            code: "INVALID_PRICE_TILE",
            message: "instrument must be a string",
            path: "$.instrument",
          },
        },
});

const componentRenderers = new GridComponentRendererRegistry();
componentRenderers.register(
  "price-tile",
  isPriceTileSettings,
  (settings, componentId) => (
    <PriceTile id={componentId} instrument={settings.instrument} />
  ),
);

<GridLayoutProvider
  componentRenderers={componentRenderers}
  componentSettings={[
    {
      id: "price-tile-17",
      type: "price-tile",
      settings: { instrument: "VOD.L" },
    },
  ]}
  document={savedDocument}
  settingsCodecs={settingsCodecs}
  onDocumentChange={saveDocument}
  onDocumentError={reportDocumentError}
>
  <GridLayout id="workspace-grid" />
</GridLayoutProvider>;
```

The plain-JSON envelope has `kind: "grid-layout"` and `version: 2`. It stores
durable layout IDs, item and component-instance IDs, track strings, item
metadata (including wire spelling `resizeable`), placeholders, ordered stacks
and selected tabs, plus versioned typed component settings. Revisions,
measurements, drag previews, DOM state, React elements, callbacks, controller
instances, and listeners are transient and are never written.

The provider subscribes to committed controller transitions. Initial hydration,
previews, rollbacks, rejected/no-op commands, and measured-pixel updates write
zero documents; an ordinary semantic commit writes once. Decode, migrations,
and all renderer resolution complete before a runtime document replaces the
active layout. Unknown component types, unsupported versions, malformed
references, failed migrations, and renderer failures report path-aware
`GridLayoutDocumentError` values through `onDocumentError` and leave the active
layout unchanged.

Nested grids must cross the same settings boundary: encode the nested
`GridLayoutDocument` as opaque settings for a registered component type, and
render it with its own `GridLayoutProvider`, grid ID, and controller. An outer
`vuu-layout` or shell document likewise stores the GridLayout document as
opaque component settings; its schema must not be merged with the GridLayout
schema.

## Supported ownership surface

- `GridLayout`, `GridLayoutItem`, `GridLayoutProvider`
- immutable `GridSnapshot` contracts and validation
- `GridController` and typed commands
- `encodeGridLayoutDocument` / `decodeGridLayoutDocument`
- settings codec, renderer, and content registries
- deliberate drag, palette-template, and stack hooks

Prefer `useGridSnapshot`, `useGridController`, and typed dispatch over direct
model access.

## Legacy compatibility and migration

`serializedLayout`, `SerializedGridLayout`, `GridLayoutDescriptor`,
`layoutFromJson`, and mutable `useGridModel` are deprecated. Existing imports
remain temporarily available, while explicitly named adapters are grouped
under `GridLayoutLegacyCompatibility`. The old provider input is read-only: it
may hydrate a descriptor-v1 fixture, but subsequent persistence callbacks emit
schema-v2 documents only and never update or serialize React props back into
the legacy value.

`componentToJson` and `layoutToJSON` remain internal legacy UI-template tools;
they must not be used for new GridLayout writes. To migrate a consumer:

1. Give layout items and component instances stable, independently meaningful
   IDs.
2. Define typed JSON settings and a versioned codec for each component type.
3. Register renderers separately from codecs.
4. Decode old descriptors only at the compatibility boundary.
5. Save the next committed state as a v2 document and retain old formats only
   for backward reads.

Deprecated aliases will remain for a compatibility release and may be removed
only after external consumers have migrated.
