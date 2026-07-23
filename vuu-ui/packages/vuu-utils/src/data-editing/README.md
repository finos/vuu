# Inline Row Editing — Architecture & API

This document describes how client-side inline row editing works in Vuu UI, covering the public API surface, the React hook that wires it together, and the call flow through each layer.

---

## Layers at a Glance

```
Consumer component (e.g. EditableInstrumentsTemplate)
  └─ useEditableTable (React hook)
       └─ EditSession (session state + orchestration)
            └─ DataSource (EditApi)
                 ├─ TickingArrayDataSource  (local / test)
                 └─ VuuDataSource           (remote)
                      └─ VuuModule / server RPC handlers
```

---

## Session Modes

Two independent RPCs can initiate a session:

| Method | RPC | Parameter | Purpose |
|---|---|---|---|
| `beginEditSession` | `"beginEditSession"` | `EditSessionMode` (long-form, see below) | Inline or standalone edit session tied to the source viewport |
| `createSessionDataSource` | `"createSessionTable"` | `CopyOption` (`"All"` \| `"Empty"` \| `"Selected"`) | Requests server to create a session table, then returns a session datasource; no internal session state on the source datasource |

### EditSessionMode (long-form, deprecated for new code)

```typescript
type InlineEditSessionMode    = "inline-all-rows";          // edits in-place in the table
type StandaloneEditSessionMode = "all-rows"                 // copy all rows
                               | "selected-rows"            // copy currently selected rows
                               | "empty-session-table";     // empty table (add-rows workflow)

// @deprecated — prefer CopyOption for standalone sessions in new code
type EditSessionMode = InlineEditSessionMode | StandaloneEditSessionMode;
```

`EditSessionMode` long-form strings are sent directly to the `beginEditSession` RPC without conversion. Callers should now prefer `CopyOption` when requesting standalone sessions via `createSessionDataSource`.

### CopyOption (preferred for standalone sessions)

```typescript
type CopyOption = "All" | "Empty" | "Selected";
```

Used with `createSessionDataSource` and accepted by `EditSession.begin()` and `useEditableTable.editSessionMode`. When a `CopyOption` is passed to `begin()`, it routes to `createSessionDataSource` instead of `beginEditSession`.

---

## EditSession — Core API

`EditSession` is a plain class (not a React component) that tracks all pending changes for one edit session and orchestrates RPC calls to the underlying datasource.

### State

| Property | Type | Description |
|---|---|---|
| `editCount` | `number` | Number of valid cell edits pending |
| `deleteCount` | `number` | Number of rows marked for soft-deletion |
| `addCount` | `number` | Number of rows added in this session |
| `invalidCount` | `number` | Number of invalid cell edits |
| `inEditMode` | `boolean` | `true` once `begin()` has resolved and before `end()` completes |
| `editState` | `"clean" \| "dirty" \| "invalid" \| "stale"` | Derived summary; emitted via `"editState"` event |

### Lifecycle

```typescript
editSession.begin(mode?)   // EditSessionMode (deprecated) | CopyOption — opens session datasource
  → editSession.end(save?, force?)   // commits or discards, clears all state
```

`begin()` is overloaded with a deprecation marker on the `EditSessionMode` signature:

```typescript
// ① deprecated — IDE shows strikethrough for long-form values like "all-rows"
begin(mode: EditSessionMode): Promise<DataSource | undefined>;
// ② preferred — "All", "Empty", "Selected", or no argument (defaults to inline)
begin(mode?: CopyOption): Promise<DataSource | undefined>;
```

Passing a `CopyOption` value routes to `createSessionDataSource`; anything else routes to `beginEditSession`. The returned session datasource is stored internally and returned to the caller.

The `isCopyOption(mode)` type guard is exported from `@vuu-ui/vuu-utils` for use at call sites that hold a `EditSessionMode | CopyOption` union:

```typescript
import { isCopyOption } from "@vuu-ui/vuu-utils";

const sessionDs = isCopyOption(mode)
  ? await editSession.begin(mode)   // CopyOption overload
  : await editSession.begin(mode);  // EditSessionMode overload (deprecated)
```

### Row Operations

| Method | Description |
|---|---|
| `editSession.addRows(count, rowData?)` | Adds `count` blank rows via the source-table datasource `addRow` RPC |
| `editSession.deleteSelectedRows()` | Deletes the rows currently selected in the server-side viewport via a single `deleteSelectedRows` RPC; updates `#deletedRows` and `deleteCount` from the returned `deletedKeys` |
| `editSession.restoreRows(keys[])` | Removes keys from the local deleted-rows set (does not send an RPC — use `undoRowChange` for full reversion) |
| `editSession.undoRowChange(key)` | Reverts **all** pending changes for one row (cell edits + soft-delete) via a single `undoRowChange` RPC; only updates local counters on confirmed success |
| `editSession.hasRowChanges(key)` | Returns `true` if the row has pending edits or is marked for deletion |

### Cell Editing

```
editSession.commit(key, column, originalValue, editedValue, isValid)
```

Tracks the cell edit locally and forwards it to `dataSource.editCell()`. Handles the case where a user reverts a cell back to its original value (removes the pending edit entry).

