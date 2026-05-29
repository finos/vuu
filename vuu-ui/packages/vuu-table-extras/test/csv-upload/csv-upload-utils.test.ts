import { describe, expect, it, vi } from "vitest";
import {
  buildPreviewTableData,
  buildRowErrorMessage,
  executeBatchRpcCalls,
  formatValidationErrors,
  getValidatedRowNumbers,
  groupValidationErrorsByRow,
  mergeValidationWithParseErrors,
  normalizeTableData,
  toValidationErrorsFromParseRowErrors,
} from "../../src/csv-upload/parse/csv-upload-utils";
import { CsvParseErrorEnum } from "../../src/csv-upload/parse/csv-parse";
import {
  CsvValidationErrorEnum,
  type CsvValidationResult,
} from "../../src/csv-upload/parse/csv-schema-validation";

const createValidation = (
  overrides: Partial<CsvValidationResult> = {},
): CsvValidationResult => ({
  columns: ["id", "name"],
  errorMap: { fileErrors: {}, rowErrors: {} },
  errors: [],
  rows: [
    { id: "1", name: "Alice" },
    { id: "2", name: "Bob" },
    { id: "3", name: "Cara" },
  ],
  ...overrides,
});

describe("csv-upload-utils", () => {
  it("converts parse row errors into validation errors", () => {
    const parseError = {
      message: "bad csv",
      errors: [
        {
          rowNum: 3,
          column: "id",
          value: "",
          message: `Parse error: ${CsvParseErrorEnum.INVALID_FORMAT}`,
          errorEnum: CsvParseErrorEnum.INVALID_FORMAT,
        },
        {
          rowNum: 3,
          column: "*",
          value: "",
          message: `Parse error: ${CsvParseErrorEnum.ROW_COLUMN_COUNT_MISMATCH}`,
          errorEnum: CsvParseErrorEnum.ROW_COLUMN_COUNT_MISMATCH,
        },
      ],
      errorMap: {
        fileErrors: {},
        rowErrors: {
          3: {
            id: [CsvParseErrorEnum.INVALID_FORMAT],
            "*": [CsvParseErrorEnum.ROW_COLUMN_COUNT_MISMATCH],
          },
        },
      },
    };

    expect(toValidationErrorsFromParseRowErrors(parseError)).toEqual([
      {
        rowNum: 3,
        column: "id",
        value: "",
        message: `Parse error: ${CsvParseErrorEnum.INVALID_FORMAT}`,
        errorEnum: CsvParseErrorEnum.INVALID_FORMAT,
      },
      {
        rowNum: 3,
        column: "*",
        value: "",
        message: `Parse error: ${CsvParseErrorEnum.ROW_COLUMN_COUNT_MISMATCH}`,
        errorEnum: CsvParseErrorEnum.ROW_COLUMN_COUNT_MISMATCH,
      },
    ]);
  });

  it("merges validation and parse row errors", () => {
    const validation = createValidation({
      errors: [
        {
          rowNum: 2,
          column: "name",
          value: "",
          message: "Empty value is not allowed.",
          errorEnum: CsvValidationErrorEnum.EMPTY_NON_STRING_VALUE,
        },
      ],
    });
    const parseError = {
      message: "bad csv",
      errors: [
        {
          rowNum: 4,
          column: "*",
          value: "",
          message: `Parse error: ${CsvParseErrorEnum.ROW_COLUMN_COUNT_MISMATCH}`,
          errorEnum: CsvParseErrorEnum.ROW_COLUMN_COUNT_MISMATCH,
        },
      ],
      errorMap: {
        fileErrors: {},
        rowErrors: {
          4: {
            "*": [CsvParseErrorEnum.ROW_COLUMN_COUNT_MISMATCH],
          },
        },
      },
    };

    const merged = mergeValidationWithParseErrors(validation, parseError);

    expect(merged.parseRowError).toEqual(parseError);
    expect(merged.errors).toHaveLength(2);
    expect(merged.errors[1]).toEqual({
      rowNum: 4,
      column: "*",
      value: "",
      message: `Parse error: ${CsvParseErrorEnum.ROW_COLUMN_COUNT_MISMATCH}`,
      errorEnum: CsvParseErrorEnum.ROW_COLUMN_COUNT_MISMATCH,
    });
  });

  it("builds preview rows with validation error details", () => {
    const validation = createValidation({
      errors: [
        {
          rowNum: 3,
          column: "name",
          value: "Bob",
          message: "Value is invalid",
          errorEnum: CsvValidationErrorEnum.TYPE_MISMATCH,
        },
      ],
    });

    expect(buildPreviewTableData(validation)).toEqual({
      columns: ["id", "name", "validationErrors"],
      rows: [
        ["1", "Alice", ""],
        ["2", "Bob", "name: Value is invalid"],
        ["3", "Cara", ""],
      ],
    });
  });

  it("returns only row numbers with no row-level errors", () => {
    const validation = createValidation({
      errors: [
        {
          rowNum: 1,
          column: "id",
          value: "",
          message: "Missing key column",
          errorEnum: CsvValidationErrorEnum.MISSING_KEY_COLUMN,
        },
        {
          rowNum: 3,
          column: "name",
          value: "Bob",
          message: "Type mismatch",
          errorEnum: CsvValidationErrorEnum.TYPE_MISMATCH,
        },
      ],
    });

    expect(getValidatedRowNumbers(validation)).toEqual([2, 4]);
  });

  it("groups validation errors by row and includes rowData", () => {
    const validation = createValidation({
      errors: [
        {
          rowNum: 1,
          column: "id",
          value: "",
          message: "Missing key column",
          errorEnum: CsvValidationErrorEnum.MISSING_KEY_COLUMN,
        },
        {
          rowNum: 3,
          column: "name",
          value: "Bob",
          message: "Type mismatch",
          errorEnum: CsvValidationErrorEnum.TYPE_MISMATCH,
        },
      ],
    });

    expect(groupValidationErrorsByRow(validation)).toEqual([
      {
        errorMap: { id: CsvValidationErrorEnum.MISSING_KEY_COLUMN },
        rowNum: 1,
        rowData: undefined,
      },
      {
        errorMap: { name: CsvValidationErrorEnum.TYPE_MISMATCH },
        rowNum: 3,
        rowData: { id: "2", name: "Bob" },
      },
    ]);
  });

  it("normalizes valid table data and falls back for invalid inputs", () => {
    const fallback = {
      columns: ["a"],
      rows: [["fallback"]],
    };

    expect(
      normalizeTableData(
        {
          data: {
            columns: ["id", "name"],
            rows: [{ id: "1", name: "Alice" }, ["2", "Bob"], null],
          },
        },
        fallback,
      ),
    ).toEqual({
      columns: ["id", "name"],
      rows: [
        ["1", "Alice"],
        ["2", "Bob"],
        ["", ""],
      ],
    });

    expect(
      normalizeTableData({ data: { columns: "bad", rows: [] } }, fallback),
    ).toBe(fallback);
    expect(normalizeTableData(undefined, fallback)).toBe(fallback);
  });

  it("formats validation errors with 'header' label for row 1 and 'row N' for data rows", () => {
    const validation = createValidation({
      errors: [
        {
          rowNum: 1,
          column: "id",
          value: "",
          message: "Missing key column",
          errorEnum: CsvValidationErrorEnum.MISSING_KEY_COLUMN,
        },
        {
          rowNum: 3,
          column: "name",
          value: "bad",
          message: "Type mismatch",
          errorEnum: CsvValidationErrorEnum.TYPE_MISMATCH,
        },
      ],
    });

    expect(formatValidationErrors(validation)).toEqual([
      "header, column 'id': Missing key column",
      "row 3, column 'name': Type mismatch",
    ]);
  });

  it("limits formatValidationErrors output to 8 entries", () => {
    const errors = Array.from({ length: 12 }, (_, i) => ({
      rowNum: i + 2,
      column: "name",
      value: "",
      message: "error",
      errorEnum: CsvValidationErrorEnum.TYPE_MISMATCH,
    }));
    const validation = createValidation({ errors });

    expect(formatValidationErrors(validation)).toHaveLength(8);
  });

  it("returns all row numbers when there are no validation errors", () => {
    const validation = createValidation();

    expect(getValidatedRowNumbers(validation)).toEqual([2, 3, 4]);
  });

  it("returns no row numbers when every row has a validation error", () => {
    const validation = createValidation({
      errors: [
        {
          rowNum: 2,
          column: "id",
          value: "",
          message: "Empty value",
          errorEnum: CsvValidationErrorEnum.EMPTY_NON_STRING_VALUE,
        },
        {
          rowNum: 3,
          column: "id",
          value: "",
          message: "Empty value",
          errorEnum: CsvValidationErrorEnum.EMPTY_NON_STRING_VALUE,
        },
        {
          rowNum: 4,
          column: "id",
          value: "",
          message: "Empty value",
          errorEnum: CsvValidationErrorEnum.EMPTY_NON_STRING_VALUE,
        },
      ],
    });

    expect(getValidatedRowNumbers(validation)).toEqual([]);
  });

  it("mergeValidationWithParseErrors is a passthrough when parseError is undefined", () => {
    const validation = createValidation();
    expect(mergeValidationWithParseErrors(validation, undefined)).toBe(
      validation,
    );
  });

  it("builds preview rows with multiple errors on one row joined by semicolon", () => {
    const validation = createValidation({
      errors: [
        {
          rowNum: 2,
          column: "id",
          value: "",
          message: "Empty value",
          errorEnum: CsvValidationErrorEnum.EMPTY_NON_STRING_VALUE,
        },
        {
          rowNum: 2,
          column: "name",
          value: "x",
          message: "Type mismatch",
          errorEnum: CsvValidationErrorEnum.TYPE_MISMATCH,
        },
      ],
    });

    expect(buildPreviewTableData(validation)).toEqual({
      columns: ["id", "name", "validationErrors"],
      rows: [
        ["1", "Alice", "id: Empty value; name: Type mismatch"],
        ["2", "Bob", ""],
        ["3", "Cara", ""],
      ],
    });
  });

  describe("buildRowErrorMessage", () => {
    it("formats a message with all errors when count is 8 or fewer", () => {
      const errors = ["row 2: bad", "row 3: bad", "row 4: bad"];
      expect(buildRowErrorMessage("Import failed", errors)).toBe(
        "Import failed for 3 row(s): row 2: bad; row 3: bad; row 4: bad",
      );
    });

    it("truncates details beyond 8 errors and appends 'and N more'", () => {
      const errors = Array.from({ length: 11 }, (_, i) => `row ${i + 2}: err`);
      const result = buildRowErrorMessage("Failed", errors);
      expect(result).toContain("Failed for 11 row(s):");
      expect(result).toContain("and 3 more");
      // Should include first 8 errors but not the 9th
      expect(result).toContain("row 2: err");
      expect(result).not.toContain("row 10: err");
    });
  });

  describe("executeBatchRpcCalls", () => {
    it("collects all results when every call succeeds", async () => {
      const items = [1, 2, 3];
      const executor = vi.fn(async (n: number) => ({ type: "SUCCESS", n }));
      const { errors, results } = await executeBatchRpcCalls(
        items,
        executor,
        (item, err) => `${item}: ${err}`,
      );

      expect(errors).toHaveLength(0);
      expect(results).toHaveLength(3);
      expect(executor).toHaveBeenCalledTimes(3);
    });

    it("collects formatted errors for calls that reject", async () => {
      const items = ["a", "b", "c"];
      const executor = vi.fn(async (s: string) => {
        if (s === "b") throw new Error("boom");
        return { type: "SUCCESS" };
      });
      const { errors, results } = await executeBatchRpcCalls(
        items,
        executor,
        (item, err) => `${item}: ${err}`,
      );

      expect(errors).toEqual(["b: boom"]);
      expect(results).toHaveLength(2);
    });

    it("records an error for RPC responses with errorMessage", async () => {
      const items = ["x"];
      const executor = vi.fn(async () => ({
        type: "ERROR_RESULT",
        errorMessage: "server rejected",
      }));
      const { errors, results } = await executeBatchRpcCalls(
        items,
        executor,
        (item, err) => `${item}: ${err}`,
      );

      expect(errors).toEqual(["x: server rejected"]);
      expect(results).toHaveLength(0);
    });
  });
});
