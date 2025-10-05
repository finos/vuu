import { WindowRange } from "./range-utils";
import { metadataKeys } from "./column-utils";

export type DataItem = string | number | boolean;
export type DataRow = [
  /** index */
  number,
  /** render index */
  number,
  /** isLeaf */
  boolean,
  /** isExpanded */
  boolean,
  /** depth  */
  number,
  /** child count */
  number,
  /** key  */
  string,
  /** selected */
  number,
  /** data values  */
  ...DataItem[],
];
export type RangeLike = { from: number; to: number };

const { KEY } = metadataKeys;

// const log = (message: string) =>
//   console.log(`%c[DataWindow] ${message}`, "color: purple;font-weight: bold;");
export class DataWindow {
  private range: WindowRange;
  public data: DataRow[];
  public rowCount = 0;
  constructor({ from, to }: RangeLike) {
    this.range = new WindowRange(from, to);
    //internal data is always 0 based, we add range.from to determine an offset
    this.data = new Array(to - from);
    // window.dataWindow = this.data;
    // log(`constructor initial range ${from} - ${to}`);
  }

  setRowCount = (rowCount: number) => {
    // log(`rowCount => ${rowCount}`);
    if (rowCount < this.data.length) {
      this.data.length = rowCount;
    }
    this.rowCount = rowCount;
  };

  // return true if existing row was updated
  add(data: DataRow) {
    const [index] = data;
    if (this.isWithinRange(index)) {
      const internalIndex = index - this.range.from;
      const isUpdate = this.data[internalIndex] !== undefined;
      this.data[internalIndex] = data;
      return isUpdate;
    } else {
      return false;
    }
  }

  getAtIndex(index: number) {
    return this.range.isWithin(index) &&
      this.data[index - this.range.from] != null
      ? this.data[index - this.range.from]
      : undefined;
  }

  getByKey(key: string) {
    return this.data.find((row) => row[KEY] === key);
  }

  isWithinRange(index: number) {
    return this.range.isWithin(index) && index <= this.rowCount;
  }

  setRange(from: number, to: number) {
    // log(`setRange ${from} ${to}`);
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

  hasData(from: number, to: number) {
    const offset = this.range.from;
    const start = from - offset;
    const end = Math.min(to - offset - 1, this.rowCount - 1);
    return this.data[start] !== undefined && this.data[end] !== undefined;
  }

  getData(from: number, to: number): DataRow[] {
    const { from: clientFrom } = this.range;
    const startOffset = Math.max(0, from - clientFrom);
    const endOffset = Math.min(to - clientFrom, this.rowCount ?? to);
    return this.data.slice(startOffset, endOffset);
  }
}