### Events

```ts
editSession.on("editState", (state: EditState) => { ... });
```

Fired whenever `editCount`, `deleteCount`, `addCount`, or `invalidCount` changes. Consumed by `EditButtons` to enable/disable the Save button.

---

## useEditableTable — React Hook

Wraps `EditSession` for use in React components. Manages session lifecycle in response to `isEditMode` toggling.

### Props

| Prop | Default | Description |
|---|---|---|
| `dataSource` | — | Pre-existing DataSource; takes precedence over `table` |
| `table` | — | Creates a new DataSource if `dataSource` not provided |
| `columns` | `undefined` | Column list for the subscription |
| `editSessionMode` | `"inline-all-rows"` | Passed to `editSession.begin()`. Accepts `CopyOption` (preferred, routes to `createSessionDataSource`) or `EditSessionMode` long-form values (deprecated, routes to `beginEditSession`). Narrowed internally with `isCopyOption` before the call. |
| `deleteMode` | `"soft"` | `"soft"` marks the row; `"hard"` deletes immediately |
| `addRowsCount` | `15` | Number of rows added per `onAddRows` call |
| `isEditMode` | required | Toggling to `true` calls `editSession.begin()`; to `false` calls `editSession.end()` |
| `onCancel` | required | Called after `editSession.end()` (discard) completes |
| `onSave` | required | Called after `editSession.end(true)` (save) completes successfully |

### Return Values

| Value | Description |
|---|---|
| `dataSource` | The (possibly newly created) DataSource |
| `editSession` | The `EditSession` instance |
| `sessionDataSource` | Set for standalone modes; `undefined` for inline |
| `hasSelection` | `true` when one or more rows are selected |
| `onCancel` | Async handler: `await editSession.end()` → `onCancel()` |
| `onSave` | Async handler: `await editSession.end(true, force)` → `onSave()` |
| `onDelete` | Calls `editSession.deleteSelectedRows()`; resets selection count |
| `onAddRows` | Adds rows via `editSession.addRows(addRowsCount)` |
| `onUndoRowChange` | `(key) =>` `editSession.undoRowChange(key)` |

`hasSelection` is kept in sync by a `useEffect` that subscribes to the datasource's
`"row-selection"` event — no `onSelectionChange` callback needs to be wired into the Table.

---

## EditButtons — UI Component

Renders the action bar for an edit session. Subscribes to `EditSession` directly for button state, and accepts handler callbacks for each action. The handlers are typically provided by `useEditableTable`, but any callbacks that satisfy the props interface can be used — the component has no hard dependency on the hook.

### Props

| Prop | Description |
|---|---|
| `editSession` | Subscribes to `"editState"` events to drive Save button state |
| `hasSelection` | Enables the Delete button |
| `onSave(force?)` | Called when Save is clicked (after optional `confirmSave` gate) |
| `onCancel()` | Called when Cancel is clicked (after optional `confirmCancel` gate) |
| `onDelete()` | Called when Delete is clicked |
| `onAddRows()` | Called when Add Rows is clicked |
| `saveLabel` | Label for the Save button (defaults to `"Save"`); appended with `" (force)"` when `editState === "stale"` |
| `confirmSave?` | `() => boolean \| Promise<boolean>` — async gate; save is aborted if it returns `false` |
| `confirmCancel?` | `() => boolean \| Promise<boolean>` — async gate; cancel is aborted if it returns `false` |

### Save button states

| `editState` | Button |
|---|---|
| `"clean"` | Disabled |
| `"dirty"` | Enabled, shows `saveLabel` |
| `"invalid"` | Disabled |
| `"stale"` | Enabled, shows `"${saveLabel} (force)"` |

---

## Call Flows

### Begin Edit Session (inline)

```
isEditMode → true
  useEditableTable (useMemo)
    editSession.begin("all-rows")
      dataSource.beginEditSession("all-rows")          ← EditApi RPC
        → "beginEditSession" RPC → VuuModule.beginEditSession
          creates SessionTable (Proxy over source Table)
          stores in #sessionTableMap[sessionTableName]
          returns { table: { module, table: sessionTableName } }
      dataSource creates #sessionDataSource for sessionTableName
      #sessionDataSource.subscribe(range, handleSessionMessage)
    EditSession stores #sessionDataSource
    subsequent operations route to #sessionDataSource
```

### Begin Edit Session (standalone via beginEditSession)

```
editSession.begin("all-rows")           // or "selected-rows" / "empty-session-table"
  dataSource.beginEditSession("all-rows")
    → "beginEditSession" RPC → VuuModule.beginEditSession
        creates SessionTable, returns { table: ... }
    → returns session DataSource to caller
  EditSession stores #sessionDataSource, returns it to consumer
```

### Create Session Datasource (standalone via createSessionDataSource)

