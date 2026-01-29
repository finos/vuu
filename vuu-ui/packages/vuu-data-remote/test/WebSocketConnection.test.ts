import "./global-mocks";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearMessagesFromWebSocketEndPoint,
  MockWebSocketOpenFirstTime,
  MockWebSocketLoginSucceeds,
  MockWebSocketLoginSucceedsThenConnectionLost,
  MockWebSocketInvalidToken,
} from "./mock-websockets";

import {
  ConnectionStatus,
  LoginRejectedMessage,
  VuuServerMessageCallback,
  WebSocketConnection,
} from "../src/WebSocketConnection";
import { VuuServerMessage } from "@vuu-ui/vuu-protocol-types";

describe("WebSocketConnection", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearMessagesFromWebSocketEndPoint();
  });
  afterEach(() => {
    // vi.useRealTimers();
  });

  it("status moves from closed to websocket-open when initial connect call succeeds - ws is open", async () => {
    vi.stubGlobal("WebSocket", MockWebSocketOpenFirstTime);
    const vuuServerMessages: (VuuServerMessage | LoginRejectedMessage)[] = [];
    const wsMessageCallback: VuuServerMessageCallback = (message) => {
      vuuServerMessages.push(message);
    };

    const connectionStatusValues: ConnectionStatus[] = [];
    const connectionStatusCallback = (status: ConnectionStatus) => {
      connectionStatusValues.push(status);
    };

    const websocketConnection = new WebSocketConnection({
      callback: wsMessageCallback,
      protocols: "",
      url: "wss://test",
    });

    expect(websocketConnection.connectionPhase).toEqual("initial-connection");
    expect(websocketConnection.connectionStatus).toEqual("closed");
    expect(websocketConnection.confirmedOpen).toEqual(false);

    websocketConnection.on("connection-status", connectionStatusCallback);

    await websocketConnection.openWebSocket();

    expect(websocketConnection.connectionPhase).toEqual("initial-connection");
    expect(websocketConnection.connectionStatus).toEqual("websocket-open");
    expect(websocketConnection.confirmedOpen).toEqual(false);

    expect(connectionStatusValues.length).toEqual(1);

    const [msg1] = connectionStatusValues;
    expect(msg1).toEqual("websocket-open");
  });

  it("progresses to confirmedOpen when login succeeds, connectionPhase advances", async () => {
    vi.stubGlobal("WebSocket", MockWebSocketLoginSucceeds);
    const vuuServerMessages: (VuuServerMessage | LoginRejectedMessage)[] = [];
    const callback: VuuServerMessageCallback = (message) => {
      vuuServerMessages.push(message);
    };

    const connectionStatusValues: ConnectionStatus[] = [];
    const connectionCallback = (status: ConnectionStatus) => {
      connectionStatusValues.push(status);
    };

    const websocketConnection = new WebSocketConnection({
      callback,
      protocols: "",
      url: "wss://test",
    });

    websocketConnection.on("connection-status", connectionCallback);

    await websocketConnection.openWebSocket();

    websocketConnection.send({
      requestId: "",
      module: "CORE",
      sessionId: "",
      body: {
        type: "LOGIN",
        token: "token-1",
      },
    });

    expect(websocketConnection.connectionStatus).toEqual("connected");
    expect(connectionStatusValues).toEqual(["websocket-open", "connected"]);
    expect(websocketConnection.confirmedOpen).toEqual(true);

    expect(websocketConnection.connectionPhase).toEqual(
      "post-disconnect-reconnection",
    );
  });

  it("Login succeeds, but connection is later lost", async () => {
    vi.stubGlobal("WebSocket", MockWebSocketLoginSucceedsThenConnectionLost);
    const vuuServerMessages: (VuuServerMessage | LoginRejectedMessage)[] = [];
    const callback: VuuServerMessageCallback = (message) => {
      vuuServerMessages.push(message);
    };

    const connectionStatusValues: ConnectionStatus[] = [];
    const connectionCallback = (status: ConnectionStatus) => {
      connectionStatusValues.push(status);
    };

    const websocketConnection = new WebSocketConnection({
      callback,
      protocols: "",
      url: "wss://test",
    });

    websocketConnection.on("connection-status", connectionCallback);

    await websocketConnection.openWebSocket();

    websocketConnection.send({
      requestId: "",
      module: "CORE",
      sessionId: "",
      body: {
        type: "LOGIN",
        token: "token-1",
      },
    });

    expect(websocketConnection.connectionStatus).toEqual("connected");
    expect(websocketConnection.confirmedOpen).toEqual(true);

    // There is a timeout pending which will kill the connection ...
    vi.advanceTimersToNextTimer();

    expect(websocketConnection.connectionPhase).toEqual(
      "post-disconnect-reconnection",
    );
    expect(websocketConnection.connectionStatus).toEqual("closed");
    expect(websocketConnection.confirmedOpen).toEqual(false);

    expect(connectionStatusValues).toEqual([
      "websocket-open",
      "connected",
      "disconnected",
      "closed",
    ]);
  });

  it("Login succeeds,connection is later lost, reconnect succeeds", async () => {
    vi.stubGlobal("WebSocket", MockWebSocketLoginSucceedsThenConnectionLost);
    const vuuServerMessages: (VuuServerMessage | LoginRejectedMessage)[] = [];
    const callback: VuuServerMessageCallback = (message) => {
      vuuServerMessages.push(message);
    };

    const connectionStatusValues: ConnectionStatus[] = [];
    const connectionCallback = (status: ConnectionStatus) => {
      connectionStatusValues.push(status);
    };

    const websocketConnection = new WebSocketConnection({
      callback,
      protocols: "",
      url: "wss://test",
    });

    websocketConnection.on("connection-status", connectionCallback);

    await websocketConnection.openWebSocket();

    websocketConnection.send({
      requestId: "",
      module: "CORE",
      sessionId: "",
      body: {
        type: "LOGIN",
        token: "token-1",
      },
    });

    expect(websocketConnection.connectionPhase).toEqual(
      "post-disconnect-reconnection",
    );
    expect(websocketConnection.connectionStatus).toEqual("connected");
    expect(websocketConnection.confirmedOpen).toEqual(true);

    // There is a timeout pending which will kill the connection ...
    vi.advanceTimersToNextTimer();

    expect(websocketConnection.connectionStatus).toEqual("closed");

    // swap back in the Login Success WebSocket
    vi.stubGlobal("WebSocket", MockWebSocketLoginSucceeds);

    await websocketConnection.openWebSocket();

    websocketConnection.send({
      requestId: "",
      module: "CORE",
      sessionId: "",
      body: {
        type: "LOGIN",
        token: "token-1",
      },
    });

    expect(websocketConnection.connectionStatus).toEqual("reconnected");
    expect(websocketConnection.confirmedOpen).toEqual(true);
    expect(connectionStatusValues).toEqual([
      "websocket-open",
      "connected",
      "disconnected",
      "closed",
      "websocket-open",
      "reconnected",
    ]);
  });

  it("login fails with Invalid token error", async () => {
    vi.stubGlobal("WebSocket", MockWebSocketInvalidToken);
    const vuuServerMessages: (VuuServerMessage | LoginRejectedMessage)[] = [];
    const callback: VuuServerMessageCallback = (message) => {
      vuuServerMessages.push(message);
    };

    const connectionStatusValues: ConnectionStatus[] = [];
    const connectionCallback = (status: ConnectionStatus) => {
      connectionStatusValues.push(status);
    };

    const websocketConnection = new WebSocketConnection({
      callback,
      protocols: "",
      url: "wss://test",
    });

    websocketConnection.on("connection-status", connectionCallback);

    await websocketConnection.openWebSocket();

    websocketConnection.send({
      requestId: "",
      module: "CORE",
      sessionId: "",
      body: {
        type: "LOGIN",
        token: "token-1",
      },
    });

    expect(vuuServerMessages.length).toEqual(1);
    expect(websocketConnection.connectionStatus).toEqual("closed");
    expect(connectionStatusValues).toEqual(["websocket-open", "closed"]);
    expect(websocketConnection.connectionPhase).toEqual("initial-connection");
    expect(websocketConnection.confirmedOpen).toEqual(false);
  });
});
