import { describe, expect, it } from "vitest";
import {
  EpochTimestamp,
  formatTemporalInput,
  getTemporalInfo,
  parseTemporalInput,
  startOfDay,
  startOfNextDay,
  timeOfDayToEpochMillis,
  type TemporalInfo,
} from "../../src/date";
import { temporalFormatter } from "../../src/formatting-utils";
import {
  getTypedValue,
  getTypedValueForDescriptor,
} from "../../src/form-utils";
import {
  isNumericColumn,
  isTemporalColumn,
  isTimeDataValue,
  isDateTimeDataValue,
} from "../../src/column-utils";

// 2024-03-15T09:30:45.123456789Z
const millis = Date.UTC(2024, 2, 15, 9, 30, 45, 123);
const nanos = `${millis}456789`;

const utcDateTimeNanos: TemporalInfo = {
  kind: "datetime",
  encoding: "epochNanos",
  precision: "ns",
  timeZone: "UTC",
};

describe("EpochTimestamp", () => {
  it("treats null, undefined, empty string and zero as empty", () => {
    for (const value of [null, undefined, "", 0, "0", BigInt(0)]) {
      expect(EpochTimestamp.fromWire(value, "epochMillis")).toBeUndefined();
      expect(EpochTimestamp.fromWire(value, "epochNanos")).toBeUndefined();
    }
  });

  it("round-trips epoch nanos without loss of precision", () => {
    const ts = EpochTimestamp.fromWire(nanos, "epochNanos");
    expect(ts?.epochMillis).toEqual(millis);
    expect(ts?.subMilliNanos).toEqual(456789);
    expect(ts?.toWire("epochNanos")).toEqual(nanos);
    expect(ts?.epochNanos).toEqual(BigInt(nanos));
  });

  it("accepts bigint nanos", () => {
    const ts = EpochTimestamp.fromWire(BigInt(nanos), "epochNanos");
    expect(ts?.toWire("epochNanos")).toEqual(nanos);
  });

  it("encodes millis as number, nanos as string", () => {
    const ts = EpochTimestamp.fromMillis(millis);
    expect(ts.toWire("epochMillis")).toEqual(millis);
    expect(ts.toWire("epochNanos")).toEqual(`${millis}000000`);
  });

  it("returns fractional second digits, truncated", () => {
    const ts = EpochTimestamp.fromWire(nanos, "epochNanos") as EpochTimestamp;
    expect(ts.fractionalSecond(3)).toEqual("123");
    expect(ts.fractionalSecond(6)).toEqual("123456");
    expect(ts.fractionalSecond(9)).toEqual("123456789");
  });

  it("compares timestamps including sub-milli nanos", () => {
    const t1 = EpochTimestamp.fromWire(`${millis}000001`, "epochNanos");
    const t2 = EpochTimestamp.fromWire(`${millis}000002`, "epochNanos");
    expect(t1?.compare(t2 as EpochTimestamp)).toBeLessThan(0);
    expect(t1?.equals(t1)).toBe(true);
  });
});

describe("getTemporalInfo", () => {
  it("derives encoding from serverDataType", () => {
    expect(getTemporalInfo({ serverDataType: "epochtimestamp" })).toMatchObject(
      { kind: "datetime", encoding: "epochMillis", precision: "ms" },
    );
    expect(
      getTemporalInfo({ serverDataType: "epochtimestampnano" }),
    ).toMatchObject({
      kind: "datetime",
      encoding: "epochNanos",
      precision: "ns",
    });
  });

  it("derives kind from type", () => {
    expect(
      getTemporalInfo({ serverDataType: "epochtimestampnano", type: "time" })
        ?.kind,
    ).toEqual("time");
    expect(
      getTemporalInfo({
        serverDataType: "epochtimestamp",
        type: { name: "date" },
      })?.kind,
    ).toEqual("date");
  });

  it("treats legacy long columns as temporal only when type is temporal", () => {
    expect(getTemporalInfo({ serverDataType: "long" })).toBeUndefined();
    expect(
      getTemporalInfo({ serverDataType: "long", type: "date/time" }),
    ).toMatchObject({ kind: "datetime", encoding: "epochMillis" });
  });

  it("allows type 'number' to opt out of temporal treatment", () => {
    expect(
      getTemporalInfo({ serverDataType: "epochtimestamp", type: "number" }),
    ).toBeUndefined();
  });

  it("does not treat string columns as temporal", () => {
    expect(
      getTemporalInfo({ serverDataType: "string", type: "time" }),
    ).toBeUndefined();
  });

  it("takes time zone from formatting", () => {
    expect(
      getTemporalInfo({
        serverDataType: "epochtimestamp",
        type: { name: "date/time", formatting: { timeZone: "Asia/Tokyo" } },
      })?.timeZone,
    ).toEqual("Asia/Tokyo");
  });
});

