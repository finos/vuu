import { SchemaColumn, TableSchema } from "@finos/vuu-data";
import { VuuRowDataItemType, VuuTable } from "@finos/vuu-protocol-types";
import { ColumnMap, EventEmitter } from "@finos/vuu-utils";
import { UpdateGenerator } from "./rowUpdates";

export type TableEvents = {
  delete: (row: VuuRowDataItemType[]) => void;
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
    updateGenerator?: UpdateGenerator
  ) {
    super();
    this.#data = data;
    this.#dataMap = dataMap;
    this.#schema = schema;
    this.#indexOfKey = dataMap[schema.key];
    this.buildIndex();
    updateGenerator?.setTable(this);
    updateGenerator?.setRange({ from: 0, to: 20 });
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

  insert(row: VuuRowDataItemType[]) {
    const index = this.#data.length;
    this.#data.push(row);
    const key = row[this.#indexOfKey] as string;
    this.#index.set(key, index);
    this.emit("insert", row);
  }

  findByKey(key: string) {
    const index = this.#index.get(key) ?? -1;
    return this.#data[index];
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
  updateRow(row: VuuRowDataItemType[]) {
    const key = row[this.#indexOfKey];
    const rowIndex = this.#data.findIndex(
      (row) => row[this.#indexOfKey] === key
    );
    if (rowIndex !== -1) {
      this.#data[rowIndex] = row;
      this.emit("update", row);
    }
  }
}

export const buildDataColumnMap = (schema: TableSchema) =>
  Object.values(schema.columns).reduce<ColumnMap>((map, col, index) => {
    map[col.name] = index;
    return map;
  }, {});

const getServerDataType = (
  columnName: string,
  { columns: cols1, table: t1 }: TableSchema,
  { columns: cols2, table: t2 }: TableSchema
) => {
  const col1 = cols1.find((col) => col.name === columnName);
  const col2 = cols2.find((col) => col.name === columnName);
  if (col1 && col2) {
    if (col1.serverDataType === col2.serverDataType) {
      return col1.serverDataType;
    } else {
      throw Error(
        `both tables ${t1.table} and ${t2.table} implement column ${columnName}, but with types differ`
      );
    }
  } else if (col1) {
    return col1.serverDataType;
  } else if (col2) {
    return col2.serverDataType;
  } else {
    throw Error(`WTF how is this possible`);
  }
};

// Just copies source tables, then registers update listeners.
// Not terribly efficient, but good enough for showcase
export const joinTables = (
  joinTable: VuuTable,
  table1: Table,
  table2: Table,
  joinColumn: string
) => {
  const { map: m1, schema: schema1 } = table1;
  const { map: m2, schema: schema2 } = table2;
  const k1 = m1[joinColumn];
  const k2 = m2[joinColumn];

  const combinedColumns = new Set(
    [...schema1.columns, ...schema2.columns].map((col) => col.name).sort()
  );

  const combinedSchema: TableSchema = {
    key: joinColumn,
    table: joinTable,
    columns: Array.from(combinedColumns).map<SchemaColumn>((columnName) => ({
      name: columnName,
      serverDataType: getServerDataType(columnName, schema1, schema2),
    })),
  };

  const data: VuuRowDataItemType[][] = [];
  const combinedColumnMap = buildDataColumnMap(combinedSchema);
  // const start = performance.now();
  for (const row of table1.data) {
    const row2 = table2.findByKey(String(row[k1]));
    if (row2) {
      const out = [];
      for (const column of table1.schema.columns) {
        const value = row[m1[column.name]];
        out[combinedColumnMap[column.name]] = value;
      }
      for (const column of table2.schema.columns) {
        const value = row2[m2[column.name]];
        out[combinedColumnMap[column.name]] = value;
      }

      data.push(out);
    }
  }
  // const end = performance.now();
  // console.log(`took ${end - start} ms to create join table ${joinTable.table}`);

  const newTable = new Table(combinedSchema, data, combinedColumnMap);

  table1.on("insert", (row) => {
    const row2 = table2.findByKey(String(row[k1]));
    if (row2) {
      const out = [];
      for (const column of table1.schema.columns) {
        const value = row[m1[column.name]];
        out[combinedColumnMap[column.name]] = value;
      }
      for (const column of table2.schema.columns) {
        const value = row2[m2[column.name]];
        out[combinedColumnMap[column.name]] = value;
      }
      newTable.insert(out);
    }
  });

  table2.on("update", (row) => {
    const keyValue = row[k2] as string;
    const targetRow = newTable.findByKey(keyValue);
    if (targetRow) {
      const updatedRow = targetRow.slice();
      for (const { name } of table2.schema.columns) {
        if (row[m2[name]] !== updatedRow[combinedColumnMap[name]]) {
          updatedRow[combinedColumnMap[name]] = row[m2[name]];
        }
      }
      newTable.updateRow(updatedRow);
    }
  });

  return newTable;
};
