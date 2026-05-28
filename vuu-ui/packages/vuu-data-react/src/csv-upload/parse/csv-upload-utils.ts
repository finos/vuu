import type { RpcResult, VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { isRpcError } from "@vuu-ui/vuu-utils";
import type { CsvUploadError } from "../CsvUpload";
import type { CsvParseError } from "./csv-parse";
import { CSV_FIRST_DATA_ROW_NUMBER } from "./csv-constants";
import type {
  CsvValidationError,
  CsvValidationErrorType,
  CsvValidationResult,
} from "./csv-schema-validation";

export type CsvUploadTableData = {
  columns: string[];
  rows: VuuRowDataItemType[][];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export const isCsvParseError = (value: unknown): value is CsvParseError =>
  isRecord(value) &&
  "message" in value &&
  typeof value.message === "string" &&
  "errors" in value &&
  Array.isArray(value.errors) &&
  "errorMap" in value &&
  isRecord(value.errorMap);

export const hasFileParseErrors = (parseError: CsvParseError) =>
  Object.keys(parseError.errorMap.fileErrors).length > 0;

export const createUploadError = (
  source: CsvUploadError["source"],
  message: string,
  parseError?: CsvParseError,
  validationError?: CsvUploadError["validationError"],
): CsvUploadError => ({
  message,
  parseError,
  validationError,
  source,
});

export const mergeValidationWithParseErrors = (
  schemaValidation: CsvValidationResult,
  parseError: CsvParseError | undefined,
): CsvValidationResult =>
  parseError
    ? {
        ...schemaValidation,
        errors: [
          ...schemaValidation.errors,
          ...toValidationErrorsFromParseRowErrors(parseError),
        ],
        parseRowError: parseError,
      }
    : schemaValidation;

export const buildRowErrorMessage = (prefix: string, rowErrors: string[]) => {
  const details = rowErrors.slice(0, 8).join("; ");
  const remaining = rowErrors.length - 8;
  const suffix = remaining > 0 ? `; and ${remaining} more` : "";
  return `${prefix} for ${rowErrors.length} row(s): ${details}${suffix}`;
};

export const formatValidationErrors = (validation: CsvValidationResult) =>
  validation.errors.slice(0, 8).map(({ column, message, rowNum }) => {
    const rowLabel = rowNum === 1 ? "header" : `row ${rowNum}`;
    return `${rowLabel}, column '${column}': ${message}`;
  });

export const buildPreviewRows = (
  rows: Record<string, VuuRowDataItemType>[],
  columns: string[],
  validation: CsvValidationResult,
): VuuRowDataItemType[][] => {
  const errorsByRow = new Map<number, string[]>();

  validation.errors.forEach(({ column, message, rowNum }) => {
    if (rowNum < CSV_FIRST_DATA_ROW_NUMBER) {
      return;
    }
    const rowIndex = rowNum - CSV_FIRST_DATA_ROW_NUMBER;
    const existing = errorsByRow.get(rowIndex) ?? [];
    existing.push(`${column}: ${message}`);
    errorsByRow.set(rowIndex, existing);
  });

  return rows.map((row, index) => {
    const values = columns.map((column) => row[column] ?? "");
    const rowErrors = (errorsByRow.get(index) ?? []).join("; ");
    return [...values, rowErrors];
  });
};

export const buildPreviewTableData = (
  validation: CsvValidationResult,
): CsvUploadTableData => ({
  columns: [...validation.columns, "validationErrors"],
  rows: buildPreviewRows(validation.rows, validation.columns, validation),
});

export const toValidationErrorsFromParseRowErrors = (
  parseError: CsvParseError,
): CsvValidationError[] => {
  return parseError.errors.filter(
    (error) => error.rowNum >= CSV_FIRST_DATA_ROW_NUMBER,
  );
};

export const getValidatedRowNumbers = (validation: CsvValidationResult) => {
  const erroredRows = new Set<number>();

  validation.errors.forEach((error) => {
    if (error.rowNum >= CSV_FIRST_DATA_ROW_NUMBER) {
      erroredRows.add(error.rowNum);
    }
  });

  return validation.rows
    .map((_, index) => index + CSV_FIRST_DATA_ROW_NUMBER)
    .filter((row) => !erroredRows.has(row));
};

export const groupValidationErrorsByRow = (
  validation: CsvValidationResult,
): Array<{
  errorMap: Record<string, CsvValidationErrorType>;
  rowNum: number;
  rowData?: Record<string, VuuRowDataItemType>;
}> => {
  const groupedErrors = new Map<
    number,
    Record<string, CsvValidationErrorType>
  >();

  validation.errors.forEach((error) => {
    const rowErrors = groupedErrors.get(error.rowNum) ?? {};
    rowErrors[error.column] = error.errorEnum;
    groupedErrors.set(error.rowNum, rowErrors);
  });

  return Array.from(groupedErrors, ([rowNum, errorMap]) => ({
    errorMap,
    rowNum,
    rowData:
      rowNum >= CSV_FIRST_DATA_ROW_NUMBER
        ? validation.rows[rowNum - CSV_FIRST_DATA_ROW_NUMBER]
        : undefined,
  }));
};

export const normalizeTableData = (
  value: unknown,
  fallback: CsvUploadTableData,
): CsvUploadTableData => {
  const tableData =
    isRecord(value) && "data" in value ? (value.data as unknown) : value;

  if (!isRecord(tableData)) {
    return fallback;
  }

  const columns = tableData.columns;
  const rows = tableData.rows;

  if (
    !Array.isArray(columns) ||
    columns.some((column) => typeof column !== "string") ||
    !Array.isArray(rows)
  ) {
    return fallback;
  }

  return {
    columns,
    rows: rows.map((row) => {
      if (Array.isArray(row)) {
        return row as VuuRowDataItemType[];
      }
      if (!isRecord(row)) {
        return columns.map(() => "");
      }
      return columns.map((column) => (row[column] as VuuRowDataItemType) ?? "");
    }),
  };
};

export type RpcBatchResult = {
  errors: string[];
  results: unknown[];
};

export const executeBatchRpcCalls = async <T>(
  items: T[],
  executor: (item: T) => Promise<unknown>,
  errorFormatter: (item: T, error: string) => string,
): Promise<RpcBatchResult> => {
  const errors: string[] = [];
  const results: unknown[] = [];

  for (const item of items) {
    try {
      const result = await executor(item);
      const rpcResult = result as RpcResult | undefined;
      if (isRpcError(rpcResult)) {
        errors.push(errorFormatter(item, rpcResult.errorMessage));
      } else {
        results.push(result);
      }
    } catch (err) {
      errors.push(errorFormatter(item, toErrorMessage(err)));
    }
  }

  return { errors, results };
};
