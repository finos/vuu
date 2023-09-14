import {
  ArrayDataSource,
  ArrayDataSourceConstructorProps,
} from "@finos/vuu-data";
import { VuuRange } from "@finos/vuu-protocol-types";
import { DataSourceRow } from "packages/vuu-data-types";
import { RowUpdates, UpdateGenerator } from "./rowUpdates";

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
    updateGenerator?.setData(super.data);
    updateGenerator?.setUpdateHandler(this.processUpdates);
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
    for (const [rowIndex, ...updates] of rowUpdates) {
      const row = super.data[rowIndex].slice() as DataSourceRow;
      if (row) {
        for (let i = 0; i < updates.length; i += 2) {
          const colIdx = updates[i] as number;
          const colVal = updates[i + 1];
          row[colIdx] = colVal;
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        super.data[rowIndex] = row;
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
