import { CSV_HEADER_ROW_NUMBER } from "./csv-constants";

export enum CsvParseErrorEnum {
  EMPTY_FILE = "EMPTY_FILE",
  INVALID_SEPARATOR = "INVALID_SEPARATOR",
  INVALID_FORMAT = "INVALID_FORMAT",
  UNQUOTED_VALUE = "UNQUOTED_VALUE",
  EMPTY_HEADER_COLUMN = "EMPTY_HEADER_COLUMN",
  DUPLICATE_HEADER_COLUMN = "DUPLICATE_HEADER_COLUMN",
  ROW_COLUMN_COUNT_MISMATCH = "ROW_COLUMN_COUNT_MISMATCH",
}

export enum CsvValidationErrorEnum {
  MISSING_KEY_COLUMN = "MISSING_KEY_COLUMN",
  UNKNOWN_COLUMN = "UNKNOWN_COLUMN",
  MAX_ROWS_EXCEEDED = "MAX_ROWS_EXCEEDED",
  EMPTY_NON_STRING_VALUE = "EMPTY_NON_STRING_VALUE",
  TYPE_MISMATCH = "TYPE_MISMATCH",
}

export type CsvErrorMap<TError extends string> = {
  rowErrors: Record<number, Record<string, TError[]>>;
  fileErrors: Record<string, TError[]>;
};

export type CsvStructuredError<TError extends string> = {
  rowNum: number;
  column: string;
  value: string;
  message: string;
  errorEnum: TError;
};

export type CsvError<TError extends string> = {
  errorMap: CsvErrorMap<TError>;
  errors: CsvStructuredError<TError>[];
  message: string;
};

export type CsvErrorState<TError extends string> = {
  errorMap: CsvErrorMap<TError>;
  errors: CsvStructuredError<TError>[];
};

export const createCsvErrorState = <
  TError extends string,
>(): CsvErrorState<TError> => ({
  errorMap: {
    rowErrors: {},
    fileErrors: {},
  },
  errors: [],
});

export const addCsvFileError = <TError extends string>(
  state: CsvErrorState<TError>,
  columnName: string,
  error: TError,
  message: string,
  value = "",
) => {
  const existing = state.errorMap.fileErrors[columnName] ?? [];
  existing.push(error);
  state.errorMap.fileErrors[columnName] = existing;
  state.errors.push({
    rowNum: CSV_HEADER_ROW_NUMBER,
    column: columnName,
    value,
    message,
    errorEnum: error,
  });
};

export const addCsvRowError = <TError extends string>(
  state: CsvErrorState<TError>,
  rowNum: number,
  columnName: string,
  error: TError,
  message: string,
  value = "",
) => {
  const rowErrors = state.errorMap.rowErrors[rowNum] ?? {};
  const existing = rowErrors[columnName] ?? [];
  existing.push(error);
  rowErrors[columnName] = existing;
  state.errorMap.rowErrors[rowNum] = rowErrors;
  state.errors.push({
    rowNum,
    column: columnName,
    value,
    message,
    errorEnum: error,
  });
};

export const hasCsvErrors = <TError extends string>(
  errorMap: CsvErrorMap<TError>,
) =>
  Object.keys(errorMap.fileErrors).length > 0 ||
  Object.keys(errorMap.rowErrors).length > 0;

export type CsvParseErrorMap = CsvErrorMap<CsvParseErrorEnum>;
export type CsvParseError = CsvError<CsvParseErrorEnum>;

export type CsvValidationErrorType = CsvValidationErrorEnum | CsvParseErrorEnum;

export type CsvValidationErrorMap = CsvErrorMap<CsvValidationErrorEnum>;
export type CsvValidationStructuredError = CsvError<CsvValidationErrorType>;
export type CsvValidationError = CsvStructuredError<CsvValidationErrorType>;
