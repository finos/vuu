import { WithBaseFilter, WithFullConfig } from "@vuu-ui/vuu-data-types";
import { describe, expect, it } from "vitest";
import { combineFilters } from "../../src/datasource/datasource-filter-utils";

describe("datasource-filter-utils", () => {
  const constantProperties: Pick<
    WithFullConfig,
    "aggregations" | "columns" | "groupBy" | "sort"
  > = {
    aggregations: [],
    columns: [],
    groupBy: [],
    sort: { sortDefs: [] },
  };

  describe("combineFilters", () => {
    it("creates a valid WithFullConfig from a baseFilterSpec only", () => {
      const withBaseFilter: WithBaseFilter<WithFullConfig> = {
        ...constantProperties,
        filterSpec: { filter: "" },
        baseFilterSpec: { filter: 'currency="GBP"' },
      };

      const fullConfig = combineFilters(withBaseFilter);
      expect(fullConfig).toEqual({
        ...constantProperties,
        filterSpec: {
          filter: 'currency="GBP"',
          filterStruct: {
            column: "currency",
            op: "=",
            value: "GBP",
          },
        },
      });
    });
  });

  it("creates a valid WithFullConfig from a filterSpec only", () => {
    const withBaseFilter: WithBaseFilter<WithFullConfig> = {
      ...constantProperties,
      filterSpec: { filter: 'currency="GBP"' },
    };

    const fullConfig = combineFilters(withBaseFilter);
    expect(fullConfig).toEqual({
      ...constantProperties,
      filterSpec: {
        filter: 'currency="GBP"',
        filterStruct: {
          column: "currency",
          op: "=",
          value: "GBP",
        },
      },
    });
  });
  it("creates a valid WithFullConfig from a filterSpec only, empty baseFilter", () => {
    const withBaseFilter: WithBaseFilter<WithFullConfig> = {
      ...constantProperties,
      baseFilterSpec: { filter: "" },
      filterSpec: { filter: 'currency="GBP"' },
    };

    const fullConfig = combineFilters(withBaseFilter);
    expect(fullConfig).toEqual({
      ...constantProperties,
      filterSpec: {
        filter: 'currency="GBP"',
        filterStruct: {
          column: "currency",
          op: "=",
          value: "GBP",
        },
      },
    });
  });

  it("creates a valid WithFullConfig from a combined baseFilter and filterSpec", () => {
    const withBaseFilter: WithBaseFilter<WithFullConfig> = {
      ...constantProperties,
      baseFilterSpec: { filter: 'exchange="XLON"' },
      filterSpec: { filter: 'currency="GBP"' },
    };

    const fullConfig = combineFilters(withBaseFilter);
    expect(fullConfig).toEqual({
      ...constantProperties,
      filterSpec: {
        filter: 'currency="GBP" and exchange="XLON"',
        filterStruct: {
          op: "and",
          filters: [
            {
              column: "currency",
              op: "=",
              value: "GBP",
            },
            {
              column: "exchange",
              op: "=",
              value: "XLON",
            },
          ],
        },
      },
    });
  });
});
