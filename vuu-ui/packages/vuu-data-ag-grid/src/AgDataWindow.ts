import { DataSourceRow } from "@finos/vuu-data-types";
import { WindowRange } from "@finos/vuu-utils";

export type AgDataItem = string | number | boolean;
export type AgData = { [key: string]: AgDataItem };
export type AgDataRow = [number, AgData];
export type RangeLike = { from: number; to: number };

export class AgDataWindow {
  private range: WindowRange;
  public data: DataSourceRow[];
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

  add(data: DataSourceRow) {
    const [index] = data;
    if (this.isWithinRange(index)) {
      const internalIndex = index - this.range.from;
      this.data[internalIndex] = data;
    }
  }

  clear() {
    this.setRowCount(0);
  }

  update(
    data: DataSourceRow,
    reverseColumnMap: Map<number, string>
  ): (string | number | boolean)[] | undefined {
    const [index] = data;
    const internalIndex = index - this.range.from;
    const dataRow = this.data[internalIndex];

    if (dataRow) {
      let updates: (string | number | boolean)[] | undefined = undefined;
      for (let i = 1; i < dataRow.length; i++) {
        if (dataRow[i] !== data[i]) {
          const key = reverseColumnMap.get(i);
          if (key) {
            const out = updates ?? (updates = []);
            dataRow[i] = data[i];
            out.push(key, data[i]);
          }
        }
      }
      return updates;
    }
  }

  getAtIndex(index: number) {
    return this.range.isWithin(index) &&
      this.data[index - this.range.from] != null
      ? this.data[index - this.range.from]
      : undefined;
  }

  isWithinRange(index: number) {
    return this.range.isWithin(index) && index <= this.rowCount;
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

  hasRow([rowIndex]: DataSourceRow) {
    const offset = this.range.from;
    return this.data[rowIndex + offset] !== undefined;
  }

  hasData(from: number, to: number) {
    const offset = this.range.from;
    const start = from - offset;
    const end = Math.min(to - offset - 1, this.rowCount - 1);
    return this.data[start] !== undefined && this.data[end] !== undefined;
  }

  getData(from: number, to: number): any[] {
    const { from: clientFrom } = this.range;
    const startOffset = Math.max(0, from - clientFrom);
    const endOffset = Math.min(to - clientFrom, this.rowCount ?? to);
    return this.data.slice(startOffset, endOffset);
  }
}
