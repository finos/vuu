import { VuuRange } from "@finos/vuu-protocol-types";
import { generateNextBidAsk, nextRandomDouble, random } from "./data-utils";
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
  private tickingColumns: { [key: string]: number };

  constructor(tickingColumns: { [key: string]: number }) {
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
      const { bid, ask, last, ...rest } = this.tickingColumns;
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

            if (bid !== undefined && ask !== undefined) {
              const { [bid]: currentBid, [ask]: currentAsk } = row as number[];
              const [newBid, newAsk] = generateNextBidAsk(
                currentBid,
                currentAsk,
                10,
                5,
                nextRandomDouble
              );
              rowUpdates[ask] = newAsk;
              rowUpdates[bid] = newBid;
              if (last !== undefined) {
                const newLast =
                  Math.round((currentAsk + (newAsk - currentAsk) / 2) * 100) /
                  100.0;
                rowUpdates[last] = newLast;
              }
            }

            for (const colIdx of Object.values(rest)) {
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
      this.timer = window.setTimeout(this.update, 500);
    }
  };
}
