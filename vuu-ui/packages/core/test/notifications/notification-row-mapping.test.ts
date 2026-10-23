import { describe, expect, it } from "vitest";
import { toPortalNotification } from "../../src/notifications/notification-row-mapping";

const map = (values: Record<string, unknown>) =>
  toPortalNotification(
    { connectionId: "s1", rowKey: "row1", values },
    { initial: false, receivedAt: 1000 },
  );

describe("toPortalNotification", () => {
  it("maps the topic column to topic, not attributes", () => {
    const notification = map({
      id: "1",
      level: "ERROR",
      source: "OMS",
      title: "Rejected",
      topic: "orders",
    });
    expect(notification.topic).toBe("orders");
    expect(notification.level).toBe("error");
    expect(notification.attributes).toEqual({ source: "OMS" });
    expect(notification.key).toBe("s1:1");
  });

  it("treats an empty or missing topic as none", () => {
    expect(map({ id: "1", topic: "" }).topic).toBeUndefined();
    expect(map({ id: "1", topic: "  " }).topic).toBeUndefined();
    expect(map({ id: "1" }).topic).toBeUndefined();
    expect(map({ id: "1", topic: "" }).attributes).toEqual({});
  });
});
