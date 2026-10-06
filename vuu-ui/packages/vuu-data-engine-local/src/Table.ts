import { Table as EngineTable } from "@heswell/vuu-table";
import type { TableSchema } from "@vuu-ui/vuu-data-types";
import type {
  VuuDataRow,
  VuuRowDataItemType,
} from "@vuu-ui/vuu-protocol-types";
import { type ColumnMap, EventEmitter } from "@vuu-ui/vuu-utils";
import type { UpdateGenerator } from "./rowUpdates";

export type TableRow = Array<VuuRowDataItemType | bigint>;

export type TableEvents = {
  delete: (key: string) => void;
  insert: (row: TableRow) => void;
  update: (row: TableRow, columnName?: string, sessionId?: string) => void;
};

/**
 * Module-facing table API, backed by an `@heswell/vuu-table` engine Table.
 *
 * Rows are stored by the engine. Note that deletes are swap-remove, so the
 * order of `data` is insertion order only until the first delete.
 *
 * Events are emitted from engine table listeners, so changes applied
 * directly to the engine table (e.g. by a JoinTable) are also observed.
 */
export class Table extends EventEmitter<TableEvents> {
  readonly engineTable: EngineTable;
  #dataMap: ColumnMap;
  #indexOfKey: number;
  #updateColumnName: string | undefined;

  constructor(
    schemaOrEngineTable: TableSchema | EngineTable,
    data: TableRow[] = [],
    dataMap?: ColumnMap,
    updateGenerator?: UpdateGenerator,
  ) {
    super();
    this.engineTable =
      schemaOrEngineTable instanceof EngineTable
        ? schemaOrEngineTable
        : new EngineTable(schemaOrEngineTable);
    this.#dataMap = dataMap ?? this.engineTable.columnMap;
    this.#indexOfKey = this.engineTable.indexOfKeyField;

    for (const row of data) {
      this.engineTable.insert(row as VuuDataRow);
    }

    this.engineTable.addListener({
      onInsert: (_rowIdx, row) => this.emit("insert", row),
      onUpdate: (_rowIdx, row) =>
        this.emit("update", row, this.#updateColumnName),
      onDelete: (_rowIdx, row) =>
        this.emit("delete", String(row[this.#indexOfKey])),
      onClear: () => undefined,
    });

    updateGenerator?.setTable(this);
    updateGenerator?.setRange({ from: 0, to: 100 });
  }

  get data(): TableRow[] {
    return this.engineTable.rows;
  }

  get map() {
    return this.#dataMap;
  }

  get schema() {
    return this.engineTable.schema;
  }

  get name() {
    return this.engineTable.name;
  }

  get rowCount() {
    return this.engineTable.rowCount;
  }

  delete(key: string) {
    if (!this.engineTable.delete(key)) {
      throw Error(`[Table] delete key ${key} not found`);
    }
  }

  /**
   * @param _emitEvent retained for compatibility with vuu-data-test, the
   * engine always notifies dependent viewports of an insert.
   */
  insert(row: TableRow, _emitEvent = true) {
    const ts = Date.now();
    const { vuuCreatedTimestamp, vuuUpdatedTimestamp } = this.#dataMap;
    if (vuuUpdatedTimestamp !== undefined) row[vuuUpdatedTimestamp] = ts;
    if (vuuCreatedTimestamp !== undefined) row[vuuCreatedTimestamp] = ts;
    this.engineTable.insert(row as VuuDataRow);
  }

  findByKey(key: string): TableRow | undefined {
    return this.engineTable.getRowAtKey(key, false);
  }

  update(key: string, columnName: string, value: bigint | VuuRowDataItemType) {
    const rowIdx = this.engineTable.rowIndexAtKey(key);
    if (rowIdx !== -1) {
      const newRow: TableRow = this.engineTable.rows[rowIdx].slice();
      newRow[this.#dataMap[columnName]] = value;
      this.#updateColumnName = columnName;
      try {
        this.engineTable.update(rowIdx, newRow as VuuDataRow);
      } finally {
        this.#updateColumnName = undefined;
      }
    }
  }

  updateRow(row: TableRow) {
    const rowIdx = this.engineTable.rowIndexAtKey(
      String(row[this.#indexOfKey]),
    );
    if (rowIdx !== -1) {
      this.engineTable.update(rowIdx, row as VuuDataRow);
    }
  }
}

export function buildDataColumnMapFromSchema(schema: Readonly<TableSchema>) {
  const map: ColumnMap = {};
  schema.columns.forEach((col, index) => {
    map[col.name] = index;
  });
  return map;
}

/**
 * Build a data ColumnMap for a table in the provided schema.
 * A data ColumnMap is a mapping from a raw data array to a map, keyed
 * by column name with no additional metadata.
 */
export function buildDataColumnMap<TableName extends string = string>(
  schemas: Readonly<Record<TableName, Readonly<TableSchema>>>,
  tableName: TableName,
) {
  return buildDataColumnMapFromSchema(schemas[tableName]);
}
