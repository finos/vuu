import {
  ConnectionManager,
  WebSocketConnectionState,
} from "@vuu-ui/vuu-data-remote";
import { useEffect, useState } from "react";

const DefaultConnectionState: WebSocketConnectionState = {
  connectionPhase: "connecting",
  connectionStatus: "closed",
  secondsToNextRetry: -1,
  retryAttemptsRemaining: 0,
  retryAttemptsTotal: 1,
};

export interface ConnectionStatusHookProps {
  connectionState?: WebSocketConnectionState;
}

export const getConnectinStateDisplayText = (
  connectionState: WebSocketConnectionState,
) => {
  switch (connectionState.connectionStatus) {
    case "closed":
      return "Unable to connect to data service";
    case "failed":
      return connectionState.connectionPhase === "connecting"
        ? "Failed to connect"
        : "Failed to re-connect";

    case "disconnected":
      return connectionState.connectionPhase === "connecting"
        ? "Attempting to connect to data service"
        : "Attempting to reconnect to data service";
  }
};

export const useConnectionStatus = ({
  connectionState: connectionStateProp = DefaultConnectionState,
}: ConnectionStatusHookProps) => {
  const [connectionState, setConnectionState] =
    useState<WebSocketConnectionState>(connectionStateProp);

  useEffect(() => {
    ConnectionManager.on("connection-status", setConnectionState);
    return () => {
      ConnectionManager.removeListener("connection-status", setConnectionState);
    };
  }, []);

  return connectionState;
};
