import type {
  CopyOption,
  DataSource,
  DataSourceSubscribeCallback,
  SessionDataSourceOverrides,
  SessionType,
} from "@vuu-ui/vuu-data-types";
import {
  EditSession,
  type RowDefaultDataItemValues,
} from "@vuu-ui/vuu-data-editing";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import {
  buildColumnMap,
  isRpcError,
  isSessionTable,
  metadataKeys,
  Range,
} from "@vuu-ui/vuu-utils";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { CsvValidationResult } from "../parse/csv-schema-validation";
import {
  buildRowErrorMessage,
  getInlineRowErrorMessage,
  getRowVuuMsgError,
  toErrorMessage,
  waitForSessionErrors,
  type SessionRowError,
  type SessionRowUpdateListener,
} from "../parse/csv-upload-utils";
import { CSV_FIRST_DATA_ROW_NUMBER } from "../parse/csv-constants";
import type {
  CsvUploadSessionEndReason,
  CsvUploadSessionEndResult,
  CsvUploadSessionTable,
} from "../CsvUpload";

export interface UseImportSessionProps {
  dataSource: DataSource;
  sessionOverrides?: SessionDataSourceOverrides;
  rowDefaults?: RowDefaultDataItemValues;
  processingPromiseRef?: RefObject<Promise<void> | undefined>;
  onImportSessionEnded?: (result: CsvUploadSessionEndResult) => void;
}

export interface UseImportSessionReturn {
  addAllRows: (
    mergedValidation: CsvValidationResult,
    isCancelled: () => boolean,
  ) => Promise<number | false>;
  beginEditSession: () => Promise<DataSource>;
  checkSessionTableErrors: (
    sessionDs: DataSource,
    expectedRowCount: number,
  ) => Promise<SessionRowError[]>;
  closePendingEditSession: (save: boolean) => Promise<void>;
  editSession: EditSession;
  endEditSessionAndNotify: (
    save: boolean,
    reason: CsvUploadSessionEndReason,
  ) => Promise<void>;
  releaseEditSessionOwnership: () => void;
  sessionDataSourceRef: React.MutableRefObject<DataSource | undefined>;
  sessionTable: CsvUploadSessionTable | undefined;
  setActiveSessionDataSource: (sessionDataSource?: DataSource) => void;
}

