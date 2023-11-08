import { TableSchema } from "@finos/vuu-data";
import { VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { EventEmitter } from "@finos/vuu-utils";

export type TableEvents = {
  delete: (row: VuuRowDataItemType[]) => void;
  insert: (row: VuuRowDataItemType[]) => void;
};

export class Table extends EventEmitter<TableEvents> {
  #data: VuuRowDataItemType[][];
  #schema: TableSchema;
  constructor(schema: TableSchema, data: VuuRowDataItemType[][]) {
    super();
    this.#data = data;
    this.#schema = schema;
  }

  get data() {
    return this.#data;
  }

  insert(row: VuuRowDataItemType[]) {
    this.#data.push(row);
    this.emit("insert", row);
  }
}
