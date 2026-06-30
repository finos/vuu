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
import type { DataSource } from "@vuu-ui/vuu-data-types";
import type { VuuTable } from "@vuu-ui/vuu-protocol-types";
import type { CsvParseError, CsvParseOptions } from "./parse/csv-parse";
import type { CsvValidationStructuredError } from "./parse/csv-schema-validation";
import type { CsvUploadTableData } from "./parse/csv-upload-utils";
import { useCsvUpload } from "./useCsvUpload";
import css from "./CsvUpload.css";

export type CsvUploadImportedResult = {
  rpcResult: unknown;
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
  onEditSessionStarted?: (dataSource: DataSource) => void;
  onEditSessionEnded?: (result: CsvUploadSessionEndResult) => void;
  onError?: (result: CsvUploadErrorResult | undefined) => void;
  onImported?: (result: CsvUploadImportedResult) => void;
  onProcessingStarted?: () => void;
  dialogTitle?: string;
  maxRows?: number;
  onCancel?: () => void;
  onClose?: () => void;
  open?: boolean;
  parseOptions?: CsvParseOptions;
}

const classBase = "vuuCsvUpload";

export const CsvUpload = (props: CsvUploadProps) => {
  const {
    children,
    dialogTitle = "Import CSV",
    onCancel,
    onClose,
    open,
  } = props;
  const isControlledOpen = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(open ?? true);

  const handleCancel = useCallback(() => {
    if (!isControlledOpen) {
      setInternalOpen(false);
    }
    onCancel?.();
  }, [isControlledOpen, onCancel]);

  const dialogOpen = isControlledOpen ? open : internalOpen;

  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-csv-upload",
    css,
    window: targetWindow,
  });

  const {
    canImport,
    isProcessingFile,
    isImporting,
    importData,
    onDrop,
    onTriggerChange,
    schema,
    validation,
  } = useCsvUpload(props);

  const handleImport = useCallback(async () => {
    await importData();
    onClose?.();
  }, [importData, onClose]);

  return (
    <Dialog open={dialogOpen}>
      <DialogHeader header={dialogTitle} />
      <DialogContent>
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
                <div> Please rectify and reupload</div>
              </>
            ) : (
              <div>Drop a file here or</div>
            )}
            <FileDropZoneTrigger
              accept=".csv,text/csv"
              onChange={onTriggerChange}
            >
              BROWSE FILES
            </FileDropZoneTrigger>
          </FileDropZone>
          {children}
        </div>
      </DialogContent>
      <DialogActions>
        <Button appearance="solid" sentiment="negative" onClick={handleCancel}>
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
    </Dialog>
  );
};
