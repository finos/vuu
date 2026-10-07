import type { DataSource, TableSchema } from "@vuu-ui/vuu-data-types";
import type { RowDefaultDataItemValues } from "@vuu-ui/vuu-data-editing";
import type { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { isSessionTable, Range } from "@vuu-ui/vuu-utils";
import { useCallback, useMemo, useRef, useState } from "react";
import { parseCsv, type CsvParseOptions } from "./parse/csv-parse";
import {
  type CsvValidationResult,
  type CsvColumnValidator,
  type CsvValidationStructuredError,
  validateCsvAgainstSchema,
} from "./parse/csv-schema-validation";
import {
  buildRowErrorMessage,
  createUploadError,
  hasFileParseErrors,
  isCsvParseError,
  mergeValidationWithParseErrors,
  toErrorMessage,
} from "./parse/csv-upload-utils";
import type {
  CsvUploadErrorResult,
  CsvUploadImportedResult,
  CsvUploadPreviewResult,
  CsvUploadSessionEndResult,
  CsvUploadSessionTable,
} from "./CsvUpload";
import { useImportSchema } from "./session/useImportSchema";
import { useImportSession } from "./session/useImportSession";

export interface CsvUploadHookProps {
  dataSource: DataSource;
  importMode?: "direct" | "preview";
  /**
   * Schema of the import table, where it differs from the target table. Used to validate
   * the CSV and to determine the session datasource columns. If omitted and importTable is
   * provided, the schema is fetched via getTableSchema. Pass a stable reference.
   */
  importSchema?: TableSchema;
  /** Expected import table, used to validate the session table returned by the server. */
  importTable?: VuuTable;
  maxRows?: number;
  onImportSessionEnded?: (result: CsvUploadSessionEndResult) => void;
  onImportSessionReady?: (dataSource: DataSource) => void;
  onError?: (result: CsvUploadErrorResult | undefined) => void;
  onImported?: (result: CsvUploadImportedResult) => void;
  onPreview?: (result: CsvUploadPreviewResult) => void;
  onProcessingStarted?: () => void;
  parseOptions?: CsvParseOptions;
  /** Default column values applied to every addRow call. Pass a stable reference — a new object triggers EditSession recreation. */
  rowDefaults?: RowDefaultDataItemValues;
  validators?: Record<string, CsvColumnValidator>;
}

export type UseCsvUploadReturn = {
  canImport: boolean;
  cancelImport: () => Promise<void>;
  importData: () => Promise<boolean>;
  isImporting: boolean;
  isProcessingFile: boolean;
  onDrop: (_event: React.DragEvent<HTMLDivElement>, files: File[]) => void;
  onTriggerChange: (
    _event: React.ChangeEvent<HTMLInputElement>,
    files: File[],
  ) => void;
  sessionTable: CsvUploadSessionTable | undefined;
  schema: TableSchema | undefined;
  validation: CsvValidationResult | undefined;
  error: CsvUploadErrorResult | undefined;
};

export const useCsvUpload = ({
  dataSource,
  importMode = "direct",
  importSchema,
  importTable,
  onImportSessionEnded,
  onImportSessionReady,
  onError,
  onImported,
  onPreview,
  onProcessingStarted,
  maxRows,
  parseOptions,
  rowDefaults,
  validators,
}: CsvUploadHookProps): UseCsvUploadReturn => {
  const [validation, setValidation] = useState<
    CsvValidationResult | undefined
  >();
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<CsvUploadErrorResult | undefined>();

  const operationIdRef = useRef(0);
  const processingPromiseRef = useRef<Promise<void> | undefined>(undefined);

  const handleError = useCallback(
    (errResult: CsvUploadErrorResult | undefined) => {
      setError(errResult);
      onError?.(errResult);
    },
    [onError],
  );

  const { schema, sessionOverrides } = useImportSchema({
    dataSource,
    importSchema,
    importTable,
  });

  const {
    addAllRows,
    beginEditSession,
    checkSessionTableErrors,
    closePendingEditSession,
    editSession,
    endEditSessionAndNotify,
    releaseEditSessionOwnership,
    sessionDataSourceRef,
    sessionTable,
    setActiveSessionDataSource,
  } = useImportSession({
    dataSource,
    sessionOverrides,
    rowDefaults,
    processingPromiseRef,
    onImportSessionEnded,
  });

  const table = dataSource.table;

  const cancelImport = useCallback(async () => {
    operationIdRef.current++;
    processingPromiseRef.current = undefined;
    setIsProcessingFile(false);
    setIsImporting(false);
    handleError(undefined);
    await closePendingEditSession(false);
  }, [closePendingEditSession, handleError]);

  const processFile = useCallback(
    async (file: File, operationId: number) => {
      setValidation(undefined);
      handleError(undefined);

      await closePendingEditSession(false);
      if (operationId !== operationIdRef.current) {
        return;
      }

      if (
        !isSessionTable(dataSource.table) &&
        (dataSource.status === "initialising" ||
          dataSource.status === "unsubscribed")
      ) {
        const errorMessage = `CsvUpload requires dataSource to be subscribed before uploading (current status: "${dataSource.status}").`;
        handleError({
          errors: {
            validationError: createUploadError("validation", errorMessage),
          },
        });
        return;
      }

      if (schema === undefined) {
        throw Error("Table schema is not yet available.");
      }

      if (table === undefined) {
        throw Error("CsvUpload requires dataSource.table to be defined.");
      }

      const fileContents = await file.text();
      if (operationId !== operationIdRef.current) {
        return;
      }
      const parsedCsv = parseCsv(fileContents, parseOptions);
      if (parsedCsv.error && hasFileParseErrors(parsedCsv.error)) {
        setValidation(undefined);
        handleError({
          errors: {
            validationError: createUploadError(
              "validation",
              `Validation failed: ${parsedCsv.error.message}`,
              parsedCsv.error,
            ),
          },
        });
        return;
      }

      const schemaValidation = validateCsvAgainstSchema(parsedCsv, schema, {
        maxRows,
        validators,
      });

      if (Object.keys(schemaValidation.errorMap.fileErrors).length > 0) {
        setValidation(schemaValidation);
        const detailedMessage = `CSV validation failed: ${schemaValidation.errors
          .map((e) =>
            e.column === "*" ? e.message : `${e.column}: ${e.message}`,
          )
          .join("; ")}`;
        handleError({
          errors: {
            schemaError: createUploadError(
              "schema",
              detailedMessage,
              parsedCsv.error,
              schemaValidation as unknown as CsvValidationStructuredError,
            ),
          },
        });
        return;
      }

      const mergedValidation = mergeValidationWithParseErrors(
        schemaValidation,
        parsedCsv.error,
      );

      setValidation(mergedValidation);

      if (mergedValidation.rows.length > 0) {
        try {
          const sessionDataSource = await beginEditSession();
          if (operationId !== operationIdRef.current) {
            return;
          }

          const rowsAddedCount = await addAllRows(
            mergedValidation,
            () => operationId !== operationIdRef.current,
          );
          if (rowsAddedCount === false) {
            return;
          }

          const expectedRowCount = rowsAddedCount;
          sessionDataSource.range = Range(0, expectedRowCount);

          const sessionErrors = await checkSessionTableErrors(
            sessionDataSource,
            expectedRowCount,
          );
          if (operationId !== operationIdRef.current) {
            return;
          }

          if (sessionErrors.length > 0) {
            throw Error(buildRowErrorMessage("Import failed", sessionErrors));
          }

          onImportSessionReady?.(sessionDataSource);
        } catch (error) {
          if (sessionDataSourceRef.current !== undefined) {
            await endEditSessionAndNotify(false, "failed");
          } else {
            try {
              await editSession.end(false);
            } catch (err) {
              console.error("[useCsvUpload] failed to end clean session", err);
            }
          }
          setValidation(undefined);
          handleError({
            errors: {
              importError: createUploadError(
                "import",
                `RPC import failed: ${toErrorMessage(error)}`,
              ),
            },
          });
        }
      }
    },
    [
      handleError,
      editSession,
      addAllRows,
      checkSessionTableErrors,
      maxRows,
      parseOptions,
      beginEditSession,
      closePendingEditSession,
      dataSource.status,
      dataSource.table,
      table,
      endEditSessionAndNotify,
      schema,
      validators,
      onImportSessionReady,
      sessionDataSourceRef,
    ],
  );

  const handleFiles = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (file === undefined) {
        return;
      }
      setIsProcessingFile(true);
      onProcessingStarted?.();
      const operationId = ++operationIdRef.current;
      const processingPromise = processFile(file, operationId);
      processingPromiseRef.current = processingPromise;
      try {
        await processingPromise;
      } catch (err) {
        setValidation(undefined);
        setActiveSessionDataSource(undefined);
        const parseError = isCsvParseError(err) ? err : undefined;
        const errorMessage = parseError
          ? `Validation failed: ${parseError.message}`
          : `Validation failed: ${toErrorMessage(err)}`;
        const errors: CsvUploadErrorResult = {
          errors: {
            validationError: createUploadError(
              "validation",
              errorMessage,
              parseError,
            ),
          },
        };
        handleError(errors);
      } finally {
        if (processingPromiseRef.current === processingPromise) {
          processingPromiseRef.current = undefined;
        }
        setIsProcessingFile(false);
      }
    },
    [handleError, onProcessingStarted, processFile, setActiveSessionDataSource],
  );

  const onDrop = useCallback(
    (_event: React.DragEvent<HTMLDivElement>, files: File[]) => {
      handleFiles(files);
    },
    [handleFiles],
  );

  const onTriggerChange = useCallback(
    (_event: React.ChangeEvent<HTMLInputElement>, files: File[]) => {
      handleFiles(files);
    },
    [handleFiles],
  );

  const canImport = useMemo(
    () =>
      validation !== undefined &&
      validation.errors.length === 0 &&
      validation.rows.length > 0 &&
      !isProcessingFile &&
      !isImporting &&
      error === undefined,
    [isImporting, isProcessingFile, validation, error],
  );

  const importData = useCallback(async () => {
    if (!canImport || validation === undefined) {
      return false;
    }

    setIsImporting(true);
    handleError(undefined);

    try {
      const fallbackTableData = {
        columns: validation.columns,
        rows: validation.rows.map((row) =>
          validation.columns.map((column) => row[column] ?? ""),
        ),
      };

      const tableData = fallbackTableData;
      if (importMode === "preview") {
        const sessionDataSource = sessionDataSourceRef.current;
        if (!sessionDataSource) {
          throw Error("CsvUpload has no session datasource to preview.");
        }
        if (!onPreview) {
          throw Error("CsvUpload preview mode requires an onPreview callback.");
        }
        onPreview({
          dataSource: sessionDataSource,
          editSession,
          tableData,
        });
        releaseEditSessionOwnership();
      } else {
        await endEditSessionAndNotify(true, "saved");
        onImported?.({ tableData });
      }
      return true;
    } catch (err) {
      const errorMessage = `RPC import failed: ${String(err)}`;
      const errors: CsvUploadErrorResult = {
        errors: {
          importError: createUploadError("import", errorMessage),
        },
      };
      handleError(errors);
      return false;
    } finally {
      setIsImporting(false);
    }
  }, [
    canImport,
    editSession,
    endEditSessionAndNotify,
    handleError,
    onImported,
    onPreview,
    importMode,
    releaseEditSessionOwnership,
    sessionDataSourceRef,
    validation,
  ]);

  return {
    canImport,
    cancelImport,
    importData,
    isImporting,
    isProcessingFile,
    onDrop,
    onTriggerChange,
    sessionTable,
    schema,
    validation,
    error,
  };
};
