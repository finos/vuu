import { useCallback, useEffect, useState } from "react";
import { ConnectionManager } from "../connection-manager";

export const useServerConnectionStatus = () => {
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  const handleStatusChange = useCallback((evt, { status }) => {
    setConnectionStatus(status);
  }, []);

  useEffect(() => {
    ConnectionManager.on("connection-status", handleStatusChange);
    return () => {
      ConnectionManager.removeListener("connection-status", handleStatusChange);
    };
  }, [handleStatusChange]);

  return connectionStatus;
};
