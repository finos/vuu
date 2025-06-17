import { describe, expect, it } from "vitest";
import { getSortStatus } from "../src/sort-utils";

describe("getSortStatus", () => {
  it("reports no-sort if VuuSort is empty", () => {
    expect(getSortStatus("ccy", { sortDefs: [] })).toEqual("no-sort");
  });
  it("reports correctly when column is not present in sort", () => {
    expect(
      getSortStatus("ccy", {
        sortDefs: [{ column: "created", sortType: "A" }],
      }),
    ).toEqual("sort-other-column");
    expect(
      getSortStatus("ccy", {
        sortDefs: [
          { column: "created", sortType: "D" },
          { column: "lastUpdates", sortType: "D" },
        ],
      }),
    ).toEqual("sort-other-column");
  });
  it("reports correctly when column is only sort column", () => {
    expect(
      getSortStatus("ccy", { sortDefs: [{ column: "ccy", sortType: "A" }] }),
    ).toEqual("single-sort-asc");
    expect(
      getSortStatus("ccy", { sortDefs: [{ column: "ccy", sortType: "D" }] }),
    ).toEqual("single-sort-desc");
  });
  it("reports correctly when column is only of multiple sort columns", () => {
    expect(
      getSortStatus("ccy", {
        sortDefs: [
          { column: "ccy", sortType: "A" },
          { column: "created", sortType: "A" },
        ],
      }),
    ).toEqual("multi-sort-includes-column-asc");
    expect(
      getSortStatus("ccy", {
        sortDefs: [
          { column: "created", sortType: "A" },
          { column: "ccy", sortType: "D" },
        ],
      }),
    ).toEqual("multi-sort-includes-column-desc");
  });
});
