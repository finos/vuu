import { describe, expect, it } from "vitest";
import { getGroupStatus } from "../src/group-utils";

describe("group-utils", () => {
  describe("getGroupStatus", () => {
    it("when no groupby, it correctly identifies no-groupby", () => {
      expect(getGroupStatus("ccy", [])).toEqual("no-groupby");
    });
    it("it correctly identifies 'single-groupby-other-column'", () => {
      expect(getGroupStatus("ccy", ["exchange"])).toEqual(
        "single-groupby-other-column",
      );
    });
    it("it correctly identifies 'multi-groupby-other-columns'", () => {
      expect(getGroupStatus("ccy", ["exchange", "created"])).toEqual(
        "multi-groupby-other-columns",
      );
    });
    it("it correctly identifies 'single-groupby'", () => {
      expect(getGroupStatus("ccy", ["ccy"])).toEqual("single-groupby");
    });
  });
});
