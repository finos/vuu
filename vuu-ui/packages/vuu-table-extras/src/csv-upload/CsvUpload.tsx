import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogHeader,
  FileDropZone,
  FileDropZoneIcon,
  FileDropZoneTrigger,
} from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { type ReactNode, useCallback, useState } from "react";
import type { RowDefaultDataItemValues, EditSession } from "@vuu-ui/vuu-data-editing";
import type { CsvParseError, CsvParseOptions } from "./parse/csv-parse";
import type { CsvValidationStructuredError } from "./parse/csv-schema-validation";
import type { DataSource } from "@vuu-ui/vuu-data-types";
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
  onImportSessionStarted?: (dataSource: DataSource) => void;
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
  } = useCsvUpload(props);

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

  const content = (
    <div className={classBase}>
      <FileDropZone
        className={`${classBase}-dropZone`}
        disabled={schema === undefined || isProcessingFile || isImporting}
        onDrop={onDrop}
        status={
          validation && validation.errors.length > 0 ? "error" : undefined
        }
      >
        <FileDropZoneIcon />
        {validation && validation.errors.length > 0 ? (
          <>
            <div>Your file contains errors</div>
            <ul className={`${classBase}-errorList`}>
              {validation.errors
                .filter((e) => e.column in validation.errorMap.fileErrors)
                .map((error, i) => (
                  <li className={`${classBase}-errorItem`} key={i}>
                    {error.message}
                  </li>
                ))}
            </ul>
            <div>Please rectify and reupload</div>
          </>
        ) : (
          <div>Drop a file here or</div>
        )}
        <FileDropZoneTrigger accept=".csv,text/csv" onChange={onTriggerChange}>
          BROWSE FILES
        </FileDropZoneTrigger>
      </FileDropZone>
      {children}
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
