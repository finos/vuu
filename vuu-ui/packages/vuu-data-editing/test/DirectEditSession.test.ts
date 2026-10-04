import type { DataSource } from "@vuu-ui/vuu-data-types";
import { describe, expect, it, vi } from "vitest";
import { DirectEditSession } from "../src/DirectEditSession";

vi.hoisted(() => {
  class MockWorker {
    postMessage() {}
    terminate() {}
  }
  vi.stubGlobal("Worker", MockWorker);
});

const success = { data: undefined, type: "SUCCESS_RESULT" as const };

const createDataSource = (editCell?: DataSource["editCell"]) =>
  ({ editCell }) as unknown as DataSource;

describe("DirectEditSession", () => {
  it("sends committed edits directly to the source dataSource", async () => {
    const editCell = vi.fn().mockResolvedValue(success);
    const dataSource = createDataSource(editCell);
    const editSession = new DirectEditSession({ dataSource });

    const response = await editSession.commit("key-1", "price", 100, 101, true);

    expect(editCell).toHaveBeenCalledWith("key-1", "price", 101);
    expect(response).toEqual(success);
  });

  it("does not require begin and is never in edit mode", () => {
    const editSession = new DirectEditSession({
      dataSource: createDataSource(vi.fn()),
    });
    expect(editSession.inEditMode).toBe(false);
  });

  it("does not track edits", async () => {
    const editSession = new DirectEditSession({
      dataSource: createDataSource(vi.fn().mockResolvedValue(success)),
    });
    await editSession.commit("key-1", "price", 100, 101, true);
    expect(editSession.isCellEdited("key-1", "price")).toBe(false);
  });

  it("returns server error responses unchanged", async () => {
    const error = { errorMessage: "rejected", type: "ERROR_RESULT" as const };
    const editSession = new DirectEditSession({
      dataSource: createDataSource(vi.fn().mockResolvedValue(error)),
    });
    await expect(
      editSession.commit("key-1", "price", 100, 101, true),
    ).resolves.toEqual(error);
  });

  it("does not send invalid values", async () => {
    const editCell = vi.fn();
    const editSession = new DirectEditSession({
      dataSource: createDataSource(editCell),
    });
    const response = await editSession.commit(
      "key-1",
      "price",
      100,
      "abc",
      false,
    );
    expect(editCell).not.toHaveBeenCalled();
    expect(response.type).toBe("ERROR_RESULT");
  });

  it("throws if the dataSource does not support editCell", async () => {
    const editSession = new DirectEditSession({
      dataSource: createDataSource(undefined),
    });
    await expect(
      editSession.commit("key-1", "price", 100, 101, true),
    ).rejects.toThrow("does not support editCell");
  });

  it("cancel sends nothing to the server", async () => {
    const editCell = vi.fn();
    const editSession = new DirectEditSession({
      dataSource: createDataSource(editCell),
    });
    await expect(editSession.cancel("key-1", "price", 100)).resolves.toEqual(
      success,
    );
    expect(editCell).not.toHaveBeenCalled();
  });
});
