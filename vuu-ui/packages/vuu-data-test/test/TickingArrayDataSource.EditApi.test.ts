import { describe, expect, it, vi } from "vitest";
import { buildDataColumnMapFromSchema, Table } from "../src/Table";
import { TickingArrayDataSource } from "../src/TickingArrayDataSource";
import type { TableSchema } from "@vuu-ui/vuu-data-types";
import type { RpcResultError, RpcResultSuccess } from "@vuu-ui/vuu-protocol-types";

const schema: TableSchema = {
  columns: [
    { name: "id", serverDataType: "string" },
    { name: "name", serverDataType: "string" },
    { name: "vuuMsg", serverDataType: "string" },
  ],
  key: "id",
  table: { module: "TEST", table: "TestTable" },
};

const SUCCESS: RpcResultSuccess = { type: "SUCCESS_RESULT", data: undefined };
const ERROR = (msg: string): RpcResultError => ({ type: "ERROR_RESULT", errorMessage: msg });

function createDataSource() {
  const table = new Table(
    schema,
    [["row-001", "Alice", ""]],
    buildDataColumnMapFromSchema(schema),
  );
  const ds = new TickingArrayDataSource({
    columnDescriptors: schema.columns,
    table,
  });
  vi.spyOn(ds, "rpcRequest").mockResolvedValue(SUCCESS);
  return ds;
}

describe("addRow", () => {
  it("dispatches addRow RPC with a generated key and provided row data", async () => {
    const ds = createDataSource();

    await ds.addRow({ name: "Bob" });

    expect(ds.rpcRequest).toHaveBeenCalledOnce();
    expect(ds.rpcRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "RPC_REQUEST",
        rpcName: "addRow",
        params: expect.objectContaining({
          key: expect.any(String),
          data: expect.objectContaining({ name: "Bob" }),
        }),
      }),
    );
  });

  it("includes the generated key inside the data payload", async () => {
    const ds = createDataSource();

    await ds.addRow({});

    const [call] = vi.mocked(ds.rpcRequest).mock.calls;
    const { key, data } = call[0].params as {
      key: string;
      data: Record<string, unknown>;
    };
    // key must be echoed into data so the server can identify the new row
    expect(data[schema.key as string]).toBe(key);
  });

  it("uses the key supplied in rowData instead of generating one", async () => {
    const ds = createDataSource();

    await ds.addRow({ id: "custom-key-123", name: "Carol" });

    expect(ds.rpcRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        rpcName: "addRow",
        params: expect.objectContaining({ key: "custom-key-123" }),
      }),
    );
  });

  it("returns the server error message string on failure", async () => {
    const ds = createDataSource();
    vi.mocked(ds.rpcRequest).mockResolvedValue(ERROR("row already exists"));

    const result = await ds.addRow({ name: "Alice" });

    expect(result).toBe("row already exists");
  });
});

describe("deleteRow", () => {
  it("dispatches deleteRow RPC with the given key and mode", async () => {
    const ds = createDataSource();

    await ds.deleteRow("row-001", "soft");

    expect(ds.rpcRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "RPC_REQUEST",
        rpcName: "deleteRow",
        params: { key: "row-001", mode: "soft" },
      }),
    );
  });

  it("defaults mode to 'hard' when omitted", async () => {
    const ds = createDataSource();

    await ds.deleteRow("row-001");

    expect(ds.rpcRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        rpcName: "deleteRow",
        params: { key: "row-001", mode: "hard" },
      }),
    );
  });

  it("returns the server error message string on failure", async () => {
    const ds = createDataSource();
    vi.mocked(ds.rpcRequest).mockResolvedValue(ERROR("row not found"));

    const result = await ds.deleteRow("row-001");

    expect(result).toBe("row not found");
  });
});

