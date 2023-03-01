import { describe, expect, test } from "vitest";
import { ArrayBackedMovingWindow } from "../src/server-proxy/array-backed-moving-window";
import { createTableRows } from "./test-utils";

function applyUpdates(movingWindow, rows) {
  rows.forEach((row) => {
    movingWindow.setAtIndex(row);
  });
}

describe("ArrayBackedMovingWindow", () => {
  describe("VUU type updates", () => {
    test("setRange before data arrives", () => {
      // This test was originally created with data captured from debugging session, ie actual Vuu server responses.
      const movingWindow = new ArrayBackedMovingWindow(
        { from: 0, to: 19 },
        { from: 0, to: 19 },
        0
      );
      const data = createTableRows("VP-001", 0, 25);
      applyUpdates(movingWindow, data);
      expect(movingWindow.internalData).toHaveLength(19);
      movingWindow.setRange(12, 31);

      // prettier-ignore
      // eslint-disable-next-line no-sparse-arrays
      expect(movingWindow.internalData.map((r) => r.rowIndex)).toEqual([12,13,14,15,16,17,18,,,,,,,,,,,,,]);

      movingWindow.setRange(29, 48);

      expect(movingWindow.internalData.map((r) => r[0])).toEqual(new Array(19));
    });

    test("simple update", () => {
      const movingWindow = new ArrayBackedMovingWindow(
        { from: 0, to: 25 },
        { from: 0, to: 25 },
        0
      );

      const data = createTableRows("VP-001", 0, 25);
      applyUpdates(movingWindow, data);

      // prettier-ignore
      const updates = [
        {rowIndex: 2, data:["AAA.OQ Co.","EUR","XNYS/NYS-MAIN",500,435,439.35,"","","","noop"]},
        {rowIndex: 9, data:["AAC.N Corporation","CAD","XNGS/NAS-GSM",1000,72,102,"","","","fastTick"]},
      ];

      applyUpdates(movingWindow, updates);

      // TODO update once we add support for keys
      // prettier-ignore
      expect(movingWindow.internalData[2]).toEqual(
        {rowIndex: 2, data:["AAA.OQ Co.","EUR","XNYS/NYS-MAIN",500,435,439.35,"","","","noop"]}
      );

      // prettier-ignore
      expect(movingWindow.internalData[9]).toEqual(
        {rowIndex: 9, data:["AAC.N Corporation","CAD","XNGS/NAS-GSM",1000,72,102,"","","","fastTick"]}
      );
    });

    test("mismatched ranges I", () => {
      const movingWindow = new ArrayBackedMovingWindow(
        { from: 0, to: 25 },
        { from: 0, to: 25 },
        0
      );
      applyUpdates(movingWindow, createTableRows("VP-001", 0, 25));

      movingWindow.setRange(31, 56);

      applyUpdates(movingWindow, createTableRows("VP-001", 0, 33));

      expect(movingWindow.internalData.map((r) => r.rowIndex)).toEqual(
        [31, 32].concat(new Array(23))
      );
    });

    test("mismatched ranges II", () => {
      const movingWindow = new ArrayBackedMovingWindow(
        { from: 0, to: 25 },
        { from: 0, to: 25 },
        0
      );

      applyUpdates(movingWindow, createTableRows("VP-001", 0, 25));

      movingWindow.setRange(2, 21);
      movingWindow.setRange(6, 25);
      movingWindow.setRange(11, 30);

      applyUpdates(movingWindow, createTableRows("VP-001", 2, 30));

      // prettier-ignore
      expect(movingWindow.internalData.map((r) => r.rowIndex)).toEqual([
        11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
      ]);
    });
  });

  describe("VUU Scrolling", () => {
    test("Scrolling FWD from top, then BWD, many scolls before data response", () => {
      const movingWindow = new ArrayBackedMovingWindow(
        { from: 0, to: 25 },
        { from: 0, to: 25 },
        0
      );
      applyUpdates(movingWindow, createTableRows("VP-001", 0, 25));

      movingWindow.setRange(6, 31);
      movingWindow.setRange(13, 38);
      movingWindow.setRange(18, 43);
      movingWindow.setRange(28, 53);
      movingWindow.setRange(37, 62);
      movingWindow.setRange(45, 70);
      movingWindow.setRange(53, 78);
      movingWindow.setRange(60, 85);
      movingWindow.setRange(66, 91);
      movingWindow.setRange(72, 97);
      movingWindow.setRange(76, 101);

      // This set of rows is already out of range so will be ignored
      applyUpdates(movingWindow, createTableRows("VP-001", 18, 63));

      applyUpdates(movingWindow, createTableRows("VP-001", 50, 95));

      expect(movingWindow.internalData.map((r) => r.rowIndex)).toEqual(
        [
          76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92,
          93, 94,
        ].concat(new Array(6))
      );

      movingWindow.setRange(80, 105);
      movingWindow.setRange(87, 112);

      applyUpdates(movingWindow, createTableRows("VP-001", 66, 111));

      movingWindow.setRange(89, 114);
      movingWindow.setRange(91, 116);
      movingWindow.setRange(92, 117);

      applyUpdates(movingWindow, createTableRows("VP-001", 70, 115));
      applyUpdates(movingWindow, createTableRows("VP-001", 82, 127));
      // prettier-ignore
      applyUpdates(movingWindow, [
        {rowIndex: 120, data: ["AAG.L London PLC","EUR","XLON/LSE-SETS",928,690,696.9,"","","","walkBidAsk"]},
      ]);

      // Turn around
      movingWindow.setRange(90, 115);
      movingWindow.setRange(82, 107);
      movingWindow.setRange(70, 95);
      movingWindow.setRange(63, 88);
      movingWindow.setRange(48, 73);

      applyUpdates(movingWindow, createTableRows("VP-001", 53, 98));

      // We don't get all the rows we need to fill the buffer, we're missing 5 rows from the leading edge of range
      // and the entire leading buffer;
      movingWindow.setRange(34, 59);
      movingWindow.setRange(22, 47);
      movingWindow.setRange(11, 36);

      applyUpdates(movingWindow, createTableRows("VP-001", 12, 57));

      movingWindow.setRange(2, 27);
      movingWindow.setRange(0, 25);
      // prettier-ignore
      applyUpdates(movingWindow, createTableRows("VP-001", 0, 35));

      expect(movingWindow.internalData.map((r) => r.rowIndex)).toEqual([
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
        20, 21, 22, 23, 24,
      ]);
    });
  });
});
