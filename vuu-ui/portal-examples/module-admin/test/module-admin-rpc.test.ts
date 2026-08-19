import {
  EMPTY_MODULE_CONFIG,
  MODULE_ADMIN_RPC,
} from "@heswell/module-admin/contracts";
import { describe, expect, it, vi } from "vitest";
import { createModuleAdminClient } from "../src/data/module-admin-rpc";

const success = (data: unknown) => ({
  action: { type: "NO_ACTION" },
  data,
  requestId: "1",
  type: "SUCCESS_RESULT",
});

describe("createModuleAdminClient", () => {
  it("sends each operation as a module discovery RPC", async () => {
    const rpcRequest = vi
      .fn()
      .mockResolvedValue(success({ id: 7, version: 2 }));
    const client = createModuleAdminClient({ rpcRequest });

    await client.createModule(EMPTY_MODULE_CONFIG);
    await client.updateModule(7, { title: "T" }, 1);
    await client.setModuleEnabled(7, false);
    await expect(client.deleteModule(7, true)).resolves.toEqual({
      id: 7,
      version: 2,
    });

    expect(rpcRequest.mock.calls.map(([request]) => request)).toEqual([
      {
        params: { module: JSON.stringify(EMPTY_MODULE_CONFIG) },
        rpcName: MODULE_ADMIN_RPC.createModule,
        type: "RPC_REQUEST",
      },
      {
        params: { changes: '{"title":"T"}', expectedVersion: 1, id: 7 },
        rpcName: MODULE_ADMIN_RPC.updateModule,
        type: "RPC_REQUEST",
      },
      {
        params: { enabled: false, id: 7 },
        rpcName: MODULE_ADMIN_RPC.setModuleEnabled,
        type: "RPC_REQUEST",
      },
      {
        params: { deleteChildren: true, id: 7 },
        rpcName: MODULE_ADMIN_RPC.deleteModule,
        type: "RPC_REQUEST",
      },
    ]);
  });

  it("rejects with the server's error message", async () => {
    const client = createModuleAdminClient({
      rpcRequest: vi.fn().mockResolvedValue({
        errorMessage: "Module was changed by someone else",
        requestId: "1",
        type: "ERROR_RESULT",
      }),
    });
    await expect(client.updateModule(1, {}, 1)).rejects.toThrow(
      "Module was changed by someone else",
    );
  });

  it("rejects when the data source has no RPC support", async () => {
    const client = createModuleAdminClient({ rpcRequest: undefined });
    await expect(client.setModuleEnabled(1, true)).rejects.toThrow(
      "Module discovery does not support RPC requests",
    );
  });
});
