import { describe, expect, it, vi } from "vitest";
import { buildDataColumnMapFromSchema, Table } from "../src/Table";
import { TickingArrayDataSource } from "../src/TickingArrayDataSource";
import {
  sessionTableRow,
  sessionTableSchema,
} from "../src/session-table-utils";
import type { TableSchema } from "@vuu-ui/vuu-data-types";
import type {
  RpcResultError,
  RpcResultSuccess,
} from "@vuu-ui/vuu-protocol-types";
import { Range } from "@vuu-ui/vuu-utils";

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
const ERROR = (msg: string): RpcResultError => ({
  type: "ERROR_RESULT",
  errorMessage: msg,
});

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

describe("sessionTableSchema", () => {
  it("adds vuu_action as a string session-only column", () => {
    const sessionSchema = sessionTableSchema({
      ...schema,
      columns: schema.columns.slice(0, 2),
    });

    expect(sessionSchema.columns).toEqual([
      { name: "id", serverDataType: "string" },
      { name: "name", serverDataType: "string" },
      { name: "vuuMsg", serverDataType: "string" },
      { name: "vuu_action", serverDataType: "string" },
    ]);
  });

  it("does not duplicate existing session-only columns", () => {
    const sessionSchema = sessionTableSchema(schema);

    expect(
      sessionSchema.columns.filter(({ name }) => name === "vuuMsg"),
    ).toHaveLength(1);
    expect(
      sessionSchema.columns.filter(({ name }) => name === "vuu_action"),
    ).toHaveLength(1);
  });

  it("only appends values for missing session-only columns", () => {
    expect(sessionTableRow(["row-001", "Alice", ""], schema)).toEqual([
      "row-001",
      "Alice",
      "",
      "",
    ]);
    expect(
      sessionTableRow(["row-001", "Alice", "", ""], {
        ...schema,
        columns: schema.columns.concat({
          name: "vuu_action",
          serverDataType: "string",
        }),
      }),
    ).toEqual(["row-001", "Alice", "", ""]);
  });
});

describe("addRow", () => {
  it("dispatches addRow RPC with provided row data", async () => {
    const ds = createDataSource();

    await ds.addRow({ name: "Bob" });

    expect(ds.rpcRequest).toHaveBeenCalledOnce();
    expect(ds.rpcRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "RPC_REQUEST",
        rpcName: "addRow",
        params: expect.objectContaining({
          key: undefined,
          data: expect.objectContaining({ name: "Bob" }),
        }),
      }),
    );
  });

  it("does not add a key to the data payload", async () => {
    const ds = createDataSource();

    await ds.addRow({});

    const [call] = vi.mocked(ds.rpcRequest).mock.calls;
    const { data } = call[0].params as {
      data: Record<string, unknown>;
    };
    expect(data[schema.key as string]).toBeUndefined();
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
    const success = {
      type: "SUCCESS_RESULT" as const,
      data: { deletedKeys: ["row-001", "row-002"] },
    };
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

  it("propagates the server error message", async () => {
    const ds = createDataSource();
    vi.mocked(ds.rpcRequest).mockResolvedValue(ERROR("something unexpected"));

    await expect(ds.endEditSession(true)).rejects.toThrow(
      "something unexpected",
    );
  });

  it("throws a stale-update error so the session can be retried", async () => {
    const ds = createDataSource();
    vi.mocked(ds.rpcRequest).mockResolvedValue(ERROR("stale update"));

    await expect(ds.endEditSession(true)).rejects.toThrow("stale update");
  });
});

