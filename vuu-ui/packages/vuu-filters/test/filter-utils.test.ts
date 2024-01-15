import {
  Filter,
  FilterClause,
  MultiClauseFilter,
} from "@finos/vuu-filter-types";
import { describe, expect, it } from "vitest";
import { addFilter, filterClauses, replaceClause } from "../src/filter-utils";

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

  describe(`replaceClause`, () => {
    const testFilterClause: FilterClause = {
      op: "=",
      column: "bbg",
      value: "ABC.Z",
    };

    it(`should simply return clause if existing filter is undefined`, () => {
      const res = replaceClause(undefined, testFilterClause, 0);
      expect(res).toEqual(testFilterClause);
    });

    it(`should simply return existing filter unchanged if index out of bound`, () => {
      const existingFilter = {
        op: "!=",
        column: "size",
        value: 3,
      } as const;
      const res = replaceClause(existingFilter, testFilterClause, -1);
      expect(res).toEqual(existingFilter);
    });

    it(`should simply return clause if existing filter is a single clause`, () => {
      const existingFilter = {
        op: "!=",
        column: "size",
        value: 3,
      } as const;
      const res = replaceClause(existingFilter, testFilterClause, 0);
      expect(res).toEqual(testFilterClause);
    });

    it(`should keep the name of the replaced filter`, () => {
      const existingFilter = {
        op: "!=",
        column: "size",
        value: 3,
        name: "Named",
      } as const;
      const res = replaceClause(existingFilter, testFilterClause, 0);
      expect(res).toEqual({ ...testFilterClause, name: "Named" });
    });

    it.each([0, 1])(
      `should correctly replace clause at index %i if existing filter is multi clause with 2 clauses`,
      (i: number) => {
        const existingFilter: MultiClauseFilter = {
          op: "and",
          filters: [
            { op: "!=", column: "size", value: 3 },
            { op: ">", column: "size", value: 0 },
          ],
        };
        const res = replaceClause(existingFilter, testFilterClause, i);
        expect(res).toEqual({
          ...existingFilter,
          filters: [
            ...existingFilter.filters.slice(0, i),
            testFilterClause,
            ...existingFilter.filters.slice(i + 1),
          ],
        });
      }
    );

    describe(`should replace clause in a deeply nested multi clause filter`, () => {
      const nestedMultiClauseFilter: MultiClauseFilter = {
        op: "and",
        filters: [
          { op: "!=", column: "size", value: 3 },
          {
            op: "or",
            filters: [
              {
                op: "and",
                filters: [
                  { column: "currency", op: "=", value: "CAD" },
                  { column: "currency", op: "=", value: "USD" },
                ],
              },
              { column: "country", op: "starts", value: "A" },
              { column: "bbg", op: "!=", value: "LDN.Z" },
            ],
          },
          { op: ">", column: "size", value: 0 },
        ],
      };

      it(`At index 0`, () => {
        const res = replaceClause(nestedMultiClauseFilter, testFilterClause, 0);
        expect(res).toMatchInlineSnapshot(`
          {
            "filters": [
              {
                "column": "bbg",
                "op": "=",
                "value": "ABC.Z",
              },
              {
                "filters": [
                  {
                    "filters": [
                      {
                        "column": "currency",
                        "op": "=",
                        "value": "CAD",
                      },
                      {
                        "column": "currency",
                        "op": "=",
                        "value": "USD",
                      },
                    ],
                    "op": "and",
                  },
                  {
                    "column": "country",
                    "op": "starts",
                    "value": "A",
                  },
                  {
                    "column": "bbg",
                    "op": "!=",
                    "value": "LDN.Z",
                  },
                ],
                "op": "or",
              },
              {
                "column": "size",
                "op": ">",
                "value": 0,
              },
            ],
            "op": "and",
          }
        `);
      });

      it(`At index 2`, () => {
        const res = replaceClause(nestedMultiClauseFilter, testFilterClause, 2);
        expect(res).toMatchInlineSnapshot(`
          {
            "filters": [
              {
                "column": "size",
                "op": "!=",
                "value": 3,
              },
              {
                "filters": [
                  {
                    "filters": [
                      {
                        "column": "currency",
                        "op": "=",
                        "value": "CAD",
                      },
                      {
                        "column": "bbg",
                        "op": "=",
                        "value": "ABC.Z",
                      },
                    ],
                    "op": "and",
                  },
                  {
                    "column": "country",
                    "op": "starts",
                    "value": "A",
                  },
                  {
                    "column": "bbg",
                    "op": "!=",
                    "value": "LDN.Z",
                  },
                ],
                "op": "or",
              },
              {
                "column": "size",
                "op": ">",
                "value": 0,
              },
            ],
            "op": "and",
          }
        `);
      });

      it(`At index 3`, () => {
        const res = replaceClause(nestedMultiClauseFilter, testFilterClause, 3);
        expect(res).toMatchInlineSnapshot(`
          {
            "filters": [
              {
                "column": "size",
                "op": "!=",
                "value": 3,
              },
              {
                "filters": [
                  {
                    "filters": [
                      {
                        "column": "currency",
                        "op": "=",
                        "value": "CAD",
                      },
                      {
                        "column": "currency",
                        "op": "=",
                        "value": "USD",
                      },
                    ],
                    "op": "and",
                  },
                  {
                    "column": "bbg",
                    "op": "=",
                    "value": "ABC.Z",
                  },
                  {
                    "column": "bbg",
                    "op": "!=",
                    "value": "LDN.Z",
                  },
                ],
                "op": "or",
              },
              {
                "column": "size",
                "op": ">",
                "value": 0,
              },
            ],
            "op": "and",
          }
        `);
      });

      const originalClausesFlatList = filterClauses(nestedMultiClauseFilter);
      it.each([0, 1, 4])(
        `the order of indices should follow the one used in filterClauses function (test at index = %i)`,
        // if this test fails, then likely we've introduced a bug when editing a multi clause filter.
        // Explanation: `filterClauses` is used to expand a multi clause filter into separate `FilterClauseEditor`,
        // and then `replaceClause` is used later to replace the updated clause at a given index.
        (idx) => {
          const replacedFromFlatListAtIndex = originalClausesFlatList.map(
            (f, i) => (idx === i ? testFilterClause : f)
          );

          const replacedFromFilter = replaceClause(
            nestedMultiClauseFilter,
            testFilterClause,
            idx
          );

          expect(filterClauses(replacedFromFilter)).toEqual(
            replacedFromFlatListAtIndex
          );
        }
      );
    });
  });
});
