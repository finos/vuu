import {
  ConnectionManager,
  ConnectionStatus,
  isConnected,
} from "@vuu-ui/vuu-data-remote";
import { useCallback, useMemo, useRef } from "react";
import { NotificationType, useNotifications } from "@vuu-ui/vuu-notifications";
import { LostConnectionIndicator } from "../lost-connection-indicator/LostConnectionIndicator";

export const useLostConnection = () => {
  const { hideNotification, showNotification } = useNotifications();

  const isConnectedRef = useRef(ConnectionManager.connected);

  const handleConnectionStatusChange = useCallback(
    (connectionStatus: ConnectionStatus) => {
      const { current: wasConnected } = isConnectedRef;
      isConnectedRef.current = isConnected(connectionStatus);

      if (wasConnected && connectionStatus === "disconnected") {
        showNotification({
          content: <LostConnectionIndicator />,
          status: "error",
          type: NotificationType.Workspace,
        });
      } else if (!wasConnected && isConnectedRef.current) {
        hideNotification();
      }
    },
    [hideNotification, showNotification],
  );

  useMemo(async () => {
    ConnectionManager.on("connection-status", handleConnectionStatusChange);
  }, [handleConnectionStatusChange]);
};
