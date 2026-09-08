import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import {
  EventEmitter,
  ValueOf,
  containsSubsetOfItems,
  getAddedItems,
  getRemovedItems,
  itemsOrOrderChanged,
} from "@vuu-ui/vuu-utils";

export const ColumnChangeSource = {
  ColumnPicker: "column-picker",
  ColumnSettings: "column-settings",
  Table: "table",
} as const;
export type ColumnChangeSource = ValueOf<typeof ColumnChangeSource>;

export const SelectedColumnChangeType = {
  CalculatedColumnAdded: "calculated-column-added",
  ColumnAdded: "column-added",
  ColumnRemoved: "column-removed",
  ColumnUpdated: "column-updated",
  ColumnsReordered: "columns-reordered",
} as const;
export type SelectedColumnChangeType = ValueOf<typeof SelectedColumnChangeType>;

export interface SelectedColumnChangeColumnAdded {
  type: Extract<SelectedColumnChangeType, "column-added">;
  column: ColumnDescriptor;
}
export interface SelectedColumnChangeCalculatedColumnAdded {
  type: Extract<SelectedColumnChangeType, "calculated-column-added">;
  column: ColumnDescriptor;
}
export interface SelectedColumnChangeColumnUpdated {
  type: Extract<SelectedColumnChangeType, "column-updated">;
  column: ColumnDescriptor;
}

export interface SelectedColumnChangeColumnRemoved {
  type: Extract<SelectedColumnChangeType, "column-removed">;
  column: ColumnDescriptor;
}

export interface SelectedColumnChangeColumnsReordered {
  type: Extract<SelectedColumnChangeType, "columns-reordered">;
}

export type SelectedColumnChangeDescriptor =
  | SelectedColumnChangeCalculatedColumnAdded
  | SelectedColumnChangeColumnAdded
  | SelectedColumnChangeColumnRemoved
  | SelectedColumnChangeColumnUpdated
  | SelectedColumnChangeColumnsReordered;

export const isColumnAdded = (
  change?: SelectedColumnChangeDescriptor,
): change is SelectedColumnChangeColumnAdded =>
  change?.type === SelectedColumnChangeType.ColumnAdded;
export const isColumnRemoved = (
  change?: SelectedColumnChangeDescriptor,
): change is SelectedColumnChangeColumnRemoved =>
  change?.type === SelectedColumnChangeType.ColumnRemoved;
export const isColumnUpdated = (
  change?: SelectedColumnChangeDescriptor,
): change is SelectedColumnChangeColumnUpdated =>
  change?.type === SelectedColumnChangeType.ColumnUpdated;
export const isColumnsReordered = (
  change?: SelectedColumnChangeDescriptor,
): change is SelectedColumnChangeColumnsReordered =>
  change?.type === SelectedColumnChangeType.ColumnsReordered;

export type ColumnsChangeHandler = (
  columns: readonly ColumnDescriptor[],
  changeSource: ColumnChangeSource,
  changeDescriptor?: SelectedColumnChangeDescriptor,
) => void;
export type ColumnEvents = {
  change: ColumnsChangeHandler;
  render: (o: object) => void;
};

export class ColumnModel extends EventEmitter<ColumnEvents> {
  #selectedColumns: readonly ColumnDescriptor[];

  #selectedColumnsFiltered: readonly ColumnDescriptor[];

  constructor(
    /**
     * All available columns, including selected columns.
     */
    public allColumns: readonly ColumnDescriptor[],
    /**
     * Columns already selected and rendered in Table.
     */
    selectedColumns: readonly ColumnDescriptor[],
  ) {
    super();
    this.#selectedColumns = selectedColumns;
    this.#selectedColumnsFiltered = [...selectedColumns];
  }

  get selectedColumns() {
    return this.#selectedColumns;
  }

  get selectedColumnsFiltered(): readonly ColumnDescriptor[] {
    return this.#selectedColumnsFiltered;
  }

  getColumn(name: string) {
    const col = this.#selectedColumns.find((col) => col.name === name);
    if (col) {
      return col;
    }
    throw Error(`[ColumnModel] columns does not contain column ${name}`);
  }

