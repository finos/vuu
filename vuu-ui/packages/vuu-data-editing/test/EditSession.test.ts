import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DataSource, EditApi } from "@vuu-ui/vuu-data-types";
import { EditSession } from "../src";

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
    let editApi: MockDataSource;
    createSession = vi.fn(
      async () => editApi as unknown as DataSource,
    ) as CreateSession;
    editApi = new MockDataSource(createSession, endEdit, edit);
    editSession = new EditSession(editApi);
  });

  it("begins with no edit and zero counts", () => {
    expect(editSession.editCount).toEqual(0);
    expect(editSession.invalidCount).toEqual(0);
    expect(editSession.inEditMode).toEqual(false);
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
    let editApi: EditApi;
    editApi = {
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
    const insertedRowSession = new EditSession(editApi);
    await insertedRowSession.begin();
    await insertedRowSession.addRow({ id: "row-001" });

    await insertedRowSession.undoRowChange("row-001");

    expect(undoRowChange).toHaveBeenCalledWith("row-001");
    expect(insertedRowSession.addCount).toBe(0);
  });

  it("clears cell markers after undoing row changes", async () => {
    const undoRowChange = vi.fn().mockResolvedValue({
      data: undefined,
      type: "SUCCESS_RESULT",
    });
    let editApi: EditApi;
    editApi = {
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
    const rowEditSession = new EditSession(editApi);
    const cellEditChanged = vi.fn();
    rowEditSession.on("cellEditChanged", cellEditChanged);
    await rowEditSession.begin();
    await rowEditSession.commit("row-001", "name", "Alice", "Alicia", true);
    cellEditChanged.mockClear();

    await rowEditSession.undoRowChange("row-001");

    expect(rowEditSession.isCellEdited("row-001", "name")).toBe(false);
    expect(cellEditChanged).toHaveBeenCalledWith("row-001", "name");
  });
});
