import { describe, expect, it } from "vitest";
import { FilterAggregator } from "../src/FilterAggregator";

describe("FilterAggregator", () => {
  describe("returns correct 'filter'", () => {
    it("WHEN created empty", () => {
      const aggregator = new FilterAggregator();
      expect(aggregator.filter).toBeUndefined();
    });

    it("WHEN created with a single value", () => {
      const aggregator = new FilterAggregator({
        column: "currency",
        op: "=",
        value: "GBP",
      });
      expect(aggregator.filter).toEqual({
        column: "currency",
        op: "=",
        value: "GBP",
      });
    });

    it("WHEN created with a multi-clause filter", () => {
      const aggregator = new FilterAggregator({
        op: "and",
        filters: [
          {
            column: "currency",
            op: "=",
            value: "GBP",
          },
          {
            column: "price",
            op: ">",
            value: 100,
          },
        ],
      });
      expect(aggregator.filter).toEqual({
        op: "and",
        filters: [
          {
            column: "currency",
            op: "=",
            value: "GBP",
          },
          {
            column: "price",
            op: ">",
            value: 100,
          },
        ],
      });
    });
  });

  it("WHEN created with a between filter", () => {
    const aggregator = new FilterAggregator({
      op: "and",
      filters: [
        {
          column: "price",
          op: ">",
          value: 100,
        },
        {
          column: "price",
          op: "<",
          value: 200,
        },
      ],
    });
    expect(aggregator.filter).toEqual({
      op: "and",
      filters: [
        {
          column: "price",
          op: ">",
          value: 100,
        },
        {
          column: "price",
          op: "<",
          value: 200,
        },
      ],
    });
  });
  it("WHEN created with a multi-clause filter, including a between filter", () => {
    const aggregator = new FilterAggregator({
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
              value: 100,
            },
            {
              column: "price",
              op: "<",
              value: 200,
            },
          ],
        },
      ],
    });
    expect(aggregator.filter).toEqual({
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
              value: 100,
            },
            {
              column: "price",
              op: "<",
              value: 200,
            },
          ],
        },
      ],
    });
  });

  describe("GIVEN an empty filter", () => {
    describe("WHEN a simple value is added", () => {
      it("THEN a single filter clause is created", () => {
        const aggregator = new FilterAggregator();
        aggregator.add({ name: "currency", serverDataType: "string" }, "GBP");
        expect(aggregator.filter).toEqual({
          column: "currency",
          op: "=",
          value: "GBP",
        });
      });
    });
    describe("WHEN a value tuple is added", () => {
      describe("AND both tuple values are present", () => {
        it("THEN a between filter is created, with appropriate data types", () => {
          const aggregator = new FilterAggregator();
          aggregator.add({ name: "price", serverDataType: "double" }, [
            "100",
            "200",
          ]);
          expect(aggregator.filter).toEqual({
            op: "and",
            filters: [
              {
                column: "price",
                op: ">",
                value: 100,
              },
              {
                column: "price",
                op: "<",
                value: 200,
              },
            ],
          });
        });
      });
      describe("AND only first range value is present", () => {
        it("THEN an '=' filter is created", () => {
          const aggregator = new FilterAggregator();
          aggregator.add({ name: "price", serverDataType: "double" }, [
            "100",
            "",
          ]);
          expect(aggregator.filter).toEqual({
            column: "price",
            op: "=",
            value: 100,
          });
        });
        describe("AND only second range value is present", () => {
          it("THEN a '<' filter is created", () => {
            const aggregator = new FilterAggregator();
            aggregator.add({ name: "price", serverDataType: "double" }, [
              "",
              "100",
            ]);
            expect(aggregator.filter).toEqual({
              column: "price",
              op: "<",
              value: 100,
            });
          });
        });
      });
    });
  });

  describe("GIVEN an existing filter", () => {
    describe("WHEN a value is added for a new column", () => {
      it("THEN a new filter clause is added", () => {
        const aggregator = new FilterAggregator({
          column: "currency",
          op: "=",
          value: "GBP",
        });

        aggregator.add({ name: "price" }, 100);

        expect(aggregator.filter).toEqual({
          op: "and",
          filters: [
            {
              column: "currency",
              op: "=",
              value: "GBP",
            },
            {
              column: "price",
              op: "=",
              value: "100",
            },
          ],
        });
      });
    });

    describe("WHEN a value is added for an existing column", () => {
      it("THEN if value is simple value, filter clause for that column is replaced", () => {
        const aggregator = new FilterAggregator({
          op: "and",
          filters: [
            {
              column: "currency",
              op: "=",
              value: "GBP",
            },
            {
              column: "price",
              op: "=",
              value: "100",
            },
          ],
        });

        aggregator.add({ name: "price" }, 200);

        expect(aggregator.filter).toEqual({
          op: "and",
          filters: [
            {
              column: "currency",
              op: "=",
              value: "GBP",
            },
            {
              column: "price",
              op: "=",
              value: "200",
            },
          ],
        });
      });
      it("THEN if value is range tuple, and '=' clause exists, replaces with between filter", () => {
        const aggregator = new FilterAggregator({
          op: "and",
          filters: [
            {
              column: "currency",
              op: "=",
              value: "GBP",
            },
            {
              column: "price",
              op: "=",
              value: "100",
            },
          ],
        });

        aggregator.add({ name: "price" }, ["100", "200"]);

        expect(aggregator.filter).toEqual({
          op: "and",
          filters: [
            {
              column: "currency",
              op: "=",
              value: "GBP",
            },
            {
              op: "and",
              filters: [
                {
                  column: "price",
                  op: ">",
                  value: "100",
                },
                {
                  column: "price",
                  op: "<",
                  value: "200",
                },
              ],
            },
          ],
        });
      });
    });
  });
});
