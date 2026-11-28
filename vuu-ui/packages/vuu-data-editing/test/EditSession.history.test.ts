import type { DataSource } from "@vuu-ui/vuu-data-types";
import { describe, expect, it, vi } from "vitest";
import { EditSession } from "../src";

vi.hoisted(() => {
  class MockWorker {
    onmessage: ((event: MessageEvent) => void) | null = null;
    postMessage() {}
    terminate() {}
  }
  vi.stubGlobal("Worker", MockWorker);
});

const ok = { data: undefined, type: "SUCCESS_RESULT" } as const;

const setup = async () => {
  const editCell = vi.fn().mockResolvedValue(ok);
  const undoRowChange = vi.fn().mockResolvedValue(ok);
  const dataSource: DataSource = {
    createSessionDataSource: vi.fn(async () => dataSource),
    editCell,
    endEditSession: vi.fn(),
    undoRowChange,
  } as unknown as DataSource;
  const editSession = new EditSession({ dataSource });
  const historyChanged = vi.fn();
  editSession.on("historyChanged", historyChanged);
  await editSession.begin();
  return { editCell, editSession, historyChanged };
};

describe("EditSession change history", () => {
  it("records each commit as a change, and undoes the latest", async () => {
    const { editCell, editSession, historyChanged } = await setup();
    expect(editSession.canUndo).toBe(false);

    await editSession.commit("r1", "qty", 10, 20, true);
    await editSession.commit("r1", "qty", 20, 30, true);
    expect(editSession.canUndo).toBe(true);
    expect(historyChanged).toHaveBeenLastCalledWith(true);

    editCell.mockClear();
    await editSession.undoLastChange();
    expect(editCell).toHaveBeenCalledExactlyOnceWith("r1", "qty", 20);
    expect(editSession.isCellEdited("r1", "qty")).toBe(true);

    await editSession.undoLastChange();
    expect(editCell).toHaveBeenLastCalledWith("r1", "qty", 10);
    expect(editSession.isCellEdited("r1", "qty")).toBe(false);
    expect(editSession.editCount).toBe(0);
    expect(editSession.canUndo).toBe(false);
    expect(historyChanged).toHaveBeenLastCalledWith(false);
  });

  it("commits several cells as one change, undone together, latest first", async () => {
    const { editCell, editSession } = await setup();
    await editSession.commitChange([
      { key: "r1", column: "var", previous: 3, value: 8 },
      { key: "r2", column: "var", previous: 5, value: 8 },
    ]);
    expect(editCell).toHaveBeenCalledTimes(2);
    expect(editSession.editCount).toBe(2);

    editCell.mockClear();
    await editSession.undoLastChange();
    expect(editCell.mock.calls).toEqual([
      ["r2", "var", 5],
      ["r1", "var", 3],
    ]);
    expect(editSession.editCount).toBe(0);
    expect(editSession.canUndo).toBe(false);
  });

  it("extends the latest change", async () => {
    const { editCell, editSession } = await setup();
    await editSession.commit("desk", "qty", 10, 20, true);
    await editSession.commitChange(
      [{ key: "book", column: "qty", previous: 25, value: 20 }],
      { extendLastChange: true },
    );

    editCell.mockClear();
    await editSession.undoLastChange();
    expect(editCell.mock.calls).toEqual([
      ["book", "qty", 25],
      ["desk", "qty", 10],
    ]);
    expect(editSession.canUndo).toBe(false);
  });

  it("reports the first failed edit, and records the others", async () => {
    const { editCell, editSession } = await setup();
    const error = { errorMessage: "invalid", type: "ERROR_RESULT" } as const;
    editCell.mockResolvedValueOnce(ok).mockResolvedValueOnce(error);
    expect(
      await editSession.commitChange([
        { key: "r1", column: "var", previous: 1, value: 2 },
        { key: "r2", column: "var", previous: 1, value: -2 },
      ]),
    ).toEqual(error);

    editCell.mockClear();
    await editSession.undoLastChange();
    expect(editCell.mock.calls).toEqual([["r1", "var", 1]]);
  });

  it("forgets a row's edits when the row's changes are undone", async () => {
    const { editSession } = await setup();
    await editSession.commitChange([
      { key: "r1", column: "var", previous: 1, value: 2 },
      { key: "r2", column: "var", previous: 1, value: 2 },
    ]);
    await editSession.commit("r1", "qty", 1, 2, true);

    await editSession.undoRowChange("r1", "editCell");
    expect(editSession.canUndo).toBe(true);
    await editSession.undoLastChange();
    expect(editSession.isCellEdited("r2", "var")).toBe(false);
    expect(editSession.canUndo).toBe(false);
  });

  it("starts each session with no history", async () => {
    const { editSession } = await setup();
    await editSession.commit("r1", "qty", 10, 20, true);
    await editSession.end();
    await editSession.begin();
    expect(editSession.canUndo).toBe(false);
  });
});
