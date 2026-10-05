import { describe, expect, it } from "vitest";
import type { ColumnDescriptorsByName } from "@vuu-ui/vuu-filter-types";
import {
  filterAsQuery,
  filterRequiresResolution,
  getColumnsByNameForFilter,
  temporalFilterAsQuery,
} from "../../src/filters/filterAsQuery";
import type { TemporalInfo } from "../../src/date";

const utc = (...args: Parameters<typeof Date.UTC>) => Date.UTC(...args);
const day = utc(2024, 2, 15);
const nextDay = utc(2024, 2, 16);

const dateTimeMillis: TemporalInfo = {
  kind: "datetime",
  encoding: "epochMillis",
  precision: "ms",
  timeZone: "UTC",
};
const dateTimeNanos: TemporalInfo = {
  ...dateTimeMillis,
  encoding: "epochNanos",
  precision: "ns",
};

describe("temporalFilterAsQuery", () => {
  describe("WHEN value is a datetime at the start of a day", () => {
    it("THEN '=' covers the whole day", () => {
      expect(
        temporalFilterAsQuery(
          { column: "ts", op: "=", value: day },
          dateTimeMillis,
        ),
      ).toEqual(`(ts >= ${day} and ts < ${nextDay})`);
    });
    it("THEN '!=' excludes the whole day", () => {
      expect(
        temporalFilterAsQuery(
          { column: "ts", op: "!=", value: day },
          dateTimeMillis,
        ),
      ).toEqual(`(ts < ${day} or ts >= ${nextDay})`);
    });
    it("THEN '>' and '<=' are relative to the end of the day", () => {
      expect(
        temporalFilterAsQuery(
          { column: "ts", op: ">", value: day },
          dateTimeMillis,
        ),
      ).toEqual(`ts >= ${nextDay}`);
      expect(
        temporalFilterAsQuery(
          { column: "ts", op: "<=", value: day },
          dateTimeMillis,
        ),
      ).toEqual(`ts < ${nextDay}`);
    });
    it("THEN '>=' and '<' are relative to the start of the day", () => {
      expect(
        temporalFilterAsQuery(
          { column: "ts", op: ">=", value: day },
          dateTimeMillis,
        ),
      ).toEqual(`ts >= ${day}`);
      expect(
        temporalFilterAsQuery(
          { column: "ts", op: "<", value: day },
          dateTimeMillis,
        ),
      ).toEqual(`ts < ${day}`);
    });
    it("THEN day bounds respect the column time zone", () => {
      // midnight in Tokyo
      const tokyoMidnight = utc(2024, 2, 14, 15);
      expect(
        temporalFilterAsQuery(
          { column: "ts", op: "=", value: tokyoMidnight },
          { ...dateTimeMillis, timeZone: "Asia/Tokyo" },
        ),
      ).toEqual(
        `(ts >= ${tokyoMidnight} and ts < ${tokyoMidnight + 86400000})`,
      );
    });
  });

  describe("WHEN value is a datetime with a time of day", () => {
    it("THEN the comparison is exact", () => {
      const value = utc(2024, 2, 15, 10, 30);
      expect(
        temporalFilterAsQuery({ column: "ts", op: "=", value }, dateTimeMillis),
      ).toEqual(`ts = ${value}`);
    });
  });

  describe("WHEN column kind is date", () => {
    it("THEN any value covers the whole day", () => {
      expect(
        temporalFilterAsQuery(
          { column: "ts", op: "=", value: utc(2024, 2, 15, 10, 30) },
          { ...dateTimeMillis, kind: "date" },
        ),
      ).toEqual(`(ts >= ${day} and ts < ${nextDay})`);
    });
  });

  describe("WHEN column is a nano timestamp", () => {
    it("THEN values are serialized as epoch nanos", () => {
      expect(
        temporalFilterAsQuery(
          { column: "ts", op: "=", value: `${day}000000` },
          dateTimeNanos,
        ),
      ).toEqual(`(ts >= ${day}000000 and ts < ${nextDay}000000)`);
    });
    it("THEN exact values preserve nanosecond precision", () => {
      expect(
        temporalFilterAsQuery(
          { column: "ts", op: ">", value: `${day}123456789` },
          dateTimeNanos,
        ),
      ).toEqual(`ts > ${day}123456789`);
    });
  });

  describe("WHEN value is a TimeString", () => {
    it("THEN it is resolved against the given date, to the second", () => {
      const nine = utc(2024, 2, 15, 9);
      expect(
        temporalFilterAsQuery(
          { column: "ts", op: "=", value: "09:00:00" },
          { ...dateTimeMillis, kind: "time" },
          { date: "2024-03-15" },
        ),
      ).toEqual(`(ts >= ${nine} and ts < ${nine + 1000})`);
      expect(
        temporalFilterAsQuery(
          { column: "ts", op: "<=", value: "09:00:00" },
          { ...dateTimeNanos, kind: "time" },
          { date: "2024-03-15" },
        ),
      ).toEqual(`ts < ${nine + 1000}000000`);
    });
    it("THEN a nano column resolves it to the period implied by its precision", () => {
      const nine = utc(2024, 2, 15, 9);
      const time = { ...dateTimeNanos, kind: "time" } as const;
      const opts = { date: "2024-03-15" } as const;
      expect(
        temporalFilterAsQuery(
          { column: "ts", op: "=", value: "09:00:00.123" },
          time,
          opts,
        ),
      ).toEqual(`(ts >= ${nine + 123}000000 and ts < ${nine + 124}000000)`);
      expect(
        temporalFilterAsQuery(
          { column: "ts", op: "=", value: "09:00:00.123456" },
          time,
          opts,
        ),
      ).toEqual(`(ts >= ${nine + 123}456000 and ts < ${nine + 123}457000)`);
      expect(
        temporalFilterAsQuery(
          { column: "ts", op: "=", value: "09:00:00.123456789" },
          time,
          opts,
        ),
      ).toEqual(`ts = ${nine + 123}456789`);
    });
    it("THEN a millisecond column compares milliseconds exactly", () => {
      const nine = utc(2024, 2, 15, 9);
      expect(
        temporalFilterAsQuery(
          { column: "ts", op: ">", value: "09:00:00.123" },
          { ...dateTimeMillis, kind: "time" },
          { date: "2024-03-15" },
        ),
      ).toEqual(`ts > ${nine + 123}`);
    });
  });
});

