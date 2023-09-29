import { VuuRange, VuuRowDataItemType } from "packages/vuu-protocol-types";
import { RowUpdates, UpdateGenerator, UpdateHandler } from "./rowUpdates";
import { random } from "./reference-data";

const getNewValue = (value: number) => {
  const multiplier = random(0, 100) / 1000;
  const direction = random(0, 10) >= 5 ? 1 : -1;
  return value + value * multiplier * direction;
};

export class BaseUpdateGenerator implements UpdateGenerator {
  private data: ReadonlyArray<VuuRowDataItemType[]> = [];
  private range: VuuRange | undefined;
  private updateHandler: UpdateHandler | undefined;
  private updating = false;
  private timer: number | undefined;
  private tickingColumns: number[];

  constructor(tickingColumns: number[]) {
    this.tickingColumns = tickingColumns;
  }

  setRange(range: VuuRange) {
    this.range = range;
    if (!this.updating && this.updateHandler) {
      this.startUpdating();
    }
  }

  setData(data: ReadonlyArray<VuuRowDataItemType[]>) {
    this.data = data;
  }

  setUpdateHandler(updateHandler: UpdateHandler) {
    this.updateHandler = updateHandler;
    if (!this.updating && this.range) {
      this.startUpdating();
    }
  }

  private startUpdating() {
    this.updating = true;
    this.update();
  }

  private stopUpdating() {
    this.updating = false;
    if (this.timer) {
      window.clearTimeout(this.timer);
      this.timer = undefined;
    }
  }

  update = () => {
    if (this.range && this.updateHandler) {
      const updates: RowUpdates[] = [];
      for (
        let rowIndex = this.range.from;
        rowIndex < this.range.to;
        rowIndex++
      ) {
        const shallUpdateRow = random(0, 10) < 2;
        if (shallUpdateRow) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const rowUpdates: RowUpdates = [rowIndex];
          const row = this.data[rowIndex];
          for (const colIdx of this.tickingColumns) {
            const shallUpdateColumn = random(0, 10) < 5;
            if (shallUpdateColumn) {
              rowUpdates.push(colIdx, getNewValue(row[colIdx] as number));
            }
          }
          if (rowUpdates.length > 1) {
            updates.push(rowUpdates);
          }
        }
      }
      this.updateHandler(updates);
    }

    if (this.updating) {
      this.timer = window.setTimeout(this.update, 200);
    }
  };
}
