# Editable Tables

## EditableTable

`EditableTable` (`@vuu-ui/vuu-table-extras`) is a `Table` with View and Edit
modes. Switching to Edit begins an edit session and shows the session table;
the footer shows Save and Cancel (and Delete, with `allowDelete`). Saving or
cancelling returns to View.

```tsx
<EditableTable config={config} dataSource={dataSource} readOnly={["ric"]} />
```

### Props

| Prop | Description |
| ---- | ----------- |
| `config`, `dataSource` | As for `Table`. `config.columns` are the view-mode columns; edit-mode columns are derived from them. |
| `editable` | Which columns can be edited, and how. See [Editable columns](#editable-columns). |
| `readOnly` | Columns that can never be edited. Defaults to the server-maintained `vuuCreatedTimestamp`, `vuuUpdatedTimestamp` and `vuuMsg`. |
| `editMode`, `defaultEditMode`, `onEditModeChange` | `"view"` or `"edit"`. Use `editMode` with `onEditModeChange` to control the mode from the parent. |
| `allowDelete` | Adds checkbox selection and a Delete button. |
| `showInlineAddRow` | Shows an empty row at the top of the table for adding rows. |
| `undoColumn` | Adds a column with an undo button on each changed row. Pass a partial column descriptor to customise it. |
| `copyOption` | Rows copied into the session table: `All` (default), `Selected` or `Empty`. |
| `deleteMode` | `soft` (default) or `hard`. See [Concepts](concepts.md#deleting-rows). |
| `rowDefaults` | Values for columns the user doesn't fill in when adding a row. Pass a stable reference. |
| `editSessionApi` | `createSessionDataSource` (default) or `beginEditSession`. |
| `confirmCancel` | `() => Promise<boolean>`, called before discarding unsaved changes. |
| `onSave`, `onCancel` | Called after a successful save or cancel. |
| `onError` | Called when begin, save, cancel or delete fails. See [Error handling](error_handling.md). |
| `editModeToggle`, `showEditModeToggle` | Replace or hide the View/Edit toggle. |
| `toolbar`, `footer` | Extra toolbar content; footer content shown in view mode. |
| `saveLabel` | Label for the Save button. |
| `testId` | Suffix for the `data-testid` of the parts, for tests. |

Other `Table` props are passed through.

## Editable columns

`editable` maps column names to editing options. The key `"*"` applies to
every column without its own entry. When `editable` is omitted, every column
not in `readOnly` can be edited.

```tsx
editable={{
  "*": false,
  description: true,
  // can be set when adding a row, but not changed afterwards
  ric: { insert: true, update: false },
  currency: { renderer: "dropdown-cell", values: ["EUR", "GBP", "USD"] },
  lastTraded: { type: { name: "date", renderer: { name: "temporal-input-cell" } } },
}}
```

A column's spec is either:

- `true` or `false`,
- `{ insert, update }`, to allow editing only when adding or only when
  updating rows, or
- `{ editable?, renderer?, values?, type? }`, to choose the cell editor:
  - `renderer` names a registered cell renderer,
  - `values` are the choices for a value-list renderer such as `dropdown-cell`,
  - `type` replaces the column type while editing and takes precedence over
    `renderer`.

### Cell editors

| Renderer | Package | Use for |
| -------- | ------- | ------- |
| `input-cell` | `@vuu-ui/vuu-table` | text and numbers (the default) |
| `checkbox-cell`, `toggle-cell` | `@vuu-ui/vuu-table` | booleans |
| `temporal-input-cell` | `@vuu-ui/vuu-table` | dates and times |
| `dropdown-cell` | `@vuu-ui/vuu-table-extras` | a fixed list of values, or values from a lookup table (see [Lookups](lookups.md)) |

Import the package that registers a renderer before you use it by name.

### Validation

A column's `clientSideEditValidationCheck` runs as the user types and before
commit. Invalid values are never sent to the server; they show a warning and
put the session in the `invalid` state, which disables Save.

## Asking before discarding changes

`useConfirmDiscard` returns a `confirmCancel` function that shows a
confirmation dialog. It needs a `ModalProvider` above it.

```tsx
const confirmDiscard = useConfirmDiscard({
  message: "You have unsaved changes. Discard them?",
});

<EditableTable confirmCancel={confirmDiscard} ... />;
```

The dialog only appears when there are changes to lose.

## Building your own editable table

When `EditableTable`'s layout doesn't fit, use the hooks it is built from.

```tsx
import {
  DataEditingProvider,
  EditButtons,
  useEditableColumns,
  useEditableTable,
} from "@vuu-ui/vuu-data-editing";

const MyEditableTable = ({ config, dataSource }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const stopEditing = useCallback(() => setIsEditMode(false), []);

  const {
    canCancel,
    canSave,
    columnsDiverge,
    dataSource: activeDataSource,
    editSchema,
    editSession,
    isEditSessionReady,
    onCancel,
    onSave,
    rowClassNameGenerators,
  } = useEditableTable({
    dataSource,
    isEditMode,
    onCancel: stopEditing,
    onSave: stopEditing,
  });

  const columns = useEditableColumns({
    columns: config.columns,
    columnsDiverge,
    editSchema,
    isEditing: isEditSessionReady,
    undoColumn: true,
  });

  return (
    <>
      <button onClick={() => setIsEditMode(true)}>Edit</button>
      <DataEditingProvider editSession={editSession}>
        <Table
          config={{ ...config, columns, rowClassNameGenerators }}
          dataSource={activeDataSource}
        />
      </DataEditingProvider>
      {isEditSessionReady ? (
        <EditButtons
          canCancel={canCancel}
          canSave={canSave}
          editSession={editSession}
          onCancel={onCancel}
          onSave={onSave}
        />
      ) : null}
    </>
  );
};
```

Things to know:

- Always pass the `dataSource` returned by `useEditableTable` to `Table`. It is
  the source in view mode and the session table while editing. Use
  `sourceDataSource` for anything that should always show the source, such as
  row counts or filters.
- Wait for `isEditSessionReady` before showing edit columns and buttons.
- When `isEditMode` is omitted, `useEditableTable` reads it from the nearest
  `EditModeProvider`.
- `useEditableTable` also returns `onDelete`, `hasSelection`,
  `isRowSelectable` and `onUndoRowChange` for delete and undo.

## Adding rows

With `showInlineAddRow`, `EditableTable` puts an `InlineAddRow` above the
table. The user fills it in and the row is added to the session table once the
last required field is committed; it is applied to the source on Save. Rows
added during a session are tracked by key, so undoing an added row removes it
again.

To add rows one at a time from a form, without entering edit mode, use
`CreateRowForm` against the table's data source. It has its own edit session
and saves each row as soon as the user clicks Create. See
[Edit forms](edit_forms.md).
