import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DataSource, EditApi } from "@vuu-ui/vuu-data-types";
import { EditSession } from "../src";

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
type CreateSession = Editable["createSessionDataSource"];
type EndEdit = Editable["endEditSession"];
type EditCell = Editable["editCell"];

export class MockDataSource implements EditApi {
  constructor(
    private createSession: CreateSession,
    private endEdit: EndEdit,
    private edit: EditCell,
  ) {}

  createSessionDataSource(...args: Parameters<CreateSession>) {
    return this.createSession(...args);
  }

  endEditSession(...args: Parameters<EndEdit>) {
    return this.endEdit(...args);
  }

  editCell(...args: Parameters<EditCell>) {
    return this.edit(...args);
  }
}

describe("EditSession", () => {
  let editSession: EditSession;
  let createSession: CreateSession;
  let endEdit: EndEdit;
  let edit: EditCell;

  beforeEach(() => {
    endEdit = vi.fn();
    edit = vi.fn();
    createSession = vi.fn(
      async () => editApi as unknown as DataSource,
    ) as CreateSession;
    const editApi = new MockDataSource(createSession, endEdit, edit);
    editSession = new EditSession({ dataSource: editApi });
  });

  it("begins with no edit and zero counts", () => {
    expect(editSession.editCount).toEqual(0);
    expect(editSession.invalidCount).toEqual(0);
    expect(editSession.inEditMode).toEqual(false);
  });

  it("supports the legacy beginEditSession API", async () => {
    const sessionDataSource = {} as DataSource;
    const beginEditSession = vi.fn().mockResolvedValue(sessionDataSource);
    const sourceDataSource = {
      beginEditSession,
    } as EditApi;
    const legacyEditSession = new EditSession({
      dataSource: sourceDataSource,
      deleteMode: "soft",
      editSessionApi: "beginEditSession",
    });

    await legacyEditSession.begin("Selected");

    expect(beginEditSession).toHaveBeenCalledWith("selected-rows");
    expect(legacyEditSession.sessionDataSource).toBe(sessionDataSource);
  });

  it("edits outside an edit session throw an error", async () => {
    await expect(() =>
      editSession.commit("key-01", "col-1", 100, 150, true),
    ).rejects.toThrowError(/No edit session in progress/);
  });

  it("returns correct state when edit session in progress", async () => {
    await editSession.begin();
    expect(editSession.inEditMode).toEqual(true);
    await editSession.end();
    expect(editSession.inEditMode).toEqual(false);
  });

  it("increments edit count on first edit, emits edit event", async () => {
    const editEventListener = vi.fn();
    editSession.on("editState", editEventListener);

    await editSession.begin();

    await editSession.commit("key-01", "col-1", 100, 150, true);

    expect(editSession.editCount).toEqual(1);
    expect(editEventListener).toHaveBeenCalledTimes(1);
    expect(editEventListener).toHaveBeenCalledWith("dirty");

    await editSession.commit("key-01", "col-2", 100, 150, true);
    expect(editSession.editCount).toEqual(2);
    // no further call
    expect(editEventListener).toHaveBeenCalledTimes(1);

    await editSession.end();
  });

  it("decrements edit count on reverted edits, emits edit event whem no edits remaining", async () => {
    const editEventListener = vi.fn();
    editSession.on("editState", editEventListener);

    await editSession.begin();

    await editSession.commit("key-01", "col-1", 100, 150, true);
    await editSession.commit("key-01", "col-2", 100, 150, true);

    editEventListener.mockClear();

    await editSession.commit("key-01", "col-1", 150, 100, true);
    expect(editSession.editCount).toEqual(1);
    expect(editEventListener).toHaveBeenCalledTimes(0);

    await editSession.commit("key-01", "col-2", 150, 100, true);
    expect(editSession.editCount).toEqual(0);
    expect(editEventListener).toHaveBeenCalledTimes(1);
    expect(editEventListener).toHaveBeenCalledWith("clean");

    await editSession.end();
  });

  it("increments invalid count and emits edit event on invalid commit", async () => {
    const editEventListener = vi.fn();
    editSession.on("editState", editEventListener);

    await editSession.begin();

    await editSession.commit("key-01", "col-1", 100, "abc", false);

    expect(editSession.editCount).toEqual(0);
    expect(editSession.invalidCount).toEqual(1);
    expect(editEventListener).toHaveBeenCalledTimes(1);
    expect(editEventListener).toHaveBeenCalledWith("invalid");

    await editSession.commit("key-01", "col-1", "abc", 150, true);
    expect(editSession.editCount).toEqual(1);
    expect(editEventListener).toHaveBeenCalledTimes(2);
    expect(editEventListener).toHaveBeenNthCalledWith(2, "dirty");

    await editSession.end();
  });

  it("increments invalid count and emits edit event on invalid commit", async () => {
    const editEventListener = vi.fn();
    editSession.on("editState", editEventListener);

    await editSession.begin();

    await editSession.commit("key-01", "col-1", 100, "abc", false);

    expect(editSession.editCount).toEqual(0);
    expect(editSession.invalidCount).toEqual(1);
    expect(editEventListener).toHaveBeenCalledTimes(1);
    expect(editEventListener).toHaveBeenCalledWith("invalid");

    await editSession.commit("key-01", "col-1", "abc", 100, true);
    expect(editSession.editCount).toEqual(0);
    expect(editEventListener).toHaveBeenCalledTimes(2);
    expect(editEventListener).toHaveBeenNthCalledWith(2, "clean");

    await editSession.end();
  });

  it("identifies when a control has been edited during current session", async () => {
    const editEventListener = vi.fn();
    editSession.on("editState", editEventListener);

    await editSession.begin();

    await editSession.commit("key-01", "col-1", 100, 200, true);
    expect(editSession.isCellEdited("key-01", "col-1")).toEqual(true);
    await editSession.commit("key-01", "col-1", 200, 100, true);
    expect(editSession.isCellEdited("key-01", "col-1")).toEqual(false);

    await editSession.end();
  });

  it("does not treat invalid edit asd an edit for tracking purposes", async () => {
    const editEventListener = vi.fn();
    editSession.on("editState", editEventListener);

    await editSession.begin();

    await editSession.commit("key-01", "col-1", 100, "abc", false);
    expect(editSession.isCellEdited("key-01", "col-1")).toEqual(false);
    await editSession.commit("key-01", "col-1", "abc", 200, true);
    expect(editSession.isCellEdited("key-01", "col-1")).toEqual(true);
    await editSession.commit("key-01", "col-1", 200, 100, true);
    expect(editSession.isCellEdited("key-01", "col-1")).toEqual(false);

    await editSession.end();
  });

  it("allows a newly inserted row to be undone without local cell edits", async () => {
    const undoRowChange = vi.fn().mockResolvedValue({
      data: { wasInsertedRow: true },
      type: "SUCCESS_RESULT",
    });
    const editApi: EditApi = {
      addRow: vi.fn().mockResolvedValue({
        data: undefined,
        type: "SUCCESS_RESULT",
      }),
      createSessionDataSource: vi.fn(
        async () => editApi as unknown as DataSource,
      ),
      endEditSession: vi.fn(),
      undoRowChange,
    };
    const insertedRowSession = new EditSession({ dataSource: editApi });
    await insertedRowSession.begin();
    await insertedRowSession.addRow({ id: "row-001" });

    await insertedRowSession.undoRowChange("row-001", "addRow");

    expect(undoRowChange).toHaveBeenCalledWith("row-001");
    expect(insertedRowSession.addCount).toBe(0);
  });

  it("clears cell markers after undoing row changes", async () => {
    const undoRowChange = vi.fn().mockResolvedValue({
      data: undefined,
      type: "SUCCESS_RESULT",
    });
    const editApi: EditApi = {
      createSessionDataSource: vi.fn(
        async () => editApi as unknown as DataSource,
      ),
      editCell: vi.fn().mockResolvedValue({
        data: undefined,
        type: "SUCCESS_RESULT",
      }),
      endEditSession: vi.fn(),
      undoRowChange,
    };
    const rowEditSession = new EditSession({ dataSource: editApi });
    const cellEditChanged = vi.fn();
    rowEditSession.on("cellEditChanged", cellEditChanged);
    await rowEditSession.begin();
    await rowEditSession.commit("row-001", "name", "Alice", "Alicia", true);
    cellEditChanged.mockClear();

    await rowEditSession.undoRowChange("row-001", "editCell");

    expect(rowEditSession.isCellEdited("row-001", "name")).toBe(false);
    expect(cellEditChanged).toHaveBeenCalledWith("row-001", "name");
  });

  it("clones rowDefaults in constructor to prevent external mutation", async () => {
    const rowDefaults = { unknownCol: "value" };
    const sessionDataSource = {
      tableSchema: {
        columns: [{ name: "validCol" }],
        key: "id",
      },
    } as unknown as DataSource;
    const mockDataSource = {
      createSessionDataSource: vi.fn(async () => sessionDataSource),
    } as unknown as EditApi;
    const session = new EditSession({
      dataSource: mockDataSource,
      rowDefaults,
    });
    await session.begin();
    expect(rowDefaults).toEqual({ unknownCol: "value" });
  });

  it("prunes row key from tracked edits and hasRowChanges is false when cell edits are reverted", async () => {
    await editSession.begin();
    await editSession.commit("key-01", "col-1", 100, 150, true);
    expect(editSession.hasRowChanges("key-01")).toBe(true);

    await editSession.commit("key-01", "col-1", 150, 100, true);
    expect(editSession.hasRowChanges("key-01")).toBe(false);
    await editSession.end();
  });

  it("handles commit resolution gracefully when edit session ends", async () => {
    let resolveEditCell: (value: unknown) => void = () => {};
    const editCellPromise = new Promise((resolve) => {
      resolveEditCell = resolve;
    });
    const editApi = {
      createSessionDataSource: vi.fn(
        async () => editApi as unknown as DataSource,
      ),
      editCell: vi.fn(() => editCellPromise),
      endEditSession: vi.fn(),
    } as unknown as EditApi;
    const session = new EditSession({ dataSource: editApi });
    await session.begin();

    const commitPromise = session.commit("row-001", "name", "A", "B", true);

    await session.end();

    resolveEditCell({ type: "SUCCESS_RESULT" });

    await expect(commitPromise).resolves.toEqual({
      data: undefined,
      type: "SUCCESS_RESULT",
    });
  });

  it("batches editState events when setting delete Count", async () => {
    const editApi = {
      createSessionDataSource: vi.fn(
        async () => editApi as unknown as DataSource,
      ),
      deleteSelectedRows: vi.fn().mockResolvedValue({
        type: "SUCCESS_RESULT",
      }),
      endEditSession: vi.fn(),
    } as unknown as EditApi;
    const session = new EditSession({ dataSource: editApi });
    await session.begin();

    const editStateListener = vi.fn();
    session.on("editState", editStateListener);

    await session.deleteSelectedRows(2);

    expect(session.deleteCount).toBe(2);
    expect(editStateListener).toHaveBeenCalledTimes(1);
    expect(editStateListener).toHaveBeenCalledWith("dirty");
  });

  it("produces a single unified editState event in undoRowChange", async () => {
    const undoRowChange = vi.fn().mockResolvedValue({
      data: { wasInsertedRow: true },
      type: "SUCCESS_RESULT",
    });
    const editApi = {
      createSessionDataSource: vi.fn(
        async () => editApi as unknown as DataSource,
      ),
      addRow: vi.fn().mockResolvedValue({
        data: undefined,
        type: "SUCCESS_RESULT",
      }),
      editCell: vi.fn().mockResolvedValue({
        data: undefined,
        type: "SUCCESS_RESULT",
      }),
      endEditSession: vi.fn(),
      undoRowChange,
    } as unknown as EditApi;
    const session = new EditSession({ dataSource: editApi });
    await session.begin();

    await session.addRow({ id: "row-1" });
    await session.commit("row-1", "name", "Alice", "Alicia", true);

    const editStateListener = vi.fn();
    session.on("editState", editStateListener);

    await session.undoRowChange("row-1", "editCell");

    expect(editStateListener).toHaveBeenCalledTimes(1);
    expect(editStateListener).toHaveBeenCalledWith("clean");
  });
});
