import {
  ArrayDataSource,
  ArrayDataSourceConstructorProps,
  SubscribeCallback,
  SubscribeProps,
} from "@finos/vuu-data";
import { VuuRange } from "@finos/vuu-protocol-types";
import { DataSourceRow } from "@finos/vuu-data-types";
import {
  RowUpdates,
  UpdateGenerator,
} from "@finos/vuu-data-test/src/rowUpdates";

export interface TickingArrayDataSourceConstructorProps
  extends ArrayDataSourceConstructorProps {
  updateGenerator?: UpdateGenerator;
}

export class TickingArrayDataSource extends ArrayDataSource {
  #updateGenerator: UpdateGenerator | undefined;
  constructor({
    updateGenerator,
    ...arrayDataSourceProps
  }: TickingArrayDataSourceConstructorProps) {
    super(arrayDataSourceProps);
    this.#updateGenerator = updateGenerator;
    updateGenerator?.setDataSource(this);
    updateGenerator?.setUpdateHandler(this.processUpdates);
  }

  async subscribe(subscribeProps: SubscribeProps, callback: SubscribeCallback) {
    const subscription = super.subscribe(subscribeProps, callback);
    if (subscribeProps.range) {
      this.#updateGenerator?.setRange(subscribeProps.range);
    }
    return subscription;
  }

  set range(range: VuuRange) {
    super.range = range;
    this.#updateGenerator?.setRange(range);
  }
  get range() {
    return super.range;
  }

  private processUpdates = (rowUpdates: RowUpdates[]) => {
    const updatedRows: DataSourceRow[] = [];
    const data = super.currentData;
    for (const [rowIndex, ...updates] of rowUpdates) {
      const row = data[rowIndex].slice() as DataSourceRow;
      if (row) {
        for (let i = 0; i < updates.length; i += 2) {
          const colIdx = updates[i] as number;
          const colVal = updates[i + 1];
          row[colIdx] = colVal;
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // TODO this is problematic if we're filtered
        // we need to update the correct underlying row
        data[rowIndex] = row;
        updatedRows.push(row);
      }
    }
    super._clientCallback?.({
      clientViewportId: super.viewport,
      mode: "update",
      rows: updatedRows,
      type: "viewport-update",
    });
  };
}
