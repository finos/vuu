# Bulk Editing

Bulk editing lets the user change many rows at once in a dialog. The dialog
shows the rows in a session table, with an extra row of editors at the top:
a value typed there is applied to that column in every row. The user can also
edit rows one by one. Nothing is applied to the source table until Save.

## useBulkEditDialog

```tsx
import { useBulkEditDialog } from "@vuu-ui/vuu-table-extras";

const { editSelectedRows, insertRows, isEditing } = useBulkEditDialog({
  bulkEditPanelProps: { columns: bulkEditColumns },
  dataSource,
  title: "Edit instruments",
});

<Button disabled={isEditing || selectedCount === 0} onClick={editSelectedRows}>
  Edit selected rows
</Button>
<Button disabled={isEditing} onClick={insertRows}>
  Add rows
</Button>
```

- `editSelectedRows()` opens the dialog with the rows selected in
  `dataSource`.
- `insertRows()` opens the dialog with an empty session table, for adding
  rows.
- `isEditing` is true while the dialog is open. `editSession` is the session
  behind it.

The hook needs a `ModalProvider` above it. It also accepts `confirmCancel`,
`onSaved`, `onCancelled`, `onError`, `saveLabel`, `deleteMode`,
`editSessionApi` and `rowDefaults`.

## Choosing the columns

Pass column descriptors in `bulkEditPanelProps.columns` and set
`editableBulk` on each:

| `editableBulk` | In the dialog the column is |
| -------------- | --------------------------- |
| `"bulk"` | shown and editable |
| `"read-only"` or not set | shown, not editable |
| `false` | hidden |

```ts
const bulkEditColumns = columns.map((column) => ({
  ...column,
  editableBulk:
    column.name === "vuuMsg" ? false : column.name === "ric" ? undefined : "bulk",
}));
```

Without `columns`, every column of the session table is shown and editable as
text. Column `type.rules` are used as client-side validation.

## Tracking the selection

`Table`'s `onSelectionChange` reports selection requests, not the selected
rows. To enable an "Edit selected" button, count selected rows with the data
source's `row-selection` event:

```tsx
const [selectedCount, setSelectedCount] = useState(0);
useEffect(() => {
  dataSource.on("row-selection", setSelectedCount);
  return () => {
    dataSource.removeListener("row-selection", setSelectedCount);
  };
}, [dataSource]);
```
