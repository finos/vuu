import { ArrayDataSource } from "@finos/vuu-data";
import { VuuRange, VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { random } from "./reference-data";
import type { RowUpdates, UpdateGenerator, UpdateHandler } from "../rowUpdates";

const getNewValue = (value: number) => {
  const multiplier = random(0, 100) / 1000;
  const direction = random(0, 10) >= 5 ? 1 : -1;
  return value + value * multiplier * direction;
};

let _orderId = 1;
const orderId = () => `0000000${_orderId++}`.slice(-3);
const createOrder = (): ["I", ...VuuRowDataItemType[]] => {
  const createTime = Date.now();
  return [
    "I",
    "EUR",
    createTime,
    0,
    createTime,
    orderId(),
    1000,
    "AAPL.L",
    "buy",
    "trader-x",
  ];
};

export class OrderUpdateGenerator implements UpdateGenerator {
  private dataSource: ArrayDataSource | undefined;
  private range: VuuRange | undefined;
  private updateHandler: UpdateHandler | undefined;
  private updating = false;
  private timer: number | undefined;

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

      updates.push(createOrder());

      if (updates.length > 0) {
        this.updateHandler(updates);
      }

      if (_orderId > 40) {
        this.updating = false;
      }
    }

    if (this.updating) {
      this.timer = window.setTimeout(this.update, 50);
    }
  };
}
