# CSV Export

CSV export is a set of standalone utility functions — `exportToCsv`, `exportCsvTemplate`, and `exportSessionTableToCsv` — implemented in [export-utils.ts](./export-utils.ts) and exported from `@vuu-ui/vuu-table-extras`. There is no React component: call them directly from a button handler or menu action.

See [CsvUpload](../csv-upload/README.md) for the counterpart component that imports a CSV into a Vuu table.

---

## Usage

```tsx
import { exportToCsv } from "@vuu-ui/vuu-table-extras";

const handleExport = useCallback(async () => {
  await exportToCsv(
    dataSource,
    "All",
    "instruments.csv",
    [],
    (err) => setStatus(`Export failed: ${err.message}`),
    () => setStatus("Download started"),
  );
}, [dataSource]);
```

`exportCsvTemplate` downloads a header-only CSV, useful for giving users a starting point for a [CsvUpload](../csv-upload/README.md) import:

```tsx
import { exportCsvTemplate } from "@vuu-ui/vuu-table-extras";

exportCsvTemplate(dataSource, "instruments-template.csv");
```

---

## `exportToCsv`

```ts
exportToCsv<TName extends string = string>(
  dataSource: DataSource,
  copyOption?: CopyOption,             // default "All"
  filename?: string,                   // default "export.csv"
  excludeColumns?: string[],
  onError?: (error: Error) => void,
  onSuccess?: () => void,
  maxRows?: number,                    // default 10_000
  columnDescriptors?: ExportColumnDescriptor<TName>[],
  overrides?: SessionDataSourceOverrides,
): Promise<void>
```

Creates a session table via `dataSource.createSessionDataSource(copyOption, "export", overrides)`, subscribes to it, drains every row, then triggers a browser download. The session data source is unsubscribed automatically once the download completes or the export fails.

| Param | Description |
|---|---|
| `dataSource` | The target `DataSource`. Must support `createSessionDataSource`, unless it is already a session table (see [Exporting an existing session table](#exporting-an-existing-session-table)). |
| `copyOption` | `"All"` exports every row, `"Selected"` only the currently selected rows. |
| `excludeColumns` | Additional columns to omit, on top of the always-excluded `vuuMsg`, `vuuAction`, `vuuRowNum`. |
| `onError` | Called once with the failure reason. Never called and rejected simultaneously — the returned promise always resolves. |
| `onSuccess` | Called once the download has been triggered (or once, with no download, if the table has zero rows). |
| `maxRows` | Row limit for the whole table. If the server reports more rows than this, the export fails via `onError` before any data is requested. |
| `columnDescriptors` | See [Column labels and formatters](#column-labels-and-formatters). Every `name` not present in the session table's columns (excluding the always-excluded set) fails the export via `onError`. |
| `overrides` | See [Exporting a divergent export table](#exporting-a-divergent-export-table). |

Rows are requested from the session data source in chunks of 1,000 rather than one bulk range request, so this behaves predictably across both local and remote data sources.

---

## `exportCsvTemplate`

```ts
exportCsvTemplate(
  dataSource: DataSource,
  filename?: string,                   // default "template.csv"
  excludeColumns?: string[],
  columns?: string[],
  overrides?: SessionDataSourceOverrides,
): Promise<void>
```

Downloads a single-row CSV containing only the column headers — no data rows, no server round trip for rows (it creates an `"Empty"` session table purely to discover columns). Pass `columns` to restrict the header to a specific subset and order; omit it to include every schema column except the always-excluded set.

If `dataSource.createSessionDataSource` fails or is unavailable, this falls back to `dataSource.tableSchema` to build the header. In that fallback path, `columns` (or `overrides.columns`) not present in the schema produce a console warning rather than a thrown error.

---

## `exportSessionTableToCsv`

```ts
exportSessionTableToCsv<TName extends string = string>(
  dataSource: DataSource,
  filename?: string,
  excludeColumns?: string[],
  onError?: (error: Error) => void,
  onSuccess?: () => void,
  maxRows?: number,
  columnDescriptors?: ExportColumnDescriptor<TName>[],
  copyOption?: CopyOption,
  overrides?: SessionDataSourceOverrides,
): Promise<void>
```

The lower-level function `exportToCsv` delegates to. Accepts either a view `DataSource` (in which case it creates the session table itself, exactly like `exportToCsv`) or an already-created session `DataSource` — see below.

### Exporting an existing session table

If `dataSource.table` is already a session table (`isSessionTable(dataSource.table)`), `exportSessionTableToCsv` subscribes to it directly instead of calling `createSessionDataSource` again. This lets a caller build and populate a session table itself (e.g. an in-progress `EditSession`) and export it without a redundant server round trip.

---

## Column labels and formatters

```ts
type ExportColumnDescriptor<TName extends string = string> = {
  name: TName;
  /** Override the column name used as the CSV header label. */
  label?: string;
  exportFormatter?: (value: unknown) => string;
};
```

```tsx
const descriptors: ExportColumnDescriptor[] = [
  { name: "ric", label: "RIC Code" },
  { name: "lotSize", label: "Lot Size", exportFormatter: (v) => `${v} units` },
];

await exportToCsv(dataSource, "All", "instruments.csv", [], onError, onSuccess, 10_000, descriptors);
```

`exportFormatter` is applied per-cell before CSV escaping. `label` overrides only the header row — the underlying column selection and order are unaffected. Omitting `columnDescriptors` exports every subscribed column (excluding the always-excluded set) using its raw column name as both header and value.

---

## Exporting a divergent export table

By default the session table is built from the target data source's config, so it carries the target table's columns. When exports should target a separate table with its own schema, pass `overrides`:

```ts
await exportToCsv(
  dataSource,
  "All",
  "instruments-overrides.csv",
  [],
  onError,
  onSuccess,
  10_000,
  undefined,
  { columns: ["ric", "currency", "lotSize"], table: EXPORT_TABLE },
);
```

```ts
type SessionDataSourceOverrides = {
  /** Columns to subscribe to on the session table. */
  columns?: string[];
  /** Expected session table. Used to validate the table returned by the server. */
  table?: VuuTable;
};
```

`overrides.columns` is forwarded to both `createSessionDataSource` and the subsequent `subscribe()` call, so the exported header and rows reflect exactly those columns — not the target table's full column set. `overrides.table` is checked against the module of the server-assigned session table; the session table name itself is always server-generated, so only the module is compared.

---

## Row limits

`maxRows` (default `10_000`) caps the whole export, not the local buffer size. If the session table reports more rows than `maxRows`, the export fails via `onError` before any row data is requested — no partial file is downloaded.
