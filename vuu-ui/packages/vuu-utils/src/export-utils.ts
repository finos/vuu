import type {
  CopyOption,
  DataSource,
  DataSourceCallbackMessage,
  DataSourceRow,
  DataSourceSubscribedMessage,
} from "@vuu-ui/vuu-data-types";
import { metadataKeys } from "./column-utils";
import { Range } from "./range-utils";

const EXPORT_EXCLUDED_COLUMNS = new Set(["vuuMsg", "vuuAction", "vuuRowNum"]);
const MAX_EXPORT_ROWS = 10_000;
const CHUNK_SIZE = 1_000;

const csvCell = (value: unknown): string => {
  const s = value == null ? "" : String(value);
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}`
    : s;
};

const triggerCsvDownload = (csv: string, filename: string): void => {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // delay revoke to give the browser time to start the download
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
};

/** Downloads a single-row CSV containing only the column headers, for use as an import template. */
export const exportCsvTemplate = (
  dataSource: DataSource,
  filename = "template.csv",
  excludeColumns: string[] = [],
  columns?: string[],
): void => {
  const schema = dataSource.tableSchema;
  if (!schema) {
    throw Error("exportCsvTemplate: tableSchema not available on dataSource");
  }
  const schemaColumnNames = new Set(schema.columns.map((col) => col.name));
  if (columns !== undefined) {
    const unknown = columns.filter((name) => !schemaColumnNames.has(name));
    if (unknown.length > 0) {
      throw Error(`exportCsvTemplate: unknown column(s): ${unknown.join(", ")}`);
    }
  }
  const excluded = new Set([...EXPORT_EXCLUDED_COLUMNS, ...excludeColumns]);
  const exportCols = columns
    ? columns.filter((name) => !excluded.has(name))
    : schema.columns.filter((col) => !excluded.has(col.name)).map((col) => col.name);
  const header = exportCols.map(csvCell).join(",");
  triggerCsvDownload(header + "\r\n", filename);
};

/**
 * Subscribes to `sessionDataSource` with a full-range request to drain all rows,
 * serialises them to CSV (excluding internal session columns), then triggers a
 * browser download. The dataSource is unsubscribed automatically once the download
 * is initiated.
 */
export const exportSessionTableToCsv = (
  sessionDataSource: DataSource,
  filename = "export.csv",
  excludeColumns: string[] = [],
  onError?: (error: Error) => void,
  onSuccess?: () => void,
  maxRows = MAX_EXPORT_ROWS,
): void => {
  const excluded = new Set([...EXPORT_EXCLUDED_COLUMNS, ...excludeColumns]);
  let exportCols: string[] = [];
  let colNameToRowIdx: Record<string, number> = {};
  let totalSize = 0;
  const collectedRows: DataSourceRow[] = [];

  const handleMessage = (message: DataSourceCallbackMessage): void => {
    if (message.type === "subscribed") {
      const { columns } = message as DataSourceSubscribedMessage;
      exportCols = columns.filter((name) => !excluded.has(name));
      // column values start after the fixed metadata block
      colNameToRowIdx = Object.fromEntries(
        columns.map((name, i) => [name, metadataKeys.count + i]),
      );
    } else if (message.type === "viewport-update") {
      if (message.mode === "size-only") {
        totalSize = message.size ?? 0;
        if (totalSize === 0) {
          sessionDataSource.unsubscribe();
          return;
        }
        if (totalSize > maxRows) {
          sessionDataSource.unsubscribe();
          onError?.(new Error(`exportToCsv: row count ${totalSize} exceeds the ${maxRows} row limit`));
          return;
        }
        // request rows in chunks for predictable behaviour across local and remote DataSources
        sessionDataSource.range = Range(0, Math.min(CHUNK_SIZE, totalSize));
      } else if (message.mode === "batch" && message.rows) {
        collectedRows.push(...message.rows);
        // update totalSize in case it changed between size-only and batch
        if (message.size !== undefined) {
          totalSize = message.size;
        }
        if (collectedRows.length >= totalSize) {
          sessionDataSource.unsubscribe();
          const lines: string[] = [exportCols.map(csvCell).join(",")];
          for (const row of collectedRows) {
            lines.push(
              exportCols.map((c) => csvCell(row[colNameToRowIdx[c]])).join(","),
            );
          }
          triggerCsvDownload(lines.join("\r\n"), filename);
          onSuccess?.();
        } else {
          const nextFrom = collectedRows.length;
          sessionDataSource.range = Range(nextFrom, Math.min(nextFrom + CHUNK_SIZE, totalSize));
        }
      }
    }
  };

  sessionDataSource.subscribe({ range: Range(0, 0) }, handleMessage);
}

/**
 * Creates an export session table from `dataSource` then streams all rows to a CSV download.
 */
export const exportToCsv = async (
  dataSource: DataSource,
  copyOption: CopyOption = "All",
  filename = "export.csv",
  excludeColumns: string[] = [],
  onError?: (error: Error) => void,
  onSuccess?: () => void,
  maxRows = MAX_EXPORT_ROWS,
): Promise<void> => {
  const sessionDataSource =
    await dataSource.createSessionDataSource?.(copyOption, "export");
  if (!sessionDataSource) {
    throw Error("exportToCsv: dataSource does not support createSessionDataSource");
  }
  exportSessionTableToCsv(sessionDataSource, filename, excludeColumns, onError, onSuccess, maxRows);
}
