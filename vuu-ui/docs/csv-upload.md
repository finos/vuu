# CsvUpload Component

The `CsvUpload` component provides a dialog-based workflow for uploading, validating, and importing a CSV file into a Vuu table via RPC. It manages a server-side edit session throughout the process and exposes a lifecycle callback API so consumers can track and react to each phase.

---

## Usage

```tsx
import { CsvUpload } from "@vuu-ui/vuu-data-react";

<CsvUpload
  dataSource={dataSource}
  maxRows={25000}
  open={dialogOpen}
  onCancel={handleCancel}
  onClose={handleClose}
  onProcessingStarted={handleProcessingStarted}
  onEditSessionStarted={handleEditSessionStarted}
  onEditSessionEnded={handleEditSessionEnded}
  onImported={handleImported}
  onError={handleError}
/>
```

---

## Props

| Prop | Type | Description |
|---|---|---|
| `dataSource` | `DataSource` | **Required.** The Vuu data source for the target table. Must support `beginEditSession`, `endEditSession`, `createSessionDataSource`, and `rpcRequest`. |
| `maxRows` | `number` | Maximum number of data rows permitted in the CSV. Defaults to `25000`. |
| `open` | `boolean` | Controls dialog open state. When provided the component is fully controlled; when omitted it manages open state internally. |
| `dialogTitle` | `string` | Dialog header text. Defaults to `"Import CSV"`. |
| `parseOptions` | `CsvParseOptions` | Options passed to the CSV parser (see [Parse Options](#parse-options)). |
| `onProcessingStarted` | `() => void` | Fired when a file starts being parsed and validated. |
| `onEditSessionStarted` | `(dataSource: DataSource) => void` | Fired when the server-side edit session is open and a session `DataSource` is available for preview. |
| `onEditSessionEnded` | `(result: CsvUploadSessionEndResult) => void` | Fired when the edit session closes, whether by import, cancel, or failure. |
| `onImported` | `(result: CsvUploadImportedResult) => void` | Fired after a successful import. |
| `onError` | `(result: CsvUploadErrorResult \| undefined) => void` | Fired when any error occurs. Called with `undefined` to clear a previous error. |
| `onCancel` | `() => void` | Fired when the Cancel button is clicked. |
| `onClose` | `() => void` | Fired when the dialog is about to close to begin importing (i.e. the Import button is clicked and data is committing). |
| `children` | `ReactNode` | Optional children rendered inside the dialog content area, below the drop zone. Useful for displaying validation error tables or status messages. |

---

## Lifecycle & Phases

The component progresses through the following phases. Use the `CsvUploadPhase` type to track state in the consuming component.

```ts
export type CsvUploadPhase =
  | "idle"
  | "processing"
  | "preview-ready"
  | "importing"
  | "imported"
  | "failed";
```

### Phase flow

```
idle
 │
 │  user drops or selects a file
 ▼
processing          ← onProcessingStarted()
 │
 ├─ parse / schema / validation errors ──► failed   ← onError({ errors })
 │
 ▼
preview-ready       ← onEditSessionStarted(sessionDataSource)
 │
 │  user clicks Import
 ▼
importing           ← onClose()
 │
 ├─ RPC import error ──► failed              ← onError({ errors })
 │
 ▼
imported            ← onImported(result)
                    ← onEditSessionEnded({ reason: "saved" })
```

If the user cancels at any point:
- `onCancel()` is called.
- `onEditSessionEnded({ reason: "discarded" })` fires if a session was open.
- Phase returns to `idle`.

### Callbacks reference

| Callback | Phase transition | Notes |
|---|---|---|
| `onProcessingStarted` | `→ processing` | Fires before parsing begins. No data available yet. |
| `onEditSessionStarted` | `→ preview-ready` | Provides a session `DataSource` scoped to the edit session. Apply filters and listen to events on this source to build a preview UI. |
| `onEditSessionEnded` | `→ imported` or `→ idle` | `reason` is `"saved"` on successful import, `"discarded"` on cancel, `"failed"` on error. `sessionTable` contains the Vuu session table reference. |
| `onImported` | `→ imported` | Provides `rpcResult` and normalised `tableData`. |
| `onError` | `→ failed` | See [Error Types](#error-types) below. |
| `onClose` | `→ importing` | Dialog is closing because import was triggered. |
| `onCancel` | `→ idle` | User cancelled. |

---

## Error Types

`onError` receives a `CsvUploadErrorResult`:

```ts
type CsvUploadErrorResult = {
  errors: CsvUploadErrors;
};

type CsvUploadErrors = {
  schemaError?: CsvUploadError;      // CSV columns don't match table schema
  validationError?: CsvUploadError;  // Parse-level or row-level validation failure
  importError?: CsvUploadError;      // RPC failure during row insertion
};

type CsvUploadError = {
  message: string;
  source: "schema" | "validation" | "import";
  parseError?: CsvParseError;
  validationError?: CsvValidationStructuredError;
};
```

Only one of `schemaError`, `validationError`, or `importError` is populated per `onError` call.

### Error maps

Errors are structured using two-level maps:

```ts
type CsvErrorMap<TError extends string> = {
  fileErrors: Record<string, TError[]>;   // keyed by column name; file-level errors (header row)
  rowErrors:  Record<number, Record<string, TError[]>>;  // keyed by 1-based row number → column name
};
```

#### Parse error codes (`CsvParseErrorEnum`)

| Code | Meaning |
|---|---|
| `EMPTY_FILE` | The file contains no content. |
| `INVALID_SEPARATOR` | Separator could not be detected. |
| `INVALID_FORMAT` | General CSV format violation. |
| `UNQUOTED_VALUE` | A value contains a delimiter but is not quoted (when `requireQuotedValues` is set). |
| `EMPTY_HEADER_COLUMN` | A header cell is blank. |
| `DUPLICATE_HEADER_COLUMN` | Two or more header cells share the same name. |
| `ROW_COLUMN_COUNT_MISMATCH` | A data row has a different number of columns than the header. |

#### Schema/validation error codes (`CsvValidationErrorEnum`)

| Code | Meaning |
|---|---|
| `MISSING_KEY_COLUMN` | The CSV does not contain the table's key column. Reported as a `fileError`. |
| `UNKNOWN_COLUMN` | A CSV column has no matching column in the table schema. Reported as a `fileError`. |
| `MAX_ROWS_EXCEEDED` | The CSV contains more rows than the `maxRows` limit. Reported as a `fileError`. |
| `EMPTY_NON_STRING_VALUE` | A non-string column cell is empty. Reported as a `rowError`. |
| `TYPE_MISMATCH` | A cell value cannot be coerced to the column's server data type. Reported as a `rowError`. |

### Accessing the error map in a session preview

When `onEditSessionStarted` fires, the session `DataSource` is pre-populated with one row per uploaded CSV row. Each row has a string column `errorMap` that contains a JSON-serialised `Record<string, string[]>` of column → error codes for that row, or an empty string if the row is valid.

To show only rows with errors, apply the filter:

```ts
dataSource.filter = { filter: 'errorMap > ""' };
```

## Parse Options

```ts
type CsvParseOptions = {
  requireQuotedValues?: boolean;
  // When true, any value containing the delimiter must be quoted or
  // the row is rejected with UNQUOTED_VALUE.
};
```

---

## Session end result

```ts
type CsvUploadSessionEndResult = {
  reason: "saved" | "discarded" | "failed";
  sessionTable?: CsvUploadSessionTable;  // VuuTable { module, table }
};
```

---

## Imported result

```ts
type CsvUploadImportedResult = {
  rpcResult: unknown;         // raw response from the server
  tableData: CsvUploadTableData;  // { columns: string[], rows: unknown[][] }
};
```
