import {
  ConnectionStatus,
  WebSocketConnectionState,
} from "@vuu-ui/vuu-data-remote/src/WebSocketConnection";
import {
  ConnectionStateDisplay,
  ConnectionStatusIndicator,
} from "@vuu-ui/vuu-shell";
import { ConnectionManager } from "@vuu-ui/vuu-data-remote";
import { useLayoutEffect, useRef, useState } from "react";
import { Button } from "@salt-ds/core";

export const ConnectionStatusIndicatorConnected = () => {
  const connectionState: WebSocketConnectionState = {
    connectionPhase: "connecting",
    connectionStatus: "connected",
    retryAttemptsTotal: 5,
    retryAttemptsRemaining: 5,
    secondsToNextRetry: 1,
  };
  return <ConnectionStatusIndicator connectionState={connectionState} />;
};

export const ConnectionStatusIndicatorDisconnectedNoRetryUsed = () => {
  const connectionState: WebSocketConnectionState = {
    connectionPhase: "connecting",
    connectionStatus: "disconnected",
    retryAttemptsTotal: 5,
    retryAttemptsRemaining: 5,
    secondsToNextRetry: 1,
  };
  return <ConnectionStatusIndicator connectionState={connectionState} />;
};

export const ConnectionStatusIndicatorDisconnectedOneRetryUsed = () => {
  const connectionState: WebSocketConnectionState = {
    connectionPhase: "connecting",
    connectionStatus: "disconnected",
    retryAttemptsTotal: 5,
    retryAttemptsRemaining: 4,
    secondsToNextRetry: 2,
  };
  return <ConnectionStatusIndicator connectionState={connectionState} />;
};

export const ConnectionStatusIndicatorDisconnectedTwoRetryUsed = () => {
  const connectionState: WebSocketConnectionState = {
    connectionPhase: "connecting",
    connectionStatus: "disconnected",
    retryAttemptsTotal: 5,
    retryAttemptsRemaining: 3,
    secondsToNextRetry: 4,
  };
  return <ConnectionStatusIndicator connectionState={connectionState} />;
};

export const ConnectionStatusIndicatorDisconnectedThreeRetryUsed = () => {
  const connectionStatusMessage: WebSocketConnectionState = {
    connectionPhase: "connecting",
    connectionStatus: "disconnected",
    retryAttemptsTotal: 5,
    retryAttemptsRemaining: 2,
    secondsToNextRetry: 8,
  };
  return (
    <ConnectionStatusIndicator connectionState={connectionStatusMessage} />
  );
};

export const ConnectionStatusIndicatorDisconnectedFourRetryUsed = () => {
  const connectionStatusMessage: WebSocketConnectionState = {
    connectionPhase: "connecting",
    connectionStatus: "disconnected",
    retryAttemptsTotal: 5,
    retryAttemptsRemaining: 1,
    secondsToNextRetry: 16,
  };
  return (
    <ConnectionStatusIndicator connectionState={connectionStatusMessage} />
  );
};

export const ConnectionStatusIndicatorDisconnectedAllRetryUsed = () => {
  const connectionStatusMessage: WebSocketConnectionState = {
    connectionPhase: "connecting",
    connectionStatus: "disconnected",
    retryAttemptsTotal: 5,
    retryAttemptsRemaining: 0,
    secondsToNextRetry: 32,
  };
  return (
    <ConnectionStatusIndicator connectionState={connectionStatusMessage} />
  );
};

export const ConnectionStatusIndicatorFailed = () => {
  const connectionStatusMessage: WebSocketConnectionState = {
    connectionPhase: "connecting",
    connectionStatus: "failed",
    retryAttemptsTotal: 5,
    retryAttemptsRemaining: 0,
    secondsToNextRetry: -1,
  };
  return (
    <ConnectionStatusIndicator connectionState={connectionStatusMessage} />
  );
};

export const ConnectionStateDisplayConnected = () => {
  useLayoutEffect(() => {
    ConnectionManager.emit("connection-status", {
      connectionPhase: "reconnecting",
      connectionStatus: "connected",
      secondsToNextRetry: 1,
      retryAttemptsRemaining: 8,
      retryAttemptsTotal: 8,
    });
  }, []);
  return <ConnectionStateDisplay />;
};

export const ConnectionStateDisplayConnecting = () => {
  useLayoutEffect(() => {
    ConnectionManager.emit("connection-status", {
      connectionPhase: "connecting",
      connectionStatus: "disconnected",
      secondsToNextRetry: 4,
      retryAttemptsRemaining: 3,
      retryAttemptsTotal: 5,
    });
  }, []);
  return <ConnectionStateDisplay />;
};

const initialConnectionState: WebSocketConnectionState = {
  connectionPhase: "connecting",
  connectionStatus: "inactive",
  retryAttemptsTotal: 5,
  retryAttemptsRemaining: 5,
  secondsToNextRetry: 5,
};

export const InteractiveStateDisplay = () => {
  const ref = useRef<WebSocketConnectionState>(initialConnectionState);
  const [, forceUpdate] = useState({});

  const setStatus = async (
    connectionStatus: ConnectionStatus,
    initialConnection = false,
  ) =>
    new Promise((resolve) => {
      let { retryAttemptsRemaining, secondsToNextRetry } = ref.current;
      let delay = 0;
      if (connectionStatus === "disconnected") {
        if (!initialConnection) {
          retryAttemptsRemaining -= 1;
          secondsToNextRetry *= 2;
        }
        ref.current = {
          ...ref.current,
          connectionStatus,
          retryAttemptsRemaining,
          secondsToNextRetry,
        };
        if (retryAttemptsRemaining) {
          delay = Math.min(secondsToNextRetry * 1000, 5000);
        }
      } else {
        ref.current = {
          ...ref.current,
          connectionStatus,
        };
      }
      forceUpdate({});
      setTimeout(resolve, delay);
    });

  const connectFail = async () => {
    // initial connection
    await setStatus("disconnected", true);

    while (ref.current.retryAttemptsRemaining > 0) {
      console.log(
        `${ref.current.retryAttemptsRemaining} attempts remaining (next delay ${ref.current.secondsToNextRetry}s)`,
      );
      await setStatus("disconnected");
    }

    await setStatus("closed");
  };

  return (
    <div
      style={{
        alignItems: "flex-end",
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <ConnectionStateDisplay connectionState={ref.current} />
      <div
        className="Toolbar"
        style={{ display: "flex", gap: 6, marginTop: 12 }}
      >
        <Button onClick={() => setStatus("connected")}>Connected</Button>
        <Button onClick={() => setStatus("disconnected")}>Disconnected</Button>
        <Button onClick={() => setStatus("closed")}>CLosed</Button>
        <Button onClick={connectFail}>Connect fail, 5 retries</Button>
      </div>
    </div>
  );
};
