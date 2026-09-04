import type {
  CopyOption,
  DataSource,
  DataSourceCallbackMessage,
  DataSourceRow,
  DataSourceSubscribedMessage,
  SessionDataSourceOverrides,
} from "@vuu-ui/vuu-data-types";
import { isSessionTable, metadataKeys, Range } from "@vuu-ui/vuu-utils";

export type ExportColumnDescriptor<TName extends string = string> = {
  name: TName;
  /** Override the column name used as the CSV header label. */
  label?: string;
  exportFormatter?: (value: unknown) => string;
};

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
export const exportCsvTemplate = async (
  dataSource: DataSource,
  filename = "template.csv",
  excludeColumns: string[] = [],
  columns?: string[],
  overrides?: SessionDataSourceOverrides,
): Promise<void> => {
  const sessionOverrides: SessionDataSourceOverrides | undefined =
    overrides ?? (columns ? { columns } : undefined);

  if (!isSessionTable(dataSource.table) && dataSource.createSessionDataSource) {
    try {
      const sessionDataSource = await dataSource.createSessionDataSource(
        "Empty",
        "export",
        sessionOverrides,
      );
      if (sessionDataSource) {
        return new Promise<void>((resolve) => {
          const excluded = new Set([
            ...EXPORT_EXCLUDED_COLUMNS,
            ...excludeColumns,
          ]);
          sessionDataSource.subscribe(
            { range: Range(0, 0), columns: sessionOverrides?.columns },
            (message: DataSourceCallbackMessage) => {
              if (message.type === "subscribed") {
                const { columns: subColumns } =
                  message as DataSourceSubscribedMessage;
                const exportCols = subColumns.filter(
                  (name) => !excluded.has(name),
                );
                const header = exportCols.map(csvCell).join(",");
                triggerCsvDownload(`${header}\r\n`, filename);
                sessionDataSource.unsubscribe();
                resolve();
              }
            },
          );
        });
      }
    } catch (error) {
      console.warn(
        "[exportCsvTemplate] createSessionDataSource failed, falling back to tableSchema",
        error,
      );
    }
  }

  const schema = dataSource.tableSchema;
  const targetColumns = columns ?? overrides?.columns;
  if (targetColumns !== undefined) {
    if (schema) {
      const schemaColumnNames = new Set(schema.columns.map((col) => col.name));
      const unknown = targetColumns.filter((name) => !schemaColumnNames.has(name));
      if (unknown.length > 0) {
        console.warn(
          `[exportCsvTemplate] unknown column(s) in view tableSchema: ${unknown.join(", ")}`,
        );
      }
    }
  } else if (!schema) {
    throw Error("exportCsvTemplate: tableSchema not available on dataSource");
  }

  const excluded = new Set([...EXPORT_EXCLUDED_COLUMNS, ...excludeColumns]);
  const exportCols = targetColumns
    ? targetColumns.filter((name) => !excluded.has(name))
    : schema?.columns
        .filter((col) => !excluded.has(col.name))
        .map((col) => col.name) ?? [];

  if (exportCols.length === 0) {
    throw Error("exportCsvTemplate: no columns available for export");
  }

  const header = exportCols.map(csvCell).join(",");
  triggerCsvDownload(`${header}\r\n`, filename);
};

/**
 * Subscribes to `dataSource` (creating an export session data source if a view data source is passed)
 * with a full-range request to drain all rows, serialises them to CSV (excluding internal session columns),
 * then triggers a browser download. The session data source is unsubscribed automatically once the download
 * is initiated.
 */
