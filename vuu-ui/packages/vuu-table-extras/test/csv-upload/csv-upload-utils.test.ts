import { describe, expect, it, vi } from "vitest";
import {
  buildRowErrorMessage,
  executeBatchRpcCalls,
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

  it("mergeValidationWithParseErrors is a passthrough when parseError is undefined", () => {
    const validation = createValidation();
    expect(mergeValidationWithParseErrors(validation, undefined)).toBe(
      validation,
    );
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
