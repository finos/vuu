import { describe, expect, it } from "vitest";
import type { ScaledDecimalFilterOptions } from "@vuu-ui/vuu-filter-types";
import type { RoundingRule } from "@vuu-ui/vuu-table-types";
import {
  filterAsQuery,
  fromScaledInteger,
  getScaledDecimalCellFilter,
  getScaledDecimalFilterOptions,
  getScaledDecimalMatchRange,
  roundScaledDecimal,
  scaledDecimalFilterAsQuery,
  toScaledInteger,
} from "../../src";

const sd6 = (
  decimals?: number,
  roundingRule?: RoundingRule,
): ScaledDecimalFilterOptions => ({
  type: "ScaledDecimal",
  scale: 6,
  decimals,
  roundingRule,
});

const range = (value: string, options: ScaledDecimalFilterOptions) =>
  getScaledDecimalMatchRange(value, options).map((n) =>
    fromScaledInteger(n, options.scale),
  );

describe("toScaledInteger / fromScaledInteger", () => {
  it("converts decimal strings to scaled integers", () => {
    expect(toScaledInteger("1.23", 2)).toBe(123n);
    expect(toScaledInteger("1.2", 6)).toBe(1200000n);
    expect(toScaledInteger("-0.01", 2)).toBe(-1n);
    expect(toScaledInteger(".5", 2)).toBe(50n);
    expect(toScaledInteger("100", 8)).toBe(10000000000n);
  });

  it("truncates digits beyond the scale, as the server does", () => {
    expect(toScaledInteger("1.239", 2)).toBe(123n);
    expect(toScaledInteger("-1.239", 2)).toBe(-123n);
  });

  it("rejects values that are not decimals", () => {
    expect(() => toScaledInteger("abc", 2)).toThrow();
    expect(() => toScaledInteger("1.2.3", 2)).toThrow();
    expect(() => toScaledInteger("", 2)).toThrow();
  });

  it("converts scaled integers to decimal literals with scale decimals", () => {
    expect(fromScaledInteger(123n, 2)).toBe("1.23");
    expect(fromScaledInteger(1n, 8)).toBe("0.00000001");
    expect(fromScaledInteger(-1225000n, 6)).toBe("-1.225000");
    expect(fromScaledInteger(0n, 4)).toBe("0.0000");
  });
});

describe("getScaledDecimalFilterOptions", () => {
  it("returns undefined for columns that are not scaled decimals", () => {
    expect(
      getScaledDecimalFilterOptions({ serverDataType: "double" }),
    ).toBeUndefined();
  });

  it("uses the display decimals and rounding rule of the column type", () => {
    expect(
      getScaledDecimalFilterOptions({
        serverDataType: "scaleddecimal8",
        type: {
          name: "number",
          formatting: { decimals: 2, roundingRule: "truncate" },
        },
      }),
    ).toEqual({
      type: "ScaledDecimal",
      scale: 8,
      decimals: 2,
      roundingRule: "truncate",
    });
  });

  it("defaults to 4 decimals, rounded, for a type with no decimals", () => {
    expect(
      getScaledDecimalFilterOptions({
        serverDataType: "scaleddecimal6",
        type: { name: "number" },
      }),
    ).toEqual({
      type: "ScaledDecimal",
      scale: 6,
      decimals: 4,
      roundingRule: "round",
    });
  });

  it("has no display decimals when the full value is displayed", () => {
    expect(
      getScaledDecimalFilterOptions({ serverDataType: "scaleddecimal6" }),
    ).toEqual({ type: "ScaledDecimal", scale: 6 });
    expect(
      getScaledDecimalFilterOptions({
        serverDataType: "scaleddecimal2",
        type: { name: "number", formatting: { decimals: 2 } },
      }),
    ).toEqual({ type: "ScaledDecimal", scale: 2 });
  });
});

