import { describe, expect, it } from "vitest";
import { ArrayDataSource } from "@vuu-ui/vuu-data-local";
import type { DataSourceRow } from "@vuu-ui/vuu-data-types";
import type { Filter } from "@vuu-ui/vuu-filter-types";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { metadataKeys, Range, ScaledDecimal6 } from "@vuu-ui/vuu-utils";

const columnDescriptors: ColumnDescriptor[] = [
  { name: "id", serverDataType: "string" },
  { name: "fxRate", serverDataType: "scaleddecimal6" },
];

// scaled decimals are held as scaled integer strings, as sent by the server
const data = [
  ["1.224999", "1224999"],
  ["1.225", "1225000"],
  ["1.23", "1230000"],
  ["1.234999", "1234999"],
  ["1.235", "1235000"],
  ["12.3", "12300000"],
  ["-1.23", "-1230000"],
  ["-1.235", "-1235000"],
  ["0.000001", "1"],
  ["null", ""],
];

const getIds = async (dataSource: ArrayDataSource) =>
  new Promise<string[]>((resolve) => {
    dataSource.subscribe({ range: Range(0, 20) }, (message) => {
      if (message.type === "viewport-update" && message.rows) {
        resolve(
          (message.rows as DataSourceRow[]).map(
            (row) => row[metadataKeys.count] as string,
          ),
        );
      }
    });
  });

const filteredIds = (filter: Filter) => {
  const dataSource = new ArrayDataSource({
    columnDescriptors,
    data: data as never,
    keyColumn: "id",
  });
  dataSource.setFilter(filter);
  return getIds(dataSource);
};

/** A clause as created for a column displaying 2 decimal places */
const displayed = (op: string, value: string): Filter => ({
  column: "fxRate",
  op: op as "=",
  value,
  extendedOptions: {
    type: "ScaledDecimal",
    scale: 6,
    decimals: 2,
    roundingRule: "round",
  },
});

describe("ArrayDataSource, filters on scaled decimal columns", () => {
  it("compares values numerically, at the column scale", async () => {
    expect(
      await filteredIds({ column: "fxRate", op: ">", value: 1.23 }),
    ).toEqual(["1.234999", "1.235", "12.3"]);
    expect(await filteredIds({ column: "fxRate", op: "<", value: 0 })).toEqual([
      "-1.23",
      "-1.235",
    ]);
  });

  it("matches a value exactly", async () => {
    expect(
      await filteredIds({ column: "fxRate", op: "=", value: 1.23 }),
    ).toEqual(["1.23"]);
    expect(
      await filteredIds({ column: "fxRate", op: "=", value: "0.000001" }),
    ).toEqual(["0.000001"]);
  });

  it("matches a ScaledDecimal value", async () => {
    expect(
      await filteredIds({
        column: "fxRate",
        op: ">=",
        value: ScaledDecimal6("1.235"),
      }),
    ).toEqual(["1.235", "12.3"]);
  });

  it("only '!=' matches a null value", async () => {
    expect(
      await filteredIds({ column: "fxRate", op: "!=", value: 1.23 }),
    ).toEqual([
      "1.224999",
      "1.225",
      "1.234999",
      "1.235",
      "12.3",
      "-1.23",
      "-1.235",
      "0.000001",
      "null",
    ]);
  });

  describe("at the displayed precision", () => {
    it("'=' matches every value displayed as the filter value", async () => {
      expect(await filteredIds(displayed("=", "1.23"))).toEqual([
        "1.225",
        "1.23",
        "1.234999",
      ]);
      expect(await filteredIds(displayed("=", "-1.23"))).toEqual(["-1.23"]);
      expect(await filteredIds(displayed("=", "-1.24"))).toEqual(["-1.235"]);
      expect(await filteredIds(displayed("=", "0"))).toEqual(["0.000001"]);
    });

    it("'!=' excludes every value displayed as the filter value, and null", async () => {
      // A range '!=' is expressed as '< from or > to', which no null matches
      expect(await filteredIds(displayed("!=", "1.23"))).toEqual([
        "1.224999",
        "1.235",
        "12.3",
        "-1.23",
        "-1.235",
        "0.000001",
      ]);
    });

    it("'>' and '<' exclude every value displayed as the filter value", async () => {
      expect(await filteredIds(displayed(">", "1.23"))).toEqual([
        "1.235",
        "12.3",
      ]);
      expect(await filteredIds(displayed("<", "1.23"))).toEqual([
        "1.224999",
        "-1.23",
        "-1.235",
        "0.000001",
      ]);
    });

    it("'>=' and '<=' include every value displayed as the filter value", async () => {
      expect(await filteredIds(displayed(">=", "1.23"))).toEqual([
        "1.225",
        "1.23",
        "1.234999",
        "1.235",
        "12.3",
      ]);
      expect(await filteredIds(displayed("<=", "1.22"))).toEqual([
        "1.224999",
        "-1.23",
        "-1.235",
        "0.000001",
      ]);
    });

    it("an inclusive range includes the values displayed as either end", async () => {
      expect(
        await filteredIds({
          op: "and",
          filters: [displayed(">=", "1.22"), displayed("<=", "1.23")],
        }),
      ).toEqual(["1.224999", "1.225", "1.23", "1.234999"]);
    });

    it("a value with more decimals than displayed is matched at its own precision", async () => {
      // 1.225 matches [1.2245, 1.2255)
      expect(await filteredIds(displayed("=", "1.225"))).toEqual([
        "1.224999",
        "1.225",
      ]);
      // 1.2350 matches [1.23495, 1.23505)
      expect(await filteredIds(displayed("=", "1.2350"))).toEqual([
        "1.234999",
        "1.235",
      ]);
    });

    it("a value with as many decimals as the scale is matched exactly", async () => {
      expect(await filteredIds(displayed("=", "1.225000"))).toEqual(["1.225"]);
    });
  });
});
