import { DataSource, EditSessionMode } from "@vuu-ui/vuu-data-types";
import type {
  RpcResultError,
  VuuRowDataItemType,
} from "@vuu-ui/vuu-protocol-types";
import { EventEmitter } from "../event-emitter";

export type EditState = "clean" | "dirty";

type CellEdit = {
  originalValue: VuuRowDataItemType;
  editedValue: VuuRowDataItemType;
};

type RowEditDetails = {
  /**
   * Column name => cell edit details
   */
  cellEdits: Map<string, CellEdit>;
};

type EditSessionEvents = {
  editState: (editState: EditState) => void;
};

export class EditSession extends EventEmitter<EditSessionEvents> {
  #active = false;
  /**
   *  Row key => row edits
   */
  #rowEdits = new Map<string, RowEditDetails>();
  #editCount = 0;
  #sourceTableDataSource?: DataSource;
  #sessionDataSource?: DataSource;
  #inEditMode = false;

  constructor(dataSource: DataSource) {
    super();
    this.#sourceTableDataSource = dataSource;
  }

  get active() {
    return this.#active;
  }
  set active(isActive: boolean) {
    this.#active = isActive;
  }
  get editCount() {
    return this.#editCount;
  }

  set editCount(val: number) {
    if (val !== this.#editCount) {
      const oldCount = this.#editCount;
      this.#editCount = val;
      if (val === 0) {
        this.emit("editState", "clean");
      } else if (oldCount === 0) {
        this.emit("editState", "dirty");
      }
    }
  }

  clear() {
    this.#rowEdits.clear();
    this.#editCount = 0;
  }

  async begin(editSessionMode?: EditSessionMode) {
    this.#inEditMode = true;

    const sessionDataSource =
      await this.#sourceTableDataSource?.beginEditSession?.(editSessionMode);

    this.#sessionDataSource = sessionDataSource;

    return sessionDataSource;
  }

  get dataSource() {
    return this.#sessionDataSource ?? this.#sourceTableDataSource;
  }

  async end(saveChanges = false) {
    await this.dataSource?.endEditSession?.(saveChanges);
    this.clear();
  }

  get inEditMode() {
    return this.#inEditMode;
  }

  get editState(): EditState {
    return this.editCount === 0 ? "clean" : "dirty";
  }

  // TODO how do we deal with the '_edited' pattern
  edit(
    key: string,
    columnName: string,
    originalValue: VuuRowDataItemType,
    newValue: VuuRowDataItemType,
  ) {
    const rowEditDetails = this.#rowEdits.get(key);
    if (rowEditDetails) {
      const { cellEdits } = rowEditDetails;
      const cellEdit = cellEdits.get(columnName);
      if (cellEdit) {
        if (newValue === cellEdit.originalValue) {
          if (cellEdits.size === 1) {
            this.#rowEdits.delete(key);
          } else {
            // re-editing a cell had removed the edit
            cellEdits.delete(columnName);
          }
          this.editCount = this.#editCount - 1;
        } else {
          cellEdit.editedValue = newValue;
        }
      } else {
        // row has already been edited, but this column has not
        cellEdits.set(columnName, {
          originalValue,
          editedValue: newValue,
        });
        this.editCount = this.#editCount + 1;
      }
    } else {
      this.#rowEdits.set(key, {
        cellEdits: new Map([
          [columnName, { originalValue, editedValue: newValue }],
        ]),
      });
      this.editCount = this.#editCount + 1;
    }
  }

  async commit(
    key: string,
    columnName: string,
    typedValue: string | number | boolean,
  ) {
    const rowEditDetails = this.#rowEdits.get(key);
    if (rowEditDetails) {
      const { cellEdits } = rowEditDetails;
      const cellEditValues = cellEdits.get(columnName);
      if (cellEditValues) {
        try {
          this.dataSource?.editCell?.(key, columnName, typedValue);
        } catch (e) {
          // ??
          console.error(e);
        }
      }
    } else {
      return {
        errorMessage: "CHANGE_REVERTED",
        type: "ERROR_RESULT",
      } as RpcResultError;
    }
  }
}