describe("deleteSelectedRows", () => {
  it("dispatches deleteSelectedRows RPC with the given mode", async () => {
    const ds = createDataSource();

    await ds.deleteSelectedRows("hard");

    expect(ds.rpcRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "RPC_REQUEST",
        rpcName: "deleteSelectedRows",
        params: { mode: "hard" },
      }),
    );
  });

  it("defaults mode to 'soft'", async () => {
    const ds = createDataSource();

    await ds.deleteSelectedRows();

    expect(ds.rpcRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        rpcName: "deleteSelectedRows",
        params: { mode: "soft" },
      }),
    );
  });

  it("returns the RpcResult unchanged on success", async () => {
    const ds = createDataSource();
    const success = { type: "SUCCESS_RESULT" as const, data: { deletedKeys: ["row-001", "row-002"] } };
    vi.mocked(ds.rpcRequest).mockResolvedValue(success);

    const result = await ds.deleteSelectedRows();

    expect(result).toEqual(success);
  });

  it("returns the RpcResultError unchanged on failure", async () => {
    const ds = createDataSource();
    const error = ERROR("no active session table");
    vi.mocked(ds.rpcRequest).mockResolvedValue(error);

    const result = await ds.deleteSelectedRows();

    expect(result).toEqual(error);
  });

  it("returns a fallback error when rpcRequest yields no response", async () => {
    const ds = createDataSource();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(ds.rpcRequest).mockResolvedValue(undefined as any);

    const result = await ds.deleteSelectedRows();

    expect(result).toEqual(ERROR("deleteSelectedRows failed"));
  });
});

describe("editCell", () => {
  it("dispatches editCell RPC with key, column and data", async () => {
    const ds = createDataSource();

    await ds.editCell("row-001", "name", "Dave");

    expect(ds.rpcRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "RPC_REQUEST",
        rpcName: "editCell",
        params: { key: "row-001", column: "name", data: "Dave" },
      }),
    );
  });

  it("passes numeric values unchanged", async () => {
    const ds = createDataSource();

    await ds.editCell("row-001", "name", 42);

    expect(ds.rpcRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        rpcName: "editCell",
        params: { key: "row-001", column: "name", data: 42 },
      }),
    );
  });

  it("returns the RpcResultError unchanged on failure", async () => {
    const ds = createDataSource();
    const error = ERROR("validation failed");
    vi.mocked(ds.rpcRequest).mockResolvedValue(error);

    const result = await ds.editCell("row-001", "name", "");

    expect(result).toEqual(error);
  });
});

describe("undoRowChange", () => {
  it("dispatches undoRowChange RPC with the row key", async () => {
    const ds = createDataSource();

    await ds.undoRowChange("row-001");

    expect(ds.rpcRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "RPC_REQUEST",
        rpcName: "undoRowChange",
        params: { key: "row-001" },
      }),
    );
  });

  it("returns the RpcResultError unchanged on failure", async () => {
    const ds = createDataSource();
    const error = ERROR("no active session table");
    vi.mocked(ds.rpcRequest).mockResolvedValue(error);

    const result = await ds.undoRowChange("row-001");

    expect(result).toEqual(error);
  });

  it("returns a fallback error when rpcRequest yields no response", async () => {
    const ds = createDataSource();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(ds.rpcRequest).mockResolvedValue(undefined as any);

    const result = await ds.undoRowChange("row-001");

    expect(result).toEqual(ERROR("undoRowChange failed"));
  });
});

