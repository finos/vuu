import {
  ConnectionManager,
  WebSocketConnectionState,
  isConnected,
} from "@vuu-ui/vuu-data-remote";
import type { VuuUser } from "@vuu-ui/vuu-utils";
import { useCallback, useMemo, useRef } from "react";
import { useNotifications } from "@vuu-ui/vuu-popups";
import { LostConnectionIndicator } from "../lost-connection-indicator/LostConnectionIndicator";

export interface RemoteConnectionHookProps {
  serverUrl?: string;
  user: VuuUser;
}
export const useRemoteConnection = ({
  serverUrl,
  user,
}: RemoteConnectionHookProps) => {
  const { hideNotification, showNotification } = useNotifications();

  const isConnectedRef = useRef(false);

  const handleConnectionStatusChange = useCallback(
    (message: WebSocketConnectionState) => {
      const { current: wasConnected } = isConnectedRef;
      isConnectedRef.current = isConnected(message.connectionStatus);

      if (wasConnected && message.connectionStatus === "disconnected") {
        showNotification({
          content: <LostConnectionIndicator />,
          level: "error",
          type: "workspace",
        });
      } else if (!wasConnected && isConnectedRef.current) {
        hideNotification();
      }
    },
    [hideNotification, showNotification],
  );

  useMemo(async () => {
    if (serverUrl) {
      ConnectionManager.on("connection-status", handleConnectionStatusChange);
      const connectionResult = await ConnectionManager.connect({
        token: user.token,
        url: serverUrl,
        username: user.username,
      });
      if (connectionResult === "rejected") {
        showNotification({
          level: "error",
          content: "Unable to connect to VUU Server",
          header: "Error",
          type: "toast",
        });
      }
    }
  }, [
    handleConnectionStatusChange,
    showNotification,
    serverUrl,
    user.token,
    user.username,
  ]);
};