  /**
   * Introduced for use by ColumnPicker
   */
  addRemoveOrReorderSelectedColumns(
    newSelectedColumns: ColumnDescriptor[],
    source: ColumnChangeSource,
  ) {
    if (!itemsOrOrderChanged(this.#selectedColumns, newSelectedColumns)) {
      throw Error(
        `[ColumnModel] addRemoveOrReorderSelectedColumns no change detected between current and new selected columns`,
      );
    }

    // Determine whether the change is column addition, removal or reordering
    const addedColumns: readonly ColumnDescriptor[] = getAddedItems(
      this.#selectedColumns,
      newSelectedColumns,
    );

    if (addedColumns.length > 0) {
      if (addedColumns.length == 1) {
        this.#selectedColumns = newSelectedColumns;
        this.notifyListeners(this.#selectedColumns, source, {
          type: SelectedColumnChangeType.ColumnAdded,
          column: addedColumns[0],
        });
        return;
      } else {
        throw Error(
          `[ColumnModel] addRemoveOrReorderSelectedColumns attempt to add multiple selected columns in a single call`,
        );
      }
    }

    const removedColumns: readonly ColumnDescriptor[] = getRemovedItems(
      this.#selectedColumns,
      newSelectedColumns,
    );

    if (removedColumns.length > 0) {
      if (removedColumns.length == 1) {
        this.#selectedColumns = newSelectedColumns;
        this.notifyListeners(this.#selectedColumns, source, {
          type: SelectedColumnChangeType.ColumnRemoved,
          column: removedColumns[0],
        });
        return;
      } else {
        throw Error(
          `[ColumnModel] addRemoveOrReorderSelectedColumns attempt to remove multiple selected columns in a single call`,
        );
      }
    }

    // Change must be reordering
    this.#selectedColumns = newSelectedColumns;
    this.notifyListeners(this.#selectedColumns, source, {
      type: SelectedColumnChangeType.ColumnsReordered,
    });
  }

  updateSelectedColumnsFiltered(
    newSelectedColumnsFiltered: ColumnDescriptor[],
  ) {
    if (
      !containsSubsetOfItems(this.#selectedColumns, newSelectedColumnsFiltered)
    ) {
      throw Error(
        `[ColumnModel] updateSelectedColumnsFiltered supplied filtered columns contains unrecognised columns`,
      );
    }

    this.#selectedColumnsFiltered = newSelectedColumnsFiltered;
  }

  removeItemFromSelectedColumns(name: string, source: ColumnChangeSource) {
    const column = this.#selectedColumns.find((col) => col.name === name);
    if (column) {
      const index = this.#selectedColumns.indexOf(column);
      this.#selectedColumns = this.#selectedColumns.toSpliced(index, 1);
      this.notifyListeners(this.#selectedColumns, source, {
        type: SelectedColumnChangeType.ColumnRemoved,
        column,
      });
    } else {
      throw Error(
        `[ColumnModel] removeItemFromSelectedColumns, column '${name}' not found`,
      );
    }
  }

  updateColumn(
    currentColumn: ColumnDescriptor,
    newColumn: ColumnDescriptor,
  ): void;
  updateColumn(column: ColumnDescriptor): void;
  updateColumn(column: ColumnDescriptor, newColumn: ColumnDescriptor = column) {
    const allIndex = this.allColumns.findIndex(
      (col) => col.name === column.name,
    );
    const selectedIndex = this.#selectedColumns.findIndex(
      (col) => col.name === column.name,
    );

    if (selectedIndex !== -1) {
      if (allIndex === -1) {
        throw Error(
          `[ColumnModel] updateColumn, selected column not in allColumns collection`,
        );
      }

      this.#selectedColumns = this.#selectedColumns.toSpliced(
        selectedIndex,
        1,
        newColumn,
      );
      this.allColumns = this.allColumns.toSpliced(allIndex, 1, newColumn);

      this.notifyListeners(this.#selectedColumns, "column-settings", {
        type: SelectedColumnChangeType.ColumnUpdated,
        column,
      });
    } else {
      throw Error(
        `[ColumnModel] updateColumn, column ${column.name} not found`,
      );
    }
  }

  /**
   * Used when adding a calculated column
   *
   * @param column
   *
   * @param addToSelectedColumns
   */
  addColumn(column: ColumnDescriptor, addToSelectedColumns = false) {
    console.log(`[ColumnModel] add column ${JSON.stringify(column)}`);
    if (addToSelectedColumns) {
      console.log(`add it to selected columns`);
    }

    this.allColumns = this.allColumns.concat(column);
    this.#selectedColumns = this.#selectedColumns.concat(column);

    this.notifyListeners(this.#selectedColumns, "column-picker", {
      type: SelectedColumnChangeType.CalculatedColumnAdded,
      column,
    });
  }

  private notifyListeners: ColumnsChangeHandler = (
    columns,
    source,
    changeType,
  ) => {
    this.emit("change", columns, source, changeType);
    this.emit("render", {});
  };
}
