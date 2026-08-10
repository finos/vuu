import type {
  CopyOption,
  DataSource,
  DeleteRowMode,
  DeleteSelectedRowsResult,
  EditApi,
  EditSessionMode,
  UndoRowChangeResult,
} from "@vuu-ui/vuu-data-types";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { EventEmitter, isRpcError } from "@vuu-ui/vuu-utils";

export const isCopyOption = (
  mode?: EditSessionMode | CopyOption,
): mode is CopyOption =>
  mode === "All" || mode === "Empty" || mode === "Selected";

export type EditState = "clean" | "dirty" | "invalid" | "stale";

export type EditLifecycle =
  | { status: "idle" }
  | { status: "starting" }
  | { status: "active"; sessionDataSource?: DataSource }
  | { status: "ending"; sessionDataSource?: DataSource }
  | {
      status: "error";
      operation: "begin" | "end";
      error: Error;
      sessionDataSource?: DataSource;
    };

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
  lifecycle: (lifecycle: EditLifecycle) => void;
};

export class EditSession extends EventEmitter<EditSessionEvents> {
  /**
   *  Row key => row edits
   */
  #rowEdits = new Map<string, RowEditDetails>();
  #deletedRows = new Set<string>();
  #editCount = 0;
  #deleteCount = 0;
  #addCount = 0;
  #invalidCount = 0;
  #deleteMode: DeleteRowMode;
  #sourceTableDataSource?: EditApi;
  #sessionDataSource?: DataSource;
  #lifecycle: EditLifecycle = { status: "idle" };
  /** Prevent begin/end RPCs from overlapping and observing stale lifecycle state. */
  #transitionQueue: Promise<void> = Promise.resolve();

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
      if (val === 0 && this.#deleteCount === 0 && this.#addCount === 0) {
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
      if (val === 0 && this.#editCount === 0 && this.#addCount === 0) {
        this.emit("editState", "clean");
      } else if (oldCount === 0) {
        this.emit("editState", "dirty");
      }
    }
  }

  get addCount() {
    return this.#addCount;
  }

  set addCount(val: number) {
    if (val !== this.#addCount) {
      const oldCount = this.#addCount;
      this.#addCount = val;
      if (val === 0 && this.#editCount === 0 && this.#deleteCount === 0) {
        this.emit("editState", "clean");
      } else if (oldCount === 0) {
        this.emit("editState", "dirty");
      }
    }
  }

  async deleteSelectedRows(): Promise<void> {
    const response = await this.dataSource?.deleteSelectedRows?.(
      this.#deleteMode,
    );
    if (isRpcError(response)) return;
    const deletedKeys = (response?.data as DeleteSelectedRowsResult | undefined)
      ?.deletedKeys;
    if (deletedKeys && deletedKeys.length > 0) {
      let newCount = 0;
      for (const key of deletedKeys) {
        if (!this.#deletedRows.has(key)) {
          this.#deletedRows.add(key);
          newCount++;
        }
      }
      if (newCount > 0) {
        this.deleteCount = this.#deleteCount + newCount;
      }
    }
  }

  addRows(count = 15, rowData: Record<string, VuuRowDataItemType> = {}) {
    for (let i = 0; i < count; i++) {
      this.#sourceTableDataSource?.addRow?.(rowData);
    }
    this.addCount = this.#addCount + count;
  }

  restoreRows(keys: string[]) {
    for (const key of keys) {
      if (this.#deletedRows.has(key)) {
        this.#deletedRows.delete(key);
        this.deleteCount = this.#deleteCount - 1;
      }
    }
  }

  hasRowChanges(key: string): boolean {
    return this.#rowEdits.has(key) || this.#deletedRows.has(key);
  }

  async undoRowChange(key: string): Promise<void> {
    if (!this.inEditMode) return;

    const rowEdits = this.#rowEdits.get(key);
    const wasDeleted = this.#deletedRows.has(key);

    if (!rowEdits?.cellEdits.size && !wasDeleted) return;

    this.#rowEdits.delete(key);
    if (wasDeleted) this.#deletedRows.delete(key);

    const response = await this.dataSource?.undoRowChange?.(key);

    if (isRpcError(response)) {
      // Restore on failure
      if (rowEdits) this.#rowEdits.set(key, rowEdits);
      if (wasDeleted) this.#deletedRows.add(key);
      return;
    }

    // Update counters after confirmed success
    if (rowEdits) {
      let validCount = 0;
      let invalidCount = 0;
      for (const [, cellEdit] of rowEdits.cellEdits) {
        if (cellEdit.isValid === false) {
          invalidCount++;
        } else {
          validCount++;
        }
      }
      this.editCount = this.#editCount - validCount;
      this.invalidCount = this.#invalidCount - invalidCount;
    }
    if (wasDeleted) {
      this.deleteCount = this.#deleteCount - 1;
    }

    // If the server deleted a newly inserted row, decrement addCount
    const wasInsertedRow =
      (response?.data as UndoRowChangeResult | undefined)?.wasInsertedRow ===
      true;
    if (wasInsertedRow) {
      this.addCount = this.#addCount - 1;
    }
  }

  #clearEdits() {
    this.#rowEdits.clear();
    this.#deletedRows.clear();
    this.#editCount = 0;
    this.#deleteCount = 0;
    this.#addCount = 0;
    this.#invalidCount = 0;
  }

  #setLifecycle(lifecycle: EditLifecycle) {
    this.#lifecycle = lifecycle;
    this.emit("lifecycle", lifecycle);
  }

  #enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.#transitionQueue.then(operation);
    // Reassign to a settled continuation: callers keep the real result, while a
    // rejected transition cannot poison the queue for later begin/end requests.
    this.#transitionQueue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  /** @deprecated Pass a `CopyOption` ("All" | "Empty" | "Selected") to use `createSessionDataSource` instead. Long-form `EditSessionMode` values will be removed in a future release. */
  begin(mode: EditSessionMode): Promise<DataSource | undefined>;
  begin(mode?: CopyOption): Promise<DataSource | undefined>;
  begin(mode?: EditSessionMode | CopyOption): Promise<DataSource | undefined>;
  begin(mode?: EditSessionMode | CopyOption): Promise<DataSource | undefined> {
    return this.#enqueue(async () => {
      if (
        this.#lifecycle.status === "active" ||
        (this.#lifecycle.status === "error" &&
          this.#lifecycle.operation === "end")
      ) {
        if (this.#lifecycle.status === "error") {
          this.#setLifecycle({
            status: "active",
            sessionDataSource: this.#sessionDataSource,
          });
        }
        return this.#sessionDataSource;
      }

      this.#setLifecycle({ status: "starting" });

      try {
        const sessionDataSource = isCopyOption(mode)
          ? await this.#sourceTableDataSource?.createSessionDataSource?.(mode)
          : await this.#sourceTableDataSource?.beginEditSession?.(mode);

        this.#sessionDataSource = sessionDataSource;
        this.#setLifecycle({ status: "active", sessionDataSource });
        return sessionDataSource;
      } catch (cause) {
        const error = cause instanceof Error ? cause : new Error(String(cause));
        this.#setLifecycle({ status: "error", operation: "begin", error });
        throw error;
      }
    });
  }

  get dataSource() {
    return this.#sessionDataSource ?? this.#sourceTableDataSource;
  }

  end(saveChanges = false, force = false): Promise<void> {
    return this.#enqueue(async () => {
      if (
        this.#lifecycle.status === "idle" ||
        (this.#lifecycle.status === "error" &&
          this.#lifecycle.operation === "begin")
      ) {
        if (this.#lifecycle.status !== "idle") {
          this.#setLifecycle({ status: "idle" });
        }
        return;
      }

      const sessionDataSource = this.#sessionDataSource;
      this.#setLifecycle({ status: "ending", sessionDataSource });

      try {
        await this.dataSource?.endEditSession?.(saveChanges, force);
        this.#clearEdits();
        this.#sessionDataSource = undefined;
        this.#setLifecycle({ status: "idle" });
      } catch (cause) {
        const error = cause instanceof Error ? cause : new Error(String(cause));
        if (error instanceof StaleUpdateError) {
          this.emit("editState", "stale");
        }
        this.#setLifecycle({
          status: "error",
          operation: "end",
          error,
          sessionDataSource,
        });
        throw error;
      }
    });
  }

  get lifecycle() {
    return this.#lifecycle;
  }

  get inEditMode() {
    return (
      this.#lifecycle.status === "active" ||
      this.#lifecycle.status === "ending" ||
      (this.#lifecycle.status === "error" &&
        this.#lifecycle.operation === "end")
    );
  }

  get editState(): EditState {
    return this.editCount === 0 &&
      this.#deleteCount === 0 &&
      this.#addCount === 0
      ? "clean"
      : "dirty";
  }

  getOrCreateRowEdits(key: string): RowEditDetails {
    const rowEditDetails = this.#rowEdits.get(key);
    if (rowEditDetails) {
      return rowEditDetails;
    } else {
      const rowEditDetails = {
        cellEdits: new Map<string, CellEdit>(),
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
    if (
      this.#lifecycle.status !== "active" &&
      !(
        this.#lifecycle.status === "error" &&
        this.#lifecycle.operation === "end"
      )
    ) {
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
