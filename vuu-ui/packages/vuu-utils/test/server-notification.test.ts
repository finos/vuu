import { describe, expect, it } from "vitest";
import { getServerNotificationStatus } from "../src/protocol-message-utils";

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
