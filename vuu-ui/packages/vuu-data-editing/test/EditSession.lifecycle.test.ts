import type { DataSource, EditApi } from "@vuu-ui/vuu-data-types";
import type {
  RpcResultError,
  RpcResultSuccess,
} from "@vuu-ui/vuu-protocol-types";
import { StaleUpdateError as UtilsStaleUpdateError } from "@vuu-ui/vuu-utils2";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EditSession, StaleUpdateError } from "../src";

vi.hoisted(() => {
  class MockWorker {
    onmessage: ((event: MessageEvent) => void) | null = null;

    constructor(_url: string) {
      void _url;
    }

    postMessage(_message: unknown) {
      void _message;
    }

    terminate() {
      return undefined;
    }
  }

  vi.stubGlobal("Worker", MockWorker);
});

type Editable = Required<EditApi>;
type AddRow = Editable["addRow"];
type CreateSession = Editable["createSessionDataSource"];
type EndEdit = Editable["endEditSession"];
type EditCell = Editable["editCell"];

const SUCCESS: RpcResultSuccess = { type: "SUCCESS_RESULT", data: undefined };
const ERROR: RpcResultError = {
  type: "ERROR_RESULT",
  errorMessage: "edit rejected",
};

class MockDataSource implements EditApi {
  constructor(
    private endEdit: EndEdit,
    private createSession: CreateSession,
    private edit: EditCell = vi.fn().mockResolvedValue(SUCCESS),
    private addRowImpl?: AddRow,
  ) { }

  addRow(...args: Parameters<AddRow>) {
    return this.addRowImpl?.(...args);
  }

  endEditSession(...args: Parameters<EndEdit>) {
    return this.endEdit(...args);
  }

  createSessionDataSource(...args: Parameters<CreateSession>) {
    return this.createSession(...args);
  }

  editCell(...args: Parameters<EditCell>) {
    return this.edit(...args);
  }
}

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
};

