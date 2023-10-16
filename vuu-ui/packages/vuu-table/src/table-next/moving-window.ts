import { DataSourceRow } from "@finos/vuu-data-types";
import { metadataKeys, WindowRange } from "@finos/vuu-utils";
import { VuuRange } from "@finos/vuu-protocol-types";

const { SELECTED } = metadataKeys;

export class MovingWindow {
  public data: DataSourceRow[];
  public rowCount = 0;
  private range: WindowRange;

  constructor({ from, to }: VuuRange) {
    this.range = new WindowRange(from, to);
    //internal data is always 0 based, we add range.from to determine an offset
    this.data = new Array(to - from);
    this.rowCount = 0;
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

  getAtIndex(index: number) {
    return this.range.isWithin(index) &&
      this.data[index - this.range.from] != null
      ? this.data[index - this.range.from]
      : undefined;
  }

  isWithinRange(index: number) {
    return this.range.isWithin(index);
  }

  setRange({ from, to }: VuuRange) {
    if (from !== this.range.from || to !== this.range.to) {
      const [overlapFrom, overlapTo] = this.range.overlap(from, to);
      const newData = new Array(Math.max(0, to - from));
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

  getSelectedRows() {
    return this.data.filter((row) => row[SELECTED] !== 0);
  }
}
