# CSV Export

CSV export provides standalone utility functions — `exportToCsv`, `exportCsvTemplate`, and `exportSessionTableToCsv` — as well as a React hook `useCsvExport` exported from `@vuu-ui/vuu-table-extras`.

See [CsvUpload](../csv-upload/README.md) for the counterpart component that imports a CSV into a Vuu table.

---

## Usage with React Hook (`useCsvExport`)

```tsx
import { useCsvExport } from "@vuu-ui/vuu-table-extras";
import { Button } from "@salt-ds/core";

const MyTable = () => {
  // Pass tableConfig to automatically export visible columns, custom order, formatters, and client columns
  const { isExporting, exportCsv, exportTemplate } = useCsvExport({
    dataSource,
    tableConfig,
  });

  return (
    <div>
      <Button
        disabled={isExporting}
        onClick={() => exportCsv({ filename: "instruments.csv" })}
      >
        {isExporting ? "Exporting..." : "Export to CSV"}
      </Button>
      <Button
        disabled={isExporting}
        onClick={() => exportTemplate({ filename: "template.csv" })}
      >
        Download Template
      </Button>
    </div>
  );
};
```

---

## Usage with Standalone Functions

```tsx
import { exportToCsv } from "@vuu-ui/vuu-table-extras";

const handleExport = useCallback(async () => {
  await exportToCsv(dataSource, {
    filename: "instruments.csv",
    copyOption: "All",
    onSuccess: () => setStatus("Download started"),
    onError: (err) => setStatus(`Export failed: ${err.message}`),
  });
}, [dataSource]);
```

`exportCsvTemplate` downloads a header-only CSV, useful for giving users a starting point for a [CsvUpload](../csv-upload/README.md) import:

```tsx
import { exportCsvTemplate } from "@vuu-ui/vuu-table-extras";

await exportCsvTemplate(dataSource, {
  filename: "instruments-template.csv",
  columns: ["ric", "currency", "isin"],
});
```

---

## `exportToCsv`

```ts
exportToCsv(
  dataSource: DataSource,
  options?: ExportToCsvOptions,
): Promise<void>
```

Options (`ExportToCsvOptions`):

| Property | Type | Default | Description |
|---|---|---|---|
| `filename` | `string` | `"export.csv"` | Downloaded filename. |
| `copyOption` | `CopyOption` | `"All"` | `"All"` exports every row, `"Selected"` only the currently selected rows. |
| `excludeColumns` | `string[]` | `[]` | Additional columns to omit, on top of the always-excluded `vuuMsg`, `vuuAction`, `vuuRowNum`. |
| `maxRows` | `number` | `10_000` | Row limit for the export. Fails if the server reports more rows than this before requesting data. |
| `columnDescriptors` | `(ExportColumnDescriptor \| ColumnDescriptor)[]` | `undefined` | Custom labels, formatters, or client columns (alias for `columns`). |
| `columns` | `(string \| ExportColumnDescriptor \| ColumnDescriptor)[]` | `undefined` | Columns to include in export and their order. Accepts table `ColumnDescriptor[]`. |
| `overrides` | `SessionDataSourceOverrides` | `undefined` | Divergent export table or column overrides. |
| `timeout` | `number` | `30_000` | Milliseconds before the export times out (0 to disable). |
| `onError` | `(error: Error) => void` | `undefined` | Callback invoked on error. |
| `onSuccess` | `() => void` | `undefined` | Callback invoked once the download is triggered (including when table has 0 data rows, downloading a header-only file). |

---

## `exportCsvTemplate`

```ts
exportCsvTemplate(
  dataSource: DataSource,
  options?: ExportCsvTemplateOptions,
): Promise<void>
```

Options (`ExportCsvTemplateOptions`):

| Property | Type | Default | Description |
|---|---|---|---|
| `filename` | `string` | `"template.csv"` | Downloaded filename. |
| `excludeColumns` | `string[]` | `[]` | Columns to omit from the template. |
| `columns` | `(string \| ColumnDescriptor)[]` | `undefined` | Specific subset and order of columns to include. Client columns and hidden columns are automatically excluded. |
| `overrides` | `SessionDataSourceOverrides` | `undefined` | Divergent table schema overrides. |
| `timeout` | `number` | `10_000` | Milliseconds before template creation times out (0 to disable). |
| `onError` | `(error: Error) => void` | `undefined` | Callback invoked on error. |
| `onSuccess` | `() => void` | `undefined` | Callback invoked once the template download is triggered. |

---

## `exportSessionTableToCsv`

```ts
exportSessionTableToCsv(
  dataSource: DataSource,
  options?: ExportToCsvOptions,
): Promise<void>
```

The lower-level function `exportToCsv` delegates to. Accepts either a view `DataSource` (in which case it creates the session table itself) or an already-created session `DataSource`.

### Exporting an existing session table

If `dataSource.table` is already a session table (`isSessionTable(dataSource.table)`), `exportSessionTableToCsv` subscribes to it directly instead of calling `createSessionDataSource` again. This lets a caller build and populate a session table itself (e.g. an in-progress `EditSession`) and export it without a redundant server round trip.

---

## Column descriptors, formatters, and client columns

`ExportColumnDescriptor` extends table `ColumnDescriptor`:

```ts
type RowAccessor = Record<string, unknown>;

type ExportColumnDescriptor =
  | ExportServerColumnDescriptor
  | ExportClientColumnDescriptor;
```

```tsx
const columns: ExportColumnDescriptor[] = [
  { name: "ric", label: "RIC Code" },
  { name: "lotSize", label: "Lot Size", exportFormatter: (v) => `${v} units` },
  {
    name: "notional",
    source: "client",
    label: "Notional",
    exportFormatter: (_, row) =>
      `$${((row?.price as number) * (row?.lotSize as number)).toLocaleString()}`,
  },
];

await exportToCsv(dataSource, {
  filename: "instruments.csv",
  columns,
});
```

### Table formatters
When standard table `ColumnDescriptor` objects are passed (e.g. from `tableConfig.columns`), `exportToCsv` automatically applies table formatters (`type.formatting` for decimals, dates, timestamps, mapped values) via `getValueFormatter` if no custom `exportFormatter` is specified.

### Client columns (`source = 'client'`)
Columns configured with `source: "client"` are not sent in server subscription requests. Their values are computed per-row using `exportFormatter(value, row)`. `row` is a proxy allowing clean field access by column name (`row.ric`, `row.price`).

### Excluding columns (`exportable: false` and UI-only columns)
Columns are excluded from CSV exports under the following conditions:
- `exportable: false`: explicitly excludes any server or client column.
- `hidden: true`: table hidden columns are skipped.
- `isSystemColumn: true`: system columns (such as the checkbox row selector) are skipped.
- **UI-only client columns**: client columns with no `exportFormatter` (e.g. action buttons, delete icon buttons, undo cells) are **automatically excluded by default**. Set `exportable: true` if an empty placeholder column is explicitly required.

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
