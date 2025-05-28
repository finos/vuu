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

    it("returns only latest row entry where multiple entries for same row occur, last entry wins where ts match", () => {
      const rows1 = createTableRows("server-vp-1", 0, 10, 100, 1, 0, 1000);
      const rows2 = createTableRows("server-vp-1", 0, 10, 100, 1, 0, 2000);

      const rows = rows1.concat(rows2);

      expect(groupRowsByViewport(rows)).toEqual({
        "server-vp-1": rows2,
      });
    });

    it("returns only latest row entry where multiple entries for same row occur, using ts", () => {
      const rows1 = createTableRows("server-vp-1", 0, 10, 100, 2, 0, 1000);
      const rows2 = createTableRows("server-vp-1", 0, 10, 100, 1, 0, 2000);

      const rows = rows1.concat(rows2);

      expect(groupRowsByViewport(rows)).toEqual({
        "server-vp-1": rows1,
      });
    });

    it("orders rows by rowIndex", () => {
      // create rows in wrong order
      const rows = createTableRows("server-vp-1", 0, 10).sort(
        ({ rowIndex: i1 }, { rowIndex: i2 }) => i2 - i1,
      );
      expect(groupRowsByViewport(rows)).toEqual({
        "server-vp-1": rows.reverse(),
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
