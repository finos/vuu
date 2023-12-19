import { useCallback, useEffect, useState } from "react";
import { ConnectionManager } from "@finos/vuu-data-remote";
import { ConnectionStatusMessage } from "@finos/vuu-data-types";

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
