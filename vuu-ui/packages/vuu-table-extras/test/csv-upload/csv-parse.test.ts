import { describe, expect, it } from "vitest";
import {
  parseCsv,
  CsvParseErrorEnum,
} from "../../src/csv-upload/parse/csv-parse";

describe("parseCsv", () => {
  it("parses CSV when all fields are double-quoted", () => {
    const csv = [
      '"id","name","note"',
      '"1","Alice","Hello, world"',
      '"2","Bob","He said ""Hi"""',
    ].join("\n");

    expect(parseCsv(csv)).toEqual({
      error: undefined,
      header: ["id", "name", "note"],
      rows: [
        ["1", "Alice", "Hello, world"],
        ["2", "Bob", 'He said "Hi"'],
      ],
    });
  });

  it("allows unquoted fields by default", () => {
    const csv = ["id,name", "1,Alice"].join("\n");

    expect(parseCsv(csv)).toEqual({
      error: undefined,
      header: ["id", "name"],
      rows: [["1", "Alice"]],
    });
  });

  it("returns single error map when header fields are not quoted in strict mode", () => {
    const csv = ["id,name", '"1","Alice"'].join("\n");
    const result = parseCsv(csv, { requireQuotedValues: true });

    expect(result.error?.errorMap.fileErrors).toEqual({
      "*": [CsvParseErrorEnum.UNQUOTED_VALUE],
    });
    expect(result.error?.errorMap.rowErrors).toEqual({});
  });

  it("returns row error map when row fields are not quoted in strict mode", () => {
    const csv = ['"id","name"', '"1",Alice'].join("\n");
    const result = parseCsv(csv, { requireQuotedValues: true });

    expect(result.error?.errorMap.fileErrors).toEqual({});
    expect(result.error?.errorMap.rowErrors).toEqual({
      1: {
        "*": [CsvParseErrorEnum.UNQUOTED_VALUE],
      },
    });
  });

  it("returns separator error in single errors map", () => {
    const csv = ['"id";"name"', '"1";"Alice"'].join("\n");
    const result = parseCsv(csv);

    expect(result.error?.errorMap.fileErrors).toEqual({
      "*": [CsvParseErrorEnum.INVALID_SEPARATOR],
    });
  });

  it("returns row error map for row/header column count mismatch", () => {
    const csv = ['"id","name"', '"1"'].join("\n");
    const result = parseCsv(csv);

    expect(result.error?.errorMap.rowErrors).toEqual({
      1: {
        "*": [CsvParseErrorEnum.ROW_COLUMN_COUNT_MISMATCH],
      },
    });
  });

  describe("customHeaders and hasHeaderRow", () => {
    it("uses customHeaders when provided and skips the header row by default", () => {
      const csv = ["col_a,col_b", "1,Alice", "2,Bob"].join("\n");
      const result = parseCsv(csv, { customHeaders: ["id", "name"] });

      expect(result.error).toBeUndefined();
      expect(result.header).toEqual(["id", "name"]);
      expect(result.rows).toEqual([
        ["1", "Alice"],
        ["2", "Bob"],
      ]);
    });

    it("treats all rows as data rows when hasHeaderRow is false", () => {
      const csv = ["1,Alice", "2,Bob"].join("\n");
      const result = parseCsv(csv, {
        customHeaders: ["id", "name"],
        hasHeaderRow: false,
      });

      expect(result.error).toBeUndefined();
      expect(result.header).toEqual(["id", "name"]);
      expect(result.rows).toEqual([
        ["1", "Alice"],
        ["2", "Bob"],
      ]);
    });

    it("reports ROW_COLUMN_COUNT_MISMATCH starting from row 1 when hasHeaderRow is false", () => {
      const csv = ["1,Alice", "2"].join("\n");
      const result = parseCsv(csv, {
        customHeaders: ["id", "name"],
        hasHeaderRow: false,
      });

      expect(result.error?.errorMap.rowErrors).toEqual({
        2: {
          "*": [CsvParseErrorEnum.ROW_COLUMN_COUNT_MISMATCH],
        },
      });
    });
  });

  describe("empty data files", () => {
    it("returns EMPTY_FILE error when CSV file is completely empty", () => {
      const result = parseCsv("");

      expect(result.error?.errorMap.fileErrors).toEqual({
        "*": [CsvParseErrorEnum.EMPTY_FILE],
      });
      expect(result.error?.message).toBe("CSV file is empty.");
    });

    it("returns EMPTY_FILE error when CSV file has only headers and no data rows", () => {
      const result = parseCsv("id,name\n");

      expect(result.error?.errorMap.fileErrors).toEqual({
        "*": [CsvParseErrorEnum.EMPTY_FILE],
      });
      expect(result.error?.message).toBe("CSV file is empty.");
      expect(result.header).toEqual(["id", "name"]);
      expect(result.rows).toEqual([]);
    });

    it("returns EMPTY_FILE error when CSV file has only headers with customHeaders", () => {
      const result = parseCsv("col_a,col_b\n", {
        customHeaders: ["id", "name"],
      });

      expect(result.error?.errorMap.fileErrors).toEqual({
        "*": [CsvParseErrorEnum.EMPTY_FILE],
      });
      expect(result.error?.message).toBe("CSV file is empty.");
    });
  });

  describe("invalid / non-CSV content", () => {
    it("returns generic INVALID_FORMAT error when csv-parse fails on malformed quotes", () => {
      const result = parseCsv('id,name\n1,foo"bar\n');

      expect(result.error?.errorMap.fileErrors).toEqual({
        "*": [CsvParseErrorEnum.INVALID_FORMAT],
      });
      expect(result.error?.message).toBe("Invalid CSV format.");
      expect(result.error?.errors[0]?.message).toBe("Invalid CSV format.");
    });
  });
});