```
editSession.begin("All")               // or "Empty" / "Selected"
  editSession detects CopyOption → routes to createSessionDataSource
  dataSource.createSessionDataSource("All")
    → "createSessionTable" RPC → VuuModule.createSessionTableService
        determines mode from CopyOption directly:
          "All"      → createSessionTableWithAllRows
          "Selected" → createSessionTableFromSelectedRows
          "Empty"    → createEmptySessionTable
        returns { table: { module, table: sessionTableName } }
    → datasource wraps returned VuuTable in a new session DataSource
  EditSession stores #sessionDataSource, returns it to consumer
```

No `fromRpcEditSessionMode` conversion is needed — `VuuModule.createSessionTable()` accepts `CopyOption` directly alongside `EditSessionMode`.

### Cell Edit

```
User edits cell
  editSession.commit(key, column, originalValue, editedValue, isValid)
    editSession.storeCellEdit(...)             ← updates #rowEdits, adjusts editCount
    dataSource.editCell(key, column, value)    ← EditApi RPC (via session datasource)
      → "editCell" RPC → VuuModule.editCell
          sessionTable.update(key, column, value)
            emits "update" event → session datasource updates its cache
            session datasource sends updated row to client
```

### Delete Selected Rows (soft)

```
User selects rows → clicks Delete
  EditButtons.onDelete → useEditableTable.handleDelete
    editSession.deleteSelectedRows()
      dataSource.deleteSelectedRows("soft")      ← EditApi RPC (via session datasource)
        → "deleteSelectedRows" RPC → VuuModule.deleteSelectedRows
            reads selectedRows from session datasource subscription
            for each selected key:
              sessionTable.update(key, sessionTableMessageColumn, "SOFT_DELETED")
            returns { deletedKeys: [...] }
      on RpcSuccess: #deletedRows.add(key) for each, deleteCount += n ← emits "editState" → "dirty"
      on RpcError:  local state unchanged
    setSelectionCount(0)                         ← disables Delete button
```

> **Note:** The client does not send row keys to the server. Selection state is owned by the server-side
> viewport. The `deletedKeys` in the response are used to populate `#deletedRows` locally so that
> `hasRowChanges` and `undoRowChange` continue to work correctly.

### Add Row

```
User clicks Add Rows
  EditButtons.onAddRows → useEditableTable.handleAddRows
    editSession.addRows(count)
      for each new row:
        #sourceTableDataSource.addRow(rowData)  ← EditApi RPC (via SOURCE datasource, not session)
          → "addRow" RPC → VuuModule.addRow
              sessionTable.insert(newRow)
              emits "insert" event → session datasource adds row to its view
      addCount += count                         ← emits "editState" → "dirty"
```

> **Note:** `addRow` always routes through the **source** datasource (not the session datasource) because `VuuModule.addRow` looks up the session table via `subscription.sessionTableName`.

### Undo Row Change

```
User clicks Undo button on a row
  UndoCellRenderer.onClick → onUndoRowChange(key)
    editSession.undoRowChange(key)
      checks #rowEdits.has(key) || #deletedRows.has(key)
      deletes key from #rowEdits / #deletedRows BEFORE the RPC       ← undo button hides immediately
      dataSource.undoRowChange(key)              ← EditApi RPC (via session datasource)
        → "undoRowChange" RPC → VuuModule.undoRowChange
            sourceTable = this.tables[dataSource.table.table]         ← real Table (avoids Proxy private-field issue)
            if sourceTable.findByKey(key) === null:                   ← newly inserted row
              sessionTable.delete(key)                                ← removes row from session view
              returns UndoRowChangeResult { wasInsertedRow: true }
            else:                                                     ← existing source row
              for each column in sessionUpdates.cellUpdates:
                originalValue = sourceTable.findByKey(key)[column]
                sessionTable.update(key, column, originalValue)       ← emits "update" → client sees original values
              sessionUpdates.delete(key)                              ← excluded from endEditSession commit
      on RpcSuccess:
        adjust editCount / invalidCount from reverted cell edits
        if wasDeleted: deleteCount--
        if wasInsertedRow: addCount--
      on RpcError: restore #rowEdits / #deletedRows (undo button reappears)
```

### Save (End Session)

```
User clicks Save
  EditButtons.handleSave
    confirmSave?.()                              ← optional async gate
    onSave(isStale)                              ← useEditableTable.handleSave
      dataSource.resume()
      editSession.end(save=true, force)
        dataSource.endEditSession(true, force)   ← EditApi RPC (via session datasource)
          → "endEditSession" RPC → VuuModule.endEditSession
              for each key in sessionTable.getSessionUpdates():
                compare lastUpdateTimestamp with source table
                if stale: write error to sessionTableMessageColumn, rejectedCount++
                else: apply cellUpdates to source table row
              if rejectedCount > 0 → returns ERROR_RESULT "stale update"
                EditSession.end catches StaleUpdateError → emits "editState" "stale"
              else → returns SUCCESS_RESULT
        editSession.clear()                      ← resets all counters and state
      onSave()                                   ← consumer callback
```

### Cancel (End Session — Discard)

```
User clicks Cancel
  EditButtons.handleCancel
    confirmCancel?.()                            ← optional async gate
    onCancel()                                   ← useEditableTable.handleCancel
      await editSession.end(save=false)
        dataSource.endEditSession(false)         ← EditApi RPC (via session datasource)
          → "endEditSession" RPC → VuuModule.endEditSession
              save=false: skips applying updates to source table
              sessionDataSource.unsubscribe()
        editSession.clear()
      onCancel()                                 ← consumer callback (e.g. toggle view mode)
```

