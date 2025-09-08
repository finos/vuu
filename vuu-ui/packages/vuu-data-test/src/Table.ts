import { TableSchema } from "@vuu-ui/vuu-data-types";
import { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { ColumnMap, EventEmitter } from "@vuu-ui/vuu-utils";
import { UpdateGenerator } from "./rowUpdates";

export type TableEvents = {
  delete: (key: string) => void;
  insert: (row: VuuRowDataItemType[]) => void;
  update: (row: VuuRowDataItemType[], columnName?: string) => void;
};

export class Table extends EventEmitter<TableEvents> {
  #data: VuuRowDataItemType[][];
  #dataMap: ColumnMap;
  #indexOfKey: number;
  #index = new Map<string, number>();
  #schema: TableSchema;

  constructor(
    schema: TableSchema,
    data: VuuRowDataItemType[][],
    dataMap: ColumnMap,
    updateGenerator?: UpdateGenerator,
  ) {
    super();
    this.#data = data;
    this.#dataMap = dataMap;
    this.#schema = schema;
    this.#indexOfKey = dataMap[schema.key];
    this.buildIndex();
    updateGenerator?.setTable(this);
    updateGenerator?.setRange({ from: 0, to: 100 });
  }

  private buildIndex() {
    for (let i = 0; i < this.#data.length; i++) {
      const key = this.#data[i][this.#indexOfKey] as string;
      this.#index.set(key, i);
    }
  }

  get data() {
    return this.#data;
  }

  get map() {
    return this.#dataMap;
  }

  get schema() {
    return this.#schema;
  }

  get name() {
    return this.#schema.table.table;
  }

  delete(key: string, emitEvent = true) {
    console.log(`[Table] delete key ${key}`);
    const index = this.#index.get(key) ?? -1;
    if (index !== -1) {
      this.#index.delete(key);
      this.#data.splice(index, 1);
      if (emitEvent) {
        this.emit("delete", key);
      }
    } else {
      throw Error(`[Table] delete key ${key} not found`);
    }
  }

  insert(row: VuuRowDataItemType[], emitEvent = true) {
    const index = this.#data.length;
    this.#data.push(row);
    const key = row[this.#indexOfKey] as string;
    this.#index.set(key, index);
    if (emitEvent) {
      this.emit("insert", row);
    }
  }

  findByKey(key: string) {
    const index = this.#index.get(key) ?? -1;
    return this.#data[index];
  }

  update(key: string, columnName: string, value: VuuRowDataItemType) {
    const rowIndex = this.#data.findIndex(
      (row) => row[this.#indexOfKey] === key,
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
  updateRow(row: VuuRowDataItemType[]) {
    const key = row[this.#indexOfKey];
    const rowIndex = this.#data.findIndex(
      (row) => row[this.#indexOfKey] === key,
    );
    if (rowIndex !== -1) {
      this.#data[rowIndex] = row;
      this.emit("update", row);
    }
  }
}

export function buildDataColumnMapFromSchema(schema: Readonly<TableSchema>) {
  return Object.values(schema.columns).reduce<ColumnMap>(
    (map, col, index) => ({
      ...map,
      [col.name]: index,
    }),
    {},
  );
}

/**
 * Build a data ColumnMap for a table in the provided schema.
 * A data ColumnMap is a mapping from a raw data array to a map, keyed
 * by column name with no additional metadata.
 *
 * @param schemas
 * @param tableName
 * @returns
 */
export function buildDataColumnMap<TableName extends string = string>(
  schemas: Readonly<Record<TableName, Readonly<TableSchema>>>,
  tableName: TableName,
) {
  return buildDataColumnMapFromSchema(schemas[tableName]);
}