describe("getScaledDecimalMatchRange", () => {
  it("matches exactly when the column displays every decimal", () => {
    expect(range("1.23", sd6())).toEqual(["1.230000", "1.230000"]);
  });

  it("matches values that round to a displayed value", () => {
    expect(range("1.23", sd6(2))).toEqual(["1.225000", "1.234999"]);
    expect(range("-1.23", sd6(2))).toEqual(["-1.234999", "-1.225000"]);
    expect(range("0", sd6(2))).toEqual(["-0.004999", "0.004999"]);
    expect(range("100", sd6(2))).toEqual(["99.995000", "100.004999"]);
  });

  it("matches values that truncate to a displayed value", () => {
    expect(range("1.23", sd6(2, "truncate"))).toEqual(["1.230000", "1.239999"]);
    expect(range("-1.23", sd6(2, "truncate"))).toEqual([
      "-1.239999",
      "-1.230000",
    ]);
    expect(range("0", sd6(2, "truncate"))).toEqual(["-0.009999", "0.009999"]);
  });

  it("interprets a value with fewer decimals at the displayed precision", () => {
    expect(range("1.2", sd6(2))).toEqual(["1.195000", "1.204999"]);
  });

  it("matches a value with more decimals than are displayed at its own precision", () => {
    expect(range("1.234", sd6(2))).toEqual(["1.233500", "1.234499"]);
    expect(range("1.2345", sd6(2))).toEqual(["1.234450", "1.234549"]);
    expect(range("1.2345", sd6(2, "truncate"))).toEqual([
      "1.234500",
      "1.234599",
    ]);
    expect(range("-1.2345", sd6(2))).toEqual(["-1.234549", "-1.234450"]);
  });

  it("matches exactly a value with as many decimals as the scale", () => {
    expect(range("1.234567", sd6(2))).toEqual(["1.234567", "1.234567"]);
    expect(range("1.2345678", sd6(2))).toEqual(["1.234567", "1.234567"]);
  });

  /**
   * The defining property: for every underlying value, the value is in the
   * range for a displayed value if, and only if, the column displays it as
   * that value.
   */
  describe.each<[2 | 4 | 6 | 8, number, RoundingRule]>([
    [4, 2, "round"],
    [4, 2, "truncate"],
    [6, 3, "round"],
    [8, 6, "round"],
  ])(
    "scale %i, %i decimals displayed (%s)",
    (scale, decimals, roundingRule) => {
      const options: ScaledDecimalFilterOptions = {
        type: "ScaledDecimal",
        scale,
        decimals,
        roundingRule,
      };
      const display = (scaled: bigint) =>
        roundScaledDecimal(
          fromScaledInteger(scaled, scale),
          undefined,
          decimals,
          true,
          false,
          false,
          roundingRule,
        );
      const step = 10n ** BigInt(scale - decimals);

      it.each(["0", "1.5", "-1.5", "0.01", "-0.01", "99.99"])(
        "the range for %s matches exactly the values displayed as it",
        (entered) => {
          const displayed = display(toScaledInteger(entered, scale));
          const [from, to] = getScaledDecimalMatchRange(displayed, options);
          const centre = toScaledInteger(displayed, scale);
          // every value within 2 display steps of the entered value
          for (let v = centre - 2n * step; v <= centre + 2n * step; v++) {
            const shown = display(v);
            const sameValue =
              shown === displayed ||
              toScaledInteger(shown, scale) ===
                toScaledInteger(displayed, scale);
            expect(v >= from && v <= to).toBe(sameValue);
          }
        },
      );

      // A value with one more decimal than displayed (where the scale allows)
      // matches the values that would display as it at that precision.
      const finer = decimals + 1;
      if (finer < scale) {
        const finerStep = 10n ** BigInt(scale - finer);
        const displayFiner = (scaled: bigint) =>
          roundScaledDecimal(
            fromScaledInteger(scaled, scale),
            undefined,
            finer,
            true,
            false,
            false,
            roundingRule,
          );
        it.each(["1.5", "-1.5", "0.001", "-0.001"])(
          "the range for %s, with one more decimal, matches the values displayed as it at that precision",
          (entered) => {
            const typed = displayFiner(toScaledInteger(entered, scale));
            const [from, to] = getScaledDecimalMatchRange(typed, options);
            const centre = toScaledInteger(typed, scale);
            for (
              let v = centre - 2n * finerStep;
              v <= centre + 2n * finerStep;
              v++
            ) {
              const sameValue =
                toScaledInteger(displayFiner(v), scale) === centre;
              expect(v >= from && v <= to).toBe(sameValue);
            }
          },
        );
      }
    },
  );
});

