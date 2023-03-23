import { useCallback, useEffect, useState } from "react";
import { ConnectionManager } from "../connection-manager";
import { ConnectionStatusMessage } from "../vuuUIMessageTypes";

export const useServerConnectionStatus = () => {
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  const handleStatusChange = useCallback(
    ({ status }: ConnectionStatusMessage) => {
      setConnectionStatus(status);
    },
    []
  );

  useEffect(() => {
    ConnectionManager.on("connection-status", handleStatusChange);
    return () => {
      ConnectionManager.removeListener("connection-status", handleStatusChange);
    };
  }, [handleStatusChange]);

  return connectionStatus;
};