describe("column predicates", () => {
  it("excludes temporal columns from numeric columns", () => {
    const column = {
      name: "c",
      serverDataType: "long",
      type: "date/time",
    } as const;
    expect(isNumericColumn(column)).toBe(false);
    expect(isTemporalColumn(column)).toBe(true);
    expect(isNumericColumn({ name: "c", serverDataType: "long" })).toBe(true);
  });
  it("distinguishes time from date/time", () => {
    const time = {
      name: "c",
      serverDataType: "epochtimestamp",
      type: "time",
    } as const;
    const dateTime = { name: "c", serverDataType: "epochtimestamp" } as const;
    expect(isTimeDataValue(time)).toBe(true);
    expect(isDateTimeDataValue(time)).toBe(false);
    expect(isTimeDataValue(dateTime)).toBe(false);
    expect(isDateTimeDataValue(dateTime)).toBe(true);
  });
});

describe("formatTemporalInput / parseTemporalInput", () => {
  it("round-trips a nano datetime", () => {
    const ts = EpochTimestamp.fromWire(nanos, "epochNanos");
    const text = formatTemporalInput(ts, utcDateTimeNanos);
    expect(text).toEqual("2024-03-15 09:30:45.123456789");
    expect(
      parseTemporalInput(text, utcDateTimeNanos)?.toWire("epochNanos"),
    ).toEqual(nanos);
  });

  it("omits zero fractional seconds", () => {
    const ts = EpochTimestamp.fromMillis(Date.UTC(2024, 0, 1, 12));
    expect(
      formatTemporalInput(ts, { ...utcDateTimeNanos, precision: "ms" }),
    ).toEqual("2024-01-01 12:00:00");
  });

  it("formats in the column time zone", () => {
    const ts = EpochTimestamp.fromMillis(Date.UTC(2024, 0, 1, 20));
    expect(
      formatTemporalInput(ts, { ...utcDateTimeNanos, timeZone: "Asia/Tokyo" }),
    ).toEqual("2024-01-02 05:00:00");
  });

  it("accepts raw epoch values", () => {
    expect(
      parseTemporalInput(`${millis}`, {
        ...utcDateTimeNanos,
        encoding: "epochMillis",
        precision: "ms",
      })?.epochMillis,
    ).toEqual(millis);
  });

  it("time kind applies time to the date of the base value", () => {
    const base = EpochTimestamp.fromWire(nanos, "epochNanos");
    const ts = parseTemporalInput(
      "17:00:00",
      { ...utcDateTimeNanos, kind: "time" },
      base,
    );
    expect(ts?.epochMillis).toEqual(Date.UTC(2024, 2, 15, 17));
  });

  it("date kind preserves the time of day of the base value", () => {
    const base = EpochTimestamp.fromWire(nanos, "epochNanos");
    const ts = parseTemporalInput(
      "2024-04-01",
      { ...utcDateTimeNanos, kind: "date" },
      base,
    );
    expect(ts?.toWire("epochNanos")).toEqual(
      `${Date.UTC(2024, 3, 1, 9, 30, 45, 123)}456789`,
    );
  });

  it("rejects invalid input", () => {
    expect(parseTemporalInput("2024-02-30", utcDateTimeNanos)).toBeUndefined();
    expect(
      parseTemporalInput("2024-02-01 25:00", utcDateTimeNanos),
    ).toBeUndefined();
    expect(parseTemporalInput("tomorrow", utcDateTimeNanos)).toBeUndefined();
  });
});

