import "./global-mocks";
import { describe, vi, it } from "vitest";
import { TEST_setRequestId } from "../src/server-proxy/server-proxy";
import {
  COMMON_ATTRS,
  COMMON_TABLE_ROW_ATTRS,
  createServerProxyAndSubscribeToViewport,
  createTableRows,
  sizeRow,
} from "./test-utils";

const mockConnection = {
  send: vi.fn(),
  status: "ready" as const,
};

describe("ServerProxy 'size-only throttling'", () => {
  it("passes a size only message through to UI client", async () => {
    const postMessageToClient = vi.fn();
    const serverProxy = await createServerProxyAndSubscribeToViewport(
      postMessageToClient,
      {
        connection: mockConnection,
      }
    );
    // prettier-ignore
    serverProxy.handleMessageFromServer({
          ...COMMON_ATTRS,
          body: {
            ...COMMON_TABLE_ROW_ATTRS,
            rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 10)],
          },
        });

    TEST_setRequestId(1);
  });
});