describe("beginEditSession", () => {
  const sessionSuccess = {
    type: "SUCCESS_RESULT" as const,
    data: { table: { module: "TEST", table: "session-xyz" } },
  };

  it("keeps 'inline-all-rows' unchanged in the RPC params (client-only concept)", async () => {
    const ds = createDataSource();
    vi.mocked(ds.rpcRequest).mockResolvedValue(sessionSuccess);

    await ds.beginEditSession("inline-all-rows");

    expect(ds.rpcRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        rpcName: "beginEditSession",
        params: { editSessionMode: "inline-all-rows" },
      }),
    );
  });

  it("sends 'all-rows' unchanged in the RPC params", async () => {
    const ds = createDataSource();
    vi.mocked(ds.rpcRequest).mockResolvedValue(sessionSuccess);

    await ds.beginEditSession("all-rows");

    expect(ds.rpcRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        rpcName: "beginEditSession",
        params: { editSessionMode: "all-rows" },
      }),
    );
  });

  it("sends 'selected-rows' unchanged in the RPC params", async () => {
    const ds = createDataSource();
    vi.mocked(ds.rpcRequest).mockResolvedValue(sessionSuccess);

    await ds.beginEditSession("selected-rows");

    expect(ds.rpcRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        rpcName: "beginEditSession",
        params: { editSessionMode: "selected-rows" },
      }),
    );
  });

  it("sends 'empty-session-table' unchanged in the RPC params", async () => {
    const ds = createDataSource();
    vi.mocked(ds.rpcRequest).mockResolvedValue(sessionSuccess);

    await ds.beginEditSession("empty-session-table");

    expect(ds.rpcRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        rpcName: "beginEditSession",
        params: { editSessionMode: "empty-session-table" },
      }),
    );
  });

  it("throws with the server error message on failure", async () => {
    const ds = createDataSource();
    vi.mocked(ds.rpcRequest).mockResolvedValue(
      ERROR("edit session already active"),
    );

    await expect(ds.beginEditSession("inline-all-rows")).rejects.toThrow(
      "edit session already active",
    );
  });
});

describe("endEditSession", () => {
  it("dispatches endEditSession RPC with { save: true } when saving changes", async () => {
    const ds = createDataSource();

    await ds.endEditSession(true);

    expect(ds.rpcRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "RPC_REQUEST",
        rpcName: "endEditSession",
        params: { save: true },
      }),
    );
  });

  it("dispatches endEditSession RPC with empty params when discarding changes", async () => {
    const ds = createDataSource();

    await ds.endEditSession(false);

    expect(ds.rpcRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "RPC_REQUEST",
        rpcName: "endEditSession",
        params: {},
      }),
    );
  });

  it("throws 'unknown error' for an unrecognised server error", async () => {
    const ds = createDataSource();
    vi.mocked(ds.rpcRequest).mockResolvedValue(ERROR("something unexpected"));

    await expect(ds.endEditSession(true)).rejects.toThrow("unknown error");
  });

  it("handles a stale-update error gracefully and does not throw", async () => {
    const ds = createDataSource();
    vi.mocked(ds.rpcRequest).mockResolvedValue(ERROR("stale update"));

    await expect(ds.endEditSession(true)).resolves.toBeUndefined();
  });
});

describe("createSessionTable", () => {
  const sessionSuccess: RpcResultSuccess = {
    type: "SUCCESS_RESULT",
    data: { table: { module: "TEST", table: "session-xyz" } },
  };

  it("dispatches createSessionTable RPC with copyOption 'All'", async () => {
    const ds = createDataSource();
    vi.mocked(ds.rpcRequest).mockResolvedValue(sessionSuccess);
    await ds.createSessionTable?.("All");
    expect(ds.rpcRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "RPC_REQUEST",
        rpcName: "createSessionTable",
        params: { copyOption: "All" },
      }),
    );
  });

  it("dispatches createSessionTable RPC with copyOption 'Selected'", async () => {
    const ds = createDataSource();
    vi.mocked(ds.rpcRequest).mockResolvedValue(sessionSuccess);
    await ds.createSessionTable?.("Selected");
    expect(ds.rpcRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "RPC_REQUEST",
        rpcName: "createSessionTable",
        params: { copyOption: "Selected" },
      }),
    );
  });

  it("dispatches createSessionTable RPC with copyOption 'Empty'", async () => {
    const ds = createDataSource();
    vi.mocked(ds.rpcRequest).mockResolvedValue(sessionSuccess);
    await ds.createSessionTable?.("Empty");
    expect(ds.rpcRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "RPC_REQUEST",
        rpcName: "createSessionTable",
        params: { copyOption: "Empty" },
      }),
    );
  });

  it("throws with the server error message on failure", async () => {
    const ds = createDataSource();
    vi.mocked(ds.rpcRequest).mockResolvedValue(ERROR("session table creation failed"));
    await expect(ds.createSessionTable?.("All")).rejects.toThrow(
      "session table creation failed",
    );
  });
});
