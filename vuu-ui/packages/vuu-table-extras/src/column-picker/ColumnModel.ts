import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { EventEmitter, reorderColumnItems, ValueOf } from "@vuu-ui/vuu-utils";

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

const byColumnName = (
  { name: n1, label: l1 = n1 }: ColumnDescriptor,
  { name: n2, label: l2 = n2 }: ColumnDescriptor,
) => (l1 > l2 ? 1 : l2 > l1 ? -1 : 0);

const filterColumns = (
  columns: readonly ColumnDescriptor[],
  pattern: string,
) => {
  if (pattern) {
    const lowerCasePattern = pattern.toLowerCase();
    return columns.filter(
      ({ name, label = name }) =>
        label.toLowerCase().indexOf(lowerCasePattern) !== -1,
    );
  } else {
    return columns;
  }
};

export class ColumnModel extends EventEmitter<ColumnEvents> {
  #searchPattern = "";
  #selectedColumns: readonly ColumnDescriptor[];
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
  }

  get availableColumns(): ColumnDescriptor[] {
    return filterColumns(this.allColumns, this.#searchPattern)
      .filter(
        ({ name }) =>
          this.#selectedColumns.findIndex((c) => c.name === name) === -1,
      )
      .toSorted(byColumnName);
  }

  set searchPattern(pattern: string) {
    const searchPattern = pattern;
    if (searchPattern !== this.#searchPattern) {
      this.#searchPattern = searchPattern;
      this.emit("render", {});
    }
  }

  get searchPattern() {
    return this.#searchPattern ?? "";
  }

  get selectedColumns() {
    return filterColumns(this.#selectedColumns, this.#searchPattern);
  }
  setSelectedColumns(
    selectedColumns: ColumnDescriptor[],
    source: ColumnChangeSource,
    changeDescriptor?: SelectedColumnChangeDescriptor,
  ) {
    this.#selectedColumns = selectedColumns;
    this.notifyListeners(selectedColumns, source, changeDescriptor);
  }

  getColumn(name: string) {
    const col = this.#selectedColumns.find((col) => col.name === name);
    if (col) {
      return col;
    }
    throw Error(`[ColumnModel] columns does not contain column ${name}`);
  }

  addItemToSelectedColumns(name: string, source: ColumnChangeSource) {
    const column = this.allColumns.find((col) => col.name === name);
    if (column) {
      this.#selectedColumns = this.#selectedColumns.concat(column);
      this.notifyListeners(this.#selectedColumns, source, {
        type: SelectedColumnChangeType.ColumnAdded,
        column,
      });
    } else {
      throw Error(
        `[ColumnModel] addItemToSelectedColumns, column '${name}' not found`,
      );
    }
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

  reorderSelectedColumns(
    orderedColumnNames: string[],
    source: ColumnChangeSource,
  ) {
    this.setSelectedColumns(
      reorderColumnItems(this.#selectedColumns, orderedColumnNames),
      source,
      { type: SelectedColumnChangeType.ColumnsReordered },
    );
  }

  updateColumn(column: ColumnDescriptor) {
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
        column,
      );
      this.allColumns = this.allColumns.toSpliced(allIndex, 1, column);

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
      console.log(`add it to selected coliumns`);
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
