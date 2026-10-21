import { describe, expect, it } from "vitest";
import { metadataKeys } from "@vuu-ui/vuu-utils";
import type { SelectRequest } from "@vuu-ui/vuu-protocol-types";
import { simulModule } from "../src/simul/SimulModule";
import type { TickingArrayDataSource } from "../src/TickingArrayDataSource";

const { KEY } = metadataKeys;

const createEditSession = async (copyOption: "All" | "Empty") => {
  const ds = simulModule.createDataSource("instruments");
  const session = (await (
    ds as TickingArrayDataSource
  ).createSessionDataSource(copyOption, "edit")) as TickingArrayDataSource;
  return session;
};

describe("VuuModule soft delete of session rows", () => {
  it("hard-deletes an uncommitted added row on soft delete, removing it from the session table", async () => {
    const session = await createEditSession("Empty");
    expect(session.size).toBe(0);

    await session.addRow({ ric: "TEST.ADD" });
    expect(session.size).toBe(1);

    session.select({
      type: "SELECT_ROW",
      rowKey: "TEST.ADD",
      preserveExistingSelection: false,
    } as Omit<SelectRequest, "vpId"> & { rowKey: string });
    const response = await session.deleteSelectedRows("soft");

    expect(response).toEqual({
      type: "SUCCESS_RESULT",
      data: { deletedKeys: ["TEST.ADD"] },
    });
    // The added row had no prior state to restore, so it is removed outright
    // rather than left behind marked "deleteRow".
    expect(session.size).toBe(0);

    // Undo now reports the row as gone instead of failing on a ghost row.
    const undoResponse = await session.undoRowChange("TEST.ADD");
    expect(undoResponse).toEqual({
      type: "ERROR_RESULT",
      errorMessage: "undoRowChange: session row not found for key TEST.ADD",
    });
  });

  it("soft-deletes a pre-existing source row, marking it deleteRow and supporting undo", async () => {
    const session = await createEditSession("All");
    const originalSize = session.size;
    expect(originalSize).toBeGreaterThan(0);

    const { vuuAction: vuuActionIdx } = session.columnMap;
    const firstRow = session.getRowAtIndex(0);
    const rowKey = firstRow?.[KEY] as string;

    session.select({
      type: "SELECT_ROW",
      rowKey,
      preserveExistingSelection: false,
    } as Omit<SelectRequest, "vpId"> & { rowKey: string });
    const response = await session.deleteSelectedRows("soft");

    expect(response).toEqual({
      type: "SUCCESS_RESULT",
      data: { deletedKeys: [rowKey] },
    });
    // Pre-existing row remains in the session table, marked for deletion.
    expect(session.size).toBe(originalSize);
    expect(session.getRowByKey(rowKey)?.[vuuActionIdx]).toBe("deleteRow");

    // Undo restores the row from the source table.
    const undoResponse = await session.undoRowChange(rowKey);
    expect(undoResponse).toEqual({ type: "SUCCESS_RESULT", data: undefined });
    expect(session.getRowByKey(rowKey)?.[vuuActionIdx]).toBe("");
  });

  it("partitions a mixed selection: added row removed, source row marked deleteRow", async () => {
    const session = await createEditSession("All");
    const originalSize = session.size;

    await session.addRow({ ric: "TEST.MIXED" });
    expect(session.size).toBe(originalSize + 1);

    const sourceRowKey = session.getRowAtIndex(0)?.[KEY] as string;
    session.select({
      type: "SELECT_ROW",
      rowKey: sourceRowKey,
      preserveExistingSelection: false,
    } as Omit<SelectRequest, "vpId"> & { rowKey: string });
    session.select({
      type: "SELECT_ROW",
      rowKey: "TEST.MIXED",
      preserveExistingSelection: true,
    } as Omit<SelectRequest, "vpId"> & { rowKey: string });

    const response = await session.deleteSelectedRows("soft");
    const deletedKeys = (response as { data: { deletedKeys: string[] } }).data
      .deletedKeys;
    expect(deletedKeys).toHaveLength(2);
    expect(deletedKeys).toEqual(
      expect.arrayContaining([sourceRowKey, "TEST.MIXED"]),
    );

    const { vuuAction: vuuActionIdx } = session.columnMap;
    // Added row removed outright; source row retained as pending delete.
    expect(session.getRowByKey("TEST.MIXED")).toBeUndefined();
    expect(session.getRowByKey(sourceRowKey)?.[vuuActionIdx]).toBe("deleteRow");
    expect(session.size).toBe(originalSize);
  });
});
