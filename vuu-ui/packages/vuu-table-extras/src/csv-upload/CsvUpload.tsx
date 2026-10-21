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
import type {
  CsvUploadTableData,
  CsvHeaderMapping,
} from "./parse/csv-upload-utils";
import { useCsvUpload } from "./useCsvUpload";
import css from "./CsvUpload.css";

export type CsvUploadImportedResult = {
  /** Normalized table column names and 2D row data imported into the table. */
  tableData: CsvUploadTableData;
};

export type CsvUploadPreviewResult = {
  /** The live session DataSource containing the staged rows. */
  dataSource: DataSource;
  /** The active EditSession managing the staged import. */
  editSession: EditSession;
  /** Normalized table column names and 2D row data staged for import. */
  tableData: CsvUploadTableData;
};

export type CsvUploadErrors = {
  /** Error when CSV columns do not match the target or import table schema. */
  schemaError?: CsvUploadError;
  /** Error when CSV syntax or cell values fail type coercion or custom validation. */
  validationError?: CsvUploadError;
  /** Error during server-side row staging or session commitment. */
  importError?: CsvUploadError;
};

export type CsvUploadError = {
  /** Human-readable error description. */
  message: string;
  /** Raw CSV parser error details, if the failure occurred during file parsing. */
  parseError?: CsvParseError;
  /** Structured validation error map, if the failure occurred during schema/row validation. */
  validationError?: CsvValidationStructuredError;
  /** Origin phase of the error. */
  source: "schema" | "validation" | "import";
};

export type CsvUploadErrorResult = {
  /** Container of populated upload errors by category. */
  errors: CsvUploadErrors;
};

export type CsvUploadSessionTable = VuuTable;

export type CsvUploadSessionEndReason = "saved" | "discarded" | "failed";

export type CsvUploadSessionEndResult = {
  /** Outcome reason for ending the session: `"saved"`, `"discarded"`, or `"failed"`. */
  reason: CsvUploadSessionEndReason;
  /** The Vuu session table descriptor that was closed, if one was active. */
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
  /** Optional content rendered below the drop zone inside the dialog content area (e.g., error preview table). */
  children?: ReactNode;
  /**
   * The Vuu DataSource for the target table. Must be subscribed (`status: "subscribed"`)
   * and support session creation, row insertion, and edit session completion.
   */
  dataSource: DataSource;
  /** Renders the upload content inline without a Dialog wrapper. Defaults to `false`. */
  embedded?: boolean;
  /**
   * Schema of the import table, where it differs from the target table. Used to validate
   * the CSV and to determine the session datasource columns. If omitted and importTable is
   * provided, the schema is fetched via getTableSchema. Pass a stable reference.
   */
  importSchema?: TableSchema;
  /** Expected import table, used to validate the session table returned by the server. */
  importTable?: VuuTable;
  /** Fired when the server-side session is fully hydrated and a preview session DataSource is available. */
  onImportSessionReady?: (dataSource: DataSource) => void;
  /** Fired when the import session ends (whether by save, discard, or failure). */
  onImportSessionEnded?: (result: CsvUploadSessionEndResult) => void;
  /** Fired when any error occurs, or called with `undefined` when errors are cleared. */
  onError?: (result: CsvUploadErrorResult | undefined) => void;
  /** Fired after a successful import commit with the normalized imported table data. */
  onImported?: (result: CsvUploadImportedResult) => void;
  /** In preview mode, fired when Import is pressed with the active EditSession and session DataSource. */
  onPreview?: (result: CsvUploadPreviewResult) => void;
  /** Fired when file parsing and validation starts. */
  onProcessingStarted?: () => void;
  /** Header title text displayed in the dialog header. Defaults to `"Import CSV"`. */
  dialogTitle?: string;
  /** Maximum number of data rows permitted in the uploaded CSV. Defaults to `10000`. */
  maxRows?: number;
  /** Fired when the user clicks Cancel. */
  onCancel?: () => void;
  /** Fired after a successful import has completed. */
  onClose?: () => void;
  /** Controls dialog open state. When provided, the dialog is fully controlled. */
  open?: boolean;
  /** Parser configuration options such as requiring quotes or custom headers. */
  parseOptions?: CsvParseOptions;
  /** Optional custom header columns to use instead of reading headers from the CSV file. */
  customHeaders?: string[];
  /** Whether the CSV contains a header row. Defaults to true. When false and customHeaders is provided, row 0 is treated as data. */
  hasHeaderRow?: boolean;
  /** Optional mapping or resolver function from CSV header column names to schema column names. */
  headerMapping?: CsvHeaderMapping;
  /** Import mode: `"direct"` commits immediately on Import; `"preview"` returns the session via `onPreview`. Defaults to `"direct"`. */
  importMode?: "direct" | "preview";
  /** Default column values merged into rows where a column is omitted in the CSV. Pass a stable reference. */
  rowDefaults?: RowDefaultDataItemValues;
  /** Custom per-column validation functions. */
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
