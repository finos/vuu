import { DataSource, EditSessionMode } from "@vuu-ui/vuu-data-types";
import type {
  RpcResultError,
  VuuRowDataItemType,
} from "@vuu-ui/vuu-protocol-types";
import { EventEmitter } from "../event-emitter";

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
      await this.dataSource?.endEditSession?.(saveChanges, force);
      this.clear();
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
    isValid: boolean,
  ) {
    const rowEditDetails = this.#rowEdits.get(key);

    if (isValid) {
      if (rowEditDetails) {
        const { cellEdits } = rowEditDetails;
        const cellEditValues = cellEdits.get(columnName);
        if (cellEditValues) {
          try {
            if (cellEditValues.isValid === false) {
              cellEditValues.isValid = true;
              this.invalidCount -= 1;
            }
            return this.dataSource?.editCell?.(key, columnName, typedValue);
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
