import { ConnectionManager } from "@vuu-ui/vuu-data-remote";
import {
  NotificationsProvider,
  useServerNotifications,
} from "@vuu-ui/vuu-notifications";
import type { ShowNotificationAction } from "@vuu-ui/vuu-protocol-types";

const notifications: Record<string, ShowNotificationAction> = {
  Error: {
    message: "Order 123 not found",
    notificationType: "Error",
    title: "Failed to process cancelOrder request",
    type: "SHOW_NOTIFICATION_ACTION",
  },
  Warning: {
    message: "Order 123 is partly filled",
    notificationType: "Warning",
    type: "SHOW_NOTIFICATION_ACTION",
  },
  Untyped: {
    message: "Order 123 cancelled",
    type: "SHOW_NOTIFICATION_ACTION",
  },
};

const ServerNotificationButtons = () => {
  useServerNotifications();
  return Object.entries(notifications).map(([label, action]) => (
    <button
      key={label}
      onClick={() => ConnectionManager.emit("server-notification", action)}
      type="button"
    >
      {label}
    </button>
  ));
};

/**
 * Each button stands in for an RPC response from the server that carries a
 * notification, and shows it at the server's level.
 */
export const ServerNotifications = () => (
  <NotificationsProvider>
    <ServerNotificationButtons />
  </NotificationsProvider>
);
