import { DataSourceRow } from "@finos/vuu-data-types";
import { isRowSelectedLast, metadataKeys, WindowRange } from "@finos/vuu-utils";
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

      // Hack until we can deal with this more elegantly. When we have a block
      // select operation, first row is selected (and updated via server), then
      // remaining rows are selected when we select the block-end row. We get an
      // update for all rows except first. Because we're extending the select status
      // on the client, we have to adjust the first row selected (its still selected
      // but is no longer the 'last selected row in block')
      // Maybe answer is to apply ALL the selection status code here, not in Viewport
      if (data[SELECTED]) {
        const previousRow = this.data[internalIndex - 1];
        if (isRowSelectedLast(previousRow)) {
          this.data[internalIndex - 1] = previousRow.slice() as DataSourceRow;
          this.data[internalIndex - 1][SELECTED] -= 4;
        }
      }
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
