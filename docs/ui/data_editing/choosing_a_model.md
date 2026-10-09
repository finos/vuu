# Choosing an Editing Model

Not every edit needs a session table. There are three models.

| | Staged session | Direct edit | Draft form + RPC |
| - | -------------- | ----------- | ---------------- |
| Edits go to | a session table, applied on Save | the source table, immediately | local React state, sent by your RPC |
| Save / Cancel | yes | no | yes |
| Insert and delete | yes | no | your RPC decides |
| Other users see changes | on Save | on each edit | when your RPC applies them |
| Server needs | session-table and edit RPC handlers | `editCell` on the source table | an RPC that accepts the whole entity |
| Use | `EditableTable`, `TableWithEditForm`, `EditForm`, `useEditableTable` | `DirectEditSession` | `useEntityDraft`, `useAsyncValidation` |

## Staged session

Use this by default. Changes to several cells or rows are saved together, the
user can review and cancel them, and stale updates are detected. See
[Editable tables](editable_tables.md) and [Edit forms](edit_forms.md).

## Direct edit

Use this when every cell edit stands alone and should take effect straight
away, like a spreadsheet: a status flag or a note. There is no session table,
no Save step and nothing to undo.

```tsx
import {
  DataEditingProvider,
  DirectEditSession,
  useEditableColumns,
} from "@vuu-ui/vuu-data-editing";

const editSession = useMemo(
  () => new DirectEditSession({ dataSource }),
  [dataSource],
);
const columns = useEditableColumns({
  columns: config.columns,
  editable: { notes: true, status: true },
  isEditing: true,
});

<DataEditingProvider editSession={editSession}>
  <Table config={{ ...config, columns }} dataSource={dataSource} />
</DataEditingProvider>;
```

The source table's service must support `editCell`.

## Draft form saved with an RPC

Use this when what the user edits is not a row in one table: a user with
roles, a configuration, or an entity that the server assembles from several
tables. Hold the values in React with `useEntityDraft` and send them with an
RPC on submit. See [Draft forms](draft_forms.md).
