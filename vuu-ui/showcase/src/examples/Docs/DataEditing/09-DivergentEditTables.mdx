# Divergent Edit Tables

By default the session table has the same columns as the table being viewed.
Sometimes they differ: the view table might join in descriptive columns that
can't be edited, while edits go to a narrower table on the server. We call
this a divergent edit table.

## Configuring the data source

Describe the edit table where you create the view data source, with the
`session` property:

```ts
const dataSource = new VuuDataSource({
  table: VIEW_TABLE,
  columns: VIEW_COLUMNS,
  session: {
    table: EDIT_TABLE, // a stable VuuTable
    columns: EDIT_COLUMNS, // a stable string[]
  },
});
```

The editing hooks don't need to know about this. When an edit session begins,
the session data source is built from `session.columns` instead of copying the
view's columns, filter, sort and grouping, which may name columns the edit
table doesn't have.

## Rendering columns

The data source switches column sets when you enter edit mode, so column
descriptors built for the view don't fit the edit table. `EditableTable`
handles this for you.

If you build your own table, `useEditableTable` returns `editSchema` and
`columnsDiverge`. Pass both to `useEditableColumns`, which then builds the
edit-mode columns from the edit table's schema:

```tsx
const { columnsDiverge, dataSource, editSchema, ...rest } = useEditableTable({
  dataSource: viewDataSource,
  isEditMode,
});

const columns = useEditableColumns({
  columns: viewColumns,
  columnsDiverge,
  editable,
  editSchema,
  isEditMode,
});
```

Cell edits send the column name to the session table, so edit-mode columns
must come from the edit schema.

## Things to know

- `rowDefaults` entries for columns the edit table doesn't have are dropped.
- If the edit table has a different key column, pending edits are discarded
  when the session table's schema arrives, because edits are tracked by row
  key.

See `DESIGN.md` in `@vuu-ui/vuu-data-editing` for the details.
