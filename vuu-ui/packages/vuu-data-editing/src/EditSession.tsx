import type {
  CopyOption,
  DataSource,
  DeleteRowMode,
  EditSessionMode,
  SchemaColumn,
  SessionType,
  UndoRowChangeResult,
} from "@vuu-ui/vuu-data-types";
import type { RpcResult, VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { EventEmitter, isRpcError, StaleUpdateError } from "@vuu-ui/vuu-utils";

export type EditState = "clean" | "dirty" | "invalid" | "stale";
export type EditActionType = "deleteRow" | "addRow" | "editCell";
/** Column name to default value mapping applied to every addRow call when a column is absent from the row data. */
export type RowDefaultDataItemValues = Record<string, VuuRowDataItemType>;
export type EditSessionApi = "createSessionDataSource" | "beginEditSession";

export type EditSessionConstructorProps = {
  dataSource: DataSource;
  /** @default "soft" */
  deleteMode?: DeleteRowMode;
  /** @default "createSessionDataSource" */
  editSessionApi?: EditSessionApi;
  /** Default column values merged into every addRow call for absent columns. Pass a stable reference. */
  rowDefaults?: RowDefaultDataItemValues;
};
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
  requiredColumns?: readonly string[];
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
};

export class EditSession extends EventEmitter<EditSessionEvents> {
  static readonly newRowKey = "__vuu_new_row__";
  /**
   *  Row key => row edits
   */
  #rowEdits = new Map<string, RowEditDetails>();
  #editCount = 0;
  #deleteCount = 0;
  #addCount = 0;
  #invalidCount = 0;
  #isStale = false;
  #commitRevision = 0;
  #cellCommitRevisions = new Map<string, Map<string, number>>();
  #deleteMode: DeleteRowMode;
  #editSessionApi: EditSessionApi;
  #rowDefaults: RowDefaultDataItemValues;
  #sourceTableDataSource?: DataSource;
  #sessionDataSource?: DataSource;
  #newRowState: NewRowState = {
    columns: [],
    requiredColumns: [],
    draftRevision: 0,
    errors: {},
    submitting: false,
    values: {},
  };
  #lifecycle: EditLifecycle = { status: "idle" };
  /** Prevent begin/end RPCs from overlapping and observing stale lifecycle state. */
  #transitionQueue: Promise<void> = Promise.resolve();

  constructor({
    dataSource,
    deleteMode = "soft",
    editSessionApi = "createSessionDataSource",
    rowDefaults = {},
  }: EditSessionConstructorProps) {
    super();
    this.#sourceTableDataSource = dataSource;
    this.#deleteMode = deleteMode;
    this.#editSessionApi = editSessionApi;
    this.#rowDefaults = { ...rowDefaults };
  }

  get editCount() {
    return this.#editCount;
  }

  get invalidCount() {
    return this.#invalidCount;
  }

  get deleteCount() {
    return this.#deleteCount;
  }

  get addCount() {
    return this.#addCount;
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

  #setDeleteCount(val: number) {
    if (val !== this.#deleteCount) {
      const oldState = this.editState;
      const oldCount = this.#deleteCount;
      this.#deleteCount = val;
      this.#emitEditStateChange(oldState, oldCount === 0 || val === 0);
    }
  }

  #setAddCount(val: number) {
    if (val !== this.#addCount) {
      const oldState = this.editState;
      const oldCount = this.#addCount;
      this.#addCount = val;
      this.#emitEditStateChange(oldState, oldCount === 0 || val === 0);
    }
  }

  #setStale(isStale: boolean) {
    if (isStale !== this.#isStale) {
      const oldState = this.editState;
      this.#isStale = isStale;
      this.#emitEditStateChange(oldState);
    }
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
    const requiredColumns =
      this.#newRowState.requiredColumns ?? this.#newRowState.columns;
    return requiredColumns.every((column) => {
      const value = this.#newRowState.values[column];
      return (
        value !== undefined &&
        (typeof value !== "string" || value.trim() !== "")
      );
    });
  }

  configureNewRow(
    columns: readonly string[],
    requiredColumns?: readonly string[],
  ) {
    if (
      columns.length === this.#newRowState.columns.length &&
      columns.every(
        (column, index) => column === this.#newRowState.columns[index],
      ) &&
      (!requiredColumns ||
        (this.#newRowState.requiredColumns !== undefined &&
          requiredColumns.length === this.#newRowState.requiredColumns.length &&
          requiredColumns.every(
            (column, index) =>
              column === this.#newRowState.requiredColumns?.[index],
          )))
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
      requiredColumns: requiredColumns ? [...requiredColumns] : undefined,
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
    const requiredColumns =
      this.#newRowState.requiredColumns ?? this.#newRowState.columns;
    const missingErrors = Object.fromEntries(
      requiredColumns
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
        requiredColumns: this.#newRowState.requiredColumns,
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

  async deleteSelectedRows(): Promise<RpcResult> {
    const deleteSelectedRows = this.dataSource?.deleteSelectedRows;
    if (deleteSelectedRows === undefined) {
      throw Error("[EditSession] datasource does not support deleting rows");
    }

    // We rely purely on the datasource-supplied selectedRowsCount for counting deletions
    // captured before the RPC call since execution deselects the deleted rows.
    const selectedRowsCount = this.dataSource?.selectedRowsCount ?? 0;

    const response = await deleteSelectedRows.call(
      this.dataSource,
      this.#deleteMode,
    );
    if (response === undefined) {
      throw Error(
        "[EditSession] datasource returned no response when deleting rows",
      );
    }
    if (isRpcError(response)) return response;

    if (selectedRowsCount > 0) {
      this.#setDeleteCount(this.#deleteCount + selectedRowsCount);
    }
    return response;
  }

  async addRow(
    rowData: Record<string, VuuRowDataItemType> = {},
  ): Promise<RpcResult> {
    const addRow = this.dataSource?.addRow;
    if (addRow === undefined) {
      throw Error("[EditSession] datasource does not support adding rows");
    }

    const response = await addRow.call(this.dataSource, {
      ...this.#rowDefaults,
      ...rowData,
    });
    if (response === undefined) {
      throw Error(
        "[EditSession] datasource returned no response when adding row",
      );
    }
    if (!isRpcError(response)) {
      this.#setAddCount(this.#addCount + 1);
    }
    return response;
  }

  hasRowChanges(key: string): boolean {
    return this.#rowEdits.has(key);
  }

  isCellEdited(key: string, columnName: string): boolean {
    const cellEdit = this.#rowEdits.get(key)?.cellEdits.get(columnName);
    return (
      cellEdit?.isValid === true &&
      cellEdit.originalValue !== cellEdit.editedValue
    );
  }

  async undoRowChange(
    key: string,
    action: EditActionType,
  ): Promise<RpcResult | undefined> {
    if (!this.inEditMode) return;

    const undoRevision = this.#commitRevision;
    const rowEditsAtRequest = this.#rowEdits.get(key);
    const columnsAtRequest = new Set(rowEditsAtRequest?.cellEdits.keys());
    const response = await this.dataSource?.undoRowChange?.(key);

    if (response === undefined) {
      return undefined;
    }
    if (isRpcError(response)) {
      return response;
    }

    const oldState = this.editState;

    const rowEdits = this.#rowEdits.get(key);
    if (rowEdits) {
      const changedColumns: string[] = [];
      let removedValidCount = 0;
      let removedInvalidCount = 0;

      for (const columnName of columnsAtRequest) {
        const latestRevision =
          this.#cellCommitRevisions.get(key)?.get(columnName) ?? 0;
        if (latestRevision > undoRevision) {
          continue;
        }
        const existing = rowEdits.cellEdits.get(columnName);
        if (existing) {
          if (existing.isValid) {
            removedValidCount++;
          } else {
            removedInvalidCount++;
          }
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

      this.#editCount -= removedValidCount;
      this.#invalidCount -= removedInvalidCount;

      for (const columnName of changedColumns) {
        this.emit("cellEditChanged", key, columnName);
      }
    }

    if (action === "deleteRow") {
      this.#deleteCount--;
    }

    // If the server deleted a newly inserted row, decrement addCount
    const wasInsertedRow =
      action === "addRow" ||
      (response?.data as UndoRowChangeResult | undefined)?.wasInsertedRow ===
        true;
    if (wasInsertedRow) {
      this.#addCount--;
    }

    this.#emitEditStateChange(oldState);

    return response;
  }

  #clearEdits() {
    const oldState = this.editState;
    const editedCells = [...this.#rowEdits].flatMap(([key, { cellEdits }]) =>
      [...cellEdits.keys()]
        .filter((columnName) => this.isCellEdited(key, columnName))
        .map((columnName) => [key, columnName] as const),
    );
    this.#rowEdits.clear();
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

  begin(
    copyOption: CopyOption = "All",
    sessionType: SessionType = "edit",
  ): Promise<DataSource> {
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
            : await sourceDataSource?.createSessionDataSource?.(
                copyOption,
                sessionType,
              );
        if (!sessionDataSource) {
          throw new Error(
            `[EditSession] datasource does not support ${this.#editSessionApi}`,
          );
        }

        this.#sessionDataSource = sessionDataSource;
        this.#setStale(false);
        this.#setLifecycle({ status: "active", sessionDataSource });

        this.reconcileWithSessionSchema();

        return sessionDataSource;
      } catch (cause) {
        const error = cause instanceof Error ? cause : new Error(String(cause));
        this.#setLifecycle({ status: "error", operation: "begin", error });
        throw error;
      }
    });
  }

  /**
   * Safe to call repeatedly - schema of a remote session table typically arrives
   * after begin() resolves, so callers re-invoke this once 'subscribed' fires.
   */
  reconcileWithSessionSchema() {
    const sessionSchema = this.#sessionDataSource?.tableSchema;
    if (sessionSchema === undefined) {
      return;
    }

    const columnNames = new Set(
      sessionSchema.columns.map((c: SchemaColumn) => c.name),
    );
    const unknown = Object.keys(this.#rowDefaults).filter(
      (key) => !columnNames.has(key),
    );
    if (unknown.length > 0) {
      console.warn(
        `[EditSession] rowDefaults contains columns not in table schema, removing: ${unknown.join(", ")}`,
      );
      for (const key of unknown) {
        delete this.#rowDefaults[key];
      }
    }

    const sourceKey = (this.#sourceTableDataSource as Partial<DataSource>)
      ?.tableSchema?.key;
    if (sourceKey !== undefined && sourceKey !== sessionSchema.key) {
      // Row edits, deletes and undo state are keyed by row key, so they cannot
      // be carried across tables with different key columns.
      console.warn(
        `[EditSession] source table key '${sourceKey}' differs from session table key '${sessionSchema.key}', discarding pending edits`,
      );
      this.#clearEdits();
    }
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

    // Keep track of counts before change
    let prevValidCount = 0;
    let prevInvalidCount = 0;
    if (existingCellEdit) {
      if (existingCellEdit.isValid) {
        prevValidCount = 1;
      } else {
        prevInvalidCount = 1;
      }
    }

    let nextValidCount = 0;
    let nextInvalidCount = 0;

    const isRevertedToOriginal =
      isValid && cellEdit.originalValue === editedValue;
    if (isRevertedToOriginal) {
      cellEdits.delete(column);
      if (cellEdits.size === 0) {
        this.#rowEdits.delete(key);
      }
    } else {
      cellEdits.set(column, cellEdit);
      if (isValid) {
        nextValidCount = 1;
      } else {
        nextInvalidCount = 1;
      }
    }

    // Incremental counter adjustment
    const editCountDiff = nextValidCount - prevValidCount;
    const invalidCountDiff = nextInvalidCount - prevInvalidCount;

    if (editCountDiff !== 0 || invalidCountDiff !== 0) {
      this.#setEditCounts(
        this.#editCount + editCountDiff,
        this.#invalidCount + invalidCountDiff,
      );
    }

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
        if (!this.inEditMode) {
          // Edit session ended in the meantime; exit gracefully.
          return { data: undefined, type: "SUCCESS_RESULT" };
        }
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
