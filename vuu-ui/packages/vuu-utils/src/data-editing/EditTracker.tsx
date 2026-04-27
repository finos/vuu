import { DataSource } from "@vuu-ui/vuu-data-types";
import type { VuuRowDataItemType, VuuTable } from "@vuu-ui/vuu-protocol-types";
import { EventEmitter } from "../event-emitter";
import { isRpcSuccess } from "../protocol-message-utils";

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

type EditTrackerEvents = {
  editState: (editState: EditState) => void;
};

export class EditTracker extends EventEmitter<EditTrackerEvents> {
  #active = false;
  /**
   *  Row key => row edits
   */
  #rowEdits = new Map<string, RowEditDetails>();
  #editCount = 0;
  #dataSource?: DataSource;
  #inEditMode = false;

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

  set dataSource(ds: DataSource) {
    this.#dataSource = ds;
  }

  clear() {
    this.#rowEdits.clear();
    this.#editCount = 0;
  }

  async enterEditMode() {
    this.#inEditMode = true;

    const rpcResponse = await this.#dataSource?.rpcRequest?.({
      type: "RPC_REQUEST",
      rpcName: "ENTER_EDIT_MODE",
      params: {},
    });

    if (isRpcSuccess(rpcResponse)) {
      const { table: sessionTable } = rpcResponse.data as { table: VuuTable };
      return sessionTable;
    } else {
      console.log("fail");
    }
  }

  get inEditMode() {
    return this.#inEditMode;
  }

  get editState(): EditState {
    return this.editCount === 0 ? "clean" : "dirty";
  }

  async cancelChanges() {
    const rpcResponse = await this.#dataSource?.rpcRequest?.({
      type: "RPC_REQUEST",
      rpcName: "EXIT_EDIT_MODE",
      params: {},
    });
    this.clear();
    return rpcResponse;
  }

  async saveChanges() {
    const rpcResponse = await this.#dataSource?.rpcRequest?.({
      type: "RPC_REQUEST",
      rpcName: "EXIT_EDIT_MODE",
      params: { save: true },
    });
    this.clear();
    return rpcResponse;
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

  async commit(key: string, columnName: string) {
    const rowEditDetails = this.#rowEdits.get(key);
    if (rowEditDetails) {
      const { cellEdits } = rowEditDetails;
      const cellEditValues = cellEdits.get(columnName);
      if (cellEditValues) {
        const { editedValue } = cellEditValues;
        const rpcResponse = await this.#dataSource?.rpcRequest?.({
          type: "RPC_REQUEST",
          rpcName: "editCell",
          params: {
            column: `${columnName}`,
            data: editedValue,
            key,
          },
        });

        return rpcResponse;
      }
    } else {
      throw Error(`[EditTracker] commit, key ${key} not found `);
    }
  }
}
