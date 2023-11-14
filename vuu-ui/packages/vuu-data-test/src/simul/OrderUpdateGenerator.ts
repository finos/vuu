import { ArrayDataSource } from "@finos/vuu-data";
import { VuuRange, VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { buildColumnMap, ColumnMap } from "@finos/vuu-utils";
import type {
  RowDelete,
  RowInsert,
  RowUpdates,
  UpdateGenerator,
  UpdateHandler,
} from "../rowUpdates";
import { metadataKeys } from "@finos/vuu-utils";

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

type OrderPhase = "create-order" | "fill-order" | "remove-order";

export class OrderUpdateGenerator implements UpdateGenerator {
  private dataSource: ArrayDataSource | undefined;
  private range: VuuRange | undefined;
  private updateHandler: UpdateHandler | undefined;
  private updating = false;
  private timer: number | undefined;
  private phase: OrderPhase = "create-order";
  private orderCount: number;
  private columnMap?: ColumnMap;

  constructor(orderCount = 20) {
    this.orderCount = orderCount;
  }

  setRange(range: VuuRange) {
    this.range = range;
    if (!this.updating && this.updateHandler) {
      this.startUpdating();
    }
  }

  setDataSource(dataSource: ArrayDataSource) {
    this.dataSource = dataSource;
    this.columnMap = buildColumnMap(dataSource.columns);
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
    const updates: (RowUpdates | RowInsert | RowDelete)[] = [];

    switch (this.phase) {
      case "create-order": {
        updates.push(createOrder());

        const data = this.dataSource?.data;
        if (data && data.length >= this.orderCount) {
          console.log("phase >>> fill");
          this.phase = "fill-order";
        }

        break;
      }

      case "fill-order": {
        console.log("fill-order");
        const data = this.dataSource?.data;
        let filledCount = 0;
        if (data && this.columnMap) {
          const count = data.length;
          const { IDX } = metadataKeys;
          const { filledQuantity: filledKey, quantity: qtyKey } =
            this.columnMap;
          for (const order of data) {
            const {
              [IDX]: rowIdx,
              [filledKey]: filledQty,
              [qtyKey]: quantity,
            } = order;
            if (filledQty < quantity) {
              const newFilledQty = Math.min(
                quantity as number,
                Math.max(100, (filledQty as number) * 1.1)
              );
              updates.push(["U", rowIdx, filledKey, newFilledQty]);
            } else {
              filledCount += 1;
              // schedule for delete
            }
          }
          if (filledCount === count) {
            console.log(">>> remove phase ");
            this.phase = "remove-order";
          }
        }

        break;
      }

      case "remove-order": {
        break;
      }
    }

    if (updates.length > 0) {
      this.updateHandler?.(updates);
    }

    if (this.updating) {
      this.timer = window.setTimeout(this.update, 50);
    }
  };
}
