import { Filter } from "@finos/vuu-filter-types";
import { describe, expect, it } from "vitest";
import { addFilter } from "../src/filter-utils";

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
