import { describe, expect, it } from "vitest";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { getTemporalCellFilter } from "../../src/filters/temporal-cell-filter";

const utc = (...args: Parameters<typeof Date.UTC>) => Date.UTC(...args);
const day = utc(2024, 2, 15);
const millis = utc(2024, 2, 15, 9, 5, 7, 123);
const nanos = `${millis}456789`;

const nanoColumn = (
  type: ColumnDescriptor["type"],
  serverDataType: ColumnDescriptor["serverDataType"] = "epochtimestampnano",
): ColumnDescriptor => ({ name: "ts", serverDataType, type });

describe("getTemporalCellFilter", () => {
  it("returns undefined for a non temporal column or empty value", () => {
    expect(
      getTemporalCellFilter({ name: "n", serverDataType: "long" }, 1),
    ).toBeUndefined();
    expect(
      getTemporalCellFilter(nanoColumn({ name: "time" }), ""),
    ).toBeUndefined();
  });

  describe("WHEN kind is time", () => {
    it("THEN value is a TimeString truncated to the displayed precision", () => {
      const ms = nanoColumn({
        name: "time",
        formatting: { pattern: { time: "hh:mm:ss.ms" }, timeZone: "UTC" },
      });
      expect(getTemporalCellFilter(ms, nanos)).toEqual({
        label: "09:05:07.123",
        op: "=",
        value: "09:05:07.123",
      });
      const s = nanoColumn({
        name: "time",
        formatting: {
          fractionalSecondDigits: 0,
          pattern: { time: "hh:mm:ss" },
          timeZone: "UTC",
        },
      });
      expect(getTemporalCellFilter(s, nanos)?.value).toEqual("09:05:07");
      const ns = nanoColumn({
        name: "time",
        formatting: { pattern: { time: "hh:mm:ss" }, timeZone: "UTC" },
      });
      expect(getTemporalCellFilter(ns, nanos)?.value).toEqual(
        "09:05:07.123456789",
      );
    });
    it("THEN a ColumnFilter displays milliseconds with the hh:mm:ss.ms pattern", () => {
      const ms = nanoColumn({
        name: "time",
        formatting: { pattern: { time: "hh:mm:ss.ms" }, timeZone: "UTC" },
      });
      expect(getTemporalCellFilter(ms, nanos, true)?.value).toEqual(
        "09:05:07.123",
      );
    });
    it("THEN a ColumnFilter displays seconds otherwise, although the table displays nanos", () => {
      const s = nanoColumn({
        name: "time",
        formatting: { pattern: { time: "hh:mm:ss" }, timeZone: "UTC" },
      });
      expect(getTemporalCellFilter(s, nanos)?.value).toEqual(
        "09:05:07.123456789",
      );
      expect(getTemporalCellFilter(s, nanos, true)).toMatchObject({
        label: "09:05:07",
        value: "09:05:07",
      });
    });
  });

  describe("WHEN kind is date, or datetime displayed by a ColumnFilter", () => {
    it("THEN value is the start of the day", () => {
      const date = nanoColumn({
        name: "date",
        formatting: { timeZone: "UTC" },
      });
      expect(getTemporalCellFilter(date, nanos)).toEqual({
        label: "15.03.2024",
        op: "=",
        value: `${day}000000`,
      });
      const dateTime = nanoColumn({
        name: "date/time",
        formatting: { timeZone: "UTC" },
      });
      expect(getTemporalCellFilter(dateTime, nanos, true)?.value).toEqual(
        `${day}000000`,
      );
    });
  });

  describe("WHEN kind is datetime", () => {
    it("THEN value is a range covering the displayed precision", () => {
      const seconds = nanoColumn({
        name: "date/time",
        formatting: {
          fractionalSecondDigits: 0,
          pattern: { date: "yyyy-mm-dd", time: "hh:mm:ss" },
          timeZone: "UTC",
        },
      });
      expect(getTemporalCellFilter(seconds, nanos)).toEqual({
        label: "2024-03-15 09:05:07",
        op: "between-inclusive",
        value: [`${millis - 123}000000`, `${millis - 123 + 999}999999`],
      });
      const ms = nanoColumn(
        {
          name: "date/time",
          formatting: {
            pattern: { date: "yyyy-mm-dd", time: "hh:mm:ss" },
            timeZone: "UTC",
          },
        },
        "epochtimestamp",
      );
      expect(getTemporalCellFilter(ms, millis + 0)).toMatchObject({
        op: "between-inclusive",
        value: [`${millis - 123}`, `${millis - 123 + 999}`],
      });
    });
    it("THEN value is exact when displayed at the precision of the encoding", () => {
      const ns = nanoColumn({
        name: "date/time",
        formatting: {
          pattern: { date: "yyyy-mm-dd", time: "hh:mm:ss" },
          timeZone: "UTC",
        },
      });
      expect(getTemporalCellFilter(ns, nanos)).toMatchObject({
        op: "=",
        value: nanos,
      });
    });
  });
});
