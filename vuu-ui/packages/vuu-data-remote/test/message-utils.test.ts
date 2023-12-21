import { describe, expect, it } from "vitest";
import { createTableRows } from "./test-utils";

import { groupRowsByViewport } from "../src/message-utils";

describe("message-utils", () => {
  describe("groupRowsByViewport", () => {
    it("returns empty map for empty rowset", () => {
      expect(groupRowsByViewport([])).toEqual({});
    });
    it("preserves order of rows in map by viewport, simple rowset", () => {
      const rows = createTableRows("server-vp-1", 0, 10);
      expect(groupRowsByViewport(rows)).toEqual({
        "server-vp-1": rows,
      });
    });

    it("preserves order of rows in map by viewport, multiple rowsets, same viewport", () => {
      const rows1 = createTableRows("server-vp-1", 0, 10);
      const rows2 = createTableRows("server-vp-1", 0, 10);
      expect(groupRowsByViewport(rows1.concat(rows2))).toEqual({
        "server-vp-1": rows1.concat(rows2),
      });
    });

    it("preserves order of rows in map by viewport, multiple rowsets, multiple viewports", () => {
      const rows1 = createTableRows("server-vp-1", 0, 10);
      const rows2 = createTableRows("server-vp-2", 0, 10);
      expect(groupRowsByViewport(rows1.concat(rows2))).toEqual({
        "server-vp-1": rows1,
        "server-vp-2": rows2,
      });
    });

    it("preserves order of rows in map by viewport, multiple rowsets, multiple viewports, interleaved", () => {
      const rows1 = createTableRows("server-vp-1", 0, 10);
      const rows2 = createTableRows("server-vp-2", 0, 10);
      const rows = rows1
        .concat(rows2)
        .sort(({ rowIndex: i1 }, { rowIndex: i2 }) => i1 - i2);
      expect(groupRowsByViewport(rows)).toEqual({
        "server-vp-1": rows1,
        "server-vp-2": rows2,
      });
    });
  });
});
