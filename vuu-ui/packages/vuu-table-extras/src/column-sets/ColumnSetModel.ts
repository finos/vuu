import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { EventEmitter, itemsOrOrderChanged } from "@vuu-ui/vuu-utils";
import {
  ColumnChangeSource,
  type ColumnModel,
  type ColumnsChangeHandler,
} from "../column-picker/ColumnModel";

/**
 * A named list of columns, in display order.
 */
export interface ColumnSet {
  /** Unique within a ColumnSetModel, the name identifies the set. */
  name: string;
  /** Column names, in order, as last edited. Edits are saved as they are made. */
  columns: string[];
  /** Column names, in order, at the last explicit save. Revert to saved restores these. */
  savedColumns: string[];
}

/**
 * Everything a host needs to persist, to restore the column sets of a grid.
 */
export interface ColumnSetsState {
  columnSets: ColumnSet[];
  /** Name of the column set in view, if any. */
  activeColumnSet?: string;
}

export type ColumnSetsChangeReason =
  | "activated"
  | "created"
  | "deleted"
  | "edited"
  | "renamed"
  | "reverted";

export type ColumnSetsChangeHandler = (
  state: ColumnSetsState,
  reason: ColumnSetsChangeReason,
) => void;

export type ColumnSetEvents = {
  change: ColumnSetsChangeHandler;
};

export const NO_COLUMN_SETS: ColumnSetsState = { columnSets: [] };

const columnNames = (columns: readonly ColumnDescriptor[]) =>
  columns.map(({ name }) => name);

/**
 * The columns of the active column set, as descriptors from availableColumns.
 * A host uses this to configure the Table with the column set in view.
 * Returns undefined if no column set is active.
 */
export const getActiveColumnSetColumns = (
  { activeColumnSet, columnSets }: ColumnSetsState,
  availableColumns: readonly ColumnDescriptor[],
): ColumnDescriptor[] | undefined => {
  const columnSet = columnSets.find(({ name }) => name === activeColumnSet);
  if (columnSet) {
    return columnSet.columns
      .map((name) => availableColumns.find((col) => col.name === name))
      .filter((col): col is ColumnDescriptor => col !== undefined);
  }
};

/**
 * Why a name cannot be used for a column set, or undefined if it can.
 * currentName is the name of the set being renamed, if any.
 */
export const getColumnSetNameError = (
  name: string,
  columnSets: readonly ColumnSet[],
  currentName?: string,
) => {
  const trimmedName = name.trim();
  if (trimmedName === "") {
    return "Enter a name";
  } else if (
    columnSets.some(
      (set) =>
        set.name !== currentName &&
        set.name.toLowerCase() === trimmedName.toLowerCase(),
    )
  ) {
    return "A column set with this name already exists";
  }
};

/**
 * Manages the column sets of a grid, wired to the grid's ColumnModel.
 *
 * - Showing a column set replaces the selected columns in the ColumnModel.
 * - Any change to the selected columns (add, remove, reorder) is saved to the
 *   active column set.
 * - Filters belong to the grid, not the column set, so are unaffected by a
 *   change of column set.
 *
 * The model holds no storage. The host provides the initial state and
 * persists the state passed to change listeners.
 */
export class ColumnSetModel extends EventEmitter<ColumnSetEvents> {
  #columnModel: ColumnModel;
  #connected = false;
  #state: ColumnSetsState;

