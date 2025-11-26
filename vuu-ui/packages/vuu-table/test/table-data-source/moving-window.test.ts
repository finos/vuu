import { beforeEach, describe, expect, it } from "vitest";
import { MovingWindow } from "../../src/table-data-source/moving-window";
import { Range } from "@vuu-ui/vuu-utils";

describe("MovingWindow", () => {
  let dataWindow: MovingWindow;

  beforeEach(() => {
    dataWindow = new MovingWindow(Range(0, 10));
  });

  it("is initialised with a array large enough to store data in range", () => {
    expect(dataWindow.data.length).to.equal(10);
  });

  describe("addRow", () => {
    it("ignores rows outside current range", () => {
      dataWindow.setRowCount(100);
      const row: DataRow = [100];
      dataWindow.add(row);
      expect(dataWindow.data.length).to.equal(10);
      expect(dataWindow.data.findIndex((d) => d === row)).to.equal(-1);
    });

    it("adds a row to internal data, at location determined by row index", () => {
      dataWindow.setRowCount(100);
      const row0: DataRow = [0];
      const row1: DataRow = [1];
      const row2: DataRow = [2];
      dataWindow.add(row0);
      dataWindow.add(row1);
      dataWindow.add(row2);
      expect(dataWindow.data.length).to.equal(10);
      expect(dataWindow.data.findIndex((d) => d === row0)).to.equal(0);
      expect(dataWindow.data.findIndex((d) => d === row1)).to.equal(1);
      expect(dataWindow.data.findIndex((d) => d === row2)).to.equal(2);
    });
  });

  describe("setRange", () => {
    it("discards rows outside the new range", () => {
      dataWindow.setRowCount(100);
      const rows = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(
        (index) => [index] as DataRow,
      );
      rows.forEach((row) => dataWindow.add(row));
      dataWindow.setRange(5, 15);
      expect(dataWindow.data.length).to.equal(10);
      expect(dataWindow.data[0][0]).to.equal(5);
      expect(dataWindow.data[4][0]).to.equal(9);
      expect(dataWindow.data[5]).to.equal(undefined);
    });
  });

  describe("getAtIndex", () => {
    it("returns the row at specified index", () => {
      dataWindow.setRowCount(100);
      const row0: DataRow = [0];
      dataWindow.add(row0);
      const result = dataWindow.getAtIndex(0);
      expect(result).to.equal(row0);
    });

    it("translates index to correct offset within current window", () => {
      dataWindow.setRowCount(100);
      const row8: DataRow = [8];
      dataWindow.add(row8);
      dataWindow.setRange(5, 15);
      const result = dataWindow.getAtIndex(8);
      expect(result).to.equal(row8);
    });
  });

  describe("isWithinRange", () => {
    it("checks index against current window", () => {
      dataWindow.setRowCount(100);
      expect(dataWindow.isWithinRange(0)).to.equal(true);
      expect(dataWindow.isWithinRange(5)).to.equal(true);
      expect(dataWindow.isWithinRange(9)).to.equal(true);
      expect(dataWindow.isWithinRange(10)).to.equal(false);
      dataWindow.setRange(5, 15);
      expect(dataWindow.isWithinRange(0)).to.equal(false);
      expect(dataWindow.isWithinRange(5)).to.equal(true);
      expect(dataWindow.isWithinRange(9)).to.equal(true);
      expect(dataWindow.isWithinRange(10)).to.equal(true);
    });
  });

  describe("setRowCount", () => {
    it("starts at 0", () => {
      expect(dataWindow.rowCount).toEqual(0);
    });
    it("stores rowCount", () => {
      dataWindow.setRowCount(100);
      expect(dataWindow.rowCount).toEqual(100);
    });
    it("does not affect data, when rowCount greater than current range", () => {
      dataWindow.setRowCount(100);
      expect(dataWindow.data.length).toEqual(10);
    });
    it("truncates data, when rowCount less than current range", () => {
      dataWindow.setRowCount(4);
      expect(dataWindow.data.length).toEqual(4);
      expect(dataWindow.isWithinRange(5)).to.equal(false);
    });
  });
  // describe("hasData", () => {});
  // describe("getData", () => {});
});