describe("scaledDecimalFilterAsQuery", () => {
  const query = (op: string, value: string, options = sd6(2)) =>
    scaledDecimalFilterAsQuery(
      { column: "fxRate", op: op as "=", value },
      options,
    );

  it("applies each operator to the range of matching values", () => {
    expect(query("=", "1.23")).toBe(
      "(fxRate >= 1.225000 and fxRate <= 1.234999)",
    );
    expect(query("!=", "1.23")).toBe(
      "(fxRate < 1.225000 or fxRate > 1.234999)",
    );
    expect(query(">", "1.23")).toBe("fxRate > 1.234999");
    expect(query(">=", "1.23")).toBe("fxRate >= 1.225000");
    expect(query("<", "1.23")).toBe("fxRate < 1.225000");
    expect(query("<=", "1.23")).toBe("fxRate <= 1.234999");
  });

  it("uses a single comparison for an exact match", () => {
    expect(query("=", "1.23", sd6())).toBe("fxRate = 1.230000");
    expect(query(">", "1.234567", sd6(2))).toBe("fxRate > 1.234567");
  });

  it("accepts numeric values, including very small ones", () => {
    expect(
      scaledDecimalFilterAsQuery(
        { column: "weight", op: "=", value: 1e-8 },
        { type: "ScaledDecimal", scale: 8 },
      ),
    ).toBe("weight = 0.00000001");
  });

  it("is used by filterAsQuery for a persisted (JSON) clause", () => {
    expect(
      filterAsQuery({
        column: "fxRate",
        op: "=",
        value: "1.23",
        extendedOptions: sd6(2, "round"),
      }),
    ).toBe("fxRate >= 1.225000 and fxRate <= 1.234999");
  });

  it("does not quote a plain string value on a scaled decimal column", () => {
    expect(
      filterAsQuery(
        { column: "fxRate", op: ">", value: "1.5" },
        {
          columnsByName: {
            fxRate: { name: "fxRate", serverDataType: "scaleddecimal6" },
          },
        },
      ),
    ).toBe("fxRate > 1.5");
  });
});

describe("getScaledDecimalCellFilter", () => {
  const column = {
    serverDataType: "scaleddecimal6" as const,
    type: { name: "number" as const, formatting: { decimals: 2 } },
  };

  it("filters on the value as displayed", () => {
    expect(getScaledDecimalCellFilter(column, "1.234567")).toEqual({
      label: "1.23",
      op: "=",
      value: "1.23",
    });
    expect(getScaledDecimalCellFilter(column, "1.235")).toEqual({
      label: "1.24",
      op: "=",
      value: "1.24",
    });
    expect(getScaledDecimalCellFilter(column, "-0.5")).toEqual({
      label: "-0.50",
      op: "=",
      value: "-0.50",
    });
  });

  it("labels the value with digit grouping, as displayed", () => {
    expect(getScaledDecimalCellFilter(column, "-1234.5")).toEqual({
      label: `${(-1234).toLocaleString()}.50`,
      op: "=",
      value: "-1234.50",
    });
  });

  it("filters on the full value when every decimal is displayed", () => {
    expect(
      getScaledDecimalCellFilter(
        { serverDataType: "scaleddecimal6" },
        "1.234567",
      ),
    ).toEqual({ label: "1.234567", op: "=", value: "1.234567" });
  });

  it("returns undefined for other columns or empty values", () => {
    expect(
      getScaledDecimalCellFilter({ serverDataType: "double" }, "1.2"),
    ).toBeUndefined();
    expect(getScaledDecimalCellFilter(column, "")).toBeUndefined();
  });
});
