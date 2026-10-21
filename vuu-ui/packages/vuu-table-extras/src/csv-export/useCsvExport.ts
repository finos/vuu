import { useCallback, useState } from "react";
import type { DataSource } from "@vuu-ui/vuu-data-types";
import type { ColumnDescriptor, TableConfig } from "@vuu-ui/vuu-table-types";
import {
  exportCsvTemplate,
  exportToCsv,
  type CsvHeaderMapping,
  type ExportColumnDescriptor,
  type ExportCsvTemplateOptions,
  type ExportToCsvOptions,
} from "./export-utils";

export interface UseCsvExportProps {
  /** The target Vuu DataSource to export data or templates from. */
  dataSource?: DataSource;
  /** Optional table configuration used to derive visible columns, order, and formatters. */
  tableConfig?: TableConfig;
  /** Explicit columns to export when not derived from tableConfig or options. */
  columns?: readonly (string | ExportColumnDescriptor | ColumnDescriptor)[];
  /**
   * Optional mapping from schema column name to exported header name,
   * or a resolver function `(col: string) => string`.
   */
  headerMapping?: CsvHeaderMapping;
  /** Default error callback for export operations. */
  onError?: (error: Error) => void;
  /** Default success callback when an export or template download is initiated. */
  onSuccess?: () => void;
}

export interface UseCsvExportResult {
  /** True while an export or template download operation is in progress. */
  isExporting: boolean;
  /** The most recent export error, or null if no error occurred. */
  error: Error | null;
  /**
   * Exports table data to CSV and triggers a file download in the browser.
   *
   * @param options - Export options including filename, columns, and limits.
   * @param overrideDataSource - Optional DataSource to export instead of the default.
   */
  exportCsv: (
    options?: ExportToCsvOptions,
    overrideDataSource?: DataSource,
  ) => Promise<void>;
  /**
   * Exports a header-only CSV template suitable for importing back into the table.
   *
   * @param options - Template options including filename, columns, and header mapping.
   * @param overrideDataSource - Optional DataSource to export template for instead of the default.
   */
  exportTemplate: (
    options?: ExportCsvTemplateOptions,
    overrideDataSource?: DataSource,
  ) => Promise<void>;
}

export function useCsvExport(
  propsOrDataSource?: DataSource | UseCsvExportProps,
): UseCsvExportResult {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const config =
    propsOrDataSource && "table" in propsOrDataSource
      ? { dataSource: propsOrDataSource }
      : ((propsOrDataSource as UseCsvExportProps) ?? {});

  const {
    dataSource: defaultDataSource,
    tableConfig,
    columns: defaultColumns,
    headerMapping: defaultHeaderMapping,
    onError,
    onSuccess,
  } = config;

  const exportCsv = useCallback(
    async (
      options?: ExportToCsvOptions,
      overrideDataSource?: DataSource,
    ) => {
      const activeDataSource = overrideDataSource ?? defaultDataSource;
      if (!activeDataSource) {
        const err = new Error(
          "useCsvExport: dataSource is required to export to CSV",
        );
        setError(err);
        onError?.(err);
        options?.onError?.(err);
        throw err;
      }

      setIsExporting(true);
      setError(null);
      try {
        const columnsToExport =
          options?.columns ??
          options?.columnDescriptors ??
          defaultColumns ??
          tableConfig?.columns;

        const effectiveHeaderMapping =
          options?.headerMapping ?? defaultHeaderMapping;

        await exportToCsv(activeDataSource, {
          columns: columnsToExport,
          ...(effectiveHeaderMapping !== undefined
            ? { headerMapping: effectiveHeaderMapping }
            : {}),
          ...options,
          onError: (err) => {
            setError(err);
            onError?.(err);
            options?.onError?.(err);
          },
          onSuccess: () => {
            onSuccess?.();
            options?.onSuccess?.();
          },
        });
      } catch (err) {
        const catchedError =
          err instanceof Error ? err : new Error(String(err));
        setError(catchedError);
        onError?.(catchedError);
        options?.onError?.(catchedError);
        throw catchedError;
      } finally {
        setIsExporting(false);
      }
    },
    [defaultDataSource, defaultColumns, defaultHeaderMapping, tableConfig, onError, onSuccess],
  );

  const exportTemplate = useCallback(
    async (
      options?: ExportCsvTemplateOptions,
      overrideDataSource?: DataSource,
    ) => {
      const activeDataSource = overrideDataSource ?? defaultDataSource;
      if (!activeDataSource) {
        const err = new Error(
          "useCsvExport: dataSource is required to export CSV template",
        );
        setError(err);
        onError?.(err);
        options?.onError?.(err);
        throw err;
      }

      setIsExporting(true);
      setError(null);
      try {
        const templateColumns =
          options?.columns ??
          defaultColumns ??
          tableConfig?.columns;

        const effectiveHeaderMapping =
          options?.headerMapping ?? defaultHeaderMapping;

        await exportCsvTemplate(activeDataSource, {
          columns: templateColumns,
          ...(effectiveHeaderMapping !== undefined
            ? { headerMapping: effectiveHeaderMapping }
            : {}),
          ...options,
          onError: (err) => {
            setError(err);
            onError?.(err);
            options?.onError?.(err);
          },
          onSuccess: () => {
            onSuccess?.();
            options?.onSuccess?.();
          },
        });
      } catch (err) {
        const catchedError =
          err instanceof Error ? err : new Error(String(err));
        setError(catchedError);
        onError?.(catchedError);
        options?.onError?.(catchedError);
        throw catchedError;
      } finally {
        setIsExporting(false);
      }
    },
    [defaultDataSource, defaultColumns, defaultHeaderMapping, tableConfig, onError, onSuccess],
  );

  return {
    isExporting,
    error,
    exportCsv,
    exportTemplate,
  };
}
