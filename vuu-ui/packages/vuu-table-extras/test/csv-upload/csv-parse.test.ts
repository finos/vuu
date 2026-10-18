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
});
