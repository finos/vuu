import "./global-mocks";
import { describe, expect, vi, it } from "vitest";
import {
  ServerProxy,
  TEST_setRequestId,
} from "../src/server-proxy/server-proxy";
import { Viewport } from "../src/server-proxy/viewport";
import {
  COMMON_ATTRS,
  COMMON_ROW_ATTRS,
  COMMON_TABLE_ROW_ATTRS,
  createServerProxyAndSubscribeToViewport,
  createTableRows,
  createTableGroupRows,
  createSubscription,
  sizeRow,
  updateTableRow,
} from "./test-utils";
import {
  DataSourceDataMessage,
  DataSourceEnabledMessage,
  DataSourceSubscribedMessage,
} from "../src";
import { VuuRow } from "@finos/vuu-protocol-types";

const SERVER_MESSAGE_CONSTANTS = {
  module: "CORE",
  sessionId: "dsdsd",
  token: "test",
  user: "user",
};

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
