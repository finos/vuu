import { Filter } from "@vuu-ui/vuu-filter-types";
import { describe, expect, it } from "vitest";
import {
  addFilter,
  findMatchingFilter,
  getFilterClausesForDisplay,
} from "../src/filter-utils";

describe("filter-utils", () => {
  describe("addFilter", () => {
    it("adds two filters on same column, equality test", () => {
      const filter1: Filter = {
        column: "currency",
        op: "=",
        value: "EUR",
      };
      const filter2: Filter = {
        column: "currency",
        op: "=",
        value: "USD",
      };
      const mergedFilter = addFilter(filter1, filter2) as Filter;
      expect(mergedFilter).toEqual({
        column: "currency",
        op: "in",
        values: ["EUR", "USD"],
      });
    });

    it("adds two filters on same column, both in", () => {
      const filter1: Filter = {
        column: "currency",
        op: "in",
        values: ["EUR"],
      };
      const filter2: Filter = {
        column: "currency",
        op: "in",
        values: ["USD"],
      };
      const mergedFilter = addFilter(filter1, filter2) as Filter;
      expect(mergedFilter).toEqual({
        column: "currency",
        op: "in",
        values: ["EUR", "USD"],
      });
    });

    it("adds two filters on same column, equals and in", () => {
      const filter1: Filter = {
        column: "currency",
        op: "in",
        values: ["EUR"],
      };
      const filter2: Filter = {
        column: "currency",
        op: "=",
        value: "USD",
      };
      const mergedFilter = addFilter(filter1, filter2) as Filter;
      expect(mergedFilter).toEqual({
        column: "currency",
        op: "in",
        values: ["EUR", "USD"],
      });
    });

    it("adds two filters on same column, different operators", () => {
      const filter1: Filter = {
        column: "ric",
        op: "starts",
        value: "A",
      };
      const filter2: Filter = {
        column: "ric",
        op: "ends",
        value: ".L",
      };
      const mergedFilter = addFilter(filter1, filter2) as Filter;
      expect(mergedFilter).toEqual({
        filters: [
          {
            column: "ric",
            op: "starts",
            value: "A",
          },
          {
            column: "ric",
            op: "ends",
            value: ".L",
          },
        ],
        op: "and",
      });
    });

    it("adds two filters on different columns, defaulting to and", () => {
      const filter1: Filter = {
        column: "currency",
        op: "=",
        value: "EUR",
      };
      const filter2: Filter = {
        column: "exchange",
        op: "=",
        value: "XLON",
      };
      const mergedFilter = addFilter(filter1, filter2) as Filter;
      expect(mergedFilter).toEqual({
        filters: [
          {
            column: "currency",
            op: "=",
            value: "EUR",
          },
          {
            column: "exchange",
            op: "=",
            value: "XLON",
          },
        ],
        op: "and",
      });
    });
  });

  it("adds two filters on different columns, explicit and", () => {
    const filter1: Filter = {
      column: "currency",
      op: "=",
      value: "EUR",
    };
    const filter2: Filter = {
      column: "exchange",
      op: "=",
      value: "XLON",
    };
    const mergedFilter = addFilter(filter1, filter2, {
      combineWith: "and",
    }) as Filter;
    expect(mergedFilter).toEqual({
      filters: [
        {
          column: "currency",
          op: "=",
          value: "EUR",
        },
        {
          column: "exchange",
          op: "=",
          value: "XLON",
        },
      ],
      op: "and",
    });
  });

  it("adds two filters on different columns, explicit or", () => {
    const filter1: Filter = {
      column: "currency",
      op: "=",
      value: "EUR",
    };
    const filter2: Filter = {
      column: "exchange",
      op: "=",
      value: "XLON",
    };
    const mergedFilter = addFilter(filter1, filter2, {
      combineWith: "or",
    }) as Filter;
    expect(mergedFilter).toEqual({
      filters: [
        {
          column: "currency",
          op: "=",
          value: "EUR",
        },
        {
          column: "exchange",
          op: "=",
          value: "XLON",
        },
      ],
      op: "or",
    });
  });
});

describe("getFilterClausesForDisplay", () => {
  it("handles single clause filters", () => {
    expect(
      getFilterClausesForDisplay({
        column: "currency",
        op: "=",
        value: "GBP",
      }),
    ).toEqual([["currency", "GBP"]]);
  });
  it("handles between filters", () => {
    expect(
      getFilterClausesForDisplay({
        op: "and",
        filters: [
          {
            column: "price",
            op: ">",
            value: 1000,
          },
          {
            column: "price",
            op: "<",
            value: 2000,
          },
        ],
      }),
    ).toEqual([["price", "1000 - 2000"]]);
  });
  it("handles multi clause", () => {
    expect(
      getFilterClausesForDisplay({
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
            value: "XLON/SETS",
          },
        ],
      }),
    ).toEqual([
      ["currency", "GBP"],
      ["exchange", "XLON/SETS"],
    ]);
  });
  it("handles multi clause, with between", () => {
    expect(
      getFilterClausesForDisplay({
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
            value: "XLON/SETS",
          },
          {
            op: "and",
            filters: [
              {
                column: "price",
                op: ">",
                value: 1000,
              },
              {
                column: "price",
                op: "<",
                value: 2000,
              },
            ],
          },
        ],
      }),
    ).toEqual([
      ["currency", "GBP"],
      ["exchange", "XLON/SETS"],
      ["price", "1000 - 2000"],
    ]);
  });

  describe("findMatchingFilter", () => {
    it("finds a match within list of FilterContainerFilterDescriptor", () => {
      const target = findMatchingFilter(
        [
          {
            active: false,
            filter: {
              name: "Exchange",
              column: "exchange",
              op: "=",
              value: "XLON/SETS",
            },
            id: "filter-1",
          },
          {
            active: false,
            filter: {
              name: "Filter One",
              column: "currency",
              op: "=",
              value: "GBP",
            },
            id: "filter-1",
          },
        ],
        {
          column: "currency",
          op: "=",
          value: "GBP",
        },
      );

      expect(target).toEqual({
        active: false,
        filter: {
          name: "Filter One",
          column: "currency",
          op: "=",
          value: "GBP",
        },
        id: "filter-1",
      });
    });
    it("returns undefined when no match found", () => {
      const target = findMatchingFilter(
        [
          {
            active: false,
            filter: {
              name: "Exchange",
              column: "exchange",
              op: "=",
              value: "XLON/SETS",
            },
            id: "filter-1",
          },
          {
            active: false,
            filter: {
              name: "Filter One",
              column: "currency",
              op: "=",
              value: "USD",
            },
            id: "filter-1",
          },
        ],
        {
          column: "currency",
          op: "=",
          value: "GBP",
        },
      );

      expect(target).toBeUndefined();
    });
  });
});
