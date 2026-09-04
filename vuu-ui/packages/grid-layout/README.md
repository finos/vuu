GridModel operations that create new tracks

1. GridModel.removeGridColumn

calls GridTracks.removeTrack (which fires "grid-track-resize")
fires "child-position-updates"

- useGridSplitterResizing.removeTrack.
  When track resized to zero

- GridLayoutModel.removeGridItem
  When a grid item is removed and only that griditem required this track

2. GridModel.removeGridRow (see removeGridColumn above)

GridTracks.<set>columns
NOT USED

GridTracks.<set>rows
NOT USED

3. GridTracks.splitTrack

fires "grid-track-resize"

- GridLayoutModel.dropSplitGridItem

4. GridTracks.splitTracks

fires "grid-track-resize"

- GridLayoutModel.dropSplitGridItem

5. GridTracks.insertTrack

- GridLayoutModel.addTrackForResize

When GridModel removes a track, it computes updates to child items then applies those updates

When GridLayoutModel applies an operation that creates a
grid track, it computes updates to child items then asks
GridModel to apply each update. Move this logic up into GridModel
GridLayoutModel should not need the addTrack method

## Versioned persistence

GridLayout owns an opaque, plain-JSON document with the discriminator
`kind: "grid-layout"` and current `version: 2`. The envelope contains a
revision-free canonical layout (`id`, track strings, sorted items, explicit
placeholder IDs, sorted stacks with ordered members and selection) and sorted
component records (`id`, `type`, settings `version`, JSON `settings`). The
outer shell and `vuu-layout` persistence envelopes treat this document as
component settings and do not merge their reducer schemas into it.

`GridComponentSettingsRegistry` associates component type keys with typed
encode/decode functions and one-step migration chains.
`GridComponentRendererRegistry` is deliberately separate: decoded settings
become React content only at the UI boundary. Unknown types, unsupported
versions, malformed canonical references, and non-JSON settings return
path-aware errors. JSON validation rejects functions, symbols, `undefined`,
cycles, non-finite numbers, class instances, and React elements rather than
silently dropping values.

Version 1 canonical documents migrate `layout.gridId` to `layout.id` and add
explicit stacks/placeholders before full validation. The legacy
`SerializedGridLayout`/`GridLayoutDescriptor` shape remains readable through
its dedicated adapter; new document writes never call `componentToJson`.
Document decoding and content resolution complete before registry replacement,
so a failed migration or renderer cannot partially mutate a live layout.

Providers subscribe to `GridController.subscribeCommitted`, so ordinary
commands write once, an interactive transaction writes once on semantic
commit, and previews, rollbacks, rejected/no-op commands, revisions, measured
pixels, drag state, DOM state, listeners, and initial hydration never write.
Broad consumer migration and removal of legacy persistence APIs are deferred
to the next architecture increment.
