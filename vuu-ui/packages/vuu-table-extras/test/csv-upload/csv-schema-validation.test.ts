import { describe, expect, it } from "vitest";
import {
  validateCsvAgainstSchema,
  CsvValidationErrorEnum,
} from "../../src/csv-upload/parse/csv-schema-validation";
import type { TableSchema } from "@vuu-ui/vuu-data-types";
import type { CsvParseResult } from "../../src/csv-upload/parse/csv-parse";

const makeSchema = (overrides: Partial<TableSchema> = {}): TableSchema =>
  ({
    key: "id",
    columns: [
      { name: "id", serverDataType: "string" },
      { name: "count", serverDataType: "int" },
      { name: "price", serverDataType: "double" },
      { name: "label", serverDataType: "string" },
    ],
    table: { module: "TEST", table: "items" },
    ...overrides,
  }) as unknown as TableSchema;

const makeParsed = (header: string[], rows: string[][]): CsvParseResult => ({
  header,
  rows,
});

describe("validateCsvAgainstSchema", () => {
  it("passes a valid CSV with no errors", () => {
    const result = validateCsvAgainstSchema(
      makeParsed(
        ["id", "count", "price", "label"],
        [
          ["a1", "10", "1.5", "foo"],
          ["a2", "20", "2.5", "bar"],
        ],
      ),
      makeSchema(),
    );

    expect(result.errors).toHaveLength(0);
    expect(result.rows).toEqual([
      { id: "a1", count: 10, price: 1.5, label: "foo" },
      { id: "a2", count: 20, price: 2.5, label: "bar" },
    ]);
  });

  it("adds a file error when the key column is absent from the CSV header", () => {
    const result = validateCsvAgainstSchema(
      makeParsed(["count", "label"], [["10", "foo"]]),
      makeSchema(),
    );

    expect(result.errorMap.fileErrors["id"]).toContain(
      CsvValidationErrorEnum.MISSING_KEY_COLUMN,
    );
  });

  it("adds a file error for each column that is not in the schema", () => {
    const result = validateCsvAgainstSchema(
      makeParsed(["id", "unknown_col"], [["a1", "val"]]),
      makeSchema(),
    );

    expect(result.errorMap.fileErrors["unknown_col"]).toContain(
      CsvValidationErrorEnum.UNKNOWN_COLUMN,
    );
  });

  it("adds a file error when row count exceeds maxRows", () => {
    const result = validateCsvAgainstSchema(
      makeParsed(
        ["id", "label"],
        [
          ["a1", "foo"],
          ["a2", "bar"],
          ["a3", "baz"],
        ],
      ),
      makeSchema(),
      { maxRows: 2 },
    );

    expect(result.errorMap.fileErrors["*"]).toContain(
      CsvValidationErrorEnum.MAX_ROWS_EXCEEDED,
    );
  });

  it("adds a row error for an empty non-string value", () => {
    const result = validateCsvAgainstSchema(
      makeParsed(["id", "count"], [["a1", ""]]),
      makeSchema(),
    );

    expect(result.errorMap.rowErrors[2]?.["count"]).toContain(
      CsvValidationErrorEnum.EMPTY_NON_STRING_VALUE,
    );
  });

  it("allows an empty string value for string columns", () => {
    const result = validateCsvAgainstSchema(
      makeParsed(["id", "label"], [["a1", ""]]),
      makeSchema(),
    );

    expect(result.errors).toHaveLength(0);
    expect(result.rows[0]?.["label"]).toBe("");
  });

  it("adds a row error when a value cannot be coerced to the column type", () => {
    const result = validateCsvAgainstSchema(
      makeParsed(["id", "count"], [["a1", "not-a-number"]]),
      makeSchema(),
    );

    expect(result.errorMap.rowErrors[2]?.["count"]).toContain(
      CsvValidationErrorEnum.TYPE_MISMATCH,
    );
  });

  it("returns correct column list from header", () => {
    const result = validateCsvAgainstSchema(
      makeParsed(["id", "label"], [["a1", "foo"]]),
      makeSchema(),
    );

    expect(result.columns).toEqual(["id", "label"]);
  });

  it("excludes rows with errors from typedRows but still records the error", () => {
    const result = validateCsvAgainstSchema(
      makeParsed(
        ["id", "count"],
        [
          ["a1", "good"],
          ["a2", "42"],
        ],
      ),
      makeSchema(),
    );

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].rowNum).toBe(2);
    expect(result.rows).toHaveLength(2);
  });
});
