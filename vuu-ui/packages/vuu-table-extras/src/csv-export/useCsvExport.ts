import { useCallback, useState } from "react";
import type { DataSource } from "@vuu-ui/vuu-data-types";
import {
  exportCsvTemplate,
  exportToCsv,
  type ExportCsvTemplateOptions,
  type ExportToCsvOptions,
} from "./export-utils";

export interface UseCsvExportProps {
  dataSource?: DataSource;
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

export interface UseCsvExportResult {
  isExporting: boolean;
  error: Error | null;
  exportCsv: <TName extends string = string>(
    options?: ExportToCsvOptions<TName>,
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
      : (propsOrDataSource as UseCsvExportProps) ?? {};

  const { dataSource: defaultDataSource, onError, onSuccess } = config;

  const exportCsv = useCallback(
    async <TName extends string = string>(
      options?: ExportToCsvOptions<TName>,
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
        await exportToCsv(activeDataSource, {
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
    [defaultDataSource, onError, onSuccess],
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
        await exportCsvTemplate(activeDataSource, {
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
    [defaultDataSource, onError, onSuccess],
  );

  return {
    isExporting,
    error,
    exportCsv,
    exportTemplate,
  };
}
