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

export interface ExportToCsvOptions<TName extends string = string> {
  filename?: string;
  copyOption?: CopyOption;
  excludeColumns?: string[];
  maxRows?: number;
  columnDescriptors?: ExportColumnDescriptor<TName>[];
  overrides?: SessionDataSourceOverrides;
  /** Timeout in milliseconds before the export times out. Default: 30_000ms (0 to disable). */
  timeout?: number;
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

export interface ExportCsvTemplateOptions {
  filename?: string;
  excludeColumns?: string[];
  columns?: string[];
  overrides?: SessionDataSourceOverrides;
  /** Timeout in milliseconds before template generation times out. Default: 10_000ms (0 to disable). */
  timeout?: number;
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

const EXPORT_EXCLUDED_COLUMNS = new Set(["vuuMsg", "vuuAction", "vuuRowNum"]);
const MAX_EXPORT_ROWS = 10_000;
const CHUNK_SIZE = 1_000;
const DEFAULT_EXPORT_TIMEOUT = 30_000;
const DEFAULT_TEMPLATE_TIMEOUT = 10_000;

const csvCell = (value: unknown): string => {
  const s = value == null ? "" : String(value);
  return s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")
    ? `"${s.replace(/"/g, '""')}"`
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
  options: ExportCsvTemplateOptions = {},
): Promise<void> => {
  const {
    filename = "template.csv",
    excludeColumns = [],
    columns,
    overrides,
    timeout = DEFAULT_TEMPLATE_TIMEOUT,
    onError,
    onSuccess,
  } = options;

  const sessionOverrides: SessionDataSourceOverrides | undefined =
    overrides ?? (columns ? { columns } : undefined);

  if (
    !isSessionTable(dataSource.table) &&
    dataSource.createSessionDataSource &&
    dataSource.status !== "initialising" &&
    dataSource.status !== "unsubscribed"
  ) {
    try {
      const sessionDataSource = await dataSource.createSessionDataSource(
        "Empty",
        "export",
        sessionOverrides,
      );
      if (sessionDataSource) {
        return new Promise<void>((resolve, reject) => {
          let timer: ReturnType<typeof setTimeout> | undefined;
          const cleanup = () => {
            if (timer) clearTimeout(timer);
            sessionDataSource.unsubscribe();
          };

          if (timeout > 0) {
            timer = setTimeout(() => {
              cleanup();
              const err = new Error(
                `exportCsvTemplate: timed out after ${timeout}ms waiting for subscription`,
              );
              if (onError) {
                onError(err);
                resolve();
              } else {
                reject(err);
              }
            }, timeout);
          }

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
                cleanup();
                onSuccess?.();
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
    const error = new Error(
      "exportCsvTemplate: tableSchema not available on dataSource",
    );
    if (onError) {
      onError(error);
      return;
    }
    throw error;
  }

  const excluded = new Set([...EXPORT_EXCLUDED_COLUMNS, ...excludeColumns]);
  const exportCols = targetColumns
    ? targetColumns.filter((name) => !excluded.has(name))
    : schema?.columns
        .filter((col) => !excluded.has(col.name))
        .map((col) => col.name) ?? [];

  if (exportCols.length === 0) {
    const error = new Error(
      "exportCsvTemplate: no columns available for export",
    );
    if (onError) {
      onError(error);
      return;
    }
    throw error;
  }

  const header = exportCols.map(csvCell).join(",");
  triggerCsvDownload(`${header}\r\n`, filename);
  onSuccess?.();
};

/**
 * Subscribes to `dataSource` (creating an export session data source if a view data source is passed),
 * collects all rows in memory in index order, serialises them to CSV (excluding internal session columns),
 * then triggers a browser download. The session data source is unsubscribed automatically once the download
 * is initiated.
 */
export const exportSessionTableToCsv = async <TName extends string = string>(
  dataSource: DataSource,
  options: ExportToCsvOptions<TName> = {},
): Promise<void> => {
  const {
    filename = "export.csv",
    copyOption = "All",
    excludeColumns = [],
    maxRows = MAX_EXPORT_ROWS,
    columnDescriptors,
    overrides,
    timeout = DEFAULT_EXPORT_TIMEOUT,
    onError,
    onSuccess,
  } = options;

  if (
    !isSessionTable(dataSource.table) &&
    (dataSource.status === "initialising" ||
      dataSource.status === "unsubscribed")
  ) {
    const error = new Error(
      `exportSessionTableToCsv: dataSource must be subscribed before exporting (current status: "${dataSource.status}")`,
    );
    if (onError) {
      onError(error);
      return;
    }
    throw error;
  }

  let sessionDataSource: DataSource | undefined;
  if (!isSessionTable(dataSource.table) && dataSource.createSessionDataSource) {
    try {
      sessionDataSource = await dataSource.createSessionDataSource(
        copyOption,
        "export",
        overrides,
      );
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      if (onError) {
        onError(error);
        return;
      }
      throw error;
    }
  } else {
    sessionDataSource = dataSource;
  }

  if (!sessionDataSource) {
    const error = new Error(
      "exportSessionTableToCsv: unable to obtain sessionDataSource",
    );
    if (onError) {
      onError(error);
      return;
    }
    throw error;
  }

  const activeSessionDataSource = sessionDataSource;
  const excluded = new Set([...EXPORT_EXCLUDED_COLUMNS, ...excludeColumns]);
  let exportCols: string[] = [];
  let colNameToRowIdx: Record<string, number> = {};
  let descriptorMap: Record<string, ExportColumnDescriptor> = {};
  let totalSize = 0;
  let nextRequestedFrom = 0;
  const collectedRows = new Map<number, DataSourceRow>();

  return new Promise<void>((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      activeSessionDataSource.unsubscribe();
    };

    const fail = (err: Error) => {
      cleanup();
      if (onError) {
        onError(err);
        resolve();
      } else {
        reject(err);
      }
    };

    if (timeout > 0) {
      timer = setTimeout(() => {
        fail(
          new Error(
            `exportToCsv: export timed out after ${timeout}ms waiting for data`,
          ),
        );
      }, timeout);
    }

    const handleMessage = (message: DataSourceCallbackMessage): void => {
      if (message.type === "subscribed") {
        const { columns } = message as DataSourceSubscribedMessage;
        if (columnDescriptors) {
          const subscribedSet = new Set(columns);
          const unknown = columnDescriptors
            .filter((d) => !excluded.has(d.name) && !subscribedSet.has(d.name))
            .map((d) => d.name);
          if (unknown.length > 0) {
            fail(
              new Error(
                `exportToCsv: unknown column(s) in columnDescriptors: ${unknown.join(", ")}`,
              ),
            );
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
            cleanup();
            const header = exportCols
              .map((name) => csvCell(descriptorMap[name]?.label ?? name))
              .join(",");
            triggerCsvDownload(`${header}\r\n`, filename);
            onSuccess?.();
            resolve();
            return;
          }
          if (totalSize > maxRows) {
            fail(
              new Error(
                `exportToCsv: row count ${totalSize} exceeds the ${maxRows} row limit`,
              ),
            );
            return;
          }
          // request rows in chunks for predictable behaviour across local and remote DataSources
          nextRequestedFrom = Math.min(CHUNK_SIZE, totalSize);
          activeSessionDataSource.range = Range(0, nextRequestedFrom);
        } else if (message.mode === "batch" && message.rows) {
          // Note: rows may be received from server in multiple batches and with no guaranteed ordering
          for (const row of message.rows) {
            const rowIndex = row[metadataKeys.IDX] as number;
            if (typeof rowIndex === "number") {
              collectedRows.set(rowIndex, row);
            }
          }
          // update totalSize in case it changed between size-only and batch
          if (message.size !== undefined) {
            totalSize = message.size;
          }
          if (collectedRows.size >= totalSize) {
            cleanup();
            const lines: string[] = [
              exportCols
                .map((name) => csvCell(descriptorMap[name]?.label ?? name))
                .join(","),
            ];
            // Assemble rows in strict index order (0 .. totalSize - 1)
            for (let i = 0; i < totalSize; i++) {
              const row = collectedRows.get(i);
              if (row) {
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
            }
            triggerCsvDownload(lines.join("\r\n"), filename);
            onSuccess?.();
            resolve();
          } else if (
            collectedRows.size >= nextRequestedFrom &&
            nextRequestedFrom < totalSize
          ) {
            const nextTo = Math.min(nextRequestedFrom + CHUNK_SIZE, totalSize);
            activeSessionDataSource.range = Range(nextRequestedFrom, nextTo);
            nextRequestedFrom = nextTo;
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
 * Creates an export session table from `dataSource`, collects all rows in memory, then triggers a CSV download.
 */
export const exportToCsv = async <TName extends string = string>(
  dataSource: DataSource,
  options?: ExportToCsvOptions<TName>,
): Promise<void> => {
  return exportSessionTableToCsv(dataSource, options);
};
