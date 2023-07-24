import { useCallback, useEffect, useState } from "react";
import { ConnectionManager, ConnectionStatusMessage } from "@finos/vuu-data";

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
