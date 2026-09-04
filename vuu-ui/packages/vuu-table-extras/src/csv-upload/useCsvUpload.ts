import type {
  DataSource,
  EditApi,
  SessionDataSourceOverrides,
  TableSchema,
} from "@vuu-ui/vuu-data-types";
import { EditSession, type RowDefaultDataItemValues } from "@vuu-ui/vuu-data-editing";
import type { VuuRowDataItemType, VuuTable } from "@vuu-ui/vuu-protocol-types";
import { isRpcError, isSessionTable, useData } from "@vuu-ui/vuu-utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parseCsv, type CsvParseOptions } from "./parse/csv-parse";
import {
  type CsvValidationResult,
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
import { CSV_FIRST_DATA_ROW_NUMBER } from "./parse/csv-constants";
import type {
  CsvUploadErrorResult,
  CsvUploadImportedResult,
  CsvUploadPreviewResult,
  CsvUploadSessionEndReason,
  CsvUploadSessionEndResult,
  CsvUploadSessionTable,
} from "./CsvUpload";

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
  onImportSessionStarted?: (dataSource: DataSource) => void;
  onError?: (result: CsvUploadErrorResult | undefined) => void;
  onImported?: (result: CsvUploadImportedResult) => void;
  onPreview?: (result: CsvUploadPreviewResult) => void;
  onProcessingStarted?: () => void;
  parseOptions?: CsvParseOptions;
  /** Default column values applied to every addRow call. Pass a stable reference — a new object triggers EditSession recreation. */
  rowDefaults?: RowDefaultDataItemValues;
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
};

