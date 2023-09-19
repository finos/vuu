import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { VuuRange, VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { buildColumnMap } from "@finos/vuu-utils";
import { PriceReferenceData, random } from "./reference-data";
import { RowUpdates, UpdateGenerator, UpdateHandler } from "./rowUpdates";
import { schemas } from "./useSchemas";
import { ExtendedColumnConfig } from "./useTableConfig";
import { ColumnGenerator, RowGenerator } from "./vuu-row-generator";

export const PricesRowGenerator: RowGenerator = () => (index: number) => {
  if (index >= PriceReferenceData.length) {
    throw Error("generateRow index val is too high");
  }

  return PriceReferenceData[index];
};

const { prices: pricesSchema } = schemas;

const { bid, bidSize, ask, askSize } = buildColumnMap(pricesSchema.columns);
const tickingColumns = [bid, bidSize, ask, askSize];

const getNewValue = (value: number) => {
  const multiplier = random(0, 100) / 1000;
  const direction = random(0, 10) >= 5 ? 1 : -1;
  return value + value * multiplier * direction;
};

class PriceUpdateGenerator implements UpdateGenerator {
  private data: ReadonlyArray<VuuRowDataItemType[]> = [];
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
          for (const colIdx of tickingColumns) {
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

export const createPriceUpdateGenerator = () => new PriceUpdateGenerator();

export const PricesColumnGenerator: ColumnGenerator = (
  columns = [],
  columnConfig: ExtendedColumnConfig = {}
) => {
  console.log({ columnConfig });
  const schemaColumns: ColumnDescriptor[] = pricesSchema.columns;
  if (typeof columns === "number") {
    throw Error("PricesColumnGenerator must be passed columns (strings)");
  } else if (columns.length === 0) {
    return schemaColumns;
  } else {
    // TODO return just requested columns and apply extended config
    return schemaColumns;
  }
};
