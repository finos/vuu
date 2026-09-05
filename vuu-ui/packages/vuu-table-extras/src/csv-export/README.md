# CSV Export

CSV export provides standalone utility functions — `exportToCsv`, `exportCsvTemplate`, and `exportSessionTableToCsv` — as well as a React hook `useCsvExport` exported from `@vuu-ui/vuu-table-extras`.

See [CsvUpload](../csv-upload/README.md) for the counterpart component that imports a CSV into a Vuu table.

---

## Usage with React Hook (`useCsvExport`)

```tsx
import { useCsvExport } from "@vuu-ui/vuu-table-extras";
import { Button } from "@salt-ds/core";

const MyTable = () => {
  const { isExporting, exportCsv, exportTemplate } = useCsvExport(dataSource);

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
exportToCsv<TName extends string = string>(
  dataSource: DataSource,
  options?: ExportToCsvOptions<TName>,
): Promise<void>
```

Options (`ExportToCsvOptions`):

| Property | Type | Default | Description |
|---|---|---|---|
| `filename` | `string` | `"export.csv"` | Downloaded filename. |
| `copyOption` | `CopyOption` | `"All"` | `"All"` exports every row, `"Selected"` only the currently selected rows. |
| `excludeColumns` | `string[]` | `[]` | Additional columns to omit, on top of the always-excluded `vuuMsg`, `vuuAction`, `vuuRowNum`. |
| `maxRows` | `number` | `10_000` | Row limit for the export. Fails if the server reports more rows than this before requesting data. |
| `columnDescriptors` | `ExportColumnDescriptor<TName>[]` | `undefined` | Custom labels and cell formatters per column (see [Column labels and formatters](#column-labels-and-formatters)). |
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
| `columns` | `string[]` | `undefined` | Specific subset and order of columns to include. |
| `overrides` | `SessionDataSourceOverrides` | `undefined` | Divergent table schema overrides. |
| `timeout` | `number` | `10_000` | Milliseconds before template creation times out (0 to disable). |
| `onError` | `(error: Error) => void` | `undefined` | Callback invoked on error. |
| `onSuccess` | `() => void` | `undefined` | Callback invoked once the template download is triggered. |

---

## `exportSessionTableToCsv`

```ts
exportSessionTableToCsv<TName extends string = string>(
  dataSource: DataSource,
  options?: ExportToCsvOptions<TName>,
): Promise<void>
```

The lower-level function `exportToCsv` delegates to. Accepts either a view `DataSource` (in which case it creates the session table itself) or an already-created session `DataSource`.

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

await exportToCsv(dataSource, {
  filename: "instruments.csv",
  columnDescriptors: descriptors,
});
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
