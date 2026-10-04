import { describe, expect, it } from "vitest";
import type { TableSchema } from "@vuu-ui/vuu-data-types";
import {
  type DynamicFeatureDescriptor,
  getCustomAndTableFeatures,
} from "../src/feature-utils";

const schema = (module: string, table: string): TableSchema => ({
  columns: [],
  key: "id",
  table: { module, table },
});

const tableSchemas = [
  schema("SIMUL", "instruments"),
  schema("SIMUL", "SPREADSHEET"),
  schema("BASKET", "basket"),
];

const spreadsheetFeature: DynamicFeatureDescriptor = {
  featureProps: { vuuTables: ["SPREADSHEET"] },
  icon: "spreadsheet",
  leftNavLocation: "vuu-tables",
  name: "spreadsheet",
  title: "Spreadsheet",
  url: "spreadsheet.js",
};

const filterTableFeature: DynamicFeatureDescriptor = {
  featureProps: { vuuTables: "*" },
  leftNavLocation: "vuu-tables",
  name: "filter-table",
  title: "Vuu Filter Table",
  url: "filter-table.js",
};

describe("getCustomAndTableFeatures", () => {
  it("creates a wildcard table feature for every table", () => {
    const { tableFeatures } = getCustomAndTableFeatures(
      [filterTableFeature],
      tableSchemas,
    );
    expect(tableFeatures.map((f) => f.title)).toEqual([
      "SIMUL Instruments ",
      "SIMUL SPREADSHEET ",
      "BASKET Basket ",
    ]);
  });

  it("creates table-specific features only for matching tables, after wildcard features", () => {
    const { tableFeatures } = getCustomAndTableFeatures(
      [spreadsheetFeature, filterTableFeature],
      tableSchemas,
    );
    expect(tableFeatures).toHaveLength(4);
    const spreadsheetFeatures = tableFeatures.filter(
      (f) => f.ComponentProps?.tableSchema.table.table === "SPREADSHEET",
    );
    expect(spreadsheetFeatures.map(({ url, icon }) => ({ url, icon }))).toEqual(
      [
        { url: "filter-table.js", icon: undefined },
        { url: "spreadsheet.js", icon: "spreadsheet" },
      ],
    );
    expect(spreadsheetFeatures[1].title).toEqual(
      "SIMUL SPREADSHEET (Spreadsheet)",
    );
  });

  it("resolves custom feature schemas by VuuTable", () => {
    const { dynamicFeatures } = getCustomAndTableFeatures(
      [
        {
          featureProps: { vuuTables: [{ module: "BASKET", table: "basket" }] },
          leftNavLocation: "vuu-features",
          name: "basket",
          title: "Basket",
          url: "basket.js",
        },
      ],
      tableSchemas,
    );
    expect(dynamicFeatures[0].ComponentProps).toEqual({
      basketSchema: tableSchemas[2],
    });
  });
});
