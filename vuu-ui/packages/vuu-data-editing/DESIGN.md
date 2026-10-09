# VUU data editing design

## Purpose

`@vuu-ui/vuu-data-editing` is the home for VUU's reusable data editing
features. It coordinates edit-session state with editable data sources and
provides React integrations for edit-mode controls.

The package is organised in layers. Applications should start at the highest
layer that fits and drop down only when they need more control:

1. **Pattern components** – `EditForm`, `CreateRowForm` (this package) and
   `EditableTable`, `TableWithEditForm`, `BulkEditDialog`
   (`@vuu-ui/vuu-table-extras`).
2. **Composable hooks** – `useEditableTable`, `useEditForm`,
   `useEditableColumns`, `useEditSessionState`, `useLookupOptions`,
   `useConfirmDiscard`, `useEntityDraft`, `useAsyncValidation`,
   `useCustomEditField`.
3. **Primitives** – `EditSession`, `DirectEditSession`, `DataEditingProvider`,
   `EditModeProvider`, `EditField`, `EditButtons`, cell renderers.

Errors raised by asynchronous edit operations are routed to an optional
`onError(error, operation)` callback (`EditErrorHandler`). When no handler is
supplied they are logged with `console.error`, so failures are never silently
swallowed.

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

### Direct editing

Some services allow cells to be edited directly on the source table, without a
session table. For these, use `DirectEditSession`. It has no begin/end
lifecycle and does not track edits: `commit` sends `editCell` straight to the
source data source and returns the server response.

```tsx
const editSession = useMemo(
  () => new DirectEditSession({ dataSource }),
  [dataSource],
);
<DataEditingProvider editSession={editSession}>
  <Table dataSource={dataSource} config={config} />
</DataEditingProvider>;
```

Both `EditSession` and `DirectEditSession` implement `TableEditSession`, the
subset of behaviour `Table` cells rely on (`commit`, `cancel`, `inEditMode`,
`isCellEdited` and `cellEditChanged` events).

`cancel` is invoked when the user abandons an in-progress cell edit (Escape).
Typed values are only sent to the session on commit, so cancelling never sends
an RPC. `EditSession.cancel` discards any invalid edit recorded for the cell,
restoring a previously committed valid edit if there was one.

`DataEditingProvider` accepts any `TableEditSession`. Two hooks read it:

- `useTableEditSession` returns whatever session is provided. Table cells use
  it to commit and cancel edits.
- `useEditSession` returns the session only if it is a staged `EditSession`,
  otherwise `undefined` (or throws, when called with `true`). Features that only
  a staged session supports (inline add row, undo row change, edit mode) use it.

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

## Row operations lifecycle (add, delete, undo)

### Added row tracking

Newly inserted rows are tracked by key in `#addedRowKeys: Set<string>`. Keys are captured directly at `addRow()` time from the RPC response map (`response.data.key`).

Tracking keys separately from the `addCount` counter allows `EditSession` to identify inserted rows across their full lifecycle, even if their `vuuAction` is subsequently overwritten (for example, by a soft delete). Row keys are resolved synchronously upon `addRow` RPC completion without relying on cell renderers or viewport visibility.

### Deletions and selection clearing

`deleteSelectedRows` captures `selectedRowsCount` from the data source and issues the delete RPC against the active session table. On success:
1. `deleteCount` is incremented.
2. Selection is explicitly cleared via `dataSource.select({ type: "DESELECT_ALL" })`. This ensures that rows marked for deletion do not remain selected, immediately disabling the Delete button and preventing duplicate deletions that would artificially inflate `deleteCount`.
3. In addition, `useEditableTable` exports `isRowSelectable: (row) => !isEditRowReadOnly(row)` so consumers can prevent soft-deleted rows from being re-selected in the table.

### Undo reconciliation

When `undoRowChange(key, action)` is called on a row:
- If `action === "deleteRow"`, `deleteCount` is decremented.
- If the row was an inserted row (`action === "addRow"` or key exists in `#addedRowKeys`), `addCount` is also decremented and the key is removed from `#addedRowKeys`.

This decouples the client from requiring the remote server to return an extra response flag: when an added row is soft-deleted and then undone, the client correctly decrements both counters and returns `editState` to `"clean"`.

## Files

| File                          | Responsibility                                                                                                                     |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `src/EditSession.tsx`         | Implements the edit-session lifecycle, change tracking, row operations, validation state, save, cancel, and stale-update handling. |
| `src/useEditableTable.ts`     | Connects an `EditSession` to React and a VUU data source, exposing handlers and state for editable tables.                         |
| `src/TableEditSession.ts`     | Defines the `TableEditSession` interface implemented by both edit session types.                                                   |
| `src/DirectEditSession.ts`    | Implements direct editing against the source table, with no session table or edit tracking.                                       |
| `src/DataEditingProvider.tsx` | Provides the active `TableEditSession` through React context (`useTableEditSession`, `useEditSession`).                             |
| `src/EditModeProvider.tsx`    | Provides shared view/edit mode state for editing controls.                                                                         |
| `src/EditButtons.tsx`         | Renders save, cancel, delete, and add-row controls based on edit-session state.                                                    |
| `src/edit-utils.tsx`          | Supplies user-facing stale-update messages.                                                                                        |
| `src/index.ts`                | Defines the package's public API.                                                                                                  |

## Dependencies

Data-source and protocol contracts come from the VUU type packages. Shared
formatting, event, RPC, and React utilities remain in `@vuu-ui/vuu-utils`;
this package depends on them rather than duplicating unrelated utilities.