  constructor(
    columnModel: ColumnModel,
    state: ColumnSetsState = NO_COLUMN_SETS,
  ) {
    super();
    this.#columnModel = columnModel;
    this.#state = state.columnSets.some(
      ({ name }) => name === state.activeColumnSet,
    )
      ? state
      : { columnSets: state.columnSets };
    this.connect();
  }

  get columnModel() {
    return this.#columnModel;
  }

  get state() {
    return this.#state;
  }

  get columnSets() {
    return this.#state.columnSets;
  }

  get activeColumnSet(): ColumnSet | undefined {
    const { activeColumnSet, columnSets } = this.#state;
    return columnSets.find(({ name }) => name === activeColumnSet);
  }

  /**
   * True if the columns of the active set differ from those last saved.
   */
  get isModified() {
    const columnSet = this.activeColumnSet;
    return columnSet
      ? itemsOrOrderChanged(columnSet.columns, columnSet.savedColumns)
      : false;
  }

  /**
   * Listen for changes to the selected columns in the ColumnModel. Called by
   * the constructor, needed only to reconnect after dispose.
   */
  connect() {
    if (!this.#connected) {
      this.#columnModel.on("change", this.handleColumnsChange);
      this.#connected = true;
    }
  }

  dispose() {
    this.#columnModel.removeListener("change", this.handleColumnsChange);
    this.#connected = false;
  }

  /**
   * Show the named column set, replacing the selected columns.
   */
  setActiveColumnSet(name: string) {
    const columnSet = this.#state.columnSets.find((set) => set.name === name);
    if (columnSet === undefined) {
      throw Error(`[ColumnSetModel] no column set named '${name}'`);
    }
    if (name !== this.#state.activeColumnSet) {
      this.setState({ ...this.#state, activeColumnSet: name }, "activated");
      this.#columnModel.replaceSelectedColumns(
        columnSet.columns,
        ColumnChangeSource.ColumnSet,
      );
    }
  }

  /**
   * Save the columns in view, in order, as a new column set and make it the
   * active set.
   */
  saveAs(name: string) {
    const error = getColumnSetNameError(name, this.#state.columnSets);
    if (error) {
      throw Error(`[ColumnSetModel] saveAs '${name}', ${error}`);
    }
    const columns = columnNames(this.#columnModel.selectedColumns);
    const columnSet: ColumnSet = {
      name: name.trim(),
      columns,
      savedColumns: columns,
    };
    this.setState(
      {
        columnSets: this.#state.columnSets.concat(columnSet),
        activeColumnSet: columnSet.name,
      },
      "created",
    );
  }

  rename(name: string, newName: string) {
    const error = getColumnSetNameError(newName, this.#state.columnSets, name);
    if (error) {
      throw Error(`[ColumnSetModel] rename '${name}', ${error}`);
    }
    const trimmedName = newName.trim();
    if (trimmedName !== name) {
      const { activeColumnSet, columnSets } = this.#state;
      this.setState(
        {
          columnSets: columnSets.map((set) =>
            set.name === name ? { ...set, name: trimmedName } : set,
          ),
          activeColumnSet:
            activeColumnSet === name ? trimmedName : activeColumnSet,
        },
        "renamed",
      );
    }
  }

  /**
   * Restore the columns of the active column set to those last saved.
   */
  revertToSaved() {
    const columnSet = this.activeColumnSet;
    if (columnSet && this.isModified) {
      this.updateColumnSet(
        { ...columnSet, columns: columnSet.savedColumns },
        "reverted",
      );
      this.#columnModel.replaceSelectedColumns(
        columnSet.savedColumns,
        ColumnChangeSource.ColumnSet,
      );
    }
  }

  /**
   * Delete the named column set. If it is the active set, the columns in view
   * are unchanged and no set is active.
   */
  delete(name: string) {
    const { activeColumnSet, columnSets } = this.#state;
    if (columnSets.some((set) => set.name === name)) {
      this.setState(
        {
          columnSets: columnSets.filter((set) => set.name !== name),
          activeColumnSet:
            activeColumnSet === name ? undefined : activeColumnSet,
        },
        "deleted",
      );
    }
  }

  private handleColumnsChange: ColumnsChangeHandler = (columns, source) => {
    const columnSet = this.activeColumnSet;
    if (columnSet && source !== ColumnChangeSource.ColumnSet) {
      const names = columnNames(columns);
      if (itemsOrOrderChanged(columnSet.columns, names)) {
        this.updateColumnSet({ ...columnSet, columns: names }, "edited");
      }
    }
  };

  private updateColumnSet(
    columnSet: ColumnSet,
    reason: ColumnSetsChangeReason,
  ) {
    this.setState(
      {
        ...this.#state,
        columnSets: this.#state.columnSets.map((set) =>
          set.name === columnSet.name ? columnSet : set,
        ),
      },
      reason,
    );
  }

  private setState(state: ColumnSetsState, reason: ColumnSetsChangeReason) {
    this.#state =
      state.activeColumnSet === undefined
        ? { columnSets: state.columnSets }
        : state;
    this.emit("change", this.#state, reason);
  }
}
