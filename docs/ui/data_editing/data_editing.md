# Data Editing

`@vuu-ui/vuu-data-editing` lets users edit Vuu table data from the UI, either
in a table or in a form. Edits are made in a temporary, server-side _session
table_ and applied to the source table only when the user saves, so other users
never see half-finished changes.

- [Getting started](getting_started.md): an editable table and a table with
  an edit form in a few lines of code.
- [Concepts and lifecycle](concepts.md): edit sessions, session tables, edit
  state and the lifecycle.
- [Choosing an editing model](choosing_a_model.md): staged session, direct
  edit, or a draft form saved with an RPC.
- [Editable tables](editable_tables.md): `EditableTable`, editable columns,
  insert, delete, undo and cell editors.
- [Edit forms](edit_forms.md): `EditForm`, `CreateRowForm`,
  `TableWithEditForm`, custom fields and validation.
- [Draft forms](draft_forms.md): forms for things that are not table rows,
  with `useEntityDraft` and `useAsyncValidation`.
- [Lookups](lookups.md): dropdowns filled from a Vuu table.
- [Bulk editing](bulk_editing.md): edit many rows at once in a dialog.
- [Divergent edit tables](divergent_edit_tables.md): when the edit table has a
  different schema from the view table.
- [Error handling](error_handling.md): rejected edits, stale saves and
  `onError`.
- [Testing](testing.md): testing editing code without a server.

## Layers

The API comes in three layers. Start at the top, and drop down a layer only
when you need more control.

| Layer | What you get | Exports |
| ----- | ------------ | ------- |
| Pattern components | A complete editing UI, configured with props | `EditableTable`, `TableWithEditForm`, `useBulkEditDialog` (`@vuu-ui/vuu-table-extras`); `EditForm`, `CreateRowForm` (`@vuu-ui/vuu-data-editing`) |
| Composable hooks | The state and handlers behind the patterns, for your own layout | `useEditableTable`, `useEditableColumns`, `useEditForm`, `useEditSessionState`, `useCustomEditField`, `useConfirmDiscard`, `useLookupOptions`, `useEntityDraft`, `useAsyncValidation` |
| Primitives | The building blocks | `EditSession`, `DirectEditSession`, `DataEditingProvider`, `EditModeProvider`, `EditField`, `EditButtons`, cell renderers |

Every pattern described here has a working example in the showcase, under
**Data Editing**.