---

## EditApi — DataSource Contract

All datasources used with `EditSession` must implement `EditApi` from `@vuu-ui/vuu-data-types`:

```ts
interface EditApi<T extends DataSourceRow | DataSourceRowWithBigint = DataSourceRow> {
  beginEditSession?(mode?: EditSessionMode): Promise<DataSourceBase<T> | undefined>;
  createSessionDataSource?(copyOption: CopyOption): Promise<DataSource<T> | undefined>;
  addRow?(rowData?: Record<string, VuuRowDataItemType>): Promise<RpcResult> | undefined;
  deleteRow?(key: string, mode?: DeleteRowMode): Promise<RpcResult> | undefined;
  deleteSelectedRows?(mode?: DeleteRowMode): Promise<RpcResult> | undefined;
  editCell?(rowKey: string, column: string, value: VuuRowDataItemType): Promise<RpcResult> | undefined;
  undoRowChange?(key: string): Promise<RpcResult> | undefined;
  endEditSession?(saveChanges?: boolean, force?: boolean): Promise<RpcResult> | undefined;
}
```

### RPC Success Response Payloads

Each `EditApi` method returns `RpcResultSuccess` on success. The table below shows the `data` field shape for each.

| Method | `data` on success | Typed as |
|---|---|---|
| `beginEditSession` | `{ table: VuuTable }` — the server-assigned session table | `BeginEditSessionResult` |
| `createSessionDataSource` | `{ table: VuuTable }` — same shape as `beginEditSession` | `BeginEditSessionResult` |
| `addRow` | `undefined` | — |
| `deleteRow` | `undefined` | — |
| `deleteSelectedRows` | `{ deletedKeys: string[] }` | `DeleteSelectedRowsResult` |
| `editCell` | `undefined` | — |
| `undoRowChange` | `{ wasInsertedRow?: boolean }` | `UndoRowChangeResult` |
| `endEditSession` | `undefined` | — |

The structured payloads are declared in `@vuu-ui/vuu-data-types`:

```ts
// beginEditSession / createSessionDataSource (CopyOption path) — session table to subscribe to
type BeginEditSessionResult = { table: VuuTable };
// Example: { table: { module: "SIMUL", table: "session-a1b2c3" } }

// deleteSelectedRows — keys of every row deleted server-side
type DeleteSelectedRowsResult = { deletedKeys: string[] };
// Example: { deletedKeys: ["VOD.L", "AAPL.O"] }

// undoRowChange — true when a newly added (uncommitted) row was removed entirely
type UndoRowChangeResult = { wasInsertedRow?: boolean };
// Example (existing row reverted): undefined
// Example (newly added row removed): { wasInsertedRow: true }
```

Both `TickingArrayDataSource` (local/test) and `VuuDataSource` (remote) implement all methods.
Each method dispatches a named RPC request registered and handled in `VuuModule.#moduleServices`.

> **`addRow` vs `deleteSelectedRows` key ownership:**
> - `addRow` generates a client-side UUID key (local test only); `VuuDataSource` omits the key and lets the server generate it.
> - `deleteSelectedRows` sends no row keys at all — the server reads its own viewport selection state.

> **`sessionTableMessageColumn`:** `VuuModule` uses a configurable column name for soft-delete and
> stale-rejection markers (defaults to `"vuuMsg"`). Subclasses can override it via `VuuModuleOptions`:
> ```typescript
> super("MY_MODULE", { sessionTableMessageColumn: "statusCol" });
> ```
> Pass the same name as `sessionTableMessageColumn` in the `UndoCellComponentProps` so the undo
> button correctly reads the soft-delete state from the row data.

---

## RPC Routing Summary

### Request Params

The `params` object sent with each RPC request (types from `@vuu-ui/vuu-protocol-types`):

| RPC name | Params shape | Example |
|---|---|---|
| `"beginEditSession"` | `{ editSessionMode?: EditSessionMode }` | `{ editSessionMode: "inline-all-rows" }` |
| `"createSessionTable"` | `{ copyOption: CopyOption }` | `{ copyOption: "All" }` |
| `"addRow"` | `{ data: Record<string, VuuRowDataItemType> }` — remote; local also adds `key` | `{ key: "VOD.L-a1b2", data: { ric: "VOD.L-a1b2", lotSize: 100, ... } }` |
| `"deleteRow"` | `{ key: string, mode: DeleteRowMode }` | `{ key: "VOD.L", mode: "soft" }` |
| `"deleteSelectedRows"` | `{ mode: DeleteRowMode }` — no keys; server reads its own selection | `{ mode: "soft" }` |
| `"editCell"` | `{ key: string, column: string, data: VuuRowDataItemType }` | `{ key: "VOD.L", column: "lotSize", data: 500 }` |
| `"undoRowChange"` | `{ key: string }` | `{ key: "VOD.L" }` |
| `"endEditSession"` | `{ save?: boolean, force?: boolean }` | `{ save: true }` or `{}` (discard) |

