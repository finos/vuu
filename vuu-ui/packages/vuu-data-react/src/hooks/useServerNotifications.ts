import { ConnectionManager } from "@vuu-ui/vuu-data-remote";
import type { ShowNotificationAction } from "@vuu-ui/vuu-protocol-types";
import { NotificationType, useNotifications } from "@vuu-ui/vuu-notifications";
import { getServerNotificationStatus } from "@vuu-ui/vuu-utils";
import { useEffect } from "react";

/**
 * Shows, as toasts, the notifications the server attaches to RPC responses,
 * such as its report that a request failed. Use it once per application.
 */
export const useServerNotifications = () => {
  const { showNotification } = useNotifications();
  useEffect(() => {
    const handleServerNotification = (action: ShowNotificationAction) => {
      showNotification({
        ...getServerNotificationStatus(action),
        content: action.message,
        type: NotificationType.Toast,
      });
    };
    ConnectionManager.on("server-notification", handleServerNotification);
    return () => {
      ConnectionManager.removeListener(
        "server-notification",
        handleServerNotification,
      );
    };
  }, [showNotification]);
};
