import { ConnectionManager } from "@finos/vuu-data-remote";
import type { ConnectionStatus } from "@finos/vuu-data-types";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { type RagStatus, TrafficLightControl } from "./TrafficLightControl";

import connectionStatusIndicatorCss from "./ConnectionStatusIndicator.css";
import { useMemo, useState } from "react";

const classBase = "vuuConnectionStatusIndicator";

interface ConnectionStatusProps {
  connectionStatus?: ConnectionStatus;
  className?: string;
  showText?: boolean;
}

const ragStatus: Record<ConnectionStatus, RagStatus> = {
  connecting: "amber",
  connected: "green",
  reconnected: "green",
  disconnected: "red",
  failed: "red",
  "connection-open-awaiting-session": "green",
};

const getRagStatus = (connectionStstus?: ConnectionStatus) => {
  if (connectionStstus) {
    return ragStatus[connectionStstus];
  } else {
    return "unknown";
  }
};

export const ConnectionStatusIndicator = ({
  connectionStatus = ConnectionManager.connectionStatus,
  showText = true,
}: ConnectionStatusProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-connection-status-indicator",
    css: connectionStatusIndicatorCss,
    window: targetWindow,
  });
  const [status, setStatus] = useState(connectionStatus);

  useMemo(() => {
    ConnectionManager.on("connection-status", ({ status }) => {
      setStatus(status);
    });
  }, []);

  return (
    <div className={classBase}>
      {showText ? (
        <div className={`${classBase}-text`}>{status ?? ""}</div>
      ) : null}
      <TrafficLightControl ragStatus={getRagStatus(status)} />
    </div>
  );
};
