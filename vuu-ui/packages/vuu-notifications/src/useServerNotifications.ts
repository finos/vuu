import type { ShowNotificationAction } from "@vuu-ui/vuu-protocol-types";
import { getServerNotificationStatus } from "@vuu-ui/vuu-utils";
import { useEffect } from "react";
import { NotificationType } from "./NotificationsContext";
import { useNotifications } from "./NotificationsProvider";

type ServerNotificationListener = (action: ShowNotificationAction) => void;

/**
 * Emits the notifications the server attaches to RPC responses. The Vuu
 * ConnectionManager is one.
 */
export interface ServerNotificationSource {
  on(event: "server-notification", listener: ServerNotificationListener): void;
  removeListener(
    event: "server-notification",
    listener: ServerNotificationListener,
  ): void;
}

/**
 * Shows, as toasts, the notifications the server attaches to RPC responses,
 * such as its report that a request failed. Use it once per application.
 */
export const useServerNotifications = (source: ServerNotificationSource) => {
  const { showNotification } = useNotifications();
  useEffect(() => {
    const handleServerNotification: ServerNotificationListener = (action) => {
      showNotification({
        ...getServerNotificationStatus(action),
        content: action.message,
        type: NotificationType.Toast,
      });
    };
    source.on("server-notification", handleServerNotification);
    return () => {
      source.removeListener("server-notification", handleServerNotification);
    };
  }, [showNotification, source]);
};
