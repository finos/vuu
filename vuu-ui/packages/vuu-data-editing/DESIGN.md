# VUU data editing design

## Purpose

`@vuu-ui/vuu-data-editing` is the home for VUU's reusable data editing
features. It coordinates edit-session state with editable data sources and
provides React integrations for edit-mode controls.

The initial implementation is copied from `@vuu-ui/vuu-utils`. The originals
remain in place so existing consumers continue to work while applications
migrate to this package.

## Architecture

`useEditableTable` creates or accepts a source data source and owns an
`EditSession`. The session calls `createSessionDataSource` with a `CopyOption`
and tracks cell edits and row changes against the returned data source.

The hook exposes `dataSource` as the lifecycle-selected active data source for
direct use by `Table`, plus `sourceDataSource` for source-only statistics,
filters, menus, and external workflows. During inline editing, React passes the
session data source to `Table`; after save or cancel succeeds it passes the
source data source back. `useDataSource` owns subscription suspend/resume and
ignores callbacks from obsolete data-source bindings.

`DataEditingProvider` makes the session available to nested controls, while
`EditButtons` reflects session state in the available editing actions.

## RPC routing

`EditSession` resolves the target of every editing RPC through its `dataSource`
getter:

```ts
get dataSource() {
  return this.#sessionDataSource ?? this.#sourceTableDataSource;
}
```

`#sessionDataSource` is assigned by `begin()`, so before an edit session starts
these operations address the source table, and once the lifecycle is `active`
they all address the session table:

| Method | Target once active |
| ------ | ------------------ |
| `deleteSelectedRows` | session data source |
| `addRow` / `addNewRow` | session data source |
| `commit` → `editCell` | session data source |
| `undoRowChange` | session data source |
| `end` → `endEditSession` | session data source |

`begin()` is the one deliberate exception: it calls
`createSessionDataSource` / `beginEditSession` on `#sourceTableDataSource`
directly rather than through the getter, because the session table does not yet
exist. The `createSessionTable` handler is therefore resolved against the source
table's viewport, and the source data source must be subscribed before edit mode
is entered.

For a remote `VuuDataSource`, the session instance issues its RPCs against its
own viewport, so it must have completed its subscription first — which is what
`isEditSessionReady` gates on.

## Divergent edit tables

The edit (session) table does not always share the view table's schema. By
default the session data source is built from the view data source config, which
would carry view-only columns — and any filter, `groupBy`, `sort`, or
aggregations that reference them — onto a table that does not have them.

`EditSession` and `useEditableTable` are deliberately unaware of this: neither
accepts a schema, an expected table, or any other transport-specific
configuration. `useEditableTable`'s contract is exactly:

```ts
useEditableTable({
  dataSource: viewDataSource, // subscribed; carries the createSessionTable RPC
  isEditMode,
  onCancel,
  onSave,
});
```

Divergence is instead configured where the view data source is constructed, via
an opaque `session` property:

```ts
new VuuDataSource({
  table: VIEW_TABLE,
  columns: VIEW_COLUMNS,
  session: {
    table: EDIT_TABLE, // stable VuuTable
    columns: EDIT_COLUMNS, // stable string[]
  },
});
```

`createSessionDataSource` / `beginEditSession` apply this internally: given
`session.columns`, the session config is built from `sessionDataSourceConfig`
rather than inheriting the view config; `session.table` is checked against the
module of the server-assigned session table. A call-time
`SessionDataSourceOverrides` argument (used by `CsvUpload`/`exportToCsv`, whose
target data source is often shared and not under the caller's construction
control) always takes precedence over the data source's own `session` config
when both are present. `EditSession.begin()` never supplies one — it calls
`createSessionDataSource(copyOption, sessionType)` with no third argument, so
for editing the effective overrides are always whatever the data source was
constructed with. The session table name itself is always server-generated.

This only affects how the session data source is constructed. Which data
source subsequent operations target is unchanged — see [RPC
routing](#rpc-routing).

Once the session table schema arrives, `reconcileWithSessionSchema` prunes
`rowDefaults` entries that the edit table does not have, and discards pending
edits if the key column differs — row edits, deletes, and undo state are all
keyed by row key and cannot cross a key-column change. The hook invokes it on
`subscribed`, since a remote session table has no schema at the point `begin()`
resolves.

The hook returns `editSchema` and `columnsDiverge` for consumers rendering a
single `Table` across both modes: the returned `dataSource` swaps column sets on
entering edit mode, so column descriptors must be rebuilt rather than reused.
This matters for cell editing in particular: `editCell` sends a column name to
the session table, so it must come from the edit schema. `rowDefaults` naming
view-only columns are dropped by `reconcileWithSessionSchema` rather than sent.

## Files

| File                          | Responsibility                                                                                                                     |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `src/EditSession.tsx`         | Implements the edit-session lifecycle, change tracking, row operations, validation state, save, cancel, and stale-update handling. |
| `src/useEditableTable.ts`     | Connects an `EditSession` to React and a VUU data source, exposing handlers and state for editable tables.                         |
| `src/DataEditingProvider.tsx` | Provides the active `EditSession` through React context.                                                                           |
| `src/EditModeProvider.tsx`    | Provides shared view/edit mode state for editing controls.                                                                         |
| `src/EditButtons.tsx`         | Renders save, cancel, delete, and add-row controls based on edit-session state.                                                    |
| `src/edit-utils.tsx`          | Supplies user-facing stale-update messages.                                                                                        |
| `src/index.ts`                | Defines the package's public API.                                                                                                  |

## Dependencies

Data-source and protocol contracts come from the VUU type packages. Shared
formatting, event, RPC, and React utilities remain in `@vuu-ui/vuu-utils`;
this package depends on them rather than duplicating unrelated utilities.
