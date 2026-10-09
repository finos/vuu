# Getting Started with Data Editing

This guide adds editing to a table of instruments: first in the table itself,
then with a form beside the table.

## What you need

- **Packages:** `@vuu-ui/vuu-data-editing` and `@vuu-ui/vuu-table-extras`.
- **A data source** for the table, for example a `VuuDataSource` created with
  `useData()`.
- **A server table that supports editing.** Edits are made in a session table,
  so the module that owns the table must:
  - handle `createSessionTable` and `endEditSession` (the core Vuu
    session-table RPC handlers provide these), and
  - provide an edit RPC handler, for example one based on
    `EditSessionRpcHandler`, implementing the edits you want to allow:
    `editCell`, `addRow` and `deleteSelectedRows`.

You don't need a server for local development or tests. Wrap your component in
`LocalDataSourceProvider` from `@vuu-ui/vuu-data-test`, which implements all of
this in the browser. See [Testing](testing.md).

## Step 1: an editable table

`EditableTable` is a `Table` with a View/Edit toggle. Switching to Edit starts
an edit session. Save applies the edits; Cancel throws them away.

```tsx
import { EditableTable } from "@vuu-ui/vuu-table-extras";
import type { TableConfig } from "@vuu-ui/vuu-table-types";
import { useData } from "@vuu-ui/vuu-utils";
import { useMemo } from "react";

const config: TableConfig = {
  columns: [
    { name: "ric", serverDataType: "string" },
    { name: "description", serverDataType: "string" },
    { name: "currency", serverDataType: "string" },
    { name: "lotSize", serverDataType: "int" },
  ],
};

export const Instruments = () => {
  const { VuuDataSource } = useData();
  const dataSource = useMemo(
    () =>
      new VuuDataSource({
        columns: ["ric", "description", "currency", "lotSize"],
        table: { module: "SIMUL", table: "instruments" },
      }),
    [VuuDataSource],
  );

  return (
    <EditableTable config={config} dataSource={dataSource} readOnly={["ric"]} />
  );
};
```

By default every column can be edited except the server-maintained
`vuuCreatedTimestamp`, `vuuUpdatedTimestamp` and `vuuMsg`. `readOnly` adds
columns to that list. To choose exactly which columns can be edited, and how,
use `editable` instead:

```tsx
<EditableTable
  config={config}
  dataSource={dataSource}
  editable={{
    currency: { renderer: "dropdown-cell", values: ["EUR", "GBP", "USD"] },
    description: true,
    lotSize: true,
  }}
/>
```

## Step 2: insert, delete and undo

These props let the user add and remove rows:

```tsx
<EditableTable
  allowDelete
  config={config}
  dataSource={dataSource}
  editable={{
    "*": true,
    // the key can be set on a new row but not changed afterwards
    ric: { insert: true, update: false },
  }}
  showInlineAddRow
  undoColumn
/>
```

- `showInlineAddRow` shows an empty row at the top of the table. The user
  fills it in to add a row.
- `allowDelete` adds a Delete button that marks the selected rows as deleted.
  Nothing is removed until the user saves.
- `undoColumn` adds an undo button to every changed, added or deleted row.

## Step 3: a table with an edit form

Some data is easier to edit in a form. `TableWithEditForm` shows the selected
row in a form beside the table. The user clicks Edit to change it, or New to
add a row.

```tsx
import type { CreateRowFormField } from "@vuu-ui/vuu-data-editing";
import { TableWithEditForm } from "@vuu-ui/vuu-table-extras";

const fields: CreateRowFormField[] = [
  { label: "RIC", name: "ric", readOnly: true },
  { label: "Description", name: "description" },
  { label: "Currency", name: "currency" },
  { label: "Lot size", name: "lotSize", serverDataType: "int" },
];

const createFields: CreateRowFormField[] = [
  { label: "RIC", name: "ric" },
  ...fields.slice(1),
];

<TableWithEditForm
  config={config}
  createFields={createFields}
  dataSource={dataSource}
  fields={fields}
  formTitle={(row) => `Instrument ${row.ric}`}
  validate={({ lotSize }) =>
    typeof lotSize === "number" && lotSize <= 0
      ? { lotSize: "Lot size must be greater than zero" }
      : {}
  }
/>;
```

Row selection is locked while the form is being edited, so the user can't lose
their changes by clicking another row. Pass `allowCreate={false}` to hide New.

## Next steps

- Ask before throwing away unsaved changes: pass
  `confirmCancel={useConfirmDiscard()}` (needs a `ModalProvider`). See
  [Editable tables](editable_tables.md).
- Lay out your own form with `EditForm` and `EditField`. See
  [Edit forms](edit_forms.md).
- Fill dropdowns from another Vuu table. See [Lookups](lookups.md).
- Show save failures to the user. See [Error handling](error_handling.md).
- Not sure a session table is right for your data? See
  [Choosing an editing model](choosing_a_model.md).
