import { describe, expect, it } from "vitest";
import type { ColumnDescriptorsByName } from "@vuu-ui/vuu-filter-types";
import {
  getFilterAsFormattedText,
  getFilterClauseTextParts,
} from "../src/filter-pill/getFilterTooltipText";

const columnsByName: ColumnDescriptorsByName = {
  marketCap: {
    name: "marketCap",
    label: "Market cap",
    serverDataType: "long",
  },
  pe: { name: "pe", serverDataType: "double" },
  ccy: { name: "ccy", serverDataType: "string" },
};

describe("getFilterAsFormattedText", () => {
  it("shows numeric values in shorthand", () => {
    expect(
      getFilterAsFormattedText(columnsByName)({
        column: "marketCap",
        op: ">",
        value: 30_000_000_000,
      }),
    ).toEqual("Market cap > 30bn");
    expect(
      getFilterAsFormattedText(columnsByName)({
        column: "pe",
        op: "in",
        values: [1_250_000, 12.5],
      }),
    ).toEqual("pe in [1.25m,12.5]");
  });
  it("shows the first clause of a multi clause filter in shorthand", () => {
    expect(
      getFilterAsFormattedText(columnsByName)({
        op: "and",
        filters: [
          { column: "marketCap", op: ">", value: 1000 },
          { column: "ccy", op: "=", value: "EUR" },
        ],
      }),
    ).toEqual("Market cap > 1k and ...");
  });
  it("leaves other values alone", () => {
    expect(
      getFilterAsFormattedText(columnsByName)({
        column: "ccy",
        op: "=",
        value: "EUR",
      }),
    ).toEqual('ccy = "EUR"');
  });
});

describe("getFilterClauseTextParts", () => {
  it("splits the shorthand value from the column and operator", () => {
    expect(
      getFilterClauseTextParts(columnsByName)({
        column: "marketCap",
        op: ">=",
        value: 5_000_000,
      }),
    ).toEqual(["Market cap >= ", "5m"]);
  });
});
