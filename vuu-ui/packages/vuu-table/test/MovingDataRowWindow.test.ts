import { beforeEach, describe, expect, it } from "vitest";
import { MovingDataRowWindow } from "../src/table-data-source/DataRowMovingWindow";
import { dataRowFactory, DataRowFunc } from "../src/data-row/DataRow";

describe("MovingDataRowWindow", () => {
  let movingWindow: MovingDataRowWindow;
  let DataRow: DataRowFunc;

  beforeEach(() => {
    movingWindow = new MovingDataRowWindow({ from: 0, to: 10 });
    [DataRow] = dataRowFactory(
      ["col1"],
      [{ name: "col1", serverDataType: "int" }],
    );
  });

  it("is initialised with a array large enough to store data in range", () => {
    expect(movingWindow.data.length).to.equal(10);
  });

  describe("addRow", () => {
    it("ignores rows outside current range", () => {
      movingWindow.setRowCount(100);
      // prettier-ignore
      const row = DataRow([100, 100, false, false, 1, 0, "key-100", 0, 0, false, 100]);
      movingWindow.add(row);
      expect(movingWindow.data.length).to.equal(10);
      expect(movingWindow.data.findIndex((d) => d === row)).to.equal(-1);
    });

    // prettier-ignore
    it("adds a row to internal data, at location determined by row index", () => {
      movingWindow.setRowCount(100);      
      const row0 = DataRow([0, 0, false, false, 1, 0, "key-100", 0, 0, false, 100]);
      const row1 = DataRow([1, 1, false, false, 1, 0, "key-101", 0, 0, false, 101]);
      const row2 = DataRow([2, 2, false, false, 1, 0, "key-102", 0, 0, false, 102]);
      movingWindow.add(row0);
      movingWindow.add(row1);
      movingWindow.add(row2);
      expect(movingWindow.data.length).to.equal(10);
      expect(movingWindow.data.findIndex((d) => d === row0)).to.equal(0);
      expect(movingWindow.data.findIndex((d) => d === row1)).to.equal(1);
      expect(movingWindow.data.findIndex((d) => d === row2)).to.equal(2);
    });
  });

  // prettier-ignore
  describe("setRange", () => {
    it("discards rows outside the new range", () => {
      movingWindow.setRowCount(100);
      const rows = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(
        (index) => DataRow([index,index, false, false, 1, 0, `key-${index}`, 0, 0, false, 1000+index]),
      );
      rows.forEach((row) => movingWindow.add(row));
      movingWindow.setRange({from:5, to:15});
      expect(movingWindow.data.length).to.equal(10);
      expect(movingWindow.data[0].index).to.equal(5);
      expect(movingWindow.data[4].index).to.equal(9);
      expect(movingWindow.data[5]).to.equal(undefined);
    });
  });

  // prettier-ignore
  describe("getAtIndex", () => {
    it("returns the row at specified index", () => {
      movingWindow.setRowCount(100);
      const row0 = DataRow([0, 0, false, false, 1, 0, "key-100", 0, 0, false, 100]);
      movingWindow.add(row0);
      const result = movingWindow.getAtIndex(0);
      expect(result).to.equal(row0);
    });

  // prettier-ignore
    it("translates index to correct offset within current window", () => {
      movingWindow.setRowCount(100);
      const row8=DataRow([8, 8, false, false, 1, 0, "key-108", 0, 0, false, 108]);
      movingWindow.add(row8);
      movingWindow.setRange({from:5, to:15});
      const result = movingWindow.getAtIndex(8);
      expect(result).to.equal(row8);
    });
  });

  // prettier-ignore
  describe("isWithinRange", () => {
    it("checks index against current window", () => {
      movingWindow.setRowCount(100);
      expect(movingWindow.isWithinRange(0)).to.equal(true);
      expect(movingWindow.isWithinRange(5)).to.equal(true);
      expect(movingWindow.isWithinRange(9)).to.equal(true);
      expect(movingWindow.isWithinRange(10)).to.equal(false);
      movingWindow.setRange({from:5, to:15});
      expect(movingWindow.isWithinRange(0)).to.equal(false);
      expect(movingWindow.isWithinRange(5)).to.equal(true);
      expect(movingWindow.isWithinRange(9)).to.equal(true);
      expect(movingWindow.isWithinRange(10)).to.equal(true);
    });
  });

  // prettier-ignore
  describe("setRowCount", () => {
    it("starts at 0", () => {
      expect(movingWindow.rowCount).toEqual(0);
    });
    it("stores rowCount", () => {
      movingWindow.setRowCount(100);
      expect(movingWindow.rowCount).toEqual(100);
    });
    it("does not affect data, when rowCount greater than current range", () => {
      movingWindow.setRowCount(100);
      expect(movingWindow.data.length).toEqual(10);
    });
    it("truncates data, when rowCount less than current range", () => {
      movingWindow.setRowCount(4);
      expect(movingWindow.data.length).toEqual(4);
      // This is wuithon range, but outside rowCount, how should we handle ?
      expect(movingWindow.isWithinRange(5)).to.equal(true);
    });
  });
  // describe("hasData", () => {});
  // describe("getData", () => {});
});
