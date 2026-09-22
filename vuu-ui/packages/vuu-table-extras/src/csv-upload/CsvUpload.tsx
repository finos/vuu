import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogHeader,
  FileDropZone,
  FileDropZoneIcon,
  FileDropZoneTrigger,
  Text,
} from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { type ReactNode, useCallback, useState, useMemo } from "react";
import type {
  RowDefaultDataItemValues,
  EditSession,
} from "@vuu-ui/vuu-data-editing";
import type { CsvParseError, CsvParseOptions } from "./parse/csv-parse";
import type {
  CsvValidationStructuredError,
  CsvColumnValidator,
} from "./parse/csv-schema-validation";
import type { DataSource, TableSchema } from "@vuu-ui/vuu-data-types";
import type { VuuTable } from "@vuu-ui/vuu-protocol-types";
import type { CsvUploadTableData } from "./parse/csv-upload-utils";
import { useCsvUpload } from "./useCsvUpload";
import css from "./CsvUpload.css";

export type CsvUploadImportedResult = {
  tableData: CsvUploadTableData;
};

export type CsvUploadPreviewResult = {
  dataSource: DataSource;
  editSession: EditSession;
  tableData: CsvUploadTableData;
};

export type CsvUploadErrors = {
  schemaError?: CsvUploadError;
  validationError?: CsvUploadError;
  importError?: CsvUploadError;
};

export type CsvUploadError = {
  message: string;
  parseError?: CsvParseError;
  validationError?: CsvValidationStructuredError;
  source: "schema" | "validation" | "import";
};

export type CsvUploadErrorResult = {
  errors: CsvUploadErrors;
};

export type CsvUploadSessionTable = VuuTable;

export type CsvUploadSessionEndReason = "saved" | "discarded" | "failed";

export type CsvUploadSessionEndResult = {
  reason: CsvUploadSessionEndReason;
  sessionTable?: CsvUploadSessionTable;
};

export type CsvUploadPhase =
  | "idle"
  | "processing"
  | "preview-ready"
  | "importing"
  | "imported"
  | "failed";

export interface CsvUploadProps {
  children?: ReactNode;
  dataSource: DataSource;
  embedded?: boolean;
  /**
   * Schema of the import table, where it differs from the target table. Used to validate
   * the CSV and to determine the session datasource columns. If omitted and importTable is
   * provided, the schema is fetched via getTableSchema. Pass a stable reference.
   */
  importSchema?: TableSchema;
  /** Expected import table, used to validate the session table returned by the server. */
  importTable?: VuuTable;
  onImportSessionReady?: (dataSource: DataSource) => void;
  onImportSessionEnded?: (result: CsvUploadSessionEndResult) => void;
  onError?: (result: CsvUploadErrorResult | undefined) => void;
  onImported?: (result: CsvUploadImportedResult) => void;
  onPreview?: (result: CsvUploadPreviewResult) => void;
  onProcessingStarted?: () => void;
  dialogTitle?: string;
  maxRows?: number;
  onCancel?: () => void;
  onClose?: () => void;
  open?: boolean;
  parseOptions?: CsvParseOptions;
  importMode?: "direct" | "preview";
  rowDefaults?: RowDefaultDataItemValues;
  validators?: Record<string, CsvColumnValidator>;
}

const classBase = "vuuCsvUpload";

