import { describe, expect, it } from "vitest";
import { FilterAggregator } from "../src/FilterAggregator";
import { filterAsQuery, Time } from "@vuu-ui/vuu-utils";
import type { Filter } from "@vuu-ui/vuu-filter-types";

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

    describe("WHEN a long value is added", () => {
      it("THEN a single filter clause is created, ", () => {
        const aggregator = new FilterAggregator();
        aggregator.add(
          { name: "id", serverDataType: "long" },
          "1000000000000001234",
        );
        expect(aggregator.filter).toEqual({
          column: "id",
          op: "=",
          value: "1000000000000001234",
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

      describe("WHEN a value tuple is added for a time column", () => {
        const tradeTime = {
              name: "tradeTime",
              serverDataType: "epochtimestamp",
              type: "time",
        } as const;
        const extendedOptions = {
          type: "TimeString",
          date: "today",
          encoding: "epochMillis",
          timeZone: "local",
        };
        const asJson = (filter: unknown) => JSON.parse(JSON.stringify(filter));

        it("THEN a between filter is created with TimeString values, resolved against today", () => {
          const aggregator = new FilterAggregator();
          aggregator.add(tradeTime, ["10:00:00", "12:30:00"]);
          expect(asJson(aggregator.filter)).toEqual({
            op: "and",
            filters: [
              {
                column: "tradeTime",
                op: ">",
                value: "10:00:00",
                extendedOptions,
              },
              {
                column: "tradeTime",
                op: "<",
                value: "12:30:00",
                extendedOptions,
              },
            ],
          });
          expect(filterAsQuery(aggregator.filter as Filter)).toEqual(
            `tradeTime >= ${+Time("10:00:01").asDate()} and tradeTime < ${+Time("12:30:00").asDate()}`,
          );
        });

        it("THEN an '=' filter is created when only first time present, matching the whole second", () => {
          const aggregator = new FilterAggregator();
          aggregator.add(tradeTime, ["09:15:00", ""]);
          expect(asJson(aggregator.filter)).toEqual({
            column: "tradeTime",
            op: "=",
            value: "09:15:00",
            extendedOptions,
          });
          expect(filterAsQuery(aggregator.filter as Filter)).toEqual(
            `tradeTime >= ${+Time("09:15:00").asDate()} and tradeTime < ${+Time("09:15:01").asDate()}`,
          );
        });

        it("THEN a '<' filter is created when only second time present", () => {
          const aggregator = new FilterAggregator();
          aggregator.add(tradeTime, ["", "18:00:00"]);
          expect(asJson(aggregator.filter)).toEqual({
            column: "tradeTime",
            op: "<",
            value: "18:00:00",
            extendedOptions,
          });
        });

        it("THEN a numeric (legacy, previously persisted) time value is converted to a TimeString", () => {
          const aggregator = new FilterAggregator();
          const firstTime = +Time("13:00:00").asDate();
          aggregator.add(tradeTime, [firstTime.toString(), "18:00:00"]);
          expect(asJson(aggregator.filter)).toEqual({
            op: "and",
            filters: [
              {
                column: "tradeTime",
                op: ">",
                value: "13:00:00",
                extendedOptions,
              },
              {
                column: "tradeTime",
                op: "<",
                value: "18:00:00",
                extendedOptions,
              },
            ],
          });
        });

        it("THEN between-inclusive uses >= and <=", () => {
          const aggregator = new FilterAggregator();
          aggregator.add(
            tradeTime,
            ["08:00:00", "09:00:00"],
            "between-inclusive",
          );
          expect(asJson(aggregator.filter)).toEqual({
            op: "and",
            filters: [
              {
                column: "tradeTime",
                op: ">=",
                value: "08:00:00",
                extendedOptions,
              },
              {
                column: "tradeTime",
                op: "<=",
                value: "09:00:00",
                extendedOptions,
              },
            ],
          });
          // <= 09:00:00 includes the whole of that second
          expect(filterAsQuery(aggregator.filter as Filter)).toEqual(
            `tradeTime >= ${+Time("08:00:00").asDate()} and tradeTime < ${+Time("09:00:01").asDate()}`,
          );
        });

        it("THEN nano time columns are serialized with nanosecond values", () => {
          const aggregator = new FilterAggregator();
          aggregator.add(
            {
              name: "tradeTime",
              serverDataType: "epochtimestampnano",
              type: "time",
            },
            "09:15:00",
          );
          expect(filterAsQuery(aggregator.filter as Filter)).toEqual(
            `tradeTime >= ${+Time("09:15:00").asDate()}000000 and tradeTime < ${+Time("09:15:01").asDate()}000000`,
          );
        });
      });

      describe("WHEN a value tuple is added for a date column", () => {
        it("THEN between-inclusive values are typed as epoch millis", () => {
          const aggregator = new FilterAggregator();
          aggregator.add(
            {
              name: "tradeDate",
              serverDataType: "epochtimestamp",
              type: "date/time",
            },
            ["2024-03-01", "2024-03-31"],
            "between-inclusive",
          );
          expect(aggregator.filter).toEqual({
            op: "and",
            filters: [
              {
                column: "tradeDate",
                op: ">=",
                value: new Date(2024, 2, 1).getTime(),
              },
              {
                column: "tradeDate",
                op: "<=",
                value: new Date(2024, 2, 31).getTime(),
              },
            ],
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