### Routing & Handlers

| EditApi method | RPC name | Routes via | VuuModule handler |
|---|---|---|---|
| `beginEditSession` | `"beginEditSession"` | source datasource | creates `SessionTable` proxy, stores in `#sessionTableMap`; `editSessionMode` passed through unchanged |
| `createSessionDataSource` | `"createSessionTable"` | source datasource | `createSessionTableService` — resolves `CopyOption` directly in `VuuModule.createSessionTable()`, no alias conversion |
| `addRow` | `"addRow"` | **source** datasource | `addRow` — inserts into session table |
| `deleteRow` | `"deleteRow"` | session datasource | `deleteRow` — direct key-based delete (for programmatic use) |
| `deleteSelectedRows` | `"deleteSelectedRows"` | session datasource | reads `selectedRows` from session subscription; soft/hard deletes each; returns `DeleteSelectedRowsResult` |
| `editCell` | `"editCell"` | session datasource | `editCell` — `sessionTable.update(key, col, val)` |
| `undoRowChange` | `"undoRowChange"` | session datasource | if key not in source table: deletes inserted row, returns `{ wasInsertedRow: true }`; otherwise reverts `cellUpdates` to source values |
| `endEditSession` | `"endEditSession"` | session datasource | applies (or discards) session updates to source table |


---

## Layers at a Glance

```
Consumer component (e.g. EditableInstrumentsTemplate)
  └─ useEditableTable (React hook)
       └─ EditSession (session state + orchestration)
            └─ DataSource (EditApi)
                 ├─ TickingArrayDataSource  (local / test)
                 └─ VuuDataSource           (remote)
                      └─ VuuModule / server RPC handlers
```

---

## EditSession — Core API

`EditSession` is a plain class (not a React component) that tracks all pending changes for one edit session and orchestrates RPC calls to the underlying datasource.

### State

| Property | Type | Description |
|---|---|---|
| `editCount` | `number` | Number of valid cell edits pending |
| `deleteCount` | `number` | Number of rows marked for soft-deletion |
| `addCount` | `number` | Number of rows added in this session |
| `invalidCount` | `number` | Number of invalid cell edits |
| `inEditMode` | `boolean` | `true` once `begin()` has resolved and before `end()` completes |
| `editState` | `"clean" \| "dirty" \| "invalid" \| "stale"` | Derived summary; emitted via `"editState"` event |

### Lifecycle

```
editSession.begin(editSessionMode?)   // opens session datasource
  → editSession.end(save?, force?)    // commits or discards, clears all state
```

`begin()` calls `dataSource.beginEditSession()` which creates a **session datasource** (a proxy/mirror of the source table). All subsequent cell edits and row operations operate against this session datasource, leaving the source table untouched until `end(true)` is called.

### Row Operations

| Method | Description |
|---|---|
| `editSession.addRows(count, rowData?)` | Adds `count` blank rows via the source-table datasource `addRow` RPC |
| `editSession.deleteSelectedRows()` | Deletes the rows currently selected in the server-side viewport via a single `deleteSelectedRows` RPC; updates `#deletedRows` and `deleteCount` from the returned `deletedKeys` |
| `editSession.restoreRows(keys[])` | Removes keys from the local deleted-rows set (does not send an RPC — use `undoRowChange` for full reversion) |
| `editSession.undoRowChange(key)` | Reverts **all** pending changes for one row (cell edits + soft-delete) via a single `undoRowChange` RPC; only updates local counters on confirmed success |
| `editSession.hasRowChanges(key)` | Returns `true` if the row has pending edits or is marked for deletion |

### Cell Editing

```
editSession.commit(key, column, originalValue, editedValue, isValid)
```

Tracks the cell edit locally and forwards it to `dataSource.editCell()`. Handles the case where a user reverts a cell back to its original value (removes the pending edit entry).

### Events

```ts
editSession.on("editState", (state: EditState) => { ... });
```

Fired whenever `editCount`, `deleteCount`, `addCount`, or `invalidCount` changes. Consumed by `EditButtons` to enable/disable the Save button.

---

## useEditableTable — React Hook

Wraps `EditSession` for use in React components. Manages session lifecycle in response to `isEditMode` toggling.

### Props

| Prop | Default | Description |
|---|---|---|
| `dataSource` | — | Pre-existing DataSource; takes precedence over `table` |
| `table` | — | Creates a new DataSource if `dataSource` not provided |
| `columns` | `undefined` | Column list for the subscription |
| `editSessionMode` | `"inline-all-rows"` | Session mode passed to `beginEditSession` |
| `deleteMode` | `"soft"` | `"soft"` marks the row; `"hard"` deletes immediately |
| `addRowsCount` | `15` | Number of rows added per `onAddRows` call |
| `isEditMode` | required | Toggling to `true` calls `editSession.begin()`; to `false` calls `editSession.end()` |
| `onCancel` | required | Called after `editSession.end()` (discard) completes |
| `onSave` | required | Called after `editSession.end(true)` (save) completes successfully |

