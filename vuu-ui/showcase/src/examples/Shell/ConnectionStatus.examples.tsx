import {
  ConnectionStatus,
  WebSocketConnectionState,
} from "@finos/vuu-data-remote/src/WebSocketConnection";
import {
  ConnectionStateDisplay,
  ConnectionStatusIndicator,
} from "@finos/vuu-shell";
import { ConnectionManager } from "@finos/vuu-data-remote";
import { useLayoutEffect, useRef, useState } from "react";
import { Button } from "@salt-ds/core";

let displaySequence = 1;

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
ConnectionStatusIndicatorConnected.displaySequence = displaySequence++;

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
ConnectionStatusIndicatorDisconnectedNoRetryUsed.displaySequence =
  displaySequence++;

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
ConnectionStatusIndicatorDisconnectedOneRetryUsed.displaySequence =
  displaySequence++;

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
ConnectionStatusIndicatorDisconnectedTwoRetryUsed.displaySequence =
  displaySequence++;

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
ConnectionStatusIndicatorDisconnectedThreeRetryUsed.displaySequence =
  displaySequence++;

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
ConnectionStatusIndicatorDisconnectedFourRetryUsed.displaySequence =
  displaySequence++;

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
ConnectionStatusIndicatorDisconnectedAllRetryUsed.displaySequence =
  displaySequence++;

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
ConnectionStatusIndicatorFailed.displaySequence = displaySequence++;

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
ConnectionStateDisplayConnected.displaySequence = displaySequence++;

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
ConnectionStateDisplayConnecting.displaySequence = displaySequence++;

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
    await setStatus("connecting");
    await setStatus("disconnected", true);

    while (ref.current.retryAttemptsRemaining > 0) {
      console.log(
        `${ref.current.retryAttemptsRemaining} attempts remaining (next delay ${ref.current.secondsToNextRetry}s)`,
      );
      await setStatus("connecting");
      await setStatus("disconnected");
    }

    await setStatus("closed");
  };

  return (
    <div style={{ padding: 24 }}>
      <ConnectionStateDisplay
        connectionState={ref.current}
        style={{ width: 300 }}
      />
      <div
        className="Toolbar"
        style={{ display: "flex", gap: 6, marginTop: 12 }}
      >
        <Button onClick={() => setStatus("connecting")}>Connecting</Button>
        <Button onClick={() => setStatus("connected")}>Connected</Button>
        <Button onClick={() => setStatus("disconnected")}>Disconnected</Button>
        <Button onClick={() => setStatus("closed")}>CLosed</Button>
        <Button onClick={connectFail}>Connect fail, 5 retries</Button>
      </div>
    </div>
  );
};
InteractiveStateDisplay.displaySequence = displaySequence++;
