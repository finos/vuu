import { JoinTable } from "@heswell/vuu-table";
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

  /**
   * Create a materialized (inner) join of two existing tables, backed by an
   * engine JoinTable, maintained incrementally as either source changes.
   * Both source tables must already have been created.
   */
  createJoinTable(
    joinTable: VuuTable,
    { table: t1 }: VuuTable,
    { table: t2 }: VuuTable,
    joinColumn: string,
  ) {
    const table1 = this.getTable(t1);
    const table2 = this.getTable(t2);
    const { schema: schema1 } = table1;
    const { schema: schema2 } = table2;

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

    const engineJoinTable = new JoinTable({
      schema: combinedSchema,
      baseTable: table1.engineTable,
      joinTable: table2.engineTable,
      leftColumn: joinColumn,
      rightColumn: joinColumn,
      joinType: "inner",
    });

    const newTable = new Table(engineJoinTable);
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
    throw Error("how is this possible");
  }
};
