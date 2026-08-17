import { LocalDataSourceProvider, simulModule } from "@vuu-ui/vuu-data-test";
import {
  CsvUpload,
  type CsvUploadErrorResult,
  type CsvUploadPhase,
  type CsvUploadSessionEndResult,
  type CsvUploadSessionTable,
} from "@vuu-ui/vuu-table-extras";
import type { DataSource } from "@vuu-ui/vuu-data-types";
import { Button } from "@salt-ds/core";
import { useCallback, useMemo, useState } from "react";

const LOCAL_TABLE_NAME = "instruments";

const CsvUploadRpcExampleContent = () => {
  const dataSource = useMemo(
    () => simulModule.createDataSource(LOCAL_TABLE_NAME),
    [],
  );

  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [imported, setImported] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(true);

  const handleCancel = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const handleReopen = useCallback(() => {
    setDialogOpen(true);
    setImported(false);
    setErrorMessage(undefined);
  }, []);

  const handleError = useCallback(
    (result: CsvUploadErrorResult | undefined) => {
      setErrorMessage(
        result?.errors.schemaError?.message ??
          result?.errors.validationError?.message ??
          result?.errors.importError?.message,
      );
    },
    [],
  );

  const handleImported = useCallback(() => {
    setImported(true);
  }, []);

  return (
    <div style={{ padding: 12, display: "grid", gap: 12 }}>
      <h3 style={{ margin: 0 }}>CSV Upload RPC Example</h3>
      {!dialogOpen ? (
        <Button onClick={handleReopen}>Open Upload Dialog</Button>
      ) : null}
      {imported ? (
        <div style={{ color: "#027a48", fontSize: 12, fontWeight: 600 }}>
          Import successful.
        </div>
      ) : null}
      <CsvUpload
        dataSource={dataSource}
        maxRows={25000}
        onCancel={handleCancel}
        onClose={handleCancel}
        onError={handleError}
        onImported={handleImported}
        open={dialogOpen}
      >
        {errorMessage ? (
          <div style={{ color: "#b42318", fontSize: 12, fontWeight: 600 }}>
            {errorMessage}
          </div>
        ) : null}
      </CsvUpload>
    </div>
  );
};

export const CsvUploadRpcExample = () => {
  return (
    <LocalDataSourceProvider>
      <CsvUploadRpcExampleContent />
    </LocalDataSourceProvider>
  );
};

const phaseLabelById: Record<CsvUploadPhase, string> = {
  idle: "Idle",
  processing: "Processing",
  "preview-ready": "Preview Ready",
  importing: "Importing",
  imported: "Imported",
  failed: "Failed",
};

const timestamp = () =>
  new Date().toLocaleTimeString([], {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

const CsvUploadRpcLifecycleExampleContent = () => {
  const dataSource = useMemo(
    () => simulModule.createDataSource(LOCAL_TABLE_NAME),
    [],
  );

  const [phase, setPhase] = useState<CsvUploadPhase>("idle");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [sessionTable, setSessionTable] = useState<
    CsvUploadSessionTable | undefined
  >();
  const [recentTransitions, setRecentTransitions] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(true);

  const addTransition = useCallback((label: string) => {
    setRecentTransitions((prev) => {
      const next = [`${timestamp()} - ${label}`, ...prev];
      return next.slice(0, 5);
    });
  }, []);

  const handleProcessingStarted = useCallback(() => {
    setPhase("processing");
    addTransition(phaseLabelById["processing"]);
  }, [addTransition]);

  const handleImportSessionStarted = useCallback(
    (dataSource: DataSource) => {
      setSessionTable(dataSource.table as CsvUploadSessionTable);
      setPhase("preview-ready");
      addTransition(phaseLabelById["preview-ready"]);
    },
    [addTransition],
  );

  const handleImportSessionEnded = useCallback(
    (result: CsvUploadSessionEndResult) => {
      setSessionTable(undefined);
      const nextPhase = result.reason === "saved" ? "imported" : "idle";
      setPhase(nextPhase);
      addTransition(phaseLabelById[nextPhase]);
    },
    [addTransition],
  );

  const handleError = useCallback(
    (result: CsvUploadErrorResult | undefined) => {
      if (result) {
        setErrorMessage(
          result.errors.schemaError?.message ??
            result.errors.validationError?.message ??
            result.errors.importError?.message,
        );
        setPhase("failed");
        addTransition(phaseLabelById["failed"]);
      } else {
        setErrorMessage(undefined);
      }
    },
    [addTransition],
  );

  const handleClose = useCallback(() => {
    setDialogOpen(false);
    setPhase("importing");
    addTransition(phaseLabelById["importing"]);
  }, [addTransition]);

  const handleCancel = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const handleReopen = useCallback(() => {
    setDialogOpen(true);
    setPhase("idle");
    setErrorMessage(undefined);
    setRecentTransitions([]);
  }, []);

  const transitionColor =
    phase === "failed"
      ? "#b42318"
      : phase === "imported"
        ? "#027a48"
        : "#155eef";

  return (
    <div style={{ padding: 12, display: "grid", gap: 12 }}>
      <h3 style={{ margin: 0 }}>CSV Upload RPC Lifecycle</h3>
      {!dialogOpen ? (
        <Button onClick={handleReopen}>Open Upload Dialog</Button>
      ) : null}
      <div
        style={{
          display: "grid",
          gap: 8,
          border: "1px solid #d0d5dd",
          borderRadius: 6,
          padding: 10,
          fontSize: 12,
        }}
      >
        <div>
          Phase:{" "}
          <strong style={{ color: transitionColor }}>
            {phaseLabelById[phase] ?? phase}
          </strong>
        </div>
        {sessionTable ? (
          <div style={{ fontFamily: "monospace", opacity: 0.8 }}>
            Session Table: {sessionTable.module}/{sessionTable.table}
          </div>
        ) : null}
        {errorMessage ? (
          <div style={{ color: "#b42318" }}>{errorMessage}</div>
        ) : null}
        <div style={{ opacity: 0.8 }}>Recent transitions:</div>
        <div style={{ display: "grid", gap: 4, fontFamily: "monospace" }}>
          {recentTransitions.length > 0
            ? recentTransitions.map((entry) => <div key={entry}>{entry}</div>)
            : "No transitions yet"}
        </div>
      </div>

      <CsvUpload
        dataSource={dataSource}
        maxRows={25000}
        onCancel={handleCancel}
        onClose={handleClose}
        onProcessingStarted={handleProcessingStarted}
        onImportSessionStarted={handleImportSessionStarted}
        onImportSessionEnded={handleImportSessionEnded}
        onError={handleError}
        open={dialogOpen}
      />
    </div>
  );
};

export const CsvUploadRpcLifecycleExample = () => {
  return (
    <LocalDataSourceProvider>
      <CsvUploadRpcLifecycleExampleContent />
    </LocalDataSourceProvider>
  );
};
