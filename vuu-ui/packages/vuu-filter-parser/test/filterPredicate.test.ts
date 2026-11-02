import type { Filter } from "@vuu-ui/vuu-filter-types";
import type { DataRow } from "@vuu-ui/vuu-table-types";
import { describe, expect, it } from "vitest";
import { filterPredicate } from "../src/filter-evaluation-utils";

/**
 * Long filter values are held as strings (see getTypedValue), long values in
 * local data are numbers.
 */
const columnMap = { code: 0, tradeId: 1 };
const rows = [
  ["123", 4_000_000_000_721],
  ["456", 4_000_000_000_722],
  ["789", 4_000_000_000_723],
];

const matching = (filter: Filter) => {
  const predicate = filterPredicate(columnMap, filter);
  return rows.filter((row) => predicate(row as never)).map(([, id]) => id);
};

const matchingDataRows = (filter: Filter) => {
  const predicate = filterPredicate(filter);
  return rows
    .filter(([code, tradeId]) => predicate({ code, tradeId } as DataRow))
    .map(([, id]) => id);
};

describe("filterPredicate, long values held as strings", () => {
  it.each([
    ["=", [4_000_000_000_722]],
    ["!=", [4_000_000_000_721, 4_000_000_000_723]],
    [">", [4_000_000_000_723]],
    [">=", [4_000_000_000_722, 4_000_000_000_723]],
    ["<", [4_000_000_000_721]],
    ["<=", [4_000_000_000_721, 4_000_000_000_722]],
  ] as const)(
    "'%s' compares a numeric row value as a number",
    (op, expected) => {
      const filter: Filter = { column: "tradeId", op, value: "4000000000722" };
      expect(matching(filter)).toEqual(expected);
      expect(matchingDataRows(filter)).toEqual(expected);
    },
  );

  it("'in' compares a numeric row value as a number", () => {
    const filter: Filter = {
      column: "tradeId",
      op: "in",
      values: ["4000000000721", "4000000000723"],
    };
    const expected = [4_000_000_000_721, 4_000_000_000_723];
    expect(matching(filter)).toEqual(expected);
    expect(matchingDataRows(filter)).toEqual(expected);
  });

  it("a number filter value still matches", () => {
    const filter: Filter = {
      column: "tradeId",
      op: "=",
      value: 4_000_000_000_721,
    };
    expect(matching(filter)).toEqual([4_000_000_000_721]);
  });

  it("a numeric string matches only the same string in a string column", () => {
    expect(matching({ column: "code", op: "=", value: "456" })).toEqual([
      4_000_000_000_722,
    ]);
    expect(matching({ column: "code", op: "=", value: 456 })).toEqual([]);
    expect(
      matching({ column: "code", op: "in", values: ["123", "789"] }),
    ).toEqual([4_000_000_000_721, 4_000_000_000_723]);
  });
});
