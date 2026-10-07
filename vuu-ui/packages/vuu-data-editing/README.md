# @vuu-ui/vuu-data-editing

Shared data editing APIs, state management, and React components for VUU UI.

This package coordinates edit-session state with editable data sources (both in-memory and remote Vuu session tables) and provides React hooks and UI controls for table editing.

---

## Table of Contents

- [Overview & Architecture](#overview--architecture)
- [EditSession](#editsession)
  - [Lifecycle State Machine](#lifecycle-state-machine)
  - [Transition Queue](#transition-queue)
  - [EditState & Counters](#editstate--counters)
  - [Internal Edit Tracking](#internal-edit-tracking)
- [Editing Operations & Flows](#editing-operations--flows)
  - [Cell Editing (`commit` / `cancel`)](#cell-editing-commit--cancel)
  - [New Row Flow (`addNewRow` / `addRow`)](#new-row-flow-addnewrow--addrow)
  - [Row Deletions (`deleteSelectedRows`)](#row-deletions-deleteselectedrows)
  - [Undo Flow (`undoRowChange`)](#undo-flow-undorowchange)
  - [Session Completion (`end`) & Stale Handling](#session-completion-end--stale-handling)
- [Direct Editing (`DirectEditSession`)](#direct-editing-directeditsession)
- [React Hooks & Context](#react-hooks--context)
  - [`useEditableTable`](#useeditabletable)
  - [`DataEditingProvider` & `useEditSession`](#dataeditingprovider--useeditsession)
  - [`useCellEdited`](#usecellEdited)
  - [`useEditMode` & `EditModeProvider`](#useeditmode--editmodeprovider)
- [UI Components & Helpers](#ui-components--helpers)
  - [`EditButtons`](#editbuttons)
  - [`UndoCellRenderer`](#undocellrenderer)
  - [`editActionRowClassNameGenerator`](#editactionrowclassnamegenerator)
  - [`isRowSelectable` / `isEditRowReadOnly`](#isrowselectable--iseditrowreadonly)
- [Standard Integration Pattern](#standard-integration-pattern)

---

## Overview & Architecture

VUU editing operates primarily through **staged edit sessions**:
1. When entering edit mode, a server-side (or mock) **session table** is created as a sandbox copy of the source table.
2. User edits (cell edits, row insertions, soft deletes) are applied to the session table and tracked locally by `EditSession`.
3. When saved, changes are committed from the session table to the source table. When cancelled, the session table is discarded without affecting the source table.

```
Source DataSource ──begin()──> Session Table Created ──> Live Session DataSource
       │                                                        │
       │                                                 Edits & Deletes
       │                                                        │
       └──────────────end(save=true/false)──────────────────────┘
```

For backends that do not use session tables and accept cell edits directly against the live table, `DirectEditSession` is used instead.

---

## EditSession

`EditSession` is the core stateful orchestrator class extending `EventEmitter`. It tracks:
- Local cell edits per row and column
- Added row keys
- Edit, invalid, delete, and add counts
- Edit session lifecycle state

### Lifecycle State Machine

`EditSession.lifecycle` is a discriminated union on `status`:

```typescript
type EditLifecycle =
  | { status: "idle" }
  | { status: "starting" }
  | { status: "active"; sessionDataSource: DataSource }
  | { status: "ending"; sessionDataSource: DataSource }
  | { status: "error"; operation: "begin" | "end"; error: Error; sessionDataSource?: DataSource };
```

```
idle ──begin()──> starting ──> active ──end()──> ending ──> idle
                     │                             │
                     └── error { op: "begin" }     └── error { op: "end" }
```

- `inEditMode`: Getter returning `true` when status is `"active"`, `"ending"`, or `error { operation: "end" }`.
- `dataSource`: Getter returning `#sessionDataSource` when active/ending, falling back to `#sourceTableDataSource`.

### Transition Queue

All `begin()` and `end()` calls are serialized through `#transitionQueue` (a chained Promise). This prevents overlapping transitions, race conditions, and corrupted lifecycle states when rapid toggles occur.

### EditState & Counters

`editSession.editState` is a derived property reflecting the overall dirtiness and validity of the session:

```typescript
type EditState = "clean" | "dirty" | "invalid" | "stale";
```

Priority order (highest to lowest):
1. **`"invalid"`**: When `invalidCount > 0` (validation failure in at least one cell).
2. **`"stale"`**: When a save was rejected by the server due to concurrent updates (`StaleUpdateError`).
3. **`"dirty"`**: When `editCount > 0 || deleteCount > 0 || addCount > 0`.
4. **`"clean"`**: When no edits, deletes, or added rows exist.

Driven by four independent counters:
- `editCount`: Number of valid cell edits differing from their original values.
- `invalidCount`: Number of cell edits with validation errors.
- `deleteCount`: Number of rows marked for deletion.
- `addCount`: Number of newly inserted rows currently in the session.

All counter setters enforce non-negative values via `Math.max(0, val)`.

### Internal Edit Tracking

`EditSession` manages four primary collections:

```typescript
#rowEdits = new Map<string, RowEditDetails>();       // rowKey => { cellEdits: Map<column, CellEdit> }
#addedRowKeys = new Set<string>();                  // Set of added row keys
#cellCommitRevisions = new Map<string, Map<string, number>>(); // (key, col) => revision
#transitionQueue = Promise.resolve();               // Serialized transition queue
```

`CellEdit` holds:
```typescript
type CellEdit = {
  originalValue: EditSessionValue;
  editedValue: EditSessionValue;
  isValid: boolean;
};
```
A cell is considered edited only when `originalValue !== editedValue && isValid === true`. If edited back to the original value, the entry is automatically pruned.

---

## Editing Operations & Flows

### Cell Editing (`commit` / `cancel`)

- **`commit(key, columnName, originalValue, typedValue, isValid, options)`**:
  - Increments cell revision to guard against out-of-order RPC responses.
  - Updates `#rowEdits`, adjusting `editCount` and `invalidCount`.
  - Dispatches `editCell` RPC to the active DataSource if `syncToDataSource !== false`.
  - Emits `"cellEditChanged"` and `"editState"`.
- **`cancel(key, columnName, restoredValue)`**:
  - Discards an in-progress invalid edit, restoring the cell to its original valid state. Uncommitted typed values are discarded client-side without sending an RPC.

### New Row Flow (`addNewRow` / `addRow`)

1. **Configure**: `editSession.configureNewRow(columns, requiredColumns)` defines the expected column inputs.
2. **Draft**: `editSession.setNewRowValue(column, value)` updates `#newRowState.values`.
3. **Submit**: `editSession.addNewRow()` validates required columns and delegates to `addRow()`.
4. **`addRow(rowData)`**:
   - Calls `dataSource.addRow(rowData)` with `#rowDefaults` merged in.
   - On success, extracts the row key (from `rowData[keyColumn]` or server `response.data.key`) and adds it to `#addedRowKeys`.
   - Increments `addCount`.
   - Resets new-row form draft and increments `draftRevision`.
5. **Asynchronous registration**: For server-generated keys received via subscription row updates, `registerAddedRow(key)` registers the key so that subsequent delete/undo operations accurately track the row.

### Row Deletions (`deleteSelectedRows`)

- Captures `selectedRowsCount` before deleting.
- Exits early if `selectedRowsCount === 0`.
- Calls `dataSource.deleteSelectedRows(deleteMode)`.
- On success:
  - Increments `deleteCount` by `selectedRowsCount`.
  - **Clears selection**: Dispatches `dataSource.select({ type: "DESELECT_ALL" })` so deleted rows are immediately deselected, preventing accidental double-deletion and disabling the Delete button.

### Undo Flow (`undoRowChange`)

Invoked when the user clicks the Undo button on a row (`UndoCellRenderer`):

```typescript
editSession.undoRowChange(key, action);
```

1. **Reverts cell edits**: Clears recorded cell edits for `key`, restores previous values, and adjusts `editCount` / `invalidCount`.
2. **Reverts deletions**: If `action === "deleteRow"`, decrements `deleteCount`.
3. **Reverts insertions**: If the row was an inserted row:
   - `action === "addRow"` OR
   - `isAddedRow(key)` (key exists in `#addedRowKeys`) OR
   - Server returns `wasInsertedRow: true`
   - Decrements `addCount` and removes `key` from `#addedRowKeys`.

> **Robust Add-Delete-Undo**: Even if a row was added, then soft-deleted (`action` became `"deleteRow"`), and the server purges the row on undo without returning `wasInsertedRow`, `EditSession` identifies the row via `#addedRowKeys` and decrements **both** `deleteCount` and `addCount`, returning `editState` cleanly to `"clean"`.

### Session Completion (`end`) & Stale Handling

- **`end(saveChanges = false, force = false)`**:
  - Transitions lifecycle to `"ending"`.
  - Calls `dataSource.endEditSession(saveChanges, force)`.
  - On success: clears all edits, resets counters, unsubscribes session DataSource, transitions to `"idle"`.
  - **Stale Updates (`StaleUpdateError`)**: If the server rejects the commit due to concurrent edits, lifecycle transitions to `error { operation: "end" }` and `editState` becomes `"stale"`. The user can force-save with `end(true, true)`.

---

## Direct Editing (`DirectEditSession`)

Implements `TableEditSession` for tables that support in-place cell editing without a session table or lifecycle state machine:
- Does not create session tables or track `editCount`.
- Each `commit()` forwards directly to `dataSource.editCell()`.
- `inEditMode` is always `false`.

---

## React Hooks & Context

### `useEditableTable`

The primary orchestrator hook for table components:

```typescript
const {
  canCancel,              // boolean: safe to show/enable Cancel button
  canSave,                // boolean: active, dirty/stale, invalidCount === 0
  dataSource,             // Active DataSource (session DS in edit mode, else source DS)
  sourceDataSource,       // Always the source DataSource
  sessionDataSource,      // Session DataSource (when active)
  editSession,            // EditSession instance
  lifecycle,              // Current EditLifecycle
  hasSelection,           // boolean: whether rows are selected (controls Delete button)
  isEditMode,             // boolean: current edit mode flag
  isEditSessionReady,     // boolean: gates rendering the editable Table
  isRowSelectable,        // (dataRow) => boolean: blocks selection of soft-deleted rows
  rowClassNameGenerators, // [vuu-edit-actions] in edit mode, else undefined
  onCancel,               // async handler: ends session and calls props.onCancel
  onDelete,               // async handler: deletes selected rows
  onSave,                 // async handler: ends session (with optional force) and calls props.onSave
  onUndoRowChange,        // (key, action) => void
} = useEditableTable(props);
```

### `DataEditingProvider` & `useEditSession`

Distributes `EditSession` through React Context to descendant cells and controls:

```tsx
<DataEditingProvider editSession={editSession}>
  {/* Table and EditButtons subtree */}
</DataEditingProvider>
```

- `useEditSession()`: Returns `EditSession | undefined`.
- `useEditSession(true)`: Returns `EditSession`, throws if unmounted.
- `useTableEditSession()`: Returns generic `TableEditSession` (works with both `EditSession` and `DirectEditSession`).

### `useCellEdited`

Uses `useSyncExternalStore` for zero-lag cell edit detection. Returns `true` if `(rowKey, columnName)` has an uncommitted edit:

```typescript
const isEdited = useCellEdited(editSession, rowKey, columnName);
```

### `useEditMode` & `EditModeProvider`

Optional context for coordinating a boolean edit/view mode toggle across independent toolbar and table components:

```tsx
const { isEditMode, setEditMode } = useEditMode();
```

---

## UI Components & Helpers

### `EditButtons`

Pre-built action buttons wired to `EditSession`:
- **Delete**: Enabled only when `hasSelection === true`.
- **Save**: Enabled when `canSave === true`. Displays `"Save (force)"` when `editState === "stale"`.
- **Cancel**: Enabled when `canCancel === true`.

```tsx
<EditButtons
  canCancel={canCancel}
  canSave={canSave}
  editSession={editSession}
  hasSelection={hasSelection}
  onCancel={onCancel}
  onDelete={onDelete}
  onSave={onSave}
/>
```

### `UndoCellRenderer`

Registered as `"vuu.undo-cell"`. Renders an Undo button in the row's action column:
- Automatically registers added rows via `editSession.registerAddedRow(key)` when `dataRow.vuuAction === "addRow"`.
- Dispatches `editSession.undoRowChange(key, action)` on click.
- Tooltip dynamically reflects action: `"Undo insert row"`, `"Undo delete row"`, or `"Undo row edits"`.

### `editActionRowClassNameGenerator`

Registered as `"vuu-edit-actions"`. Applies row CSS classes based on `dataRow.vuuAction`:
- `"addRow"` → `.vuuTableRow-inserted`
- `"deleteRow"` → `.vuuTableRow-deleted`

### `isRowSelectable` / `isEditRowReadOnly`

- `isEditRowReadOnly(dataRow)`: Returns `true` if `dataRow.vuuAction === "deleteRow"`.
- `isRowSelectable`: Exported from `useEditableTable` as `(dataRow) => !isEditRowReadOnly(dataRow)`. Pass to `<Table isRowSelectable={isRowSelectable} />` to prevent users from selecting soft-deleted rows.

---

## Standard Integration Pattern

```tsx
import React, { useCallback, useState } from "react";
import { Table } from "@vuu-ui/vuu-table";
import {
  DataEditingProvider,
  EditButtons,
  useEditableTable,
} from "@vuu-ui/vuu-data-editing";

export const EditableTableFeature = ({ sourceDataSource, tableConfig }) => {
  const [isEditMode, setIsEditMode] = useState(false);

  const {
    canCancel,
    canSave,
    dataSource,
    editSession,
    hasSelection,
    isEditSessionReady,
    isRowSelectable,
    onCancel,
    onDelete,
    onSave,
    rowClassNameGenerators,
  } = useEditableTable({
    dataSource: sourceDataSource,
    isEditMode,
    onCancel: () => setIsEditMode(false),
    onSave: () => setIsEditMode(false),
  });

  return (
    <DataEditingProvider editSession={editSession}>
      <div className="table-container">
        {(!isEditMode || isEditSessionReady) && (
          <Table
            config={tableConfig}
            dataSource={dataSource}
            isRowSelectable={isRowSelectable}
            rowClassNameGenerators={rowClassNameGenerators}
          />
        )}
      </div>

      <div className="toolbar">
        {!isEditMode ? (
          <button onClick={() => setIsEditMode(true)}>Edit</button>
        ) : (
          <EditButtons
            canCancel={canCancel}
            canSave={canSave}
            editSession={editSession}
            hasSelection={hasSelection}
            onCancel={onCancel}
            onDelete={onDelete}
            onSave={onSave}
          />
        )}
      </div>
    </DataEditingProvider>
  );
};
```

