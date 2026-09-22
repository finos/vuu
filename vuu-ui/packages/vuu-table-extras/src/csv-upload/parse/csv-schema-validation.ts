import type { TableSchema, SchemaColumn } from "@vuu-ui/vuu-data-types";
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
import { CSV_FIRST_DATA_ROW_NUMBER, MAX_ROWS_IN_CSV } from "./csv-constants";
import type { VuuColumnDataType } from "@vuu-ui/vuu-protocol-types";
import type { DataValueTypeSimple } from "@vuu-ui/vuu-data-types";

export {
  CsvValidationErrorEnum,
  type CsvValidationError,
  type CsvValidationErrorMap,
  type CsvValidationErrorType,
  type CsvValidationStructuredError,
} from "./csv-errors";

export interface ImportSchemaColumn extends SchemaColumn {
  required?: boolean;
}

export interface ImportTableSchema extends Omit<TableSchema, "columns"> {
  readonly columns: readonly ImportSchemaColumn[];
}

export type CsvColumnValidator = (
  value: string,
  columnName: string,
  row: Record<string, string>,
) => boolean | string;

export type CsvValidationResult = {
  columns: string[];
  errorMap: CsvValidationErrorMap;
  errors: CsvValidationError[];
  parseRowError?: CsvParseError;
  rows: Record<string, VuuRowDataItemType>[];
};

export type CsvValidationOptions = {
  maxRows?: number;
  validators?: Record<string, CsvColumnValidator>;
};

const INTERNAL_KEY_COLUMNS = new Set(["vuuRowNum"]);

const getFriendlyTypeName = (type: string): string => {
  switch (type) {
    case "int":
    case "long":
      return "whole number";
    case "double":
    case "number":
    case "decimal":
    case "scaleddecimal":
    case "scaleddecimal2":
    case "scaleddecimal4":
    case "scaleddecimal6":
    case "scaleddecimal8":
      return "decimal or number";
    case "time":
      return "time in 'HH:MM:SS' format";
    case "epochtimestamp":
    case "epochtimestampnano":
    case "date/time":
      return "date/time";
    case "char":
      return "single character";
    case "boolean":
      return "boolean (true/false)";
    case "json":
      return "JSON value";
    default:
      return type;
  }
};

const getFriendlyErrorMessage = (
  errMessage: string,
  rawValue: string,
  toType: string,
): string => {
  if (errMessage.includes("is not a valid")) {
    return `'${rawValue}' is not a valid ${getFriendlyTypeName(toType)}`;
  }
  return errMessage;
};

export const validateCsvAgainstSchema = (
  parsed: CsvParseResult,
  tableSchema: TableSchema | ImportTableSchema,
  options?: CsvValidationOptions,
): CsvValidationResult => {
  const schemaColumns = new Map(
    tableSchema.columns.map((col) => [col.name, col] as const),
  );
  const maxRows = options?.maxRows ?? MAX_ROWS_IN_CSV;
  const errorState = createCsvErrorState<CsvValidationErrorEnum>();

  if (
    tableSchema.key &&
    !INTERNAL_KEY_COLUMNS.has(tableSchema.key) &&
    !parsed.header.includes(tableSchema.key)
  ) {
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
        `Column ${column} is not present in table schema.`,
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
    const rawRow = parsed.header.reduce<Record<string, string>>(
      (acc, headerCol, idx) => {
        acc[headerCol] = rowValues[idx] ?? "";
        return acc;
      },
      {},
    );

    parsed.header.forEach((columnName, columnIndex) => {
      const rawValue = rowValues[columnIndex] ?? "";
      const schemaColumn = schemaColumns.get(columnName);
      const schemaType = schemaColumn?.serverDataType;
      const isRequired = schemaColumn?.required === true;

      if (rawValue.length === 0) {
        if (isRequired) {
          addCsvRowError(
            errorState,
            rowNum,
            columnName,
            CsvValidationErrorEnum.REQUIRED_FIELD_MISSING,
            "This field is required and cannot be left blank",
            rawValue,
          );
        }
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
          getFriendlyErrorMessage(
            err instanceof Error ? err.message : String(err),
            rawValue,
            toType,
          ),
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
          `'${rawValue}' is not a valid ${getFriendlyTypeName(toType)}`,
          rawValue,
        );
        return;
      }

      const customValidator = options?.validators?.[columnName];
      if (customValidator) {
        const validationResult = customValidator(rawValue, columnName, rawRow);
        if (validationResult !== true) {
          addCsvRowError(
            errorState,
            rowNum,
            columnName,
            CsvValidationErrorEnum.CUSTOM_VALIDATION,
            typeof validationResult === "string"
              ? validationResult
              : `Value '${rawValue}' failed custom validation.`,
            rawValue,
          );
          return;
        }
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
