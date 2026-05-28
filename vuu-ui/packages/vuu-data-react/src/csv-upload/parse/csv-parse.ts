import { parse } from "csv-parse/browser/esm/sync";
import {
  addCsvFileError,
  addCsvRowError,
  createCsvErrorState,
  hasCsvErrors,
  CsvParseErrorEnum,
  type CsvStructuredError,
  type CsvParseError,
  type CsvParseErrorMap,
} from "./csv-errors";
import {
  CSV_FIRST_DATA_ROW_NUMBER,
  CSV_HEADER_ROW_NUMBER,
} from "./csv-constants";

export {
  CsvParseErrorEnum,
  type CsvError,
  type CsvErrorMap,
  type CsvStructuredError,
  type CsvParseError,
  type CsvParseErrorMap,
} from "./csv-errors";

export type CsvParseResult = {
  error?: CsvParseError;
  header: string[];
  rows: string[][];
};

export type CsvParseOptions = {
  requireQuotedValues?: boolean;
};

const normaliseLineEndings = (input: string) =>
  input
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

const quotedCsvLinePattern = /^\s*"(?:""|[^"])*"\s*(,\s*"(?:""|[^"])*"\s*)*$/;

const withError = (
  message: string,
  errorMap: CsvParseErrorMap,
  errors: CsvStructuredError<CsvParseErrorEnum>[],
  header: string[] = [],
  rows: string[][] = [],
): CsvParseResult => ({
  error: { errorMap, errors, message },
  header,
  rows,
});

export const parseCsv = (
  csvText: string,
  options?: CsvParseOptions,
): CsvParseResult => {
  const errorState = createCsvErrorState<CsvParseErrorEnum>();
  const text = normaliseLineEndings(csvText);

  if (text.trim().length === 0) {
    addCsvFileError(
      errorState,
      "*",
      CsvParseErrorEnum.EMPTY_FILE,
      "CSV file is empty.",
    );
    return withError(
      "CSV file is empty.",
      errorState.errorMap,
      errorState.errors,
    );
  }

  const allLines = text.split("\n");
  const nonEmptyLines = allLines.filter((line) => line.trim().length > 0);

  if (nonEmptyLines.length === 0) {
    addCsvFileError(
      errorState,
      "*",
      CsvParseErrorEnum.EMPTY_FILE,
      "CSV file is empty.",
    );
    return withError(
      "CSV file is empty.",
      errorState.errorMap,
      errorState.errors,
    );
  }

  const firstLine = nonEmptyLines[0];
  if (firstLine.includes(";") && !firstLine.includes(",")) {
    addCsvFileError(
      errorState,
      "*",
      CsvParseErrorEnum.INVALID_SEPARATOR,
      "CSV must use comma separators.",
      firstLine,
    );
    return withError(
      "CSV must use comma separators.",
      errorState.errorMap,
      errorState.errors,
    );
  }

  if (options?.requireQuotedValues === true) {
    nonEmptyLines.forEach((line, lineIndex) => {
      if (!quotedCsvLinePattern.test(line)) {
        if (lineIndex === 0) {
          addCsvFileError(
            errorState,
            "*",
            CsvParseErrorEnum.UNQUOTED_VALUE,
            "CSV values must be enclosed in double quotes.",
            line,
          );
        } else {
          addCsvRowError(
            errorState,
            lineIndex + CSV_HEADER_ROW_NUMBER,
            "*",
            CsvParseErrorEnum.UNQUOTED_VALUE,
            "CSV values must be enclosed in double quotes.",
            line,
          );
        }
      }
    });

    if (hasCsvErrors(errorState.errorMap)) {
      return withError(
        "CSV values must be enclosed in double quotes.",
        errorState.errorMap,
        errorState.errors,
      );
    }
  }

  let records: string[][];
  try {
    records = parse(text, {
      bom: true,
      delimiter: ",",
      escape: '"',
      quote: '"',
      relax_column_count: true,
      skip_empty_lines: true,
    }) as string[][];
  } catch (err) {
    addCsvFileError(
      errorState,
      "*",
      CsvParseErrorEnum.INVALID_FORMAT,
      err instanceof Error ? err.message : "Invalid CSV format.",
    );
    return withError(
      "Invalid CSV format.",
      errorState.errorMap,
      errorState.errors,
    );
  }

  if (records.length === 0) {
    addCsvFileError(
      errorState,
      "*",
      CsvParseErrorEnum.EMPTY_FILE,
      "CSV file is empty.",
    );
    return withError(
      "CSV file is empty.",
      errorState.errorMap,
      errorState.errors,
    );
  }

  const header = records[0].map((value) => value.trim());
  if (header.length === 0) {
    addCsvFileError(
      errorState,
      "*",
      CsvParseErrorEnum.EMPTY_HEADER_COLUMN,
      "CSV header contains empty column names.",
    );
  }

  header.forEach((col, columnIndex) => {
    if (col.length === 0) {
      addCsvFileError(
        errorState,
        `column_${columnIndex + 1}`,
        CsvParseErrorEnum.EMPTY_HEADER_COLUMN,
        "CSV header contains empty column names.",
      );
    }
  });

  if (hasCsvErrors(errorState.errorMap)) {
    return withError(
      "CSV header contains empty column names.",
      errorState.errorMap,
      errorState.errors,
    );
  }

  const duplicateHeader = header.find(
    (col, idx) => header.indexOf(col) !== idx,
  );
  if (duplicateHeader) {
    addCsvFileError(
      errorState,
      duplicateHeader,
      CsvParseErrorEnum.DUPLICATE_HEADER_COLUMN,
      `CSV header contains duplicate column '${duplicateHeader}'.`,
      duplicateHeader,
    );
    return withError(
      `CSV header contains duplicate column '${duplicateHeader}'.`,
      errorState.errorMap,
      errorState.errors,
      header,
      [],
    );
  }

  const rows = records.slice(1);

  rows.forEach((row, rowIndex) => {
    if (row.length !== header.length) {
      addCsvRowError(
        errorState,
        rowIndex + CSV_FIRST_DATA_ROW_NUMBER,
        "*",
        CsvParseErrorEnum.ROW_COLUMN_COUNT_MISMATCH,
        "CSV rows must have the same number of columns as the header.",
        row.join(","),
      );
    }
  });

  if (hasCsvErrors(errorState.errorMap)) {
    return withError(
      "CSV rows must have the same number of columns as the header.",
      errorState.errorMap,
      errorState.errors,
      header,
      rows,
    );
  }

  return { header, rows };
};
