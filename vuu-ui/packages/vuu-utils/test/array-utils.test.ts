import { describe, expect, it } from "vitest";
import { reorderItems } from "../src/array-utils";

describe("reorderItems", () => {
  it("reorders items to match sortedNames", () => {
    expect(
      reorderItems(
        [{ name: "test1" }, { name: "test2" }, { name: "test3" }],
        ["test3", "test1", "test2"],
      ),
    ).toEqual([{ name: "test3" }, { name: "test1" }, { name: "test2" }]);
  });
  it("ignores duplicates in sortedNames", () => {
    expect(
      reorderItems(
        [{ name: "test1" }, { name: "test2" }, { name: "test3" }],
        ["test3", "test3", "test1", "test2"],
      ),
    ).toEqual([{ name: "test3" }, { name: "test1" }, { name: "test2" }]);
  });
});