export const exportSessionTableToCsv = async <TName extends string = string>(
  dataSource: DataSource,
  filename = "export.csv",
  excludeColumns: string[] = [],
  onError?: (error: Error) => void,
  onSuccess?: () => void,
  maxRows = MAX_EXPORT_ROWS,
  columnDescriptors?: ExportColumnDescriptor<TName>[],
  copyOption: CopyOption = "All",
  overrides?: SessionDataSourceOverrides,
): Promise<void> => {
  let sessionDataSource: DataSource | undefined;
  if (!isSessionTable(dataSource.table) && dataSource.createSessionDataSource) {
    try {
      sessionDataSource = await dataSource.createSessionDataSource(
        copyOption,
        "export",
        overrides,
      );
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
      return;
    }
  } else {
    sessionDataSource = dataSource;
  }

  if (!sessionDataSource) {
    onError?.(
      new Error("exportSessionTableToCsv: unable to obtain sessionDataSource"),
    );
    return;
  }

  const activeSessionDataSource = sessionDataSource;
  const excluded = new Set([...EXPORT_EXCLUDED_COLUMNS, ...excludeColumns]);
  let exportCols: string[] = [];
  let colNameToRowIdx: Record<string, number> = {};
  let descriptorMap: Record<string, ExportColumnDescriptor> = {};
  let totalSize = 0;
  const collectedRows: DataSourceRow[] = [];

  return new Promise<void>((resolve) => {
    const handleMessage = (message: DataSourceCallbackMessage): void => {
      if (message.type === "subscribed") {
        const { columns } = message as DataSourceSubscribedMessage;
        if (columnDescriptors) {
          const subscribedSet = new Set(columns);
          const unknown = columnDescriptors
            .filter((d) => !excluded.has(d.name) && !subscribedSet.has(d.name))
            .map((d) => d.name);
          if (unknown.length > 0) {
            activeSessionDataSource.unsubscribe();
            onError?.(
              new Error(
                `exportToCsv: unknown column(s) in columnDescriptors: ${unknown.join(", ")}`,
              ),
            );
            resolve();
            return;
          }
          descriptorMap = Object.fromEntries(
            columnDescriptors.map((d) => [d.name, d]),
          );
        }
        exportCols = columns.filter((name) => !excluded.has(name));
        // column values start after the fixed metadata block
        colNameToRowIdx = Object.fromEntries(
          columns.map((name, i) => [name, metadataKeys.count + i]),
        );
      } else if (message.type === "viewport-update") {
        if (message.mode === "size-only") {
          totalSize = message.size ?? 0;
          if (totalSize === 0) {
            activeSessionDataSource.unsubscribe();
            onSuccess?.();
            resolve();
            return;
          }
          if (totalSize > maxRows) {
            activeSessionDataSource.unsubscribe();
            onError?.(
              new Error(
                `exportToCsv: row count ${totalSize} exceeds the ${maxRows} row limit`,
              ),
            );
            resolve();
            return;
          }
          // request rows in chunks for predictable behaviour across local and remote DataSources
          activeSessionDataSource.range = Range(
            0,
            Math.min(CHUNK_SIZE, totalSize),
          );
        } else if (message.mode === "batch" && message.rows) {
          collectedRows.push(...message.rows);
          // update totalSize in case it changed between size-only and batch
          if (message.size !== undefined) {
            totalSize = message.size;
          }
          if (collectedRows.length >= totalSize) {
            activeSessionDataSource.unsubscribe();
            const lines: string[] = [
              exportCols
                .map((name) => csvCell(descriptorMap[name]?.label ?? name))
                .join(","),
            ];
            for (const row of collectedRows) {
              lines.push(
                exportCols
                  .map((c) => {
                    const raw = row[colNameToRowIdx[c]];
                    const formatter = descriptorMap[c]?.exportFormatter;
                    return csvCell(formatter ? formatter(raw) : raw);
                  })
                  .join(","),
              );
            }
            triggerCsvDownload(lines.join("\r\n"), filename);
            onSuccess?.();
            resolve();
          } else {
            const nextFrom = collectedRows.length;
            activeSessionDataSource.range = Range(
              nextFrom,
              Math.min(nextFrom + CHUNK_SIZE, totalSize),
            );
          }
        }
      }
    };

    activeSessionDataSource.subscribe(
      { range: Range(0, 0), columns: overrides?.columns },
      handleMessage,
    );
  });
};

/**
 * Creates an export session table from `dataSource` then streams all rows to a CSV download.
 */
export const exportToCsv = async <TName extends string = string>(
  dataSource: DataSource,
  copyOption: CopyOption = "All",
  filename = "export.csv",
  excludeColumns: string[] = [],
  onError?: (error: Error) => void,
  onSuccess?: () => void,
  maxRows = MAX_EXPORT_ROWS,
  columnDescriptors?: ExportColumnDescriptor<TName>[],
  overrides?: SessionDataSourceOverrides,
): Promise<void> => {
  return exportSessionTableToCsv(
    dataSource,
    filename,
    excludeColumns,
    onError,
    onSuccess,
    maxRows,
    columnDescriptors,
    copyOption,
    overrides,
  );
};
