import { TableSchema } from "@finos/vuu-data";
import { VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { ColumnMap, EventEmitter } from "@finos/vuu-utils";

export type TableEvents = {
  delete: (row: VuuRowDataItemType[]) => void;
  insert: (row: VuuRowDataItemType[]) => void;
  update: (row: VuuRowDataItemType[], columnName: string) => void;
};

export class Table extends EventEmitter<TableEvents> {
  #data: VuuRowDataItemType[][];
  #dataMap: ColumnMap;
  #indexOfKey: number;
  #schema: TableSchema;
  constructor(
    schema: TableSchema,
    data: VuuRowDataItemType[][],
    dataMap: ColumnMap
  ) {
    super();
    this.#data = data;
    this.#dataMap = dataMap;
    this.#schema = schema;
    this.#indexOfKey = dataMap[schema.key];
  }

  get data() {
    return this.#data;
  }

  insert(row: VuuRowDataItemType[]) {
    this.#data.push(row);
    this.emit("insert", row);
  }

  update(key: string, columnName: string, value: VuuRowDataItemType) {
    const rowIndex = this.#data.findIndex(
      (row) => row[this.#indexOfKey] === key
    );
    const colIndex = this.#dataMap[columnName];
    if (rowIndex !== -1) {
      const row = this.#data[rowIndex];
      const newRow = row.slice();
      newRow[colIndex] = value;
      this.#data[rowIndex] = newRow;
      this.emit("update", newRow, columnName);
    }
  }
}
