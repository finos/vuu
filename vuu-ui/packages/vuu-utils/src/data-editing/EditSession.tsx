import { DeleteRowMode, EditApi, EditSessionMode } from "@vuu-ui/vuu-data-types";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { EventEmitter } from "../event-emitter";
import { isRpcError } from "../protocol-message-utils";

export type EditState = "clean" | "dirty" | "invalid" | "stale";

export class EditError extends Error {}

type CellEdit = {
  originalValue: VuuRowDataItemType;
  editedValue: VuuRowDataItemType;
  isValid?: boolean;
  isDeleted?: boolean;
};

// TODO can add more when when we know what the server implementation of error columns will look like
export class StaleUpdateError extends Error {}

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
  /**
   *  Row key => row edits
   */
  #rowEdits = new Map<string, RowEditDetails>();
  #deletedRows = new Set<string>();
  #editCount = 0;
  #deleteCount = 0;
  #invalidCount = 0;
  #deleteMode: DeleteRowMode;
  #sourceTableDataSource?: EditApi;
  #sessionDataSource?: EditApi;
  #inEditMode = false;
  #endEditModePending = false;

  constructor(dataSource: EditApi, deleteMode: DeleteRowMode = "soft") {
    super();
    this.#sourceTableDataSource = dataSource;
    this.#deleteMode = deleteMode;
  }

  get editCount() {
    return this.#editCount;
  }

  set editCount(val: number) {
    if (val !== this.#editCount) {
      const oldCount = this.#editCount;
      this.#editCount = val;
      if (val === 0 && this.#deleteCount === 0) {
        this.emit("editState", "clean");
      } else if (oldCount === 0) {
        this.emit("editState", "dirty");
      }
    }
  }

  get invalidCount() {
    return this.#invalidCount;
  }

  set invalidCount(val: number) {
    if (val !== this.#invalidCount) {
      const oldCount = this.#invalidCount;
      this.#invalidCount = val;
      if (val === 0) {
        this.emit("editState", this.#editCount === 0 ? "clean" : "dirty");
      } else if (oldCount === 0) {
        this.emit("editState", "invalid");
      }
    }
  }

  get deleteCount() {
    return this.#deleteCount;
  }

  set deleteCount(val: number) {
    if (val !== this.#deleteCount) {
      const oldCount = this.#deleteCount;
      this.#deleteCount = val;
      if (val === 0 && this.#editCount === 0) {
        this.emit("editState", "clean");
      } else if (oldCount === 0) {
        this.emit("editState", "dirty");
      }
    }
  }

  deleteRows(keys: string[]) {
    for (const key of keys) {
      if (!this.#deletedRows.has(key)) {
        this.#deletedRows.add(key);
        this.deleteCount = this.#deleteCount + 1;
        this.dataSource?.deleteRow?.(key, this.#deleteMode);
      }
    }
  }

  restoreRows(keys: string[]) {
    for (const key of keys) {
      if (this.#deletedRows.has(key)) {
        this.#deletedRows.delete(key);
        this.deleteCount = this.#deleteCount - 1;
      }
    }
  }

  clear() {
    this.#rowEdits.clear();
    this.#deletedRows.clear();
    this.#editCount = 0;
    this.#deleteCount = 0;
    this.#inEditMode = false;
    this.#endEditModePending = false;
  }

  async begin(editSessionMode?: EditSessionMode) {
    try {
      this.#inEditMode = true;
      const sessionDataSource =
        await this.#sourceTableDataSource?.beginEditSession?.(editSessionMode);

      this.#sessionDataSource = sessionDataSource;

      return sessionDataSource;
    } catch (e) {
      this.#inEditMode = false;
    }
  }

  get dataSource() {
    return this.#sessionDataSource ?? this.#sourceTableDataSource;
  }

  async end(saveChanges = false, force = false) {
    try {
      if (this.#inEditMode) {
        this.#endEditModePending = true;
        await this.dataSource?.endEditSession?.(saveChanges, force);
        this.clear();
      }
    } catch (e) {
      this.#endEditModePending = false;
      if (e instanceof StaleUpdateError) {
        this.emit("editState", "stale");
      } else {
        console.error(`[EditSession] ${(e as Error).message}`);
      }
    }
  }

  get inEditMode() {
    return this.#inEditMode === true && this.#endEditModePending === false;
  }

  get editState(): EditState {
    return this.editCount === 0 && this.#deleteCount === 0 ? "clean" : "dirty";
  }

  getOrCreateRowEdits(key: string): RowEditDetails {
    const rowEditDetails = this.#rowEdits.get(key);
    if (rowEditDetails) {
      return rowEditDetails;
    } else {
      const rowEditDetails = {
        cellEdits: new Map(),
      };
      this.#rowEdits.set(key, rowEditDetails);
      return rowEditDetails;
    }
  }

  storeCellEdit(
    cellEdits: Map<string, CellEdit>,
    column: string,
    originalValue: VuuRowDataItemType,
    editedValue: VuuRowDataItemType,
    isValid: boolean,
  ) {
    const cellEdit = cellEdits.get(column);
    if (cellEdit) {
      if (cellEdit.originalValue === editedValue) {
        cellEdits.delete(column);
        cellEdit.isDeleted = true;
        if (cellEdit.isValid) {
          this.editCount -= 1;
        } else {
          this.invalidCount -= 1;
        }
      } else {
        if (isValid && cellEdit.isValid === false) {
          cellEdit.isValid = true;
          cellEdit.editedValue = editedValue;
          // do not trigger the event, save it for the editCount
          this.#invalidCount -= 1;
          this.editCount += 1;
        }
      }
      return cellEdit;
    } else {
      const cellEdit: CellEdit = {
        originalValue,
        editedValue,
        isValid,
      };
      cellEdits.set(column, cellEdit);
      if (isValid) {
        this.editCount += 1;
      }
      return cellEdit;
    }
  }

  async commit(
    key: string,
    columnName: string,
    originalValue: VuuRowDataItemType,
    typedValue: string | number | boolean,
    isValid: boolean,
  ) {
    if (!this.#inEditMode) {
      throw new Error("No edit session in progress");
    }
    const rowEditDetails = this.getOrCreateRowEdits(key);

    if (isValid) {
      const { cellEdits } = rowEditDetails;

      const cellEdit = this.storeCellEdit(
        cellEdits,
        columnName,
        originalValue,
        typedValue,
        isValid,
      );

      if (cellEdit.isDeleted) {
        if (rowEditDetails.cellEdits.size === 0) {
          this.#rowEdits.delete(key);
        }
      }

      if (this.dataSource?.editCell) {
        const response = await this.dataSource.editCell(
          key,
          columnName,
          typedValue,
        );
        if (isRpcError(response)) {
          cellEdit.isValid = false;
          this.invalidCount += 1;
        }

        return {
          editedDuringCurrentSession: cellEdit.originalValue !== typedValue,
          ...response,
        };
      }
    } else {
      const { cellEdits } = rowEditDetails;
      let cellEdit = cellEdits.get(columnName);
      if (cellEdit && cellEdit.isValid !== false) {
        cellEdit.isValid = false;
        this.invalidCount += 1;
      } else if (cellEdit === undefined) {
        cellEdit = this.storeCellEdit(
          cellEdits,
          columnName,
          originalValue,
          typedValue,
          isValid,
        );
        this.invalidCount += 1;
      }
      return { editedDuringCurrentSession: false };
    }
  }
}
