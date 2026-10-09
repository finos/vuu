# Error Handling

Errors can occur when a session starts or ends, when a single edit is
rejected, or when a save conflicts with someone else's changes.

## Session operations: onError

`EditableTable`, `TableWithEditForm`, `useBulkEditDialog`, `useEditableTable`,
`useEditForm` and `EditForm` accept an `onError` handler:

```tsx
<EditableTable
  dataSource={dataSource}
  onError={(error, operation) =>
    showNotification({ status: "error", content: `${operation} failed: ${error.message}` })
  }
/>
```

`operation` is `"begin"`, `"cancel"`, `"delete"` or `"save"`. Without a
handler, errors are logged with `console.error`.

The session's lifecycle also records the failure. `useEditSessionState`
returns a `lifecycle` with `status: "error"` and `operation` `"begin"` or
`"end"`. After a failed save the session stays open, so the user can try Save
again or Cancel.

## Single edits

When the server rejects a cell edit, the edit is kept as invalid and the cell
shows a warning with the server's message. Save is disabled until the user
fixes or undoes it. Client-side validation (column `rules` or
`clientSideEditValidationCheck`) works the same way.

## New rows

If the server rejects `addNewRow`, the row stays in the form so the user can
correct it and try again:

- In `CreateRowForm`, `EditForm` and `TableWithEditForm`, the message appears
  in the banner at the top of the form. `useEditForm` exposes it as `error`.
- In `InlineAddRow`, it appears on the final column.

## Stale updates

The server rejects a save when a row in the session table has changed in the
source table since it was copied. In this case:

- `end()` rejects with `StaleUpdateError` (from `@vuu-ui/vuu-utils`) and the
  session's `editState` becomes `"stale"`.
- Each conflicting row's `vuuMsg` column describes the conflict.
  `getVuuEditMessage` formats it, for example: "Update rejected. Original
  value 100 could not be updated to 120. It was updated to 110 at 10:42:13".
- `EditButtons` changes Save to "Save (force)". That calls `end(true, true)`,
  which overwrites the newer values.

If you render your own buttons, check for `editState === "stale"` and decide
whether to offer a forced save.

## Out-of-order responses

If the user edits the same cell twice quickly, the response to the first edit
may arrive after the second was sent. The first `editCell` call then rejects
with `SupersededEditError`. It's safe to ignore: the later edit wins.