describe("time zone day boundaries", () => {
  it("handles DST transitions (Europe/London)", () => {
    // clocks go forward 2024-03-31 01:00 UTC, day is 23 hours
    const midday = Date.UTC(2024, 2, 31, 12);
    const start = startOfDay(midday, "Europe/London");
    const end = startOfNextDay(midday, "Europe/London");
    expect(start).toEqual(Date.UTC(2024, 2, 31, 0));
    expect(end).toEqual(Date.UTC(2024, 2, 31, 23));
    expect((end - start) / 3_600_000).toEqual(23);
    // clocks go back 2024-10-27, day is 25 hours
    const octMidday = Date.UTC(2024, 9, 27, 12);
    expect(
      (startOfNextDay(octMidday, "Europe/London") -
        startOfDay(octMidday, "Europe/London")) /
        3_600_000,
    ).toEqual(25);
  });

  it("resolves a time of day against a given date and time zone", () => {
    expect(timeOfDayToEpochMillis("09:00:00", "2024-07-01", "UTC")).toEqual(
      Date.UTC(2024, 6, 1, 9),
    );
    expect(
      timeOfDayToEpochMillis("09:00:00", "2024-07-01", "Europe/London"),
    ).toEqual(Date.UTC(2024, 6, 1, 8));
  });
});

describe("temporalFormatter", () => {
  const nanoColumn = (
    type: object | string = {},
  ): Parameters<typeof temporalFormatter>[0] => ({
    name: "ts",
    serverDataType: "epochtimestampnano",
    type:
      typeof type === "string"
        ? type
        : {
            name: "date/time",
            ...type,
            formatting: {
              timeZone: "UTC",
              ...(type as { formatting?: object }).formatting,
            },
          },
  });

  it("formats nanos with correct milliseconds", () => {
    const formatter = temporalFormatter(
      nanoColumn({
        formatting: { pattern: { time: "hh:mm:ss.ms" }, timeZone: "UTC" },
      }),
    );
    expect(formatter(nanos)).toEqual("09:30:45.123");
  });

  it("formats nanos with 9 fractional digits by default when time shown", () => {
    const formatter = temporalFormatter(
      nanoColumn({
        formatting: { pattern: { time: "hh:mm:ss" }, timeZone: "UTC" },
      }),
    );
    expect(formatter(nanos)).toEqual("09:30:45.123456789");
  });

  it("formats with configured fractional second digits", () => {
    const formatter = temporalFormatter(
      nanoColumn({
        formatting: {
          pattern: { time: "hh:mm:ss" },
          fractionalSecondDigits: 6,
          timeZone: "UTC",
        },
      }),
    );
    expect(formatter(nanos)).toEqual("09:30:45.123456");
  });

  it("formats a 'time' column as time only", () => {
    const formatter = temporalFormatter({
      name: "ts",
      serverDataType: "epochtimestamp",
      type: { name: "time", formatting: { timeZone: "UTC" } },
    });
    expect(formatter(millis)).toEqual("09:30:45");
  });

  it("formats a 'date' column as date only", () => {
    const formatter = temporalFormatter({
      name: "ts",
      serverDataType: "epochtimestamp",
      type: { name: "date", formatting: { timeZone: "UTC" } },
    });
    expect(formatter(millis)).toEqual("15.03.2024");
  });

  it("formats in the configured time zone", () => {
    const formatter = temporalFormatter({
      name: "ts",
      serverDataType: "epochtimestamp",
      type: {
        name: "time",
        formatting: { timeZone: "Asia/Tokyo", pattern: { time: "hh:mm:ss" } },
      },
    });
    expect(formatter(millis)).toEqual("18:30:45");
  });

  it("renders empty values as empty string", () => {
    const formatter = temporalFormatter(nanoColumn());
    expect(formatter(0)).toEqual("");
    expect(formatter("0")).toEqual("");
    expect(formatter(null)).toEqual("");
  });
});

describe("typed values", () => {
  it("returns epoch millis as number for epochtimestamp", () => {
    expect(getTypedValue(`${millis}`, "epochtimestamp")).toEqual(millis);
  });
  it("returns epoch nanos as string for epochtimestampnano", () => {
    expect(getTypedValue(nanos, "epochtimestampnano")).toEqual(nanos);
  });
  it("parses canonical input using the column descriptor", () => {
    expect(
      getTypedValueForDescriptor("2024-03-15 09:30:45.123456789", {
        name: "ts",
        serverDataType: "epochtimestampnano",
        type: { name: "date/time", formatting: { timeZone: "UTC" } },
      }),
    ).toEqual(nanos);
  });
  it("throws for invalid input when requested", () => {
    expect(() =>
      getTypedValueForDescriptor(
        "not a date",
        { name: "ts", serverDataType: "epochtimestamp" },
        true,
      ),
    ).toThrow();
  });
});
