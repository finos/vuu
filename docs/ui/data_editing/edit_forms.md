# Edit Forms

There are three form components, from most to least complete:

| Component | Use it to |
| --------- | --------- |
| `TableWithEditForm` (`@vuu-ui/vuu-table-extras`) | show a table with a form for the selected row, with Edit and New |
| `CreateRowForm` | add a row from a list of fields |
| `EditForm` | lay out your own form for editing or adding a row |

All of them own an edit session, so you don't need `useEditableTable` or a
`DataEditingProvider`. In edit mode the session holds just the row being
edited (copy option `Selected`); in create mode it starts empty (`Empty`). Save
applies the change to the source table.

## TableWithEditForm

```tsx
<TableWithEditForm
  config={config}
  createFields={createFields}
  createTitle="New instrument"
  dataSource={dataSource}
  fields={fields}
  formTitle={(row) => `Instrument ${row.ric}`}
  validate={validateInstrument}
/>
```

| Prop | Description |
| ---- | ----------- |
| `fields` | Fields shown for the selected row. See [Fields](#fields). |
| `createFields` | Fields shown when adding a row. Defaults to `fields`. |
| `allowCreate` | Show the New button. Default `true`. |
| `validate`, `validateCreate` | Client-side validation for edit and create. `validateCreate` defaults to `validate`. |
| `formTitle` | A title, or a function of the selected row. |
| `createTitle` | Title of the create form. Default `"New"`. |
| `placeholder` | Shown when no row is selected. |
| `confirmCancel` | Asked before discarding unsaved changes. See `useConfirmDiscard`. |
| `onModeChange` | Called with `"view"`, `"edit"` or `"create"`. |
| `toolbar` | Extra toolbar content. |
| `deleteMode`, `editSessionApi`, `rowDefaults`, `onError` | Passed to the form's edit session. |
| `testId` | Suffix for `data-testid`s. |

## Fields

`fields` and `createFields` are lists of `CreateRowFormField`, the props of an
`EditField` without `dataRow`:

```ts
const fields: CreateRowFormField[] = [
  { label: "RIC", name: "ric", readOnly: true },
  { label: "Description", name: "description" },
  { label: "Lot size", name: "lotSize", serverDataType: "int" },
  { label: "Active", name: "active", type: "checkbox" },
  {
    label: "Exchange",
    name: "exchange",
    optionMap: { label: "description", value: "code" },
    table: { module: "SIMUL", table: "exchanges" },
    type: "dropdown",
  },
];
```

- `serverDataType` converts the typed text before it is sent (default
  `"string"`, or `"boolean"` for checkboxes).
- `required` defaults to `true` in a create form. Set it to `false` for
  optional fields.
- `clientSideEditValidationCheck` validates a single field as the user types.
- A `dropdown` field gets its options from a lookup table. See
  [Lookups](lookups.md).

## CreateRowForm

```tsx
<CreateRowForm
  dataSource={dataSource}
  fields={createFields}
  key={formKey}
  onCancelled={close}
  onSaved={close}
  title="New instrument"
  validate={validateInstrument}
/>
```

The row is added only when the user clicks Create and every check passes:
required fields, `validate`, and the server. If the server rejects the row,
its message is shown above the fields and the user can correct the values and
try again.

A `CreateRowForm` adds one row. To add another, close it from `onSaved`, or
change its `key` to get a fresh form.

## EditForm

Use `EditForm` when you want to lay out the fields yourself.

```tsx
import { EditField, EditForm } from "@vuu-ui/vuu-data-editing";

<EditForm
  dataRow={row}
  dataSource={dataSource}
  isEditMode={isEditMode}
  key={row.key}
  onCancelled={() => setIsEditMode(false)}
  onSaved={() => setIsEditMode(false)}
  title={`Instrument ${row.ric}`}
  validate={validateInstrument}
>
  <EditField dataRow={row} label="Description" name="description" />
  <EditField dataRow={row} label="Lot size" name="lotSize" serverDataType="int" />
</EditForm>;
```

- In edit mode, the row must be the one selected in `dataSource`. Fields are
  read-only until `isEditMode` is true (or, if omitted, until the nearest
  `EditModeProvider` is in edit mode).
- For create mode, pass `mode="create"`, `columns` and `requiredColumns`, and
  give each field `dataRow={{ key: EditSession.newRowKey }}` and `deferNewRow`.
  `CreateRowForm` does all this for you.
- `children` can be a function that receives the form state, for example to
  show fields depending on other values:

  ```tsx
  <EditForm {...props}>
    {(form) => (
      <>
        <EditField dataRow={row} label="Type" name="type" />
        {form.getValues().type === "future" ? (
          <EditField dataRow={row} label="Expiry" name="expiry" />
        ) : null}
      </>
    )}
  </EditForm>
  ```

- `showButtons={false}` hides the built-in Save and Cancel so you can render
  your own. A component inside the form can call `useEditFormContext()` to get
  `submit()`, `cancel()`, `canSave` and the rest of the form state. If the
  buttons must live outside the form, such as in a dialog footer, use
  `useEditForm` instead (see below).
- `saveLabel` defaults to "Save", or "Create" in create mode.

## Validation

`validate(values)` returns an object of error messages keyed by field name.
It runs on submit, with `values` being the row's current values including
unsaved edits. Errors are shown on the fields, and nothing is saved until the
object is empty.

```ts
const validateInstrument: EditFormValidator = ({ currency, lotSize }) => {
  const errors: Record<string, string> = {};
  if (!["EUR", "GBP", "USD"].includes(currency as string)) {
    errors.currency = "Unknown currency";
  }
  if (typeof lotSize === "number" && lotSize <= 0) {
    errors.lotSize = "Lot size must be greater than zero";
  }
  return errors;
};
```

Validation happens in three places:

1. `clientSideEditValidationCheck` on a field: as the user types.
2. `validate` on the form: when the user clicks Save or Create.
3. The server: when the edit or row is sent. Rejections are shown in the
   form's error banner. See [Error handling](error_handling.md).

## Custom fields

`EditField` handles text, checkbox and dropdown values. For anything else,
such as a list of tags or a value edited with several controls, write your own
field with `useCustomEditField`. It records the value in the form's edit
session, so the form knows it is dirty and Save sends it.

```tsx
const TagsField = ({ dataRow, name }) => {
  const originalValue = useMemo(() => parseTags(dataRow[name]), [dataRow, name]);
  const { error, isDirty, setValue, value = originalValue } =
    useCustomEditField<string[]>({
      equals: sameTags,
      name,
      originalValue,
      rowKey: dataRow.key,
      serialize: (tags) => tags.join(","),
    });
  // render value, call setValue(nextTags) when it changes
};
```

- `serialize` turns your value into the scalar sent to the server.
- `equals` decides when the value is back to the original, so the edit is
  dropped and the form is clean again.
- The hook returns `{ value, setValue, reset, isDirty, committing, error }`.
- It uses the edit session from the enclosing form. Pass `editSession` to use
  another.

:::caution
Pressing Enter in a single text input inside a `<form>` submits it. If your
field uses Enter for something else, call `event.preventDefault()`.
:::

## Building your own form

`EditForm` is built on `useEditForm`, which you can use directly. It takes the
same props and returns the form state and actions: `submit(force?)`,
`cancel()`, `setValue(name, value)`, `getValues()`, `fieldErrors`, `saving`,
`error`, `isDirty`, `canSave` and the `editSession`. Wrap your fields in a
`DataEditingProvider` with the returned `editSession`.

## Things to know

- Table rows passed to `onSelect` are proxies that are only valid during that
  render. To keep one, copy it with `getDataRowValues(row)`.
- `rowDefaults` must be a stable reference. A new object recreates the edit
  session.
