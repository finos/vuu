import {
  Banner,
  BannerContent,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogHeader,
  Spinner,
  StackLayout,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Text,
} from "@salt-ds/core";
import type { DataSource } from "@vuu-ui/vuu-data-types";
import {
  CSV_FIRST_DATA_ROW_NUMBER,
  type CsvUploadErrorResult,
  type CsvValidationError,
  useCsvUpload,
} from "@vuu-ui/vuu-table-extras";
import {
  type ChangeEvent,
  type ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  limitsCsvValidators,
  limitsImportSchema,
} from "./trader-limits-config";

/** The CSV header is line 1, so data row n is line n + 1. */
const lineNumber = (rowNum: number) => rowNum + 1;

/**
 * Errors against data rows, one per row and message. useCsvUpload also
 * reports the vuuMsg of every staged row as a row error (column "*"),
 * including the rows it staged for client-side errors, sometimes twice.
 * Those repeat an error already listed against a column.
 */
const toRowErrors = (errors: CsvValidationError[]) => {
  const columnErrorRows = new Set(
    errors.filter(({ column }) => column !== "*").map(({ rowNum }) => rowNum),
  );
  const seen = new Set<string>();
  return errors.filter(({ column, message, rowNum }) => {
    if (rowNum < CSV_FIRST_DATA_ROW_NUMBER) {
      return false;
    }
    if (column === "*" && columnErrorRows.has(rowNum)) {
      return false;
    }
    const id = `${rowNum}:${column}:${message}`;
    if (seen.has(id)) {
      return false;
    }
    seen.add(id);
    return true;
  });
};

/** An error that is not against a data row: the file, or the import. */
const generalErrorMessage = (error: CsvUploadErrorResult | undefined) => {
  const { importError, schemaError, validationError } = error?.errors ?? {};
  if (importError) {
    return {
      message: importError.message.replace(
        /^RPC import failed:\s*(Error:\s*)?/,
        "",
      ),
      title: "The limits were not imported.",
    };
  }
  const message = (schemaError ?? validationError)?.message.replace(
    /^(CSV validation|Validation) failed:\s*/,
    "",
  );
  return message === undefined
    ? undefined
    : { message, title: "The file could not be read." };
};

export interface LimitsImportHookResult {
  /** The file input and the import dialog. Render once. */
  importElements: ReactNode;
  /** Opens the file chooser. The dialog opens once a file is chosen. */
  chooseFile: () => void;
}

/**
 * Import limits from a CSV file. The user chooses a file, which is validated
 * and staged on the server, then the dialog shows the outcome: Upload
 * completed, with Import to apply the rows, or the errors to fix.
 */
export const useLimitsImport = (
  dataSource: DataSource,
): LimitsImportHookResult => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);

  const {
    canImport,
    cancelImport,
    error,
    importData,
    isImporting,
    isProcessingFile,
    onTriggerChange,
    validation,
  } = useCsvUpload({
    dataSource,
    importSchema: limitsImportSchema,
    validators: limitsCsvValidators,
  });

  const chooseFile = useCallback(() => inputRef.current?.click(), []);

  const handleFileChange = useCallback(
    (evt: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(evt.target.files ?? []);
      // Clear the input, so choosing the same file again (once it has been
      // fixed) is still a change.
      evt.target.value = "";
      if (files.length > 0) {
        setOpen(true);
        onTriggerChange(evt, files);
      }
    },
    [onTriggerChange],
  );

  const handleCancel = useCallback(async () => {
    await cancelImport();
    setOpen(false);
  }, [cancelImport]);

  const handleImport = useCallback(async () => {
    if (await importData()) {
      setOpen(false);
    }
  }, [importData]);

  const rowErrors = useMemo(
    () => toRowErrors(validation?.errors ?? []),
    [validation],
  );
  const generalError =
    rowErrors.length === 0 ? generalErrorMessage(error) : undefined;
  const hasErrors = rowErrors.length > 0 || generalError !== undefined;

  const content = isProcessingFile ? (
    <StackLayout align="center" direction="row" gap={1}>
      <Spinner size="small" aria-label="Validating" />
      <Text>Validating file…</Text>
    </StackLayout>
  ) : generalError !== undefined ? (
    <Banner status="error" data-testid="import-general-error">
      <BannerContent>
        <Text>
          <strong>{generalError.title}</strong> {generalError.message}
        </Text>
        <Text>Fix the file and import it again.</Text>
      </BannerContent>
    </Banner>
  ) : rowErrors.length > 0 ? (
    <StackLayout gap={1}>
      <Banner status="error">
        <BannerContent>
          {rowErrors.length === 1
            ? "1 error was found"
            : `${rowErrors.length} errors were found`}{" "}
          in the file. Fix the lines below and import it again.
        </BannerContent>
      </Banner>
      <div className="TraderLimits-importErrors">
        <Table data-testid="import-row-errors">
          <THead>
            <TR>
              <TH>Line</TH>
              <TH>Column</TH>
              <TH>Error</TH>
            </TR>
          </THead>
          <TBody>
            {rowErrors.map(({ column, message, rowNum }, i) => (
              <TR key={`${rowNum}-${column}-${i}`}>
                <TD>{lineNumber(rowNum)}</TD>
                <TD>{column === "*" ? "" : column}</TD>
                <TD>{message}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </StackLayout>
  ) : canImport || isImporting ? (
    <Banner status="success" data-testid="import-upload-completed">
      <BannerContent>
        <strong>Upload completed.</strong>{" "}
        {validation?.rows.length === 1
          ? "1 limit is ready to import."
          : `${validation?.rows.length ?? 0} limits are ready to import.`}
      </BannerContent>
    </Banner>
  ) : null;

  const importElements = (
    <>
      <input
        accept=".csv,text/csv"
        data-testid="import-file-input"
        hidden
        onChange={handleFileChange}
        ref={inputRef}
        type="file"
      />
      <Dialog
        open={open}
        size="medium"
        status={hasErrors ? "error" : undefined}
      >
        <DialogHeader header="Import limits" />
        <DialogContent>{content}</DialogContent>
        <DialogActions>
          {hasErrors ? (
            <Button disabled={isProcessingFile} onClick={chooseFile}>
              Choose file
            </Button>
          ) : null}
          <Button disabled={isImporting} onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            appearance="solid"
            disabled={!canImport || isImporting}
            onClick={handleImport}
            sentiment="accented"
          >
            {isImporting ? "Importing…" : "Import"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );

  return { chooseFile, importElements };
};
