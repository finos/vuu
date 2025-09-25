import { describe, expect, it } from "vitest";
import { selectItem } from "../src/selection-utils";

describe("selection-utils", () => {
  describe("selectItem", () => {
    describe("single row select", () => {
      it("returns a SelectRowRequest", () => {
        expect(selectItem("single", "key-1", false, false)).toEqual({
          preserveExistingSelection: false,
          rowKey: "key-1",
          type: "SELECT_ROW",
        });
      });
      it("even when activeRowKey passed", () => {
        expect(selectItem("single", "key-1", false, false, "key-5")).toEqual({
          preserveExistingSelection: false,
          rowKey: "key-1",
          type: "SELECT_ROW",
        });
      });
    });

    describe("row range select", () => {
      it("returns a SelectRowRangeRequest", () => {
        expect(selectItem("extended", "key-1", true, false, "key-5")).toEqual({
          preserveExistingSelection: false,
          fromRowKey: "key-1",
          toRowKey: "key-5",
          type: "SELECT_ROW_RANGE",
        });
      });
    });
  });
});
