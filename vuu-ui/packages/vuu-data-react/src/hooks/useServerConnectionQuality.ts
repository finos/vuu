import { useCallback, useEffect, useState } from "react";
import { ConnectionManager } from "@finos/vuu-data";

export const useServerConnectionQuality = () => {
  const [messagesPerSecond, setMessagesPerSecond] = useState<number>(0);
  const handleConnectivityMessage = useCallback(({ messages }) => {
    setMessagesPerSecond(messages.messagesLength);
  }, []);

  useEffect(() => {
    ConnectionManager.on("connection-metrics", handleConnectivityMessage);
    return () => {
      ConnectionManager.removeListener(
        "connection-metrics",
        handleConnectivityMessage
      );
    };
  }, [handleConnectivityMessage]);

  return messagesPerSecond;
};