`editSessionMode` accepts any `EditSessionMode` value, including the short-form aliases introduced
for the RPC contract (`"All"`, `"Selected"`, `"Empty"`) as well as the long-form strings
(`"inline-all-rows"`, `"all-rows"`, `"selected-rows"`, `"empty-session-table"`). The datasource
converts long-form values to their aliases before dispatching the RPC (see `toRpcEditSessionMode`).

### Return Values

| Value | Description |
|---|---|
| `dataSource` | The (possibly newly created) DataSource |
| `editSession` | The `EditSession` instance |
| `sessionDataSource` | Set for standalone edit modes; `undefined` for inline |
| `hasSelection` | `true` when one or more rows are selected |
| `onCancel` | Async handler: `await editSession.end()` → `onCancel()` |
| `onSave` | Async handler: `await editSession.end(true, force)` → `onSave()` |
| `onDelete` | Calls `editSession.deleteSelectedRows()`; resets selection count |
| `onAddRows` | Adds rows via `editSession.addRows(addRowsCount)` |
| `onUndoRowChange` | `(key) =>` `editSession.undoRowChange(key)` |

`hasSelection` is kept in sync by a `useEffect` that subscribes to the datasource's
`"row-selection"` event — no `onSelectionChange` callback needs to be wired into the Table.

---

## EditButtons — UI Component

Renders the action bar for an edit session. Subscribes to `EditSession` directly for button state, and accepts handler callbacks for each action. The handlers are typically provided by `useEditableTable`, but any callbacks that satisfy the props interface can be used — the component has no hard dependency on the hook.

### Props

| Prop | Description |
|---|---|
| `editSession` | Subscribes to `"editState"` events to drive Save button state |
| `hasSelection` | Enables the Delete button |
| `onSave(force?)` | Called when Save is clicked (after optional `confirmSave` gate) |
| `onCancel()` | Called when Cancel is clicked (after optional `confirmCancel` gate) |
| `onDelete()` | Called when Delete is clicked |
| `onAddRows()` | Called when Add Rows is clicked |
| `saveLabel` | Label for the Save button (defaults to `"Save"`); appended with `" (force)"` when `editState === "stale"` |
| `confirmSave?` | `() => boolean \| Promise<boolean>` — async gate; cancel is aborted if it returns `false` |
| `confirmCancel?` | `() => boolean \| Promise<boolean>` — async gate; cancel is aborted if it returns `false` |

### Save button states

| `editState` | Button |
|---|---|
| `"clean"` | Disabled |
| `"dirty"` | Enabled, shows `saveLabel` |
| `"invalid"` | Disabled |
| `"stale"` | Enabled, shows `"${saveLabel} (force)"` |

---

## Call Flows

### Begin Edit Session

```
isEditMode → true
  useEditableTable (useMemo)
    editSession.begin("inline-all-rows")
      dataSource.beginEditSession("inline-all-rows")          ← EditApi RPC
        → "beginEditSession" RPC → VuuModule.beginEditSession
          creates SessionTable (Proxy over source Table)
          stores in #sessionTableMap[sessionTableName]
          returns { table: { module, table: sessionTableName } }
      dataSource creates #sessionDataSource for sessionTableName
      #sessionDataSource.subscribe(range, handleSessionMessage)
    EditSession stores #sessionDataSource
    subsequent operations route to #sessionDataSource
```

### Cell Edit

```
User edits cell
  editSession.commit(key, column, originalValue, editedValue, isValid)
    editSession.storeCellEdit(...)             ← updates #rowEdits, adjusts editCount
    dataSource.editCell(key, column, value)    ← EditApi RPC (via session datasource)
      → "editCell" RPC → VuuModule.editCell
          sessionTable.update(key, column, value)
            emits "update" event → session datasource updates its cache
            session datasource sends updated row to client
```

### Delete Selected Rows (soft)

```
User selects rows → clicks Delete
  EditButtons.onDelete → useEditableTable.handleDelete
    editSession.deleteSelectedRows()
      dataSource.deleteSelectedRows("soft")      ← EditApi RPC (via session datasource)
        → "deleteSelectedRows" RPC → VuuModule.deleteSelectedRows
            reads selectedRows from session datasource subscription
            for each selected key:
              sessionTable.update(key, sessionTableMessageColumn, "SOFT_DELETED")
            returns { deletedKeys: [...] }
      on RpcSuccess: #deletedRows.add(key) for each, deleteCount += n ← emits "editState" → "dirty"
      on RpcError:  local state unchanged
    setSelectionCount(0)                         ← disables Delete button
```

> **Note:** The client does not send row keys to the server. Selection state is owned by the server-side
> viewport. The `deletedKeys` in the response are used to populate `#deletedRows` locally so that
> `hasRowChanges` and `undoRowChange` continue to work correctly.

### Add Row

```
User clicks Add Rows
  EditButtons.onAddRows → useEditableTable.handleAddRows
    editSession.addRows(count)
      for each new row:
        #sourceTableDataSource.addRow(rowData)  ← EditApi RPC (via SOURCE datasource, not session)
          → "addRow" RPC → VuuModule.addRow
              sessionTable.insert(newRow)
              emits "insert" event → session datasource adds row to its view
      addCount += count                         ← emits "editState" → "dirty"
```

