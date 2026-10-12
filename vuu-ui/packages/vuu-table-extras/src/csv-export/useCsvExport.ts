import { useCallback, useState } from "react";
import type { DataSource } from "@vuu-ui/vuu-data-types";
import type { ColumnDescriptor, TableConfig } from "@vuu-ui/vuu-table-types";
import {
  exportCsvTemplate,
  exportToCsv,
  type ExportColumnDescriptor,
  type ExportCsvTemplateOptions,
  type ExportToCsvOptions,
} from "./export-utils";

export interface UseCsvExportProps {
  dataSource?: DataSource;
  tableConfig?: TableConfig;
  columns?: readonly (string | ExportColumnDescriptor | ColumnDescriptor)[];
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

export interface UseCsvExportResult {
  isExporting: boolean;
  error: Error | null;
  exportCsv: (
    options?: ExportToCsvOptions,
    overrideDataSource?: DataSource,
  ) => Promise<void>;
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

        await exportToCsv(activeDataSource, {
          columns: columnsToExport,
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
    [defaultDataSource, defaultColumns, tableConfig, onError, onSuccess],
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

        await exportCsvTemplate(activeDataSource, {
          columns: templateColumns,
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
    [defaultDataSource, defaultColumns, tableConfig, onError, onSuccess],
  );

  return {
    isExporting,
    error,
    exportCsv,
    exportTemplate,
  };
}
