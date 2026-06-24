import type { DataSource, TableSchema } from "@vuu-ui/vuu-data-types";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { isRpcSuccess, isSessionTable } from "@vuu-ui/vuu-utils";
import { useCallback, useMemo, useRef, useState } from "react";
import { parseCsv, type CsvParseOptions } from "./parse/csv-parse";
import {
  type CsvValidationResult,
  validateCsvAgainstSchema,
} from "./parse/csv-schema-validation";
import {
  buildRowErrorMessage,
  createUploadError,
  executeBatchRpcCalls,
  hasFileParseErrors,
  isCsvParseError,
  normalizeTableData,
  mergeValidationWithParseErrors,
  toErrorMessage,
} from "./parse/csv-upload-utils";
import { CSV_FIRST_DATA_ROW_NUMBER } from "./parse/csv-constants";
import type {
  CsvUploadErrorResult,
  CsvUploadImportedResult,
  CsvUploadErrors,
  CsvUploadSessionEndReason,
  CsvUploadSessionEndResult,
  CsvUploadSessionTable,
} from "./CsvUpload";

export interface CsvUploadHookProps {
  dataSource: DataSource;
  maxRows?: number;
  onEditSessionEnded?: (result: CsvUploadSessionEndResult) => void;
  onEditSessionStarted?: (dataSource: DataSource) => void;
  onError?: (result: CsvUploadErrorResult | undefined) => void;
  onImported?: (result: CsvUploadImportedResult) => void;
  onProcessingStarted?: () => void;
  parseOptions?: CsvParseOptions;
}

export type UseCsvUploadReturn = {
  canImport: boolean;
  importData: () => Promise<void>;
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
};

