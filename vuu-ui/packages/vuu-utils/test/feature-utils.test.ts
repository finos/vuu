import { describe, expect, it } from "vitest";
import {
  getCustomAndTableFeatures,
  type DynamicFeatureDescriptor,
} from "../src/feature-utils";

const tableFeature = (
  featureProps?: DynamicFeatureDescriptor["featureProps"],
): DynamicFeatureDescriptor => ({
  description: "Filter table",
  featureProps,
  id: "filter-table",
  leftNavLocation: "vuu-tables",
  location: "vuu-tables",
  mfComponent: "FilterTable",
  mfScope: "filterTable",
  mfUrl: "/filter-table.js",
  name: "filter-table",
  path: "filter-table",
  title: "Filter table",
  version: 1,
});

describe("getCustomAndTableFeatures", () => {
  it("handles table feature descriptors without featureProps", () => {
    expect(getCustomAndTableFeatures([tableFeature()], [])).toEqual({
      dynamicFeatures: [],
      tableFeatures: [],
    });
  });

  it("expands wildcard table feature descriptors", () => {
    const tableSchema = {
      columns: [],
      table: { module: "SIMUL", table: "instruments" },
    };

    expect(
      getCustomAndTableFeatures(
        [tableFeature({ vuuTables: "*" })],
        [tableSchema],
      ),
    ).toMatchObject({
      dynamicFeatures: [],
      tableFeatures: [
        {
          ComponentProps: { tableSchema },
          title: expect.stringContaining("SIMUL Instruments"),
        },
      ],
    });
  });

  it("omits undefined view props from table-backed custom features", () => {
    const tableSchema = {
      columns: [],
      table: { module: "SIMUL", table: "instruments" },
    };
    const feature = {
      ...tableFeature({
        vuuTables: [{ module: "SIMUL", table: "instruments" }],
      }),
      leftNavLocation: "vuu-features" as const,
    };

    const { dynamicFeatures } = getCustomAndTableFeatures(
      [feature],
      [tableSchema],
    );

    expect(dynamicFeatures).toHaveLength(1);
    expect(dynamicFeatures[0]).not.toHaveProperty("ViewProps");
  });
});
