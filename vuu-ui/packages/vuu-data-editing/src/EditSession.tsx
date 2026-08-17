import type {
  CopyOption,
  DataSource,
  DeleteRowMode,
  DeleteSelectedRowsResult,
  EditApi,
  EditSessionMode,
  UndoRowChangeResult,
} from "@vuu-ui/vuu-data-types";
import type { RpcResult, VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { EventEmitter, isRpcError } from "@vuu-ui/vuu-utils";
import { StaleUpdateError } from "@vuu-ui/vuu-utils2";

export type EditState = "clean" | "dirty" | "invalid" | "stale";
export type EditSessionApi =
  | "createSessionDataSource"
  | "beginEditSession";
const toEditSessionMode = (copyOption: CopyOption): EditSessionMode => {
  switch (copyOption) {
    case "All":
      return "all-rows";
    case "Selected":
      return "selected-rows";
    case "Empty":
      return "empty-session-table";
  }
};
export type NewRowState = {
  columns: readonly string[];
  draftRevision: number;
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

export class EditError extends Error {}
export class SupersededEditError extends Error {}

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
  cellEditChanged: (key: string, columnName: string) => void;
  editState: (editState: EditState) => void;
  lifecycle: (lifecycle: EditLifecycle) => void;
  newRow: (newRowState: NewRowState) => void;
  rowChangeChanged: (key: string) => void;
};

export class EditSession extends EventEmitter<EditSessionEvents> {
  static readonly newRowKey = "__vuu_new_row__";
  /**
   *  Row key => row edits
   */
  #rowEdits = new Map<string, RowEditDetails>();
  #deletedRows = new Set<string>();
  #deleteRevision = 0;
  #rowDeleteRevisions = new Map<string, number>();
  #editCount = 0;
  #deleteCount = 0;
  #addCount = 0;
  #invalidCount = 0;
  #isStale = false;
  #commitRevision = 0;
  #cellCommitRevisions = new Map<string, Map<string, number>>();
  #deleteMode: DeleteRowMode;
  #editSessionApi: EditSessionApi;
  #sourceTableDataSource?: EditApi;
  #sessionDataSource?: DataSource;
  #newRowState: NewRowState = {
    columns: [],
    draftRevision: 0,
    errors: {},
    submitting: false,
    values: {},
  };
  #lifecycle: EditLifecycle = { status: "idle" };
  /** Prevent begin/end RPCs from overlapping and observing stale lifecycle state. */
  #transitionQueue: Promise<void> = Promise.resolve();

  constructor(
    dataSource: EditApi,
    deleteMode: DeleteRowMode = "soft",
    editSessionApi: EditSessionApi = "createSessionDataSource",
  ) {
    super();
    this.#sourceTableDataSource = dataSource;
    this.#deleteMode = deleteMode;
    this.#editSessionApi = editSessionApi;
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
    if (this.#isStale) {
      return "stale";
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

  #setStale(isStale: boolean) {
    if (isStale !== this.#isStale) {
      const oldState = this.editState;
      this.#isStale = isStale;
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
      return (
        value !== undefined &&
        (typeof value !== "string" || value.trim() !== "")
      );
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
        draftRevision: this.#newRowState.draftRevision + 1,
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
        this.#rowDeleteRevisions.set(key, ++this.#deleteRevision);
        if (!this.#deletedRows.has(key)) {
          this.#deletedRows.add(key);
          newCount++;
        }
      }
      if (newCount > 0) {
        this.deleteCount = this.#deleteCount + newCount;
        for (const key of deletedKeys) {
          this.emit("rowChangeChanged", key);
        }
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
        this.#rowDeleteRevisions.delete(key);
        this.deleteCount = this.#deleteCount - 1;
      }
    }
  }

  hasRowChanges(key: string): boolean {
    return this.#rowEdits.has(key) || this.#deletedRows.has(key);
  }

  isCellEdited(key: string, columnName: string): boolean {
    const cellEdit = this.#rowEdits.get(key)?.cellEdits.get(columnName);
    return (
      cellEdit?.isValid === true &&
      cellEdit.originalValue !== cellEdit.editedValue
    );
  }

  async undoRowChange(key: string): Promise<void> {
    if (!this.inEditMode) return;

    const undoRevision = this.#commitRevision;
    const deleteRevisionAtRequest = this.#rowDeleteRevisions.get(key);
    const rowEditsAtRequest = this.#rowEdits.get(key);
    const columnsAtRequest = new Set(rowEditsAtRequest?.cellEdits.keys());
    const wasDeleted = this.#deletedRows.has(key);
    const response = await this.dataSource?.undoRowChange?.(key);

    if (isRpcError(response)) {
      return;
    }

    const rowEdits = this.#rowEdits.get(key);
    if (rowEdits) {
      const changedColumns: string[] = [];
      for (const columnName of columnsAtRequest) {
        const latestRevision =
          this.#cellCommitRevisions.get(key)?.get(columnName) ?? 0;
        if (latestRevision > undoRevision) {
          continue;
        }
        if (this.isCellEdited(key, columnName)) {
          changedColumns.push(columnName);
        }
        rowEdits.cellEdits.delete(columnName);
        this.#setCellCommitRevision(key, columnName);
      }
      if (rowEdits.cellEdits.size === 0) {
        this.#rowEdits.delete(key);
      }
      this.#refreshEditCounts();
      for (const columnName of changedColumns) {
        this.emit("cellEditChanged", key, columnName);
      }
    }
    if (
      wasDeleted &&
      this.#deletedRows.has(key) &&
      this.#rowDeleteRevisions.get(key) === deleteRevisionAtRequest
    ) {
      this.#deletedRows.delete(key);
      this.#rowDeleteRevisions.delete(key);
      this.deleteCount = this.#deleteCount - 1;
    }

    // If the server deleted a newly inserted row, decrement addCount
    const wasInsertedRow =
      (response?.data as UndoRowChangeResult | undefined)?.wasInsertedRow ===
      true;
    if (wasInsertedRow) {
      this.addCount = this.#addCount - 1;
    }
    this.emit("rowChangeChanged", key);
  }

  #clearEdits() {
    const oldState = this.editState;
    const editedCells = [...this.#rowEdits].flatMap(([key, { cellEdits }]) =>
      [...cellEdits.keys()]
        .filter((columnName) => this.isCellEdited(key, columnName))
        .map((columnName) => [key, columnName] as const),
    );
    this.#rowEdits.clear();
    this.#deletedRows.clear();
    this.#rowDeleteRevisions.clear();
    this.#cellCommitRevisions.clear();
    this.#editCount = 0;
    this.#deleteCount = 0;
    this.#addCount = 0;
    this.#invalidCount = 0;
    this.#isStale = false;
    this.#setNewRowState({
      columns: this.#newRowState.columns,
      draftRevision: this.#newRowState.draftRevision + 1,
      errors: {},
      submitting: false,
      values: {},
    });
    for (const [key, columnName] of editedCells) {
      this.emit("cellEditChanged", key, columnName);
    }
    this.#emitEditStateChange(oldState);
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
        const sourceDataSource = this.#sourceTableDataSource;
        const sessionDataSource =
          this.#editSessionApi === "beginEditSession"
            ? await sourceDataSource?.beginEditSession?.(
                toEditSessionMode(copyOption),
              )
            : await sourceDataSource?.createSessionDataSource?.(copyOption);
        if (!sessionDataSource) {
          throw new Error(
            `[EditSession] datasource does not support ${this.#editSessionApi}`,
          );
        }

        this.#sessionDataSource = sessionDataSource;
        this.#setStale(false);
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

  get sessionDataSource() {
    return this.#sessionDataSource;
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
          this.#setStale(true);
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

  #getOrCreateRowEdits(key: string): RowEditDetails {
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

  #storeCellEdit(
    key: string,
    cellEdits: Map<string, CellEdit>,
    column: string,
    originalValue: VuuRowDataItemType,
    editedValue: VuuRowDataItemType,
    isValid: boolean,
  ) {
    const wasEdited = this.isCellEdited(key, column);
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
    if (wasEdited !== this.isCellEdited(key, column)) {
      this.emit("cellEditChanged", key, column);
    }
    return cellEdit;
  }

  #setCellCommitRevision(key: string, columnName: string) {
    const revision = ++this.#commitRevision;
    const rowRevisions =
      this.#cellCommitRevisions.get(key) ?? new Map<string, number>();
    rowRevisions.set(columnName, revision);
    this.#cellCommitRevisions.set(key, rowRevisions);
    return revision;
  }

  #isLatestCellCommit(key: string, columnName: string, revision: number) {
    return this.#cellCommitRevisions.get(key)?.get(columnName) === revision;
  }

  async commit(
    key: string,
    columnName: string,
    originalValue: VuuRowDataItemType,
    typedValue: string | number | boolean,
    isValid: boolean,
  ): Promise<RpcResult> {
    if (
      this.#lifecycle.status !== "active" &&
      !(
        this.#lifecycle.status === "error" &&
        this.#lifecycle.operation === "end"
      )
    ) {
      throw new Error("No edit session in progress");
    }
    const revision = this.#setCellCommitRevision(key, columnName);
    const rowEditDetails = this.#getOrCreateRowEdits(key);
    const { cellEdits } = rowEditDetails;

    if (isValid) {
      const cellEdit = this.#storeCellEdit(
        key,
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
        if (!this.#isLatestCellCommit(key, columnName, revision)) {
          throw new SupersededEditError(
            `Edit response superseded for ${key}:${columnName}`,
          );
        }
        const currentCellEdits = this.#getOrCreateRowEdits(key).cellEdits;
        if (isRpcError(response)) {
          this.#storeCellEdit(
            key,
            currentCellEdits,
            columnName,
            cellEdit.originalValue,
            typedValue,
            false,
          );
        } else if (currentCellEdits.size === 0) {
          this.#rowEdits.delete(key);
        }

        return response;
      }
      if (cellEdits.size === 0) {
        this.#rowEdits.delete(key);
      }
      return { data: undefined, type: "SUCCESS_RESULT" };
    } else {
      this.#storeCellEdit(
        key,
        cellEdits,
        columnName,
        originalValue,
        typedValue,
        isValid,
      );
      return { data: undefined, type: "SUCCESS_RESULT" };
    }
  }
}