describe("EditSession lifecycle", () => {
  let createSession: CreateSession;
  let editSession: EditSession;
  let editCell: EditCell;
  let endEdit: EndEdit;

  beforeEach(() => {
    endEdit = vi.fn();
    editCell = vi.fn().mockResolvedValue(SUCCESS);
    createSession = vi.fn(
      async () => dataSource as unknown as DataSource,
    ) as CreateSession;
    const dataSource = new MockDataSource(endEdit, createSession, editCell);
    editSession = new EditSession(dataSource);
  });

  it("publishes lifecycle transitions", async () => {
    const lifecycleListener = vi.fn();
    editSession.on("lifecycle", lifecycleListener);

    await editSession.begin();
    await editSession.end();

    expect(lifecycleListener.mock.calls.map(([state]) => state.status)).toEqual(
      ["starting", "active", "ending", "idle"],
    );
  });

  it("adds a populated row and updates the add count after success", async () => {
    const addRow = vi.fn<AddRow>().mockResolvedValue({
      data: undefined,
      type: "SUCCESS_RESULT",
    });
    editSession = new EditSession(
      new MockDataSource(endEdit, createSession, editCell, addRow),
    );

    await editSession.addRow({ id: 7, name: "Alice" });

    expect(addRow).toHaveBeenCalledWith({ id: 7, name: "Alice" });
    expect(editSession.addCount).toBe(1);
  });

  it("does not update the add count when adding a row fails", async () => {
    const addRow = vi.fn<AddRow>().mockResolvedValue({
      errorMessage: "Insert rejected",
      type: "ERROR_RESULT",
    });
    editSession = new EditSession(
      new MockDataSource(endEdit, createSession, editCell, addRow),
    );

    await editSession.addRow({ id: 7 });

    expect(editSession.addCount).toBe(0);
  });

  it("owns draft values and required-field errors for a new row", async () => {
    const addRow = vi.fn<AddRow>().mockResolvedValue(SUCCESS);
    editSession = new EditSession(
      new MockDataSource(endEdit, createSession, editCell, addRow),
    );
    editSession.configureNewRow(["id", "name"]);
    editSession.setNewRowValue("id", 7);
    expect(editSession.isNewRowComplete()).toBe(false);

    await expect(editSession.addNewRow()).resolves.toEqual(SUCCESS);
    expect(editSession.newRowState.errors).toEqual({ name: "Value required" });
    expect(addRow).not.toHaveBeenCalled();

    editSession.setNewRowValue("name", "Alice");
    expect(editSession.isNewRowComplete()).toBe(true);
    await expect(editSession.addNewRow()).resolves.toEqual(SUCCESS);
    expect(addRow).toHaveBeenCalledWith({ id: 7, name: "Alice" });
    expect(editSession.newRowState).toMatchObject({
      draftRevision: 1,
      errors: {},
      values: {},
    });
  });

  it("prevents duplicate new-row submissions", async () => {
    const pendingAdd = deferred<RpcResultSuccess>();
    const addRow = vi.fn<AddRow>().mockReturnValue(pendingAdd.promise);
    editSession = new EditSession(
      new MockDataSource(endEdit, createSession, editCell, addRow),
    );
    editSession.configureNewRow(["id"]);
    editSession.setNewRowValue("id", 7);

    const firstAdd = editSession.addNewRow();
    await Promise.resolve();
    const secondAdd = editSession.addNewRow();
    pendingAdd.resolve(SUCCESS);

    await expect(firstAdd).resolves.toEqual(SUCCESS);
    await expect(secondAdd).resolves.toEqual(SUCCESS);
    expect(addRow).toHaveBeenCalledTimes(1);
  });

  it("serializes end behind a pending begin", async () => {
    const pendingBegin = deferred<DataSource | undefined>();
    createSession = vi.fn(() => pendingBegin.promise);
    const dataSource = new MockDataSource(endEdit, createSession);
    editSession = new EditSession(dataSource);

    const beginPromise = editSession.begin();
    await Promise.resolve();
    expect(editSession.lifecycle.status).toBe("starting");

    const endPromise = editSession.end();
    expect(endEdit).not.toHaveBeenCalled();

    pendingBegin.resolve(dataSource as unknown as DataSource);
    await beginPromise;
    await endPromise;

    expect(createSession).toHaveBeenCalledTimes(1);
    expect(endEdit).toHaveBeenCalledTimes(1);
    expect(editSession.lifecycle).toEqual({ status: "idle" });
  });

  it("does not begin a second session when begin is queued twice", async () => {
    await Promise.all([editSession.begin(), editSession.begin()]);

    expect(createSession).toHaveBeenCalledTimes(1);
    expect(editSession.lifecycle.status).toBe("active");
  });

  it("forwards copy options and defaults to All", async () => {
    await editSession.begin();
    expect(createSession).toHaveBeenCalledWith("All");

    await editSession.end();
    createSession = vi.fn(
      async () => selectedDataSource as unknown as DataSource,
    ) as CreateSession;
    const selectedDataSource = new MockDataSource(endEdit, createSession);
    editSession = new EditSession(selectedDataSource);
    await editSession.begin("Selected");
    expect(createSession).toHaveBeenCalledWith("Selected");
  });

  it("keeps a failed end session active and allows retry", async () => {
    const endError = new Error("end failed");
    endEdit = vi
      .fn()
      .mockRejectedValueOnce(endError)
      .mockResolvedValueOnce(undefined);
    createSession = vi.fn(
      async () => dataSource as unknown as DataSource,
    ) as CreateSession;
    const dataSource = new MockDataSource(endEdit, createSession);
    editSession = new EditSession(dataSource);

    await editSession.begin();
    await expect(editSession.end()).rejects.toBe(endError);

    expect(editSession.lifecycle).toMatchObject({
      status: "error",
      operation: "end",
      error: endError,
    });
    expect(editSession.inEditMode).toBe(true);

    await editSession.end();
    expect(editSession.lifecycle).toEqual({ status: "idle" });
  });

  it("re-exports and handles stale update errors", async () => {
    const staleUpdateError = new StaleUpdateError("stale update");
    const editStateListener = vi.fn();
    endEdit = vi.fn().mockRejectedValue(staleUpdateError);
    createSession = vi.fn(
      async () => dataSource as unknown as DataSource,
    ) as CreateSession;
    const dataSource = new MockDataSource(endEdit, createSession);
    editSession = new EditSession(dataSource);
    editSession.on("editState", editStateListener);

    expect(StaleUpdateError).toBe(UtilsStaleUpdateError);
    await editSession.begin();
    await expect(editSession.end()).rejects.toBe(staleUpdateError);
    expect(editStateListener).toHaveBeenCalledWith("stale");
    expect(editSession.editState).toBe("stale");
  });

  it("keeps stale authoritative until a successful retry ends the session", async () => {
    const staleUpdateError = new StaleUpdateError("stale update");
    endEdit = vi
      .fn()
      .mockRejectedValueOnce(staleUpdateError)
      .mockResolvedValueOnce(undefined);
    createSession = vi.fn(
      async () => dataSource as unknown as DataSource,
    ) as CreateSession;
    const dataSource = new MockDataSource(endEdit, createSession);
    editSession = new EditSession(dataSource);

    await editSession.begin();
    await editSession.commit("row-1", "price", 100, 101, true);
    await expect(editSession.end(true)).rejects.toBe(staleUpdateError);
    expect(editSession.editState).toBe("stale");

    await editSession.end(true, true);
    expect(editSession.editState).toBe("clean");

    await editSession.begin();
    expect(editSession.editState).toBe("clean");
  });

  it("prioritizes validation over stale and restores stale after correction", async () => {
    const staleUpdateError = new StaleUpdateError("stale update");
    endEdit = vi.fn().mockRejectedValue(staleUpdateError);
    createSession = vi.fn(
      async () => dataSource as unknown as DataSource,
    ) as CreateSession;
    const dataSource = new MockDataSource(endEdit, createSession);
    editSession = new EditSession(dataSource);

    await editSession.begin();
    await editSession.commit("row-1", "price", 100, 101, true);
    await expect(editSession.end(true)).rejects.toBe(staleUpdateError);
    await editSession.commit("row-1", "price", 100, "invalid", false);

    expect(editSession.editState).toBe("invalid");
    expect(editSession.invalidCount).toBe(1);

    await editSession.commit("row-1", "price", 100, 102, true);
    expect(editSession.editState).toBe("stale");
    expect(editSession.invalidCount).toBe(0);
  });

  it("runs edits and end operations on the created session datasource", async () => {
    const sessionEnd = vi.fn<EndEdit>().mockResolvedValue(undefined);
    const sessionEdit = vi.fn<EditCell>().mockResolvedValue(SUCCESS);
    const unusedCreate = vi.fn<CreateSession>();
    const sessionDataSource = new MockDataSource(
      sessionEnd,
      unusedCreate,
      sessionEdit,
    );
    const sourceEnd = vi.fn<EndEdit>();
    const sourceEdit = vi.fn<EditCell>();
    const sourceCreate = vi
      .fn<CreateSession>()
      .mockResolvedValue(sessionDataSource as unknown as DataSource);
    const sourceDataSource = new MockDataSource(
      sourceEnd,
      sourceCreate,
      sourceEdit,
    );
    editSession = new EditSession(sourceDataSource);

    await editSession.begin();
    expect(editSession.sessionDataSource).toBe(sessionDataSource);
    await editSession.commit("row-1", "price", 100, 101, true);
    await editSession.end(true);

    expect(sessionEdit).toHaveBeenCalledWith("row-1", "price", 101);
    expect(sessionEnd).toHaveBeenCalledWith(true, false);
    expect(sourceEdit).not.toHaveBeenCalled();
    expect(sourceEnd).not.toHaveBeenCalled();
    expect(editSession.dataSource).toBe(sourceDataSource);
    expect(editSession.sessionDataSource).toBeUndefined();
  });

  it("keeps the session datasource selected after an end failure", async () => {
    const endError = new Error("end failed");
    const sessionEnd = vi.fn<EndEdit>().mockRejectedValue(endError);
    const sessionDataSource = new MockDataSource(
      sessionEnd,
      vi.fn<CreateSession>(),
    );
    const sourceDataSource = new MockDataSource(
      vi.fn<EndEdit>(),
      vi
        .fn<CreateSession>()
        .mockResolvedValue(sessionDataSource as unknown as DataSource),
    );
    editSession = new EditSession(sourceDataSource);

    await editSession.begin();
    await expect(editSession.end(true)).rejects.toBe(endError);

    expect(editSession.dataSource).toBe(sessionDataSource);
    expect(editSession.sessionDataSource).toBe(sessionDataSource);
    expect(editSession.lifecycle).toMatchObject({
      operation: "end",
      sessionDataSource,
      status: "error",
    });
  });

  it("reports begin failures without entering edit mode", async () => {
    const beginError = new Error("begin failed");
    createSession = vi.fn().mockRejectedValueOnce(beginError);
    editSession = new EditSession(new MockDataSource(endEdit, createSession));

    await expect(editSession.begin()).rejects.toBe(beginError);

    expect(editSession.lifecycle).toMatchObject({
      status: "error",
      operation: "begin",
      error: beginError,
    });
    expect(editSession.inEditMode).toBe(false);
  });

  it("keeps valid and invalid counts correct through repeated edits", async () => {
    const states: string[] = [];
    editSession.on("editState", (state) => states.push(state));
    await editSession.begin();

    await editSession.commit("row-1", "price", 100, 101, true);
    expect([
      editSession.editCount,
      editSession.invalidCount,
      editSession.editState,
    ]).toEqual([1, 0, "dirty"]);

    await editSession.commit("row-1", "price", 100, 102, false);
    await editSession.commit("row-1", "price", 100, 103, false);
    expect([
      editSession.editCount,
      editSession.invalidCount,
      editSession.editState,
    ]).toEqual([0, 1, "invalid"]);

    await editSession.commit("row-1", "price", 100, 104, true);
    await editSession.commit("row-1", "price", 100, 105, true);
    expect([
      editSession.editCount,
      editSession.invalidCount,
      editSession.editState,
    ]).toEqual([1, 0, "dirty"]);

    await editSession.commit("row-1", "price", 100, 100, true);
    expect([
      editSession.editCount,
      editSession.invalidCount,
      editSession.editState,
    ]).toEqual([0, 0, "clean"]);
    expect(states).toEqual(["dirty", "invalid", "dirty", "clean"]);
  });

  it("moves rejected edits from valid to invalid without inflating counts", async () => {
    editCell = vi
      .fn()
      .mockResolvedValueOnce(ERROR)
      .mockResolvedValueOnce(SUCCESS)
      .mockResolvedValueOnce(ERROR)
      .mockResolvedValueOnce(SUCCESS);
    createSession = vi.fn(
      async () => dataSource as unknown as DataSource,
    ) as CreateSession;
    const dataSource = new MockDataSource(endEdit, createSession, editCell);
    editSession = new EditSession(dataSource);
    await editSession.begin();

    await editSession.commit("row-1", "price", 100, 101, true);
    expect([
      editSession.editCount,
      editSession.invalidCount,
      editSession.editState,
    ]).toEqual([0, 1, "invalid"]);

    await editSession.commit("row-1", "price", 100, 102, true);
    expect([editSession.editCount, editSession.invalidCount]).toEqual([1, 0]);

    await editSession.commit("row-1", "price", 100, 103, true);
    expect([editSession.editCount, editSession.invalidCount]).toEqual([0, 1]);

    await editSession.commit("row-1", "price", 100, 100, true);
    expect([
      editSession.editCount,
      editSession.invalidCount,
      editSession.editState,
    ]).toEqual([0, 0, "clean"]);
  });

  it("ignores superseded commit responses and keeps the newest cell state", async () => {
    const first = deferred<RpcResultError>();
    const second = deferred<RpcResultSuccess>();
    editCell = vi
      .fn<EditCell>()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    createSession = vi.fn(
      async () => dataSource as unknown as DataSource,
    ) as CreateSession;
    const dataSource = new MockDataSource(endEdit, createSession, editCell);
    editSession = new EditSession(dataSource);
    await editSession.begin();

    const firstCommit = editSession.commit("row-1", "price", 100, 101, true);
    const secondCommit = editSession.commit("row-1", "price", 101, 102, true);

    second.resolve(SUCCESS);
    await secondCommit;
    first.resolve(ERROR);
    await expect(firstCommit).rejects.toThrow(
      "Edit response superseded for row-1:price",
    );

    expect(editSession.isCellEdited("row-1", "price")).toBe(true);
    expect([
      editSession.editCount,
      editSession.invalidCount,
      editSession.editState,
    ]).toEqual([1, 0, "dirty"]);
  });

  it("keeps concurrent cell responses attached to current row state", async () => {
    const firstRevert = deferred<RpcResultSuccess>();
    const secondRevert = deferred<RpcResultError>();
    editCell = vi
      .fn<EditCell>()
      .mockResolvedValueOnce(SUCCESS)
      .mockResolvedValueOnce(SUCCESS)
      .mockReturnValueOnce(firstRevert.promise)
      .mockReturnValueOnce(secondRevert.promise);
    createSession = vi.fn(
      async () => dataSource as unknown as DataSource,
    ) as CreateSession;
    const dataSource = new MockDataSource(endEdit, createSession, editCell);
    editSession = new EditSession(dataSource);
    await editSession.begin();
    await editSession.commit("row-1", "price", 100, 101, true);
    await editSession.commit("row-1", "size", 10, 11, true);

    const firstCommit = editSession.commit("row-1", "price", 101, 100, true);
    const secondCommit = editSession.commit("row-1", "size", 11, 10, true);
    firstRevert.resolve(SUCCESS);
    await firstCommit;
    secondRevert.resolve(ERROR);
    await secondCommit;

    expect([
      editSession.editCount,
      editSession.invalidCount,
      editSession.editState,
    ]).toEqual([0, 1, "invalid"]);
  });

  it("undoes only edits that existed when the undo request began", async () => {
    const pendingUndo = deferred<RpcResultSuccess>();
    const dataSource: EditApi = {
      createSessionDataSource: vi.fn(
        async () => dataSource as unknown as DataSource,
      ),
      editCell: vi.fn().mockResolvedValue(SUCCESS),
      endEditSession: vi.fn(),
      undoRowChange: vi.fn().mockReturnValue(pendingUndo.promise),
    };
    editSession = new EditSession(dataSource);
    await editSession.begin();
    await editSession.commit("row-1", "price", 100, 101, true);

    const undo = editSession.undoRowChange("row-1");
    await editSession.commit("row-1", "size", 10, 11, true);
    pendingUndo.resolve(SUCCESS);
    await undo;

    expect(editSession.isCellEdited("row-1", "price")).toBe(false);
    expect(editSession.isCellEdited("row-1", "size")).toBe(true);
    expect([editSession.editCount, editSession.invalidCount]).toEqual([1, 0]);
  });

  it("does not let an older undo clear a newer row deletion", async () => {
    const pendingUndo = deferred<RpcResultSuccess>();
    const deleteSelectedRows = vi.fn().mockResolvedValue({
      data: { deletedKeys: ["row-1"] },
      type: "SUCCESS_RESULT",
    });
    const dataSource: EditApi = {
      createSessionDataSource: vi.fn(
        async () => dataSource as unknown as DataSource,
      ),
      deleteSelectedRows,
      endEditSession: vi.fn(),
      undoRowChange: vi.fn().mockReturnValue(pendingUndo.promise),
    };
    editSession = new EditSession(dataSource);
    await editSession.begin();
    await editSession.deleteSelectedRows();

    const undo = editSession.undoRowChange("row-1");
    await editSession.deleteSelectedRows();
    pendingUndo.resolve(SUCCESS);
    await undo;

    expect(editSession.hasRowChanges("row-1")).toBe(true);
    expect(editSession.deleteCount).toBe(1);
  });

  it("notifies delete count boundaries while cell edits keep the session dirty", async () => {
    const states: string[] = [];
    editSession.on("editState", (state) => states.push(state));
    await editSession.begin();
    await editSession.commit("row-1", "price", 100, 101, true);
    states.length = 0;

    editSession.deleteCount = 1;
    editSession.deleteCount = 0;

    expect(states).toEqual(["dirty", "dirty"]);
    expect(editSession.editState).toBe("dirty");
  });
});
