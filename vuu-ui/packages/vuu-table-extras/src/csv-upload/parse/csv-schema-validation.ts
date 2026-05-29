import type { TableSchema } from "@vuu-ui/vuu-data-types";
import { getTypedValue } from "@vuu-ui/vuu-utils";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import {
  addCsvFileError,
  addCsvRowError,
  createCsvErrorState,
  CsvValidationErrorEnum,
} from "./csv-errors";
import type {
  CsvValidationError,
  CsvValidationErrorMap,
  CsvParseError,
} from "./csv-errors";
import type { CsvParseResult } from "./csv-parse";
import { CSV_FIRST_DATA_ROW_NUMBER } from "./csv-constants";
import type { VuuColumnDataType } from "@vuu-ui/vuu-protocol-types";
import type { DataValueTypeSimple } from "@vuu-ui/vuu-data-types";

export {
  CsvValidationErrorEnum,
  type CsvValidationError,
  type CsvValidationErrorMap,
  type CsvValidationErrorType,
  type CsvValidationStructuredError,
} from "./csv-errors";

export type CsvValidationResult = {
  columns: string[];
  errorMap: CsvValidationErrorMap;
  errors: CsvValidationError[];
  parseRowError?: CsvParseError;
  rows: Record<string, VuuRowDataItemType>[];
};

export type CsvValidationOptions = {
  maxRows?: number;
};

const MAX_ROWS_IN_CSV = 25000;

export const validateCsvAgainstSchema = (
  parsed: CsvParseResult,
  tableSchema: TableSchema,
  options?: CsvValidationOptions,
): CsvValidationResult => {
  const schemaColumns = new Map(
    tableSchema.columns.map((col) => [col.name, col.serverDataType] as const),
  );
  const maxRows = options?.maxRows ?? MAX_ROWS_IN_CSV;
  const errorState = createCsvErrorState<CsvValidationErrorEnum>();

  if (!parsed.header.includes(tableSchema.key)) {
    addCsvFileError(
      errorState,
      tableSchema.key,
      CsvValidationErrorEnum.MISSING_KEY_COLUMN,
      `CSV must include key column '${tableSchema.key}'.`,
    );
  }

  parsed.header.forEach((column) => {
    if (!schemaColumns.has(column)) {
      addCsvFileError(
        errorState,
        column,
        CsvValidationErrorEnum.UNKNOWN_COLUMN,
        "Column is not present in table schema.",
        column,
      );
    }
  });

  if (parsed.rows.length > maxRows) {
    addCsvFileError(
      errorState,
      "*",
      CsvValidationErrorEnum.MAX_ROWS_EXCEEDED,
      `CSV row count ${parsed.rows.length} exceeds maxRows ${maxRows}.`,
      String(parsed.rows.length),
    );
  }

  const typedRows: Record<string, VuuRowDataItemType>[] = [];

  parsed.rows.forEach((rowValues, rowIndex) => {
    const rowNum = rowIndex + CSV_FIRST_DATA_ROW_NUMBER;
    const typedRow: Record<string, VuuRowDataItemType> = {};

    parsed.header.forEach((columnName, columnIndex) => {
      const rawValue = rowValues[columnIndex];
      const schemaType = schemaColumns.get(columnName);

      if (rawValue.length === 0 && schemaType !== "string") {
        addCsvRowError(
          errorState,
          rowNum,
          columnName,
          CsvValidationErrorEnum.EMPTY_NON_STRING_VALUE,
          "Empty value is not allowed for non-string columns.",
          rawValue,
        );
        return;
      }

      let value: VuuRowDataItemType | undefined;
      const toType = (schemaType ?? "string") as
        | VuuColumnDataType
        | DataValueTypeSimple;
      try {
        value = getTypedValue(rawValue, toType);
      } catch (err) {
        addCsvRowError(
          errorState,
          rowNum,
          columnName,
          CsvValidationErrorEnum.TYPE_MISMATCH,
          err instanceof Error ? err.message : String(err),
          rawValue,
        );
        return;
      }
      if (value === undefined) {
        addCsvRowError(
          errorState,
          rowNum,
          columnName,
          CsvValidationErrorEnum.TYPE_MISMATCH,
          `Value '${rawValue}' is not a valid ${toType}`,
          rawValue,
        );
        return;
      }
      typedRow[columnName] = value;
    });

    typedRows.push(typedRow);
  });

  return {
    columns: parsed.header,
    errorMap: errorState.errorMap,
    errors: errorState.errors,
    rows: typedRows,
  };
};