> **Note:** `addRow` always routes through the **source** datasource (not the session datasource) because `VuuModule.addRow` looks up the session table via `subscription.sessionTableName`.

### Undo Row Change

```
User clicks Undo button on a row
  UndoCellRenderer.onClick → onUndoRowChange(key)
    editSession.undoRowChange(key)
      checks #rowEdits.has(key) || #deletedRows.has(key)
      deletes key from #rowEdits / #deletedRows BEFORE the RPC       ← undo button hides immediately
      dataSource.undoRowChange(key)              ← EditApi RPC (via session datasource)
        → "undoRowChange" RPC → VuuModule.undoRowChange
            sourceTable = this.tables[dataSource.table.table]         ← real Table (avoids Proxy private-field issue)
            if sourceTable.findByKey(key) === null:                   ← newly inserted row
              sessionTable.delete(key)                                ← removes row from session view
              returns UndoRowChangeResult { wasInsertedRow: true }
            else:                                                     ← existing source row
              for each column in sessionUpdates.cellUpdates:
                originalValue = sourceTable.findByKey(key)[column]
                sessionTable.update(key, column, originalValue)       ← emits "update" → client sees original values
              sessionUpdates.delete(key)                              ← excluded from endEditSession commit
      on RpcSuccess:
        adjust editCount / invalidCount from reverted cell edits
        if wasDeleted: deleteCount--
        if wasInsertedRow: addCount--
      on RpcError: restore #rowEdits / #deletedRows (undo button reappears)
```

### Save (End Session)

```
User clicks Save
  EditButtons.handleSave
    confirmSave?.()                              ← optional async gate
    onSave(isStale)                              ← useEditableTable.handleSave
      dataSource.resume()
      editSession.end(save=true, force)
        dataSource.endEditSession(true, force)   ← EditApi RPC (via session datasource)
          → "endEditSession" RPC → VuuModule.endEditSession
              for each key in sessionTable.getSessionUpdates():
                compare lastUpdateTimestamp with source table
                if stale: write error to sessionTableMessageColumn, rejectedCount++
                else: apply cellUpdates to source table row
              if rejectedCount > 0 → returns ERROR_RESULT "stale update"
                EditSession.end catches StaleUpdateError → emits "editState" "stale"
              else → returns SUCCESS_RESULT
        editSession.clear()                      ← resets all counters and state
      onSave()                                   ← consumer callback
```

### Cancel (End Session — Discard)

```
User clicks Cancel
  EditButtons.handleCancel
    confirmCancel?.()                            ← optional async gate
    onCancel()                                   ← useEditableTable.handleCancel
      await editSession.end(save=false)
        dataSource.endEditSession(false)         ← EditApi RPC (via session datasource)
          → "endEditSession" RPC → VuuModule.endEditSession
              save=false: skips applying updates to source table
              sessionDataSource.unsubscribe()
        editSession.clear()
      onCancel()                                 ← consumer callback (e.g. toggle view mode)
```

---

## EditApi — DataSource Contract

All datasources used with `EditSession` must implement `EditApi` from `@vuu-ui/vuu-data-types`:

```ts
interface EditApi {
  beginEditSession?(mode?: EditSessionMode): Promise<DataSource | undefined>;
  addRow?(rowData?: Record<string, VuuRowDataItemType>): Promise<RpcResult> | undefined;
  deleteRow?(key: string, mode?: DeleteRowMode): Promise<RpcResult> | undefined;
  deleteSelectedRows?(mode?: DeleteRowMode): Promise<RpcResult> | undefined;
  editCell?(rowKey: string, column: string, value: VuuRowDataItemType): Promise<RpcResult> | undefined;
  undoRowChange?(key: string): Promise<RpcResult> | undefined;
  endEditSession?(saveChanges?: boolean, force?: boolean): Promise<RpcResult> | undefined;
}
```

### RPC Success Response Payloads

Each `EditApi` method returns `RpcResultSuccess` on success. The table below shows the `data` field shape for each.

| Method | `data` on success | Typed as |
|---|---|---|
| `beginEditSession` | `{ table: VuuTable }` — the server-assigned session table | `BeginEditSessionResult` |
| `addRow` | `undefined` | — |
| `deleteRow` | `undefined` | — |
| `deleteSelectedRows` | `{ deletedKeys: string[] }` | `DeleteSelectedRowsResult` |
| `editCell` | `undefined` | — |
| `undoRowChange` | `{ wasInsertedRow?: boolean }` | `UndoRowChangeResult` |
| `endEditSession` | `undefined` | — |

The three structured payloads are declared in `@vuu-ui/vuu-data-types`:

