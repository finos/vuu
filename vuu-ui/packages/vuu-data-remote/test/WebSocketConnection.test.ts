import "./global-mocks";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearMessagesFromWebSocketEndPoint,
  mockMessageFromWebSocketEndpoint,
  MockWebSocketOpenFirstTime,
  MockWebSocketConnectsOnSecondAttempt,
  MockWebSocketConnectsOnThirdAttempt,
  MockWebSocketAlwaysFails,
  MockWebSocketAlwaysFailsLikeProxy,
  MockWebSocketOpenFirstTimeLosesConnectionLater,
} from "./mock-websockets";

import {
  VuuServerMessageCallback,
  WebSocketConnection,
  WebSocketConnectionState,
} from "../src/WebSocketConnection";
import { VuuServerMessage } from "@finos/vuu-protocol-types";

describe("WebSocketConnection", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearMessagesFromWebSocketEndPoint();
  });
  afterEach(() => {
    // vi.useRealTimers();
  });

  describe("initial connection", () => {
    it("status moves from connecting to connected when initial connection succeeds", async () => {
      vi.stubGlobal("WebSocket", MockWebSocketOpenFirstTime);
      const vuuServerMessages: VuuServerMessage[] = [];
      const callback: VuuServerMessageCallback = (
        message: VuuServerMessage,
      ) => {
        vuuServerMessages.push(message);
      };

      const connectionStatusMessages: WebSocketConnectionState[] = [];
      const connectionCallback = (message: WebSocketConnectionState) => {
        connectionStatusMessages.push(message);
      };

      const websocketConnection = new WebSocketConnection({
        callback,
        protocols: "",
        url: "wss://test",
      });
      websocketConnection.on("connection-status", connectionCallback);

      await websocketConnection.connect();

      expect(websocketConnection.connectionState).toEqual({
        connectionPhase: "connecting",
        connectionStatus: "connected",
        retryAttemptsRemaining: 5,
        retryAttemptsTotal: 5,
        secondsToNextRetry: 1,
      });

      expect(connectionStatusMessages.length).toEqual(2);

      const [msg1, msg2] = connectionStatusMessages;
      expect(msg1.connectionStatus).toEqual("connecting");
      expect(msg2.connectionStatus).toEqual("connected");
    });

    it("sets confirmedOpen and installs reconnect retry limits when first message received", async () => {
      vi.stubGlobal("WebSocket", MockWebSocketOpenFirstTime);
      const callback = vi.fn();
      const connectionCallback = vi.fn();

      const websocketConnection = new WebSocketConnection({
        callback,
        protocols: "",
        url: "wss://test",
      });
      websocketConnection.on("connection-status", connectionCallback);

      await websocketConnection.connect();

      mockMessageFromWebSocketEndpoint("test", {
        body: { type: "LOGIN_SUCCESS" },
      });

      expect(websocketConnection.connectionState).toEqual({
        connectionPhase: "reconnecting",
        connectionStatus: "connected",
        retryAttemptsRemaining: 8,
        retryAttemptsTotal: 8,
        secondsToNextRetry: 1,
      });
    });

    it("retries connect in case of failure, single failure", async () => {
      vi.stubGlobal("WebSocket", MockWebSocketConnectsOnSecondAttempt);
      const vuuServerMessages: VuuServerMessage[] = [];
      const callback: VuuServerMessageCallback = (
        message: VuuServerMessage,
      ) => {
        vuuServerMessages.push(message);
      };

      const connectionStatusMessages: WebSocketConnectionState[] = [];
      const connectionCallback = (message: WebSocketConnectionState) => {
        connectionStatusMessages.push(message);
      };

      const websocketConnection = new WebSocketConnection({
        callback,
        protocols: "",
        url: "wss://test",
      });
      websocketConnection.on("connection-status", connectionCallback);

      await websocketConnection.connect();

      expect(websocketConnection.connectionState).toEqual({
        connectionPhase: "connecting",
        connectionStatus: "connected",
        retryAttemptsRemaining: 4,
        retryAttemptsTotal: 5,
        secondsToNextRetry: 2,
      });

      expect(connectionStatusMessages.length).toEqual(4);

      const [msg1, msg2, msg3, msg4] = connectionStatusMessages;
      expect(msg1.connectionStatus).toEqual("connecting");
      expect(msg2.connectionStatus).toEqual("disconnected");
      expect(msg3.connectionStatus).toEqual("connecting");
      expect(msg4.connectionStatus).toEqual("connected");
    });

    it("retries connect in case of failure, two failures", async () => {
      vi.stubGlobal("WebSocket", MockWebSocketConnectsOnThirdAttempt);
      const vuuServerMessages: VuuServerMessage[] = [];
      const callback: VuuServerMessageCallback = (
        message: VuuServerMessage,
      ) => {
        vuuServerMessages.push(message);
      };

      const connectionStatusMessages: WebSocketConnectionState[] = [];
      const connectionCallback = (message: WebSocketConnectionState) => {
        connectionStatusMessages.push(message);
      };

      const websocketConnection = new WebSocketConnection({
        callback,
        protocols: "",
        url: "wss://test",
      });
      websocketConnection.on("connection-status", connectionCallback);

      await websocketConnection.connect();

      expect(websocketConnection.connectionState).toEqual({
        connectionPhase: "connecting",
        connectionStatus: "connected",
        retryAttemptsRemaining: 3,
        retryAttemptsTotal: 5,
        secondsToNextRetry: 4,
      });

      expect(connectionStatusMessages.length).toEqual(6);

      const [msg1, msg2, msg3, msg4, msg5, msg6] = connectionStatusMessages;
      expect(msg1.connectionStatus).toEqual("connecting");
      expect(msg2.connectionStatus).toEqual("disconnected");
      expect(msg3.connectionStatus).toEqual("connecting");
      expect(msg4.connectionStatus).toEqual("disconnected");
      expect(msg5.connectionStatus).toEqual("connecting");
      expect(msg6.connectionStatus).toEqual("connected");
    });

    it("connect fails after maximum retries", async () => {
      vi.stubGlobal("WebSocket", MockWebSocketAlwaysFails);
      const vuuServerMessages: VuuServerMessage[] = [];
      const callback: VuuServerMessageCallback = (
        message: VuuServerMessage,
      ) => {
        vuuServerMessages.push(message);
      };

      const connectionStatusMessages: WebSocketConnectionState[] = [];
      const connectionCallback = (message: WebSocketConnectionState) => {
        connectionStatusMessages.push(message);
      };

      const websocketConnection = new WebSocketConnection({
        callback,
        protocols: "",
        url: "wss://test",
      });
      websocketConnection.on("connection-status", connectionCallback);

      await expect(() => websocketConnection.connect()).rejects.toThrowError(
        "connection failed",
      );

      expect(websocketConnection.connectionState).toEqual({
        connectionPhase: "connecting",
        connectionStatus: "closed",
        retryAttemptsRemaining: 0,
        retryAttemptsTotal: 5,
        secondsToNextRetry: 32,
      });

      expect(connectionStatusMessages.length).toEqual(13);

      const [msg1, msg2, msg3, msg4, msg5, msg6, , , , , , , msg13] =
        connectionStatusMessages;
      expect(msg1.connectionStatus).toEqual("connecting");
      expect(msg2.connectionStatus).toEqual("disconnected");
      expect(msg3.connectionStatus).toEqual("connecting");
      expect(msg4.connectionStatus).toEqual("disconnected");
      expect(msg5.connectionStatus).toEqual("connecting");
      expect(msg6.connectionStatus).toEqual("disconnected");
      expect(msg13.connectionStatus).toEqual("closed");
    });

    it("Simulating Proxy. opens but closes before message received. Fails after maximum retries", async () => {
      vi.stubGlobal("WebSocket", MockWebSocketAlwaysFailsLikeProxy);

      const vuuServerMessages: VuuServerMessage[] = [];
      const callback: VuuServerMessageCallback = (
        message: VuuServerMessage,
      ) => {
        vuuServerMessages.push(message);
      };

      const connectionStatusMessages: WebSocketConnectionState[] = [];
      const connectionCallback = (message: WebSocketConnectionState) => {
        connectionStatusMessages.push(message);
      };

      const websocketConnection = new WebSocketConnection({
        callback,
        protocols: "",
        url: "wss://test",
      });
      websocketConnection.on("connection-status", connectionCallback);

      await websocketConnection.connect();

      expect(websocketConnection.connectionState).toEqual({
        connectionPhase: "connecting",
        connectionStatus: "connected",
        retryAttemptsRemaining: 5,
        retryAttemptsTotal: 5,
        secondsToNextRetry: 1,
      });

      expect(connectionStatusMessages.length).toEqual(2);
      const [msg1, msg2] = connectionStatusMessages;
      expect(msg1.connectionStatus).toEqual("connecting");
      expect(msg2.connectionStatus).toEqual("connected");

      let reconnectAttempts = 0;
      while (vi.getTimerCount() > 0) {
        reconnectAttempts += 1;
        vi.advanceTimersToNextTimer();
      }
      // 3 (timeouts) * 5 (retry attempts) + 1
      expect(reconnectAttempts).toEqual(16);

      const lastMessage = connectionStatusMessages.at(-1);
      expect(lastMessage?.connectionStatus).toEqual("closed");

      expect(websocketConnection.connectionState).toEqual({
        connectionPhase: "connecting",
        connectionStatus: "closed",
        retryAttemptsRemaining: 0,
        retryAttemptsTotal: 5,
        secondsToNextRetry: 32,
      });
    });
  });

  describe("disconnect following successful connection", () => {
    it("attempts to reconnect, succeeds first time", async () => {
      vi.stubGlobal(
        "WebSocket",
        MockWebSocketOpenFirstTimeLosesConnectionLater,
      );
      const callback = vi.fn();
      const connectionCallback = vi.fn();

      const websocketConnection = new WebSocketConnection({
        callback,
        protocols: "",
        url: "wss://test",
      });
      websocketConnection.on("connection-status", connectionCallback);

      await websocketConnection.connect();

      mockMessageFromWebSocketEndpoint("test", {
        body: { type: "LOGIN_SUCCESS" },
      });

      // There is a timeout pending which will kill the connection ...
      vi.advanceTimersToNextTimer();

      // swap back in the Success WebSocket
      vi.stubGlobal("WebSocket", MockWebSocketOpenFirstTime);

      expect(websocketConnection.connectionState).toEqual({
        connectionPhase: "reconnecting",
        connectionStatus: "disconnected",
        retryAttemptsRemaining: 8,
        retryAttemptsTotal: 8,
        secondsToNextRetry: 1,
      });

      // Next timeout will trigger the first retry attempt, connecting
      vi.advanceTimersToNextTimer();
      expect(websocketConnection.connectionState).toEqual({
        connectionPhase: "reconnecting",
        connectionStatus: "reconnecting",
        retryAttemptsRemaining: 7,
        retryAttemptsTotal: 8,
        secondsToNextRetry: 2,
      });

      // Next timeout will trigger the connection success, connected
      vi.advanceTimersToNextTimer();
      expect(websocketConnection.connectionState).toEqual({
        connectionPhase: "reconnecting",
        connectionStatus: "reconnected",
        retryAttemptsRemaining: 7,
        retryAttemptsTotal: 8,
        secondsToNextRetry: 2,
      });
    });
  });
});