export const useCsvUpload = ({
  dataSource,
  importMode = "direct",
  importSchema,
  importTable,
  onImportSessionEnded,
  onImportSessionStarted,
  onError,
  onImported,
  onPreview,
  onProcessingStarted,
  maxRows,
  parseOptions,
  rowDefaults,
}: CsvUploadHookProps): UseCsvUploadReturn => {
  const { getServerAPI } = useData();
  const [validation, setValidation] = useState<
    CsvValidationResult | undefined
  >();
  const [sessionTable, setSessionTable] = useState<
    CsvUploadSessionTable | undefined
  >();
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [fetchedImportSchema, setFetchedImportSchema] = useState<
    TableSchema | undefined
  >();

  useEffect(() => {
    if (importSchema || importTable === undefined) {
      setFetchedImportSchema(undefined);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const server = await getServerAPI();
        const tableSchema = await server.getTableSchema(importTable);
        if (!cancelled) {
          setFetchedImportSchema(tableSchema);
        }
      } catch (error) {
        console.error(
          "[useCsvUpload] failed to fetch import table schema",
          error,
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getServerAPI, importSchema, importTable]);

  const resolvedImportSchema = importSchema ?? fetchedImportSchema;
  const sessionOverrides = useMemo<SessionDataSourceOverrides | undefined>(() => {
    const columns = resolvedImportSchema?.columns.map(({ name }) => name);
    return columns || importTable ? { columns, table: importTable } : undefined;
  }, [resolvedImportSchema, importTable]);
  // EditSession's constructor takes no session/schema config - the override is applied
  // here, at the createSessionDataSource call site, since `dataSource` is supplied by the
  // caller and may be shared with a view that has no knowledge of the import table.
  const importDataSource = useMemo<EditApi & { tableSchema?: TableSchema }>(() => {
    if (!sessionOverrides) {
      return dataSource;
    }
    return {
      tableSchema: dataSource.tableSchema,
      createSessionDataSource: async (copyOption, sessionType) => {
        if (!dataSource.createSessionDataSource) {
          throw Error(
            "[useCsvUpload] dataSource does not support createSessionDataSource",
          );
        }
        return dataSource.createSessionDataSource(
          copyOption,
          sessionType,
          sessionOverrides,
        );
      },
    };
  }, [dataSource, sessionOverrides]);
  const editSession = useMemo(
    () =>
      new EditSession({
        dataSource: importDataSource,
        editSessionApi: "createSessionDataSource",
        rowDefaults,
      }),
    [importDataSource, rowDefaults],
  );
  const ownsEditSessionRef = useRef(true);
  const operationIdRef = useRef(0);
  const processingPromiseRef = useRef<Promise<void> | undefined>(undefined);
  const sessionDataSourceRef = useRef<DataSource | undefined>(undefined);

  useEffect(
    () => () => {
      operationIdRef.current++;
      const processingPromise = processingPromiseRef.current;
      void (async () => {
        try {
          await processingPromise;
        } finally {
          if (ownsEditSessionRef.current) {
            try {
              await editSession.end(false);
            } catch (error) {
              console.error(
                "[useCsvUpload] failed to discard edit session during cleanup",
                error,
              );
            }
          }
        }
      })();
    },
    [editSession],
  );

  const setActiveSessionDataSource = useCallback(
    (sessionDataSource?: DataSource) => {
      sessionDataSourceRef.current = sessionDataSource;
      const table = sessionDataSource?.table;
      setSessionTable(
        table && isSessionTable(table)
          ? (table as CsvUploadSessionTable)
          : undefined,
      );
    },
    [],
  );

  const endEditSessionAndNotify = useCallback(
    async (save: boolean, reason: CsvUploadSessionEndReason) => {
      const sessionDataSource = sessionDataSourceRef.current;
      if (!sessionDataSource) {
        throw Error("CsvUpload has no active edit session.");
      }
      if (!sessionDataSource.endEditSession) {
        throw Error(
          "CsvUpload requires the session datasource to support endEditSession.",
        );
      }
      const currentSessionTable = sessionDataSource.table;
      await editSession.end(save);

      setActiveSessionDataSource(undefined);
      onImportSessionEnded?.({
        reason,
        sessionTable:
          currentSessionTable && isSessionTable(currentSessionTable)
            ? (currentSessionTable as CsvUploadSessionTable)
            : undefined,
      });
      return undefined;
    },
    [editSession, onImportSessionEnded, setActiveSessionDataSource],
  );

  const table = dataSource.table;
  // CSV is validated before the session table exists, so the import schema cannot
  // come from the session datasource. Never fall back to the target schema once an
  // import table is declared - that would validate against the wrong columns.
  const schema = importTable
    ? resolvedImportSchema
    : (resolvedImportSchema ?? dataSource.tableSchema);

  const addAllRows = useCallback(
    async (mergedValidation: CsvValidationResult, operationId: number) => {
      const vuuMsgByRow = new Map<number, string>();
      for (const { rowNum, column, message } of mergedValidation.errors) {
        if (rowNum < CSV_FIRST_DATA_ROW_NUMBER) continue;
        const existing = vuuMsgByRow.get(rowNum);
        const columnError = `${column}: ${message}`;
        vuuMsgByRow.set(
          rowNum,
          existing
            ? `${existing}; ${columnError}`
            : `Row ${rowNum}: ${columnError}`,
        );
      }

      const parsedRowCount = mergedValidation.rows.length;
      const unparsedErrorRows = [...vuuMsgByRow.keys()]
        .filter(
          (rowNum) => rowNum - CSV_FIRST_DATA_ROW_NUMBER >= parsedRowCount,
        )
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

      const rpcErrors: string[] = [];
      for (const { rowNum, rowData, vuuMsg } of allRows) {
        if (operationId !== operationIdRef.current) {
          return false;
        }
        try {
          const payload = vuuMsg ? { vuuRowNum: rowNum, vuuMsg } : { ...rowData, vuuRowNum: rowNum, vuuMsg };
          const result = await editSession.addRow(payload);
          if (isRpcError(result)) {
            throw Error(result.errorMessage);
          }
          if (typeof result === "string") {
            throw Error(result);
          }
        } catch (error) {
          rpcErrors.push(`Row ${rowNum}: ${toErrorMessage(error)}`);
        }
      }

      if (rpcErrors.length > 0) {
        throw Error(buildRowErrorMessage("Import failed", rpcErrors));
      }
      return true;
    },
    [editSession],
  );

  const beginEditSession = useCallback(async () => {
    const sessionDataSource = await editSession.begin("Empty", "import");

    const sessionVuuTable = sessionDataSource?.table;
    if (
      sessionDataSource === undefined ||
      sessionVuuTable === undefined ||
      !isSessionTable(sessionVuuTable)
    ) {
      throw Error(
        "CsvUpload createSessionDataSource returned no session datasource.",
      );
    }
    if (!sessionDataSource.columns.includes("vuuMsg")) {
      sessionDataSource.columns = sessionDataSource.columns.concat("vuuMsg");
    }
    setActiveSessionDataSource(sessionDataSource);
    onImportSessionStarted?.(sessionDataSource);
    return sessionDataSource;
  }, [editSession, onImportSessionStarted, setActiveSessionDataSource]);

  const closePendingEditSession = useCallback(
    async (save: boolean) => {
      if (sessionDataSourceRef.current === undefined) {
        return;
      }
      await endEditSessionAndNotify(save, save ? "saved" : "discarded");
    },
    [endEditSessionAndNotify],
  );

  const cancelImport = useCallback(async () => {
    operationIdRef.current++;
    try {
      await processingPromiseRef.current;
    } catch {
      // File-processing errors are surfaced by handleFiles.
    }
    await closePendingEditSession(false);
  }, [closePendingEditSession]);

  const processFile = useCallback(
    async (file: File, operationId: number) => {
      setValidation(undefined);
      onError?.(undefined);

      await closePendingEditSession(false);
      if (operationId !== operationIdRef.current) {
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
        if (operationId !== operationIdRef.current) {
          return;
        }

        try {
          const rowsAdded = await addAllRows(mergedValidation, operationId);
          if (!rowsAdded) {
            return;
          }
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
        onError?.(errors);
      } finally {
        if (processingPromiseRef.current === processingPromise) {
          processingPromiseRef.current = undefined;
        }
        setIsProcessingFile(false);
      }
    },
    [onError, onProcessingStarted, processFile, setActiveSessionDataSource],
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
      return false;
    }

    setIsImporting(true);
    onError?.(undefined);

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
        ownsEditSessionRef.current = false;
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
      onError?.(errors);
      return false;
    } finally {
      setIsImporting(false);
    }
  }, [
    canImport,
    editSession,
    endEditSessionAndNotify,
    onError,
    onImported,
    onPreview,
    importMode,
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
  };
};
