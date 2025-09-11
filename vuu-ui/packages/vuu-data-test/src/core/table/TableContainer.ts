import { SchemaColumn, TableSchema } from "@vuu-ui/vuu-data-types";
import { buildDataColumnMapFromSchema, Table } from "../../Table";
import { VuuRowDataItemType, VuuTable } from "@vuu-ui/vuu-protocol-types";
import { ColumnMap } from "@vuu-ui/vuu-utils";
import { UpdateGenerator } from "../../rowUpdates";

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
    data: VuuRowDataItemType[][],
    dataMap: ColumnMap,
    updateGenerator?: UpdateGenerator,
  ) => {
    const table = new Table(schema, data, dataMap, updateGenerator);
    this.addTable(table);
    return table;
  };

  // TODO this is problematic in that it assumes both tables are already created
  // depends on the order in which modules are imnported
  // Make this independent odf base table creation order
  createJoinTable(
    joinTable: VuuTable,
    { table: t1 }: VuuTable,
    { table: t2 }: VuuTable,
    joinColumn: string,
  ) {
    const table1 = this.getTable(t1);
    const table2 = this.getTable(t2);

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
      key: joinColumn,
      table: joinTable,
      columns: Array.from(combinedColumns).map<SchemaColumn>((columnName) => ({
        name: columnName,
        serverDataType: getServerDataType(columnName, schema1, schema2),
      })),
    };

    const data: VuuRowDataItemType[][] = [];
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
