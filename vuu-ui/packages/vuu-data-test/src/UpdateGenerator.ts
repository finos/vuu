import { VuuRange } from "@finos/vuu-protocol-types";
import { random } from "./simul/reference-data";
import type { UpdateGenerator } from "./rowUpdates";
import { Table } from "./Table";

const getNewValue = (value: number) => {
  const multiplier = random(0, 100) / 1000;
  const direction = random(0, 10) >= 5 ? 1 : -1;
  return value + value * multiplier * direction;
};

export class BaseUpdateGenerator implements UpdateGenerator {
  private table: Table | undefined;
  private range: VuuRange | undefined;
  private updating = false;
  private timer: number | undefined;
  private tickingColumns: number[];

  constructor(tickingColumns: number[]) {
    this.tickingColumns = tickingColumns;
  }

  setRange(range: VuuRange) {
    this.range = range;
    if (!this.updating && this.table) {
      this.startUpdating();
    }
  }

  setTable(table: Table) {
    this.table = table;
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
    if (this.range && this.table) {
      const data = this.table?.data;
      if (data && data?.length > 0) {
        const maxRange = Math.min(this.range.to, data.length);
        for (let rowIndex = this.range.from; rowIndex < maxRange; rowIndex++) {
          let updateCount = 0;
          const shallUpdateRow = random(0, 10) < 2;
          if (shallUpdateRow) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const rowUpdates = this.table.data[rowIndex];
            const row = data[rowIndex];
            for (const colIdx of this.tickingColumns) {
              const shallUpdateColumn = random(0, 10) < 5;
              if (shallUpdateColumn) {
                updateCount += 1;
                const newValue = getNewValue(row[colIdx] as number);
                if (this.table) {
                  rowUpdates[colIdx] = newValue;
                }
              }
            }
            if (this.table && updateCount > 0) {
              this.table.updateRow(rowUpdates);
            }
          }
        }
      }
    }

    if (this.updating) {
      this.timer = window.setTimeout(this.update, 200);
    }
  };
}
