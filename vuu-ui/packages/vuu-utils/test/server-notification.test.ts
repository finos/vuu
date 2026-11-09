import { describe, expect, it } from "vitest";
import {
  getServerNotificationStatus,
  hasRpcResponseNotification,
} from "../src/protocol-message-utils";

describe("getServerNotificationStatus", () => {
  it("maps each server notification type to a toast status", () => {
    expect(getServerNotificationStatus({ notificationType: "Error" })).toEqual({
      header: "Error",
      status: "error",
    });
    expect(
      getServerNotificationStatus({ notificationType: "Warning" }),
    ).toEqual({ header: "Warning", status: "warning" });
    expect(getServerNotificationStatus({ notificationType: "Info" })).toEqual({
      header: "Information",
      status: "info",
    });
  });

  it("treats an action without a notification type as a success", () => {
    expect(getServerNotificationStatus({})).toEqual({
      header: "Success",
      status: "success",
    });
  });

  it("uses the server's title as the header", () => {
    expect(
      getServerNotificationStatus({
        notificationType: "Error",
        title: "Failed to process cancelOrder request",
      }),
    ).toEqual({
      header: "Failed to process cancelOrder request",
      status: "error",
    });
  });
});

describe("hasRpcResponseNotification", () => {
  const action = {
    message: "Order 123 not found",
    notificationType: "Error",
    type: "SHOW_NOTIFICATION_ACTION",
  };

  it("matches an RPC response that carries a notification", () => {
    expect(
      hasRpcResponseNotification({ action, requestId: "1", type: "RPC_RESPONSE" }),
    ).toBe(true);
  });

  it("ignores other responses and other actions", () => {
    expect(
      hasRpcResponseNotification({ action, type: "VIEW_PORT_MENU_RESP" }),
    ).toBe(false);
    expect(
      hasRpcResponseNotification({
        action: { type: "NO_ACTION" },
        type: "RPC_RESPONSE",
      }),
    ).toBe(false);
    expect(hasRpcResponseNotification({ type: "RPC_RESPONSE" })).toBe(false);
  });
});
