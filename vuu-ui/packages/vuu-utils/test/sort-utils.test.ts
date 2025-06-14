import { describe, expect, it } from "vitest";
import { getSortStatus } from "../src/sort-utils";

describe("getSortStatus", () => {
  it("reports not-sorted if VuuSort is empty", () => {
    expect(getSortStatus({ sortDefs: [] }, "ccy")).toEqual("not-sorted");
  });
  it("reports correctly when column is not present in sort", () => {
    expect(
      getSortStatus(
        { sortDefs: [{ column: "created", sortType: "A" }] },
        "ccy",
      ),
    ).toEqual("not-sorted");
    expect(
      getSortStatus(
        {
          sortDefs: [
            { column: "created", sortType: "D" },
            { column: "lastUpdates", sortType: "D" },
          ],
        },
        "ccy",
      ),
    ).toEqual("not-sorted");
  });
  it("reports correctly when column is only sort column", () => {
    expect(
      getSortStatus({ sortDefs: [{ column: "ccy", sortType: "A" }] }, "ccy"),
    ).toEqual("single-sort-asc");
    expect(
      getSortStatus({ sortDefs: [{ column: "ccy", sortType: "D" }] }, "ccy"),
    ).toEqual("single-sort-desc");
  });
  it("reports correctly when column is only of multiple sort columns", () => {
    expect(
      getSortStatus(
        {
          sortDefs: [
            { column: "ccy", sortType: "A" },
            { column: "created", sortType: "A" },
          ],
        },
        "ccy",
      ),
    ).toEqual("multi-sort-asc");
    expect(
      getSortStatus(
        {
          sortDefs: [
            { column: "created", sortType: "A" },
            { column: "ccy", sortType: "D" },
          ],
        },
        "ccy",
      ),
    ).toEqual("multi-sort-desc");
  });
});