export const CsvUpload = (props: CsvUploadProps) => {
  const {
    children,
    dialogTitle = "Import CSV",
    embedded = false,
    onCancel,
    onClose,
    open,
  } = props;
  const isControlledOpen = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(open ?? true);

  const dialogOpen = isControlledOpen ? open : internalOpen;

  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-csv-upload",
    css,
    window: targetWindow,
  });

  const {
    canImport,
    cancelImport,
    isProcessingFile,
    isImporting,
    importData,
    onDrop,
    onTriggerChange,
    schema,
    validation,
    error,
  } = useCsvUpload(props);

  const errorsToRender = useMemo<CsvValidationStructuredError["errors"]>(() => {
    if (validation?.errors && validation.errors.length > 0) {
      return validation.errors;
    }
    const parseErrors =
      error?.errors.schemaError?.parseError?.errors ||
      error?.errors.validationError?.parseError?.errors;
    if (parseErrors && parseErrors.length > 0) {
      return parseErrors as CsvValidationStructuredError["errors"];
    }
    return [];
  }, [validation, error]);

  const parsedSchemaErrors = useMemo<string[]>(() => {
    const schemaErrorMsg =
      error?.errors.schemaError?.message ||
      error?.errors.validationError?.message;
    if (!schemaErrorMsg) return [];
    const cleanedMsg = schemaErrorMsg.replace(/^CSV validation failed:\s*/, "");
    return cleanedMsg
      .split(";")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }, [error]);

  const hasErrors = !!error || (validation && validation.errors.length > 0);
  const isUploaded = canImport || isImporting;
  const status = hasErrors ? "error" : isUploaded ? "success" : undefined;

  const handleCancel = useCallback(async () => {
    await cancelImport();
    if (!isControlledOpen) {
      setInternalOpen(false);
    }
    onCancel?.();
  }, [cancelImport, isControlledOpen, onCancel]);

  const handleImport = useCallback(async () => {
    if (await importData()) {
      onClose?.();
    }
  }, [importData, onClose]);

  const renderErrorsContent = useMemo(() => {
    if (error?.errors.importError) {
      return (
        <>
          <strong>Import failed</strong>
          <div className={`${classBase}-errorContainer`}>
            <div
              className={`${classBase}-errorItem ${classBase}-importErrorItem`}
            >
              {error.errors.importError.message}
            </div>
          </div>
        </>
      );
    }

    if (hasErrors) {
      const headingText = error
        ? "Validation failed"
        : "Your file contains errors";
      return (
        <>
          <strong>{headingText}</strong>
          <div className={`${classBase}-errorContainer`}>
            {errorsToRender.length > 0 ? (
              <ul className={`${classBase}-errorList`}>
                {errorsToRender.map((error, i) => (
                  <li
                    className={`${classBase}-errorItem`}
                    key={`${error.column}-${error.message}-${i}`}
                  >
                    {error.rowNum > 0 ? `Row ${error.rowNum}: ` : ""}
                    {error.column === "*" ? "" : `${error.column}: `}
                    {error.message}
                  </li>
                ))}
              </ul>
            ) : parsedSchemaErrors.length > 0 ? (
              <ul className={`${classBase}-errorList`}>
                {parsedSchemaErrors.map((errMsg) => (
                  <li className={`${classBase}-errorItem`} key={errMsg}>
                    {errMsg}
                  </li>
                ))}
              </ul>
            ) : (
              <div
                className={`${classBase}-errorItem ${classBase}-importErrorItem`}
              >
                {error?.errors.schemaError?.message ||
                  error?.errors.validationError?.message ||
                  "An unexpected error occurred during import"}
              </div>
            )}
          </div>
        </>
      );
    }

    return <div>Drop a file here or</div>;
  }, [error, hasErrors, errorsToRender, parsedSchemaErrors]);

  const content = (
    <div className={classBase}>
      <FileDropZone
        className={`${classBase}-dropZone`}
        disabled={schema === undefined || isProcessingFile || isImporting}
        onDrop={onDrop}
        status={status}
      >
        {isUploaded ? (
          <>
            <FileDropZoneIcon status="success" />
            <strong>Upload completed</strong>
          </>
        ) : (
          <>
            <FileDropZoneIcon status={hasErrors ? "error" : undefined} />
            {renderErrorsContent}
            {hasErrors && (
              <Text className={`${classBase}-rectifyPrompt`}>
                Please rectify and reupload
              </Text>
            )}
            <FileDropZoneTrigger
              accept=".csv,text/csv"
              onChange={onTriggerChange}
            >
              BROWSE FILES
            </FileDropZoneTrigger>
            <Text>Only .csv files</Text>
            {children}
          </>
        )}
      </FileDropZone>
    </div>
  );

  const actions = (
    <DialogActions>
      <Button
        appearance="solid"
        disabled={isImporting}
        sentiment="negative"
        onClick={handleCancel}
      >
        Cancel
      </Button>
      <Button
        disabled={!canImport}
        appearance="solid"
        sentiment="accented"
        onClick={handleImport}
      >
        {isProcessingFile
          ? "Validating..."
          : isImporting
            ? "Importing..."
            : "Import"}
      </Button>
    </DialogActions>
  );

  if (embedded) {
    return (
      <>
        {content}
        {actions}
      </>
    );
  }

  return (
    <Dialog open={dialogOpen}>
      <DialogHeader header={dialogTitle} />
      <DialogContent>{content}</DialogContent>
      {actions}
    </Dialog>
  );
};
