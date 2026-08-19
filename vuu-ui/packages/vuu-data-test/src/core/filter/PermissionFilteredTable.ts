import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { Table } from "../../Table";
import type { RowPredicate } from "./PermissionFilter";

/**
 * A per-viewport view of a source table, containing only those rows that
 * satisfy a permission predicate. Changes to the source table are mirrored,
 * an update that moves a row into or out of the permitted set is emitted as
 * an insert or delete.
 */
export class PermissionFilteredTable extends Table {
  #attached = false;
  #indexOfKey: number;
  #predicate: RowPredicate;
  #source: Table;

  constructor(source: Table, predicate: RowPredicate) {
    super(source.schema, source.data.filter(predicate), source.map);
    this.#indexOfKey = source.map[source.schema.key];
    this.#predicate = predicate;
    this.#source = source;
    this.attach();
  }

  get source() {
    return this.#source;
  }

  /**
   * Start mirroring changes from the source table. Invoked on construction,
   * only needs to be called again following dispose.
   */
  attach() {
    if (!this.#attached) {
      this.#source.on("insert", this.handleSourceInsert);
      this.#source.on("update", this.handleSourceUpdate);
      this.#source.on("delete", this.handleSourceDelete);
      this.#attached = true;
    }
  }

  dispose() {
    if (this.#attached) {
      this.#source.removeListener("insert", this.handleSourceInsert);
      this.#source.removeListener("update", this.handleSourceUpdate);
      this.#source.removeListener("delete", this.handleSourceDelete);
      this.#attached = false;
    }
  }

  private contains(key: string) {
    return this.findByKey(key) !== undefined;
  }

  private handleSourceInsert = (row: Array<bigint | VuuRowDataItemType>) => {
    if (this.#predicate(row)) {
      this.insert(row);
    }
  };

  private handleSourceUpdate = (row: Array<bigint | VuuRowDataItemType>) => {
    const key = row[this.#indexOfKey] as string;
    const isMember = this.contains(key);
    const isPermitted = this.#predicate(row);
    if (isMember && isPermitted) {
      this.replaceRow(row);
    } else if (isMember) {
      this.delete(key);
    } else if (isPermitted) {
      this.insert(row);
    }
  };

  private handleSourceDelete = (key: string) => {
    if (this.contains(key)) {
      this.delete(key);
    }
  };

  private replaceRow(row: Array<bigint | VuuRowDataItemType>) {
    const key = row[this.#indexOfKey];
    const rowIndex = this.data.findIndex((r) => r[this.#indexOfKey] === key);
    if (rowIndex !== -1) {
      this.data[rowIndex] = row;
      this.emit("update", row);
    }
  }
}
