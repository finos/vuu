import { ArrayDataSource } from "@finos/vuu-data";
import { VuuRange } from "@finos/vuu-protocol-types";
import { random } from "./reference-data";
import { RowUpdates, UpdateGenerator, UpdateHandler } from "./rowUpdates";

const getNewValue = (value: number) => {
  const multiplier = random(0, 100) / 1000;
  const direction = random(0, 10) >= 5 ? 1 : -1;
  return value + value * multiplier * direction;
};

export class BaseUpdateGenerator implements UpdateGenerator {
  private dataSource: ArrayDataSource | undefined;
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

  setDataSource(dataSource: ArrayDataSource) {
    this.dataSource = dataSource;
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
      const data = this.dataSource?.currentData;
      if (data && data?.length > 0) {
        const maxRange = Math.min(this.range.to, data.length);
        for (let rowIndex = this.range.from; rowIndex < maxRange; rowIndex++) {
          const shallUpdateRow = random(0, 10) < 2;
          if (shallUpdateRow) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const rowUpdates: RowUpdates = [rowIndex];
            const row = data[rowIndex];
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
        if (updates.length > 0) {
          this.updateHandler(updates);
        }
      }
    }

    if (this.updating) {
      this.timer = window.setTimeout(this.update, 200);
    }
  };
}
