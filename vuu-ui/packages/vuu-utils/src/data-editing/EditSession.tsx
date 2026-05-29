import { DataSource, EditSessionMode } from "@vuu-ui/vuu-data-types";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { EventEmitter } from "../event-emitter";
import { isRpcError } from "../../dist/index.mjs";

export type EditState = "clean" | "dirty" | "invalid" | "stale";

type CellEdit = {
  originalValue: VuuRowDataItemType;
  editedValue: VuuRowDataItemType;
  isValid?: boolean;
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
  #editCount = 0;
  #invalidCount = 0;
  #sourceTableDataSource?: DataSource;
  #sessionDataSource?: DataSource;
  #inEditMode = false;

  constructor(dataSource: DataSource) {
    super();
    this.#sourceTableDataSource = dataSource;

    dataSource.on("remote-update-during-local-edit", (rows) => {
      console.log(
        `source table updated via another channel, whilst we have an inline edit session in progress`,
        { rows },
      );
    });
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

  clear() {
    this.#rowEdits.clear();
    this.#editCount = 0;
    this.#inEditMode = false;
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
        await this.dataSource?.endEditSession?.(saveChanges, force);
        this.clear();
      }
    } catch (e) {
      if (e instanceof StaleUpdateError) {
        this.emit("editState", "stale");
      } else {
        console.error(`[EditSession] ${(e as Error).message}`);
      }
    }
  }

  get inEditMode() {
    return this.#inEditMode;
  }

  get editState(): EditState {
    return this.editCount === 0 ? "clean" : "dirty";
  }

  getRowEdits(key: string): RowEditDetails {
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
      if (isValid && cellEdit.isValid === false) {
        cellEdit.isValid = true;
        this.invalidCount -= 1;
      }
      return cellEdit;
    } else {
      const cellEdit = {
        originalValue,
        editedValue,
        isValid,
      };
      cellEdits.set(column, cellEdit);
      this.editCount = this.#editCount + 1;
      return cellEdit;
    }
  }

  /**
   * Apply incremental edit(s) to edit control value. Used for TextInput, where multiple
   * edits may follow in sequence before value finally committed.
   *
   * @param key value for edited Row
   * @param columnName
   * @param originalValue
   * @param newValue
   */
  edit(
    key: string,
    columnName: string,
    originalValue: VuuRowDataItemType,
    newValue: VuuRowDataItemType,
  ) {
    const { cellEdits } = this.getRowEdits(key);
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
      cellEdits.set(columnName, {
        originalValue,
        editedValue: newValue,
      });
      this.editCount = this.#editCount + 1;
    }
  }

  async commit(
    key: string,
    columnName: string,
    originalValue: VuuRowDataItemType,
    typedValue: string | number | boolean,
    isValid: boolean,
  ) {
    const rowEditDetails = this.getRowEdits(key);

    if (isValid) {
      const { cellEdits } = rowEditDetails;
      const cellEdit = this.storeCellEdit(
        cellEdits,
        columnName,
        originalValue,
        typedValue,
        isValid,
      );

      const response = await this.dataSource?.editCell?.(
        key,
        columnName,
        typedValue,
      );
      if (isRpcError(response)) {
        cellEdit.isValid = false;
        this.invalidCount += 1;
      }

      return response;
    } else {
      if (rowEditDetails) {
        const { cellEdits } = rowEditDetails;
        const cellEditValues = cellEdits.get(columnName);
        if (cellEditValues && cellEditValues.isValid !== false) {
          cellEditValues.isValid = false;
          this.invalidCount += 1;
        }
      }
      console.log(
        `[EditSession] key ${key}, column ${columnName} is valid ? ${isValid} `,
      );
    }
  }
}
