# CsvUpload Component

The `CsvUpload` component provides a dialog-based workflow for uploading, validating, and importing a CSV file into a Vuu table via RPC. It manages a server-side edit session throughout the process and exposes a lifecycle callback API so consumers can track and react to each phase.

See [CSV Export](../csv-export/README.md) for the counterpart utilities that export a table to CSV.

---

## Usage

```tsx
import { CsvUpload } from "@vuu-ui/vuu-table-extras";

<CsvUpload
  dataSource={dataSource}
  maxRows={25000}
  open={dialogOpen}
  onCancel={handleCancel}
  onClose={handleClose}
  onProcessingStarted={handleProcessingStarted}
  onImportSessionStarted={handleImportSessionStarted}
  onImportSessionEnded={handleImportSessionEnded}
  onImported={handleImported}
  onError={handleError}
/>
```

---

## Props

| Prop | Type | Description |
|---|---|---|
| `dataSource` | `DataSource` | **Required.** The Vuu data source for the target table. Must be subscribed (`status: "subscribed"`) and support `createSessionDataSource` (used internally with `sessionType: "import"`), `addRow`, and `endEditSession`. |
| `importSchema` | `TableSchema` | Schema of the import table, where it differs from the target table. Used to validate the CSV and to determine the session datasource columns. If omitted and `importTable` is provided, the schema is fetched via `getTableSchema`. Pass a stable reference. See [Importing into a separate table](#importing-into-a-separate-table). |
| `importTable` | `VuuTable` | The import table, where it differs from the target table. Used to resolve `importSchema` when that is not supplied, and to validate the module of the session table returned by the server. |
| `embedded` | `boolean` | Renders the upload content and actions without its own `Dialog`, for use inside an existing modal. Defaults to `false`. |
| `importMode` | `"direct" \| "preview"` | Both modes create and populate an `EditSession`. `"direct"` commits it when Import is pressed; `"preview"` returns the live session through `onPreview` so the caller can edit or delete rows before ending it. Defaults to `"direct"`. |
| `maxRows` | `number` | Maximum number of data rows permitted in the CSV. Defaults to `25000`. |
| `open` | `boolean` | Controls dialog open state. When provided the component is fully controlled; when omitted it manages open state internally. |
| `dialogTitle` | `string` | Dialog header text. Defaults to `"Import CSV"`. |
| `parseOptions` | `CsvParseOptions` | Options passed to the CSV parser (see [Parse Options](#parse-options)). |
| `onProcessingStarted` | `() => void` | Fired when a file starts being parsed and validated. |
| `onImportSessionStarted` | `(dataSource: DataSource) => void` | Fired when the server-side session is open and a session `DataSource` is available for preview. |
| `onImportSessionEnded` | `(result: CsvUploadSessionEndResult) => void` | Fired when the import session closes, whether by import, cancel, or failure. |
| `onImported` | `(result: CsvUploadImportedResult) => void` | Fired after a successful import. |
| `onPreview` | `(result: CsvUploadPreviewResult) => void` | In preview mode, fired when Import is pressed with the populated `EditSession`, session datasource, and normalized table data. |
| `onError` | `(result: CsvUploadErrorResult \| undefined) => void` | Fired when any error occurs. Called with `undefined` to clear a previous error. |
| `onCancel` | `() => void` | Fired when the Cancel button is clicked. |
| `onClose` | `() => void` | Fired after a successful import completes (i.e. the Import button was clicked and the session committed). |
| `children` | `ReactNode` | Optional children rendered inside the dialog content area, below the drop zone. Typically used to display a read-only error table — see [Displaying validation errors](#displaying-validation-errors). |

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
preview-ready       ← onImportSessionStarted(sessionDataSource)
 │
 │  user clicks Import
 ▼
importing           ← onClose()
 │
 ├─ RPC import error ──► failed              ← onError({ errors })
 │
 ▼
imported            ← onImported(result)
                    ← onImportSessionEnded({ reason: "saved" })
```

If the user cancels at any point:
- `onCancel()` is called.
- `onImportSessionEnded({ reason: "discarded" })` fires if a session was open.
- Phase returns to `idle`.

### Callbacks reference

| Callback | Phase transition | Notes |
|---|---|---|
| `onProcessingStarted` | `→ processing` | Fires before parsing begins. No data available yet. |
| `onImportSessionStarted` | `→ preview-ready` | Provides the populated session `DataSource`. |
| `onImportSessionEnded` | `→ imported` or `→ idle` | `reason` is `"saved"` on successful import, `"discarded"` on cancel, `"failed"` on error. `sessionTable` contains the Vuu session table reference. |
| `onImported` | `→ imported` | Provides normalized `tableData`. |
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
| `MISSING_KEY_COLUMN` | The CSV does not contain the table's key column (internal/staging key columns such as `vuuRowNum` are exempt and generated automatically). Reported as a `fileError`. |
| `UNKNOWN_COLUMN` | A CSV column has no matching column in the table schema. Reported as a `fileError`. |
| `MAX_ROWS_EXCEEDED` | The CSV contains more rows than the `maxRows` limit. Reported as a `fileError`. |
| `EMPTY_NON_STRING_VALUE` | A non-string column cell is empty. Reported as a `rowError`. |
| `TYPE_MISMATCH` | A cell value cannot be coerced to the column's server data type. Reported as a `rowError`. |

## Parse Options

```ts
type CsvParseOptions = {
  requireQuotedValues?: boolean;
  // When true, any value containing the delimiter must be quoted or
  // the row is rejected with UNQUOTED_VALUE.
};
```

---

## Import session table columns

When the component opens a session for CSV import it requests a session table of type `"import"`. The server adds two extra columns to the schema on top of the source table columns:

| Column | Type | Purpose |
|---|---|---|
| `vuuMsg` | `string` | Validation error message for this row. Empty string when the row is valid. |
| `vuuRowNum` | `int` | 1-based row number from the original CSV file (including the header row, so data starts at 2). |

Row payloads sent to `addRow` differ by validity:

- **Valid rows** — full column data plus `vuuRowNum` and `vuuMsg: ""`.
- **Error rows** — only `{ vuuRowNum, vuuMsg }` (no column data); the session table key is set to the string value of `vuuRowNum`.

On `endEditSession(save: true)` the server skips any row where `vuuMsg` is non-empty, so error rows are never committed to the source table.

---

## Importing into a separate table

By default the CSV is validated against `dataSource.tableSchema` and the session inherits the target table's columns. When uploads land in a dedicated import/export table with its own schema, declare it:

```tsx
<CsvUpload
  dataSource={targetDataSource}   // subscribed; carries the createSessionTable RPC
  importTable={IMPORT_TABLE}
  importSchema={IMPORT_SCHEMA}    // optional - fetched from importTable if omitted
/>
```

`importSchema` does double duty: its column names become the session datasource columns, and it replaces `dataSource.tableSchema` as the schema the CSV is validated against. That second role is not optional — `processFile` validates the CSV *before* the session begins, and `useCsvUpload` does not subscribe to the session datasource itself (rows are added via `addRow` RPCs directly). When `onImportSessionStarted` fires, subscribing to the session datasource is left to the consumer (e.g. `<Table />` or `DataUploadPreview`) to manage viewport rendering. The import schema has to be known up front.

| Props | Behaviour |
|---|---|
| neither | Validates against `dataSource.tableSchema`; session inherits target columns. |
| `importTable` only | Schema fetched once via `getTableSchema`; drives validation and session columns. |
| both | `importSchema` wins; no fetch. |

Notes:

- Once `importTable` is set, the schema never falls back to `dataSource.tableSchema`. Until the fetch resolves `schema` is `undefined`, which disables the drop zone — validating against the target table's columns would be silently wrong.
- `importSchema` must be a stable reference; it feeds the `EditSession` memo, so a value constructed inline each render recreates the session.
- The import table's session table must still accept `vuuRowNum` and `vuuMsg`, which are sent on every row.

---

## Displaying validation errors

Use the `children` prop together with `onImportSessionStarted` to render an inline error table. The session datasource already contains both valid and error rows; apply a `vuuMsg != ""` filter to show only error rows:

```tsx
const [sessionDataSource, setSessionDataSource] = useState<DataSource | undefined>();

const handleImportSessionStarted = useCallback((sessionDs: DataSource) => {
  sessionDs.filter = { filter: 'vuuMsg != ""' };
  setSessionDataSource(sessionDs);
}, []);

const handleImportSessionEnded = useCallback(() => {
  setSessionDataSource(undefined);
}, []);

const errorTableConfig: TableConfig = {
  columns: [
    { name: "vuuRowNum", label: "Row",   width: 80,  serverDataType: "int" },
    { name: "vuuMsg",    label: "Error", width: 400, serverDataType: "string" },
  ],
};

<CsvUpload
  dataSource={dataSource}
  onImportSessionStarted={handleImportSessionStarted}
  onImportSessionEnded={handleImportSessionEnded}
>
  {sessionDataSource ? (
    <div style={{ height: 200 }}>
      <Table config={errorTableConfig} dataSource={sessionDataSource} />
    </div>
  ) : null}
</CsvUpload>
```

The `Table` is a virtualized component and requires an explicit height on its container to render rows.

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
  tableData: CsvUploadTableData;  // { columns: string[], rows: unknown[][] }
};
```