```ts
// beginEditSession — session table to subscribe to
type BeginEditSessionResult = { table: VuuTable };
// Example success data:
// { table: { module: "SIMUL", table: "session-a1b2c3" } }

// deleteSelectedRows — keys of every row deleted server-side
//   Used by EditSession to increment deleteCount and populate #deletedRows
type DeleteSelectedRowsResult = { deletedKeys: string[] };
// Example success data:
// { deletedKeys: ["VOD.L", "AAPL.O"] }

// undoRowChange — true when a newly added (uncommitted) row was removed entirely
type UndoRowChangeResult = { wasInsertedRow?: boolean };
// Example success data (existing source row reverted):
// undefined
// Example success data (newly added row removed):
// { wasInsertedRow: true }
```

`EditSession` imports and uses these types directly — no inline casts.

Both `TickingArrayDataSource` (local/test) and `VuuDataSource` (remote) implement all methods.
Each method dispatches a named RPC request which is registered and handled in `VuuModule.#moduleServices`.

> **`addRow` vs `deleteSelectedRows` key ownership:**
> - `addRow` generates a client-side UUID key (local test only); `VuuDataSource` omits the key and lets the server generate it.
> - `deleteSelectedRows` sends no row keys at all — the server reads its own viewport selection state.

> **`sessionTableMessageColumn`:** `VuuModule` uses a configurable column name for soft-delete and
> stale-rejection markers (defaults to `"vuuMsg"`). Subclasses can override it via `VuuModuleOptions`:
> ```typescript
> super("MY_MODULE", { sessionTableMessageColumn: "statusCol" });
> ```
> Pass the same name as `sessionTableMessageColumn` in the `UndoCellComponentProps` so the undo
> button correctly reads the soft-delete state from the row data.

---

## RPC Routing Summary

### Request Params

The `params` object sent with each RPC request (types from `@vuu-ui/vuu-protocol-types`):

| RPC name | Params shape | Example |
|---|---|---|
| `"beginEditSession"` | `{ editSessionMode: EditSessionModeAlias \| "inline-all-rows" }` | `{ editSessionMode: "All" }` |
| `"addRow"` | `{ data: Record<string, VuuRowDataItemType> }` — remote; local also adds `key` | `{ key: "VOD.L-a1b2", data: { ric: "VOD.L-a1b2", lotSize: 100, ... } }` |
| `"deleteRow"` | `{ key: string, mode: DeleteRowMode }` | `{ key: "VOD.L", mode: "soft" }` |
| `"deleteSelectedRows"` | `{ mode: DeleteRowMode }` — no keys; server reads its own selection | `{ mode: "soft" }` |
| `"editCell"` | `{ key: string, column: string, data: VuuRowDataItemType }` | `{ key: "VOD.L", column: "lotSize", data: 500 }` |
| `"undoRowChange"` | `{ key: string }` | `{ key: "VOD.L" }` |
| `"endEditSession"` | `{ save?: boolean, force?: boolean }` | `{ save: true }` or `{}` (discard) |

### Routing & Handlers

| EditApi method | RPC name | Routes via | VuuModule handler |
|---|---|---|---|
| `addRow` | `"addRow"` | **source** datasource | `addRow` — inserts into session table |
| `deleteRow` | `"deleteRow"` | session datasource | `deleteRow` — direct key-based delete (for programmatic use) |
| `deleteSelectedRows` | `"deleteSelectedRows"` | session datasource | reads `selectedRows` from session subscription; soft/hard deletes each; returns `DeleteSelectedRowsResult` |
| `editCell` | `"editCell"` | session datasource | `editCell` — `sessionTable.update(key, col, val)` |
| `undoRowChange` | `"undoRowChange"` | session datasource | if key not in source table: deletes inserted row, returns `UndoRowChangeResult { wasInsertedRow: true }`; otherwise reverts `cellUpdates` to source values |
| `beginEditSession` | `"beginEditSession"` | source datasource | creates `SessionTable` proxy, stores in `#sessionTableMap` |
| `endEditSession` | `"endEditSession"` | session datasource | applies (or discards) session updates to source table |

---

## Per-Row Checkbox State — `checkboxRowLevelProps`

When using checkbox selection (`selectionModel="checkbox"`) during an edit session, individual row checkboxes can be given custom `disabled` and `checked` states via the `checkboxRowLevelProps` prop on `<Table>`.

### API

```typescript
// Defined in @vuu-ui/vuu-table-types
type CheckboxRowLevelProps = {
  /** Override the checked state; falls back to dataRow.isSelected if absent */
  checked?: boolean;
  /** Disable the checkbox for this row */
  disabled?: boolean;
};

// On TableProps:
checkboxRowLevelProps?: (dataRow: DataRow) => CheckboxRowLevelProps;
```

### Soft-delete example

In `EditableInstrumentsTemplate`, soft-deleted rows show their checkbox as **checked + disabled** — visually indicating the row is pending deletion while preventing re-selection:

```typescript
const checkboxRowLevelProps = useCallback(
  (dataRow: DataRow): CheckboxRowLevelProps =>
    dataRow.vuuMsg === "SOFT_DELETED"
      ? { disabled: true, checked: true }
      : {},
  [],
);

<Table
  config={config}
  dataSource={sessionDataSource ?? dataSource}
  checkboxRowLevelProps={editMode === "edit" ? checkboxRowLevelProps : undefined}
  selectionModel={editMode === "edit" ? "checkbox" : "none"}
/>
```
