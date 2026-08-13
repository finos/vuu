import type {
  CopyOption,
  DataSource,
  DeleteRowMode,
  DeleteSelectedRowsResult,
  EditApi,
  UndoRowChangeResult,
} from "@vuu-ui/vuu-data-types";
import type { RpcResult, VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { EventEmitter, isRpcError, StaleUpdateError } from "@vuu-ui/vuu-utils";

export type EditState = "clean" | "dirty" | "invalid" | "stale";
export type NewRowState = {
  columns: readonly string[];
  errors: Readonly<Record<string, string>>;
  submitting: boolean;
  values: Readonly<Record<string, VuuRowDataItemType>>;
};

export type EditLifecycle =
  | { status: "idle" }
  | { status: "starting" }
  | { status: "active"; sessionDataSource: DataSource }
  | { status: "ending"; sessionDataSource: DataSource }
  | {
    status: "error";
    operation: "begin" | "end";
    error: Error;
    sessionDataSource?: DataSource;
  };

export class EditError extends Error { }

type CellEdit = {
  originalValue: VuuRowDataItemType;
  editedValue: VuuRowDataItemType;
  isValid: boolean;
};

type RowEditDetails = {
  /**
   * Column name => cell edit details
   */
  cellEdits: Map<string, CellEdit>;
};

type EditSessionEvents = {
  editState: (editState: EditState) => void;
  lifecycle: (lifecycle: EditLifecycle) => void;
  newRow: (newRowState: NewRowState) => void;
  rowChangeUndone: (key: string) => void;
};

export class EditSession extends EventEmitter<EditSessionEvents> {
  static readonly newRowKey = "__vuu_new_row__";
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
  #newRowState: NewRowState = {
    columns: [],
    errors: {},
    submitting: false,
    values: {},
  };
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
    this.#setEditCounts(val, this.#invalidCount);
  }

  get invalidCount() {
    return this.#invalidCount;
  }

  set invalidCount(val: number) {
    this.#setEditCounts(this.#editCount, val);
  }

  get deleteCount() {
    return this.#deleteCount;
  }

  set deleteCount(val: number) {
    if (val !== this.#deleteCount) {
      const oldState = this.editState;
      const oldCount = this.#deleteCount;
      this.#deleteCount = val;
      this.#emitEditStateChange(oldState, oldCount === 0 || val === 0);
    }
  }

  get addCount() {
    return this.#addCount;
  }

  set addCount(val: number) {
    if (val !== this.#addCount) {
      const oldState = this.editState;
      const oldCount = this.#addCount;
      this.#addCount = val;
      this.#emitEditStateChange(oldState, oldCount === 0 || val === 0);
    }
  }

  get editState(): EditState {
    if (this.#invalidCount > 0) {
      return "invalid";
    }
    return this.#editCount === 0 &&
      this.#deleteCount === 0 &&
      this.#addCount === 0
      ? "clean"
      : "dirty";
  }

  #emitEditStateChange(oldState: EditState, force = false) {
    const newState = this.editState;
    if (force || newState !== oldState) {
      this.emit("editState", newState);
    }
  }

  #setEditCounts(editCount: number, invalidCount: number) {
    if (editCount !== this.#editCount || invalidCount !== this.#invalidCount) {
      const oldState = this.editState;
      this.#editCount = editCount;
      this.#invalidCount = invalidCount;
      this.#emitEditStateChange(oldState);
    }
  }

  #refreshEditCounts() {
    let editCount = 0;
    let invalidCount = 0;
    for (const { cellEdits } of this.#rowEdits.values()) {
      for (const cellEdit of cellEdits.values()) {
        if (cellEdit.isValid) {
          editCount++;
        } else {
          invalidCount++;
        }
      }
    }
    this.#setEditCounts(editCount, invalidCount);
  }

  get newRowState(): NewRowState {
    return this.#newRowState;
  }

  isNewRow(key: string) {
    return key === EditSession.newRowKey;
  }

  isNewRowFinalColumn(columnName: string) {
    return this.#newRowState.columns.at(-1) === columnName;
  }

  isNewRowComplete() {
    return this.#newRowState.columns.every((column) => {
      const value = this.#newRowState.values[column];
      return value !== undefined &&
        (typeof value !== "string" || value.trim() !== "");
    });
  }

  configureNewRow(columns: readonly string[]) {
    if (
      columns.length === this.#newRowState.columns.length &&
      columns.every(
        (column, index) => column === this.#newRowState.columns[index],
      )
    ) {
      return;
    }

    const columnSet = new Set(columns);
    const errors = Object.fromEntries(
      Object.entries(this.#newRowState.errors).filter(([column]) =>
        columnSet.has(column),
      ),
    );
    this.#setNewRowState({
      ...this.#newRowState,
      columns: [...columns],
      errors,
    });
  }

  setNewRowValue(column: string, value: VuuRowDataItemType) {
    const errors = { ...this.#newRowState.errors };
    delete errors[column];
    this.#setNewRowState({
      ...this.#newRowState,
      errors,
      values: { ...this.#newRowState.values, [column]: value },
    });
  }

  async addNewRow(): Promise<RpcResult> {
    const missingErrors = Object.fromEntries(
      this.#newRowState.columns
        .filter((column) => {
          const value = this.#newRowState.values[column];
          return (
            value === undefined ||
            (typeof value === "string" && value.trim() === "")
          );
        })
        .map((column) => [column, "Value required"]),
    );
    const errors = { ...this.#newRowState.errors, ...missingErrors };

    if (Object.keys(errors).length > 0) {
      this.#setNewRowState({ ...this.#newRowState, errors });
      return { data: undefined, type: "SUCCESS_RESULT" };
    }

    if (this.#newRowState.submitting) {
      return { data: undefined, type: "SUCCESS_RESULT" };
    }

    this.#setNewRowState({ ...this.#newRowState, submitting: true });
    try {
      const response = await this.addRow({ ...this.#newRowState.values });
      if (isRpcError(response)) {
        const finalColumn = this.#newRowState.columns.at(-1);
        this.#setNewRowState({
          ...this.#newRowState,
          errors: finalColumn
            ? { [finalColumn]: response.errorMessage }
            : this.#newRowState.errors,
          submitting: false,
        });
        return response;
      }

      this.#setNewRowState({
        columns: this.#newRowState.columns,
        errors: {},
        submitting: false,
        values: {},
      });
      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unable to add row";
      const finalColumn = this.#newRowState.columns.at(-1);
      this.#setNewRowState({
        ...this.#newRowState,
        errors: finalColumn
          ? { [finalColumn]: errorMessage }
          : this.#newRowState.errors,
        submitting: false,
      });
      return { errorMessage, type: "ERROR_RESULT" };
    }
  }

  #setNewRowState(newRowState: NewRowState) {
    this.#newRowState = newRowState;
    this.emit("newRow", newRowState);
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

  async addRow(
    rowData: Record<string, VuuRowDataItemType> = {},
  ): Promise<RpcResult> {
    const addRow = this.dataSource?.addRow;
    if (addRow === undefined) {
      throw Error("[EditSession] datasource does not support adding rows");
    }

    const response = await addRow.call(this.dataSource, rowData);
    if (response === undefined) {
      throw Error(
        "[EditSession] datasource returned no response when adding row",
      );
    }
    if (!isRpcError(response)) {
      this.addCount = this.#addCount + 1;
    }
    return response;
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
    if (rowEdits) this.#refreshEditCounts();
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
    this.emit("rowChangeUndone", key);
  }

  #clearEdits() {
    this.#rowEdits.clear();
    this.#deletedRows.clear();
    this.#editCount = 0;
    this.#deleteCount = 0;
    this.#addCount = 0;
    this.#invalidCount = 0;
    this.#setNewRowState({
      columns: this.#newRowState.columns,
      errors: {},
      submitting: false,
      values: {},
    });
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

  begin(copyOption: CopyOption = "All"): Promise<DataSource> {
    return this.#enqueue(async () => {
      if (
        this.#lifecycle.status === "active" ||
        (this.#lifecycle.status === "error" &&
          this.#lifecycle.operation === "end")
      ) {
        const sessionDataSource = this.#sessionDataSource;
        if (!sessionDataSource) {
          throw new Error("[EditSession] active lifecycle has no datasource");
        }
        if (this.#lifecycle.status === "error") {
          this.#setLifecycle({
            status: "active",
            sessionDataSource,
          });
        }
        return sessionDataSource;
      }

      this.#setLifecycle({ status: "starting" });

      try {
        const createSessionDataSource =
          this.#sourceTableDataSource?.createSessionDataSource;
        if (!createSessionDataSource) {
          throw new Error(
            "[EditSession] datasource does not support createSessionDataSource",
          );
        }
        const sessionDataSource = await createSessionDataSource.call(
          this.#sourceTableDataSource,
          copyOption,
        );
        if (!sessionDataSource) {
          throw new Error(
            "[EditSession] datasource did not create a session datasource",
          );
        }

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
      if (!sessionDataSource) {
        throw new Error("[EditSession] ending lifecycle has no datasource");
      }
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
    const existingCellEdit = cellEdits.get(column);
    const cellEdit: CellEdit = {
      originalValue: existingCellEdit?.originalValue ?? originalValue,
      editedValue,
      isValid,
    };

    if (isValid && cellEdit.originalValue === editedValue) {
      cellEdits.delete(column);
    } else {
      cellEdits.set(column, cellEdit);
    }
    this.#refreshEditCounts();
    return cellEdit;
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

      if (this.dataSource?.editCell) {
        const response = await this.dataSource.editCell(
          key,
          columnName,
          typedValue,
        );
        if (isRpcError(response)) {
          this.storeCellEdit(
            cellEdits,
            columnName,
            cellEdit.originalValue,
            typedValue,
            false,
          );
        } else if (cellEdits.size === 0) {
          this.#rowEdits.delete(key);
        }

        return {
          editedDuringCurrentSession: cellEdit.originalValue !== typedValue,
          ...response,
        };
      }
      if (cellEdits.size === 0) {
        this.#rowEdits.delete(key);
      }
    } else {
      const { cellEdits } = rowEditDetails;
      this.storeCellEdit(
        cellEdits,
        columnName,
        originalValue,
        typedValue,
        isValid,
      );
      return { editedDuringCurrentSession: false };
    }
  }
}
