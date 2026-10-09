import { useOptionalVuuConnectionId } from "@vuu-ui/core";
import {
  ConnectionManager,
  ConnectionStatus,
  DEFAULT_CONNECTION_ID,
  isConnected,
} from "@vuu-ui/vuu-data-remote";
import { useCallback, useEffect, useRef } from "react";
import { NotificationType, useNotifications } from "@vuu-ui/vuu-notifications";
import { LostConnectionIndicator } from "../lost-connection-indicator/LostConnectionIndicator";

export const useLostConnection = () => {
  const { hideNotification, showNotification } = useNotifications();
  const connectionId = useOptionalVuuConnectionId() ?? DEFAULT_CONNECTION_ID;

  const isConnectedRef = useRef(ConnectionManager.connectedFor(connectionId));

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

  useEffect(
    () =>
      ConnectionManager.onConnectionStatus(
        connectionId,
        handleConnectionStatusChange,
      ),
    [connectionId, handleConnectionStatusChange],
  );
};