describe("filterAsQuery with columnsByName", () => {
  const columnsByName: ColumnDescriptorsByName = {
    tradeDate: { name: "tradeDate", serverDataType: "epochtimestamp" },
    lastUpdate: {
      name: "lastUpdate",
      serverDataType: "long",
      type: { name: "date/time", formatting: { timeZone: "UTC" } },
    },
    ccy: { name: "ccy", serverDataType: "string" },
    nano: { name: "nano", serverDataType: "epochtimestampnano" },
  };

  it("serializes legacy long date/time columns as temporal", () => {
    expect(
      filterAsQuery(
        {
          op: "and",
          filters: [
            { column: "lastUpdate", op: "=", value: day },
            { column: "ccy", op: "=", value: "EUR" },
          ],
        },
        { columnsByName },
      ),
    ).toEqual(
      `(lastUpdate >= ${day} and lastUpdate < ${nextDay}) and ccy = "EUR"`,
    );
  });

  it("serializes nano values unquoted", () => {
    expect(
      filterAsQuery(
        { column: "nano", op: "in", values: [`${day}000001`, `${day}000002`] },
        { columnsByName },
      ),
    ).toEqual(`nano in [${day}000001,${day}000002]`);
  });

  it("identifies filters that require resolution", () => {
    expect(
      filterRequiresResolution(
        { column: "ccy", op: "=", value: "EUR" },
        columnsByName,
      ),
    ).toBe(false);
    expect(
      filterRequiresResolution(
        {
          op: "and",
          filters: [
            { column: "ccy", op: "=", value: "EUR" },
            { column: "tradeDate", op: "=", value: day },
          ],
        },
        columnsByName,
      ),
    ).toBe(true);
  });

  it("merges client column descriptors with schema columns", () => {
    const merged = getColumnsByNameForFilter(
      {
        columns: [
          { name: "lastUpdate", serverDataType: "long" },
          { name: "ccy", serverDataType: "string" },
        ],
      },
      { lastUpdate: { name: "lastUpdate", type: "date/time" } },
    );
    expect(merged?.lastUpdate).toEqual({
      name: "lastUpdate",
      serverDataType: "long",
      type: "date/time",
    });
    expect(merged?.ccy).toEqual({ name: "ccy", serverDataType: "string" });
  });
});
