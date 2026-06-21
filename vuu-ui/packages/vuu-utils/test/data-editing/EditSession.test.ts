import { beforeEach, describe, expect, it, vi } from "vitest";
import { EditApi } from "@vuu-ui/vuu-data-types";
import { EditSession } from "../../src";

type Editable = Required<EditApi>;
type BeginEdit = Editable["beginEditSession"];
type EndEdit = Editable["endEditSession"];
type EditCell = Editable["editCell"];

export class MockDataSource implements EditApi {
  constructor(
    private beginEdit: BeginEdit,
    private endEdit: EndEdit,
    private edit: EditCell,
  ) {}

  beginEditSession(...args: Parameters<BeginEdit>) {
    return this.beginEdit(...args);
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
  let beginEdit: BeginEdit;
  let endEdit: EndEdit;
  let edit: EditCell;

  beforeEach(() => {
    beginEdit = vi.fn();
    endEdit = vi.fn();
    edit = vi.fn();
    const editApi = new MockDataSource(beginEdit, endEdit, edit);
    editSession = new EditSession(editApi);
  });

  it("begins with no edit and zero counts", () => {
    expect(editSession.editCount).toEqual(0);
    expect(editSession.invalidCount).toEqual(0);
    expect(editSession.inEditMode).toEqual(false);
  });

  it("edits outside an edit session throw an error", () => {
    expect(() =>
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

    //prettier-ignore
    let {editedDuringCurrentSession} = await editSession.commit("key-01", "col-1", 100, 200, true);
    expect(editedDuringCurrentSession).toEqual(true);
    //prettier-ignore
    ({editedDuringCurrentSession} = await editSession.commit("key-01", "col-1", 200, 100, true));
    expect(editedDuringCurrentSession).toEqual(false);

    await editSession.end();
  });

  it("does not treat invalid edit asd an edit for tracking purposes", async () => {
    const editEventListener = vi.fn();
    editSession.on("editState", editEventListener);

    await editSession.begin();

    //prettier-ignore
    let {editedDuringCurrentSession} = await editSession.commit("key-01", "col-1", 100, 'abc', false);
    expect(editedDuringCurrentSession).toEqual(false);
    //prettier-ignore
    ({editedDuringCurrentSession} = await editSession.commit("key-01", "col-1", 'abc', 200, true));
    expect(editedDuringCurrentSession).toEqual(true);
    //prettier-ignore
    ({editedDuringCurrentSession} = await editSession.commit("key-01", "col-1", 200, 100, true));
    expect(editedDuringCurrentSession).toEqual(false);

    await editSession.end();
  });
});
