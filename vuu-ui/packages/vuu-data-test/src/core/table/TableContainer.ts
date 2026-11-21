import type { SchemaColumn, TableSchema } from "@vuu-ui/vuu-data-types";
import { buildDataColumnMapFromSchema, Table } from "../../Table";
import type { VuuRowDataItemType, VuuTable } from "@vuu-ui/vuu-protocol-types";
import type { ColumnMap } from "@vuu-ui/vuu-utils";
import type { UpdateGenerator } from "../../rowUpdates";

const DEFAULT_RANGE_LIMITS = {
  maxRangeEnd: 1_000_000,
  maxRangeWidth: 1_000,
};

class TableContainer {
  private constructor() {
    //  empty constructor is all we need
  }
  static #instance: TableContainer;

  public static get instance(): TableContainer {
    if (!TableContainer.#instance) {
      TableContainer.#instance = new TableContainer();
    }
    return TableContainer.#instance;
  }

  #tables = new Map<string, Table>();

  createTable = (
    schema: TableSchema,
    data: Array<Array<VuuRowDataItemType | bigint>> = [],
    dataMap: ColumnMap = buildDataColumnMapFromSchema(schema),
    updateGenerator?: UpdateGenerator,
  ) => {
    const table = new Table(schema, data, dataMap, updateGenerator);
    this.addTable(table);
    return table;
  };

  // TODO this is problematic in that it assumes both tables are already created
  // depends on the order in which modules are imported
  // Make this independent of base table creation order
  createJoinTable(
    joinTable: VuuTable,
    source1: VuuTable | Table,
    source2: VuuTable | Table,
    joinColumn: string,
  ) {
    const table1 =
      source1 instanceof Table ? source1 : this.getTable(source1.table);
    const table2 =
      source2 instanceof Table ? source2 : this.getTable(source2.table);

    // Just copies source tables, then registers update listeners.
    // Not terribly efficient, but good enough for showcase

    const { map: m1, schema: schema1 } = table1;
    const { map: m2, schema: schema2 } = table2;
    const k1 = m1[joinColumn];
    const k2 = m2[joinColumn];

    const combinedColumns = new Set(
      [...schema1.columns, ...schema2.columns].map((col) => col.name).sort(),
    );

    const combinedSchema: TableSchema = {
      key: schema1.key,
      table: joinTable,
      rangeLimits: DEFAULT_RANGE_LIMITS,
      columns: Array.from(combinedColumns).map<SchemaColumn>((columnName) => ({
        name: columnName,
        serverDataType: getServerDataType(columnName, schema1, schema2),
      })),
    };

    const data: Array<bigint | VuuRowDataItemType>[] = [];
    const combinedColumnMap = buildDataColumnMapFromSchema(combinedSchema);
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
    const joinedKeys = new Map<string, Set<string>>();
    const indexJoinedRow = (row: Array<bigint | VuuRowDataItemType>) => {
      const value = String(row[combinedColumnMap[joinColumn]]);
      const key = String(row[combinedColumnMap[schema1.key]]);
      let keys = joinedKeys.get(value);
      if (!keys) {
        keys = new Set();
        joinedKeys.set(value, keys);
      }
      keys.add(key);
    };
    data.forEach(indexJoinedRow);

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
        indexJoinedRow(out);
        newTable.insert(out);
      }
    });

    table1.on("update", (row) => {
      const key = String(row[m1[schema1.key]]);
      const targetRow = newTable.findByKey(key);
      if (targetRow) {
        const updatedRow = targetRow.slice();
        for (const { name } of schema1.columns) {
          updatedRow[combinedColumnMap[name]] = row[m1[name]];
        }
        newTable.updateRow(updatedRow);
      }
    });

    table1.on("delete", (key) => {
      const row = newTable.findByKey(key);
      if (row) {
        const value = String(row[combinedColumnMap[joinColumn]]);
        const keys = joinedKeys.get(value);
        keys?.delete(key);
        if (keys?.size === 0) {
          joinedKeys.delete(value);
        }
        newTable.delete(key);
      }
    });

    table2.on("update", (row) => {
      const keyValue = String(row[k2]);
      for (const key of joinedKeys.get(keyValue) ?? []) {
        const targetRow = newTable.findByKey(key);
        if (!targetRow) {
          continue;
        }
        const updatedRow = targetRow.slice();
        for (const { name } of table2.schema.columns) {
          if (name in m1) {
            continue;
          }
          if (row[m2[name]] !== updatedRow[combinedColumnMap[name]]) {
            updatedRow[combinedColumnMap[name]] = row[m2[name]];
          }
        }
        newTable.updateRow(updatedRow);
      }
    });

    newTable.update = (key, columnName, value) => {
      const row = newTable.findByKey(key);
      if (!row) {
        throw Error(`[TableContainer] join row ${key} not found`);
      }
      if (columnName === schema1.key || columnName === joinColumn) {
        throw Error(`[TableContainer] cannot edit join key ${columnName}`);
      }
      if (columnName in m1) {
        table1.update(key, columnName, value);
      } else if (columnName in m2) {
        table2.update(
          String(row[combinedColumnMap[schema2.key]]),
          columnName,
          value,
        );
      } else {
        throw Error(`[TableContainer] unknown join column ${columnName}`);
      }
    };

    this.addTable(newTable);

    return newTable;
  }

  addTable(table: Table) {
    this.#tables.set(table.name, table);
  }
  getTable<T = Table>(tableName: string) {
    const table = this.#tables.get(tableName) as T;
    if (table) {
      return table;
    } else {
      throw Error(`[TableContainer] no table ${tableName}`);
    }
  }
}

export default TableContainer.instance;

const getServerDataType = (
  columnName: string,
  { columns: cols1, table: t1 }: TableSchema,
  { columns: cols2, table: t2 }: TableSchema,
) => {
  const col1 = cols1.find((col) => col.name === columnName);
  const col2 = cols2.find((col) => col.name === columnName);
  if (col1 && col2) {
    if (col1.serverDataType === col2.serverDataType) {
      return col1.serverDataType;
    } else {
      throw Error(
        `both tables ${t1.table} and ${t2.table} implement column ${columnName}, but with types differ`,
      );
    }
  } else if (col1) {
    return col1.serverDataType;
  } else if (col2) {
    return col2.serverDataType;
  } else {
    throw Error(`how is this possible`);
  }
};