describe("createSessionDataSource", () => {
  const sessionSuccess: RpcResultSuccess = {
    type: "SUCCESS_RESULT",
    data: { table: { module: "TEST", table: "session-xyz" } },
  };

  it("dispatches createSessionTable RPC with copyOption 'All' and default sessionType 'edit'", async () => {
    const ds = createDataSource();
    vi.mocked(ds.rpcRequest).mockResolvedValue(sessionSuccess);
    await ds.createSessionDataSource?.("All");
    expect(ds.rpcRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "RPC_REQUEST",
        rpcName: "createSessionTable",
        params: { copyOption: "All", sessionType: "edit" },
      }),
    );
  });

  it("dispatches createSessionTable RPC with copyOption 'Selected' and default sessionType 'edit'", async () => {
    const ds = createDataSource();
    vi.mocked(ds.rpcRequest).mockResolvedValue(sessionSuccess);
    await ds.createSessionDataSource?.("Selected");
    expect(ds.rpcRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "RPC_REQUEST",
        rpcName: "createSessionTable",
        params: { copyOption: "Selected", sessionType: "edit" },
      }),
    );
  });

  it("dispatches createSessionTable RPC with copyOption 'Empty' and default sessionType 'edit'", async () => {
    const ds = createDataSource();
    vi.mocked(ds.rpcRequest).mockResolvedValue(sessionSuccess);
    await ds.createSessionDataSource?.("Empty");
    expect(ds.rpcRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "RPC_REQUEST",
        rpcName: "createSessionTable",
        params: { copyOption: "Empty", sessionType: "edit" },
      }),
    );
  });

  it("passes sessionType 'import' to the RPC request", async () => {
    const ds = createDataSource();
    vi.mocked(ds.rpcRequest).mockResolvedValue(sessionSuccess);
    await ds.createSessionDataSource?.("Empty", "import");
    expect(ds.rpcRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "RPC_REQUEST",
        rpcName: "createSessionTable",
        params: { copyOption: "Empty", sessionType: "import" },
      }),
    );
  });

  it("passes sessionType 'export' to the RPC request", async () => {
    const ds = createDataSource();
    vi.mocked(ds.rpcRequest).mockResolvedValue(sessionSuccess);
    await ds.createSessionDataSource?.("All", "export");
    expect(ds.rpcRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "RPC_REQUEST",
        rpcName: "createSessionTable",
        params: { copyOption: "All", sessionType: "export" },
      }),
    );
  });

  it("throws with the server error message on failure", async () => {
    const ds = createDataSource();
    vi.mocked(ds.rpcRequest).mockResolvedValue(
      ERROR("session table creation failed"),
    );
    await expect(ds.createSessionDataSource?.("All")).rejects.toThrow(
      "session table creation failed",
    );
  });

  it("replays committed rows from the source datasource when session editing ends", async () => {
    const sourceTable = new Table(
      schema,
      [["row-001", "Alice", ""]],
      buildDataColumnMapFromSchema(schema),
    );
    const sessionTable = new Table(
      { ...schema, table: { module: "TEST", table: "session-xyz" } },
      [],
      buildDataColumnMapFromSchema(schema),
    );
    const sessionDataSource = new TickingArrayDataSource({
      columnDescriptors: schema.columns,
      table: sessionTable,
    });
    const sourceDataSource = new TickingArrayDataSource({
      columnDescriptors: schema.columns,
      table: sourceTable,
      vuuModule: {
        createDataSource: () => sessionDataSource,
      },
    });
    vi.spyOn(sourceDataSource, "rpcRequest").mockResolvedValue(sessionSuccess);

    const updates = vi.fn();
    await sourceDataSource.subscribe({ range: Range(0, 10) }, updates);
    updates.mockClear();

    const editDataSource =
      await sourceDataSource.createSessionDataSource("Empty");
    expect(editDataSource?.isSessionDataSourceOf?.(sourceDataSource)).toBe(
      true,
    );
    sourceDataSource.suspend(false);
    vi.spyOn(sessionDataSource, "rpcRequest").mockImplementation(async () => {
      sourceTable.insert(["row-002", "Bob", ""]);
      updates.mockClear();
      return SUCCESS;
    });

    await editDataSource?.endEditSession?.(true);
    expect(updates).not.toHaveBeenCalled();

    sourceDataSource.resume(updates);
    const rows = updates.mock.calls.at(-1)?.[0].rows;
    expect(rows).toEqual(
      expect.arrayContaining([expect.arrayContaining(["row-002", "Bob"])]),
    );

    updates.mockClear();
    await editDataSource?.endEditSession?.(true);
    expect(updates).not.toHaveBeenCalled();
  });
});