export const useCsvUpload = ({
  dataSource,
  onEditSessionEnded,
  onEditSessionStarted,
  onError,
  onImported,
  onProcessingStarted,
  maxRows,
  parseOptions,
}: CsvUploadHookProps): UseCsvUploadReturn => {
  const [validation, setValidation] = useState<
    CsvValidationResult | undefined
  >();
  const [sessionTable, setSessionTable] = useState<
    CsvUploadSessionTable | undefined
  >();
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const sessionTableRef = useRef<CsvUploadSessionTable | undefined>(undefined);

  const setActiveSessionTable = useCallback(
    (table?: CsvUploadSessionTable) => {
      sessionTableRef.current = table;
      if (table) {
        const sessionDs = dataSource.createSessionDataSource?.(table);
        if (sessionDs) {
          onEditSessionStarted?.(sessionDs);
        }
      }
      setSessionTable(table);
    },
    [dataSource, onEditSessionStarted],
  );

  const endEditSessionAndNotify = useCallback(
    async (save: boolean, reason: CsvUploadSessionEndReason) => {
      if (!dataSource.endEditSession) {
        throw Error("CsvUpload requires datasource endEditSession support.");
      }
      const currentSessionTable = sessionTableRef.current;
      const result = await dataSource.endEditSession(save);

      setActiveSessionTable(undefined);
      onEditSessionEnded?.({
        reason,
        sessionTable: currentSessionTable,
      });
      return result;
    },
    [dataSource, onEditSessionEnded, setActiveSessionTable],
  );

  const table = dataSource.table;
  const schema = dataSource.tableSchema;

  const addAllRows = useCallback(
    async (mergedValidation: CsvValidationResult) => {
      if (table === undefined) {
        throw Error("CsvUpload requires dataSource.table to be defined.");
      }

      const vuuMsgByRow = new Map<number, string>();
      for (const { rowNum, column, message } of mergedValidation.errors) {
        if (rowNum < CSV_FIRST_DATA_ROW_NUMBER) continue;
        const existing = vuuMsgByRow.get(rowNum);
        const columnError = `${column}: ${message}`;
        vuuMsgByRow.set(
          rowNum,
          existing ? `${existing}; ${columnError}` : `Row ${rowNum}: ${columnError}`,
        );
      }

      const parsedRowCount = mergedValidation.rows.length;
      const unparsedErrorRows = [...vuuMsgByRow.keys()]
        .filter((rowNum) => rowNum - CSV_FIRST_DATA_ROW_NUMBER >= parsedRowCount)
        .map((rowNum) => ({
          rowNum,
          rowData: {} as Record<string, VuuRowDataItemType>,
          vuuMsg: vuuMsgByRow.get(rowNum) ?? "",
        }));

      const allRows = [
        ...mergedValidation.rows.map((rowData, idx) => ({
          rowNum: idx + CSV_FIRST_DATA_ROW_NUMBER,
          rowData: rowData ?? {},
          vuuMsg: vuuMsgByRow.get(idx + CSV_FIRST_DATA_ROW_NUMBER) ?? "",
        })),
        ...unparsedErrorRows,
      ];

      const { errors: rpcErrors } = await executeBatchRpcCalls(
        allRows,
        async ({ rowNum, rowData, vuuMsg }) => {
          const payload = { ...rowData, rowNum, vuuMsg };
          const result = await dataSource.rpcRequest?.({
            type: "RPC_REQUEST",
            rpcName: "addRow",
            params: {
              key: String(rowNum),
              data: payload,
            },
          });
          if (!isRpcSuccess(result)) {
            const msg =
              result && "errorMessage" in result
                ? String(result.errorMessage)
                : "addRow RPC failed";
            throw Error(msg);
          }
          return result;
        },
        ({ rowNum }, error) => `Row ${rowNum}: ${error}`,
      );

      if (rpcErrors.length > 0) {
        const errorMessage = buildRowErrorMessage("Import failed", rpcErrors);
        const errors: CsvUploadErrors = {
          importError: createUploadError("import", errorMessage),
        };
        onError?.({ errors });
      }
    },
    [dataSource, onError, table],
  );

  const beginEditSession = useCallback(async () => {
    if (!dataSource.beginEditSession) {
      throw Error("CsvUpload requires datasource beginEditSession support.");
    }

    const sessionDataSource = await dataSource.beginEditSession("empty-session-table");

    const sessionVuuTable = sessionDataSource?.table;
    if (sessionVuuTable && isSessionTable(sessionVuuTable)) {
      setActiveSessionTable(sessionVuuTable as CsvUploadSessionTable);
    }
  }, [dataSource, setActiveSessionTable]);

  const closePendingEditSession = useCallback(
    async (save: boolean) => {
      if (sessionTableRef.current === undefined) {
        return;
      }
      await endEditSessionAndNotify(save, save ? "saved" : "discarded");
    },
    [endEditSessionAndNotify],
  );

  const processFile = useCallback(
    async (file: File) => {
      setValidation(undefined);
      onError?.(undefined);

      await closePendingEditSession(false);

      if (schema === undefined) {
        throw Error("Table schema is not yet available.");
      }

      if (table === undefined) {
        throw Error("CsvUpload requires dataSource.table to be defined.");
      }

      const parsedCsv = parseCsv(await file.text(), parseOptions);
      if (parsedCsv.error && hasFileParseErrors(parsedCsv.error)) {
        setValidation(undefined);
        onError?.({
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
      });

      if (Object.keys(schemaValidation.errorMap.fileErrors).length > 0) {
        setValidation(schemaValidation);
        onError?.({
          errors: {
            schemaError: createUploadError(
              "schema",
              "CSV validation failed.",
              parsedCsv.error,
              {
                errorMap: schemaValidation.errorMap,
                errors: schemaValidation.errors,
                message: "CSV validation failed.",
              },
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
        await beginEditSession();

        try {
          await addAllRows(mergedValidation);
        } catch (error) {
          await endEditSessionAndNotify(false, "failed");
          setValidation(undefined);
          onError?.({
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
      onError,
      addAllRows,
      maxRows,
      parseOptions,
      beginEditSession,
      closePendingEditSession,
      table,
      endEditSessionAndNotify,
      schema,
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
      try {
        await processFile(file);
      } catch (err) {
        setValidation(undefined);
        setActiveSessionTable(undefined);
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
        onError?.(errors);
      } finally {
        setIsProcessingFile(false);
      }
    },
    [onError, onProcessingStarted, processFile, setActiveSessionTable],
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
      !isImporting,
    [isImporting, isProcessingFile, validation],
  );

  const importData = useCallback(async () => {
    if (!canImport || validation === undefined) {
      return;
    }

    setIsImporting(true);
    onError?.(undefined);

    try {
      const rpcResult = await endEditSessionAndNotify(true, "saved");

      const fallbackTableData = {
        columns: validation.columns,
        rows: validation.rows.map((row) =>
          validation.columns.map((column) => row[column] ?? ""),
        ),
      };

      onImported?.({
        rpcResult,
        tableData: normalizeTableData(rpcResult, fallbackTableData),
      });
    } catch (err) {
      const errorMessage = `RPC import failed: ${String(err)}`;
      const errors: CsvUploadErrorResult = {
        errors: {
          importError: createUploadError("import", errorMessage),
        },
      };
      onError?.(errors);
    } finally {
      setIsImporting(false);
    }
  }, [canImport, endEditSessionAndNotify, onError, onImported, validation]);

  return {
    canImport,
    importData,
    isImporting,
    isProcessingFile,
    onDrop,
    onTriggerChange,
    sessionTable,
    schema,
    validation,
  };
};
