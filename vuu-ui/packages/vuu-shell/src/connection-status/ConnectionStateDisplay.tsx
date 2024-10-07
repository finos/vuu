import { ConnectionManager } from "@finos/vuu-data-remote";
import type { WebSocketConnectionState } from "@finos/vuu-data-remote/src/WebSocketConnection";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { HTMLAttributes, useMemo, useState } from "react";
import { ConnectionRetryCountdown } from "./ConnectionRetryCountdown";
import { ConnectionStatusIndicator } from "./ConnectionStatusIndicator";
import cx from "clsx";

import connectionStateDisplayCss from "./ConnectionStateDisplay.css";

const classBase = "vuuConnectionStateDisplay";

const DefaultConnectionState: WebSocketConnectionState = {
  connectionPhase: "connecting",
  connectionStatus: "closed",
  secondsToNextRetry: -1,
  retryAttemptsRemaining: 0,
  retryAttemptsTotal: 1,
};

interface ConnectionStateDisplayProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  connectionState?: WebSocketConnectionState;
  showText?: boolean;
}

const getDisplayText = (connectionState: WebSocketConnectionState) => {
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

export const ConnectionStateDisplay = ({
  connectionState: connectionStateProp,
  showText = true,
  ...htmlAttributes
}: ConnectionStateDisplayProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-connection-status-indicator",
    css: connectionStateDisplayCss,
    window: targetWindow,
  });
  const [connectionState, setConnectionState] =
    useState<WebSocketConnectionState>(DefaultConnectionState);

  useMemo(() => {
    ConnectionManager.on("connection-status", setConnectionState);
    if (connectionStateProp) {
      setConnectionState(connectionStateProp);
    }
  }, [connectionStateProp]);

  const { connectionStatus, secondsToNextRetry } = connectionState;

  return (
    <div
      {...htmlAttributes}
      className={cx(classBase, `${classBase}-${connectionStatus}`)}
    >
      {showText ? (
        <div className={`${classBase}-text`}>
          {getDisplayText(connectionState)}
        </div>
      ) : null}
      {connectionStatus === "disconnected" && secondsToNextRetry > 0 ? (
        <ConnectionRetryCountdown seconds={secondsToNextRetry} />
      ) : null}
      <ConnectionStatusIndicator connectionState={connectionState} />
    </div>
  );
};
