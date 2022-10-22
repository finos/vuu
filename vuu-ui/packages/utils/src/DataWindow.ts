import { WindowRange } from "./range-utils";

type DataItem = string | number | boolean;
type DataRow = [number, ...DataItem[]];
type RangeLike = { from: number; to: number };

export class DataWindow {
  private range: WindowRange;
  public data: any[];
  public rowCount = 0;
  constructor({ from, to }: RangeLike) {
    this.range = new WindowRange(from, to);
    //internal data is always 0 based, we add range.from to determine an offset
    this.data = new Array(to - from);
  }

  setRowCount = (rowCount: number) => {
    if (rowCount < this.data.length) {
      this.data.length = rowCount;
    }
    this.rowCount = rowCount;
  };

  add(data: DataRow) {
    const [index] = data;
    //onsole.log(`ingest row at rowIndex ${index} [${index - this.range.from}]`)
    if (this.isWithinRange(index)) {
      const internalIndex = index - this.range.from;
      this.data[internalIndex] = data;

      // if (!sequential(this.data)){
      //   debugger;
      // }
    }
  }

  getAtIndex(index: number) {
    return this.range.isWithin(index) &&
      this.data[index - this.range.from] != null
      ? this.data[index - this.range.from]
      : undefined;
  }

  isWithinRange(index: number) {
    return this.range.isWithin(index);
  }

  setRange(from: number, to: number) {
    if (from !== this.range.from || to !== this.range.to) {
      const [overlapFrom, overlapTo] = this.range.overlap(from, to);
      const newData = new Array(to - from);
      for (let i = overlapFrom; i < overlapTo; i++) {
        const data = this.getAtIndex(i);
        if (data) {
          const index = i - from;
          newData[index] = data;
        }
      }
      this.data = newData;
      this.range.from = from;
      this.range.to = to;
    }
  }
}