export const useImportSession = ({
  dataSource,
  sessionOverrides,
  rowDefaults,
  processingPromiseRef,
  onImportSessionEnded,
}: UseImportSessionProps): UseImportSessionReturn => {
  const sessionErrorsRef = useRef<Map<string | number, SessionRowError>>(
    new Map(),
  );
  const receivedRowKeysRef = useRef<Set<string | number>>(new Set());
  const sessionRowUpdateListenersRef = useRef<Set<SessionRowUpdateListener>>(
    new Set(),
  );

  const importDataSource = useMemo<DataSource>(() => {
    return {
      tableSchema: dataSource.tableSchema,
      createSessionDataSource: async (
        copyOption: CopyOption,
        sessionType?: SessionType,
      ) => {
        if (!dataSource.createSessionDataSource) {
          throw Error(
            "[useCsvUpload] dataSource does not support createSessionDataSource",
          );
        }
        const sessionDs = await dataSource.createSessionDataSource(
          copyOption,
          sessionType,
          sessionOverrides,
        );
        if (!sessionDs) {
          throw Error("[useCsvUpload] Failed to create session datasource");
        }

        if (!sessionDs.columns.includes("vuuMsg")) {
          sessionDs.columns = sessionDs.columns.concat("vuuMsg");
        }

        const columnMap = buildColumnMap(sessionDs.columns);
        const vuuMsgDataIndex = columnMap.vuuMsg ?? -1;
        const vuuRowNumDataIndex = columnMap.vuuRowNum ?? -1;

        const handleSessionMessage: DataSourceSubscribeCallback = (message) => {
          if (message.type === "viewport-update" && message.rows) {
            for (const row of message.rows) {
              const rowKey = row[metadataKeys.KEY] ?? row[metadataKeys.IDX];
              receivedRowKeysRef.current.add(rowKey);
              const error = getRowVuuMsgError(
                row,
                vuuMsgDataIndex,
                vuuRowNumDataIndex,
              );
              if (error) {
                sessionErrorsRef.current.set(rowKey, error);
              }
            }
            for (const listener of sessionRowUpdateListenersRef.current) {
              listener();
            }
          } else if (message.type === "viewport-clear") {
            sessionErrorsRef.current.clear();
            receivedRowKeysRef.current.clear();
          }
        };

        if (sessionDs.isRemote) {
          return new Promise<DataSource>((resolve, reject) => {
            const handleSubscribed = () => {
              sessionDs.removeListener("subscribed", handleSubscribed);
              resolve(sessionDs);
            };
            sessionDs.on("subscribed", handleSubscribed);
            try {
              sessionDs.subscribe({ range: Range(0, 0) }, handleSessionMessage);
            } catch (err) {
              sessionDs.removeListener("subscribed", handleSubscribed);
              reject(err);
            }
          });
        } else if (
          typeof sessionDs.subscribe === "function" &&
          sessionDs.status === "initialising"
        ) {
          try {
            sessionDs.subscribe({ range: Range(0, 0) }, handleSessionMessage);
          } catch {
            // ignore if local/mock datasource doesn't support subscribe
          }
        }

        return sessionDs;
      },
    } as DataSource;
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
  const sessionDataSourceRef = useRef<DataSource | undefined>(undefined);
  const [sessionTable, setSessionTable] = useState<
    CsvUploadSessionTable | undefined
  >();

  useEffect(
    () => () => {
      const processingPromise = processingPromiseRef?.current;
      void (async () => {
        try {
          await processingPromise;
        } finally {
          if (ownsEditSessionRef.current) {
            try {
              const sessionDs =
                sessionDataSourceRef.current ?? editSession.sessionDataSource;
              if (sessionDs?.status !== "unsubscribed") {
                await editSession.end(false);
              }
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
    [editSession, processingPromiseRef],
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
      ownsEditSessionRef.current = false;
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
      try {
        await editSession.end(save);
      } finally {
        if (
          sessionDataSource.status !== "unsubscribed" &&
          typeof sessionDataSource.unsubscribe === "function"
        ) {
          sessionDataSource.unsubscribe();
        }
        setActiveSessionDataSource(undefined);
      }

      onImportSessionEnded?.({
        reason,
        sessionTable:
          currentSessionTable && isSessionTable(currentSessionTable)
            ? (currentSessionTable as CsvUploadSessionTable)
            : undefined,
      });
    },
    [editSession, onImportSessionEnded, setActiveSessionDataSource],
  );

  const beginEditSession = useCallback(async () => {
    sessionErrorsRef.current.clear();
    receivedRowKeysRef.current.clear();
    ownsEditSessionRef.current = true;
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

    setActiveSessionDataSource(sessionDataSource);
    return sessionDataSource;
  }, [editSession, setActiveSessionDataSource]);

  const closePendingEditSession = useCallback(
    async (save: boolean) => {
      if (sessionDataSourceRef.current === undefined) {
        return;
      }
      await endEditSessionAndNotify(save, save ? "saved" : "discarded");
    },
    [endEditSessionAndNotify],
  );

  const releaseEditSessionOwnership = useCallback(() => {
    ownsEditSessionRef.current = false;
  }, []);

  const addAllRows = useCallback(
    async (
      mergedValidation: CsvValidationResult,
      isCancelled: () => boolean,
    ) => {
      const vuuMsgByRow = new Map<number, string>();
      for (const { rowNum, column, message } of mergedValidation.errors) {
        if (rowNum < CSV_FIRST_DATA_ROW_NUMBER) continue;
        const existing = vuuMsgByRow.get(rowNum);
        const columnError = `${column}: ${message}`;
        vuuMsgByRow.set(
          rowNum,
          existing ? `${existing}; ${columnError}` : columnError,
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
        if (isCancelled()) {
          return false;
        }
        try {
          const payload = vuuMsg
            ? { vuuRowNum: rowNum, vuuMsg }
            : { ...rowData, vuuRowNum: rowNum, vuuMsg };
          const result = await editSession.addRow(payload);
          if (isRpcError(result)) {
            throw Error(result.errorMessage);
          }
          if (typeof result === "string") {
            throw Error(result);
          }
          const inlineMsg = getInlineRowErrorMessage(result);
          if (inlineMsg) {
            sessionErrorsRef.current.set(rowNum, {
              rowNum,
              message: inlineMsg,
            });
          }
        } catch (error) {
          rpcErrors.push(
            `${rowNum === 0 ? "Header" : `Row ${rowNum}`}: ${toErrorMessage(error)}`,
          );
        }
      }

      if (rpcErrors.length > 0) {
        throw Error(buildRowErrorMessage("Import failed", rpcErrors));
      }
      return allRows.length;
    },
    [editSession],
  );

  const checkSessionTableErrors = useCallback(
    async (
      sessionDs: DataSource,
      expectedRowCount: number,
    ): Promise<SessionRowError[]> => {
      return waitForSessionErrors(
        sessionDs.isRemote ?? false,
        sessionErrorsRef.current,
        receivedRowKeysRef.current,
        expectedRowCount,
        sessionRowUpdateListenersRef.current,
      );
    },
    [],
  );

  return {
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
  };
};
