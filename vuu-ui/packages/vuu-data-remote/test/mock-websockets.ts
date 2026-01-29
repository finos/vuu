/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi } from "vitest";
import { EventEmitter } from "@vuu-ui/vuu-utils";

const websocketMessageEmitter = new EventEmitter();

export const clearMessagesFromWebSocketEndPoint = () => {
  websocketMessageEmitter.removeAllListeners();
};
export const mockMessageFromWebSocketEndpoint = (
  messageName: string,
  message: unknown,
) => {
  websocketMessageEmitter.emit(messageName, message);
};

class BaseWebSocket {
  protected messageHandler: any;
  protected openHandler: any;
  protected errorHandler: any;
  protected closeHandler: any;

  constructor() {
    websocketMessageEmitter.on("test", this.receiveMessage);
  }

  private receiveMessage = (message: unknown) => {
    this.messageHandler({ data: JSON.stringify(message) });
  };

  set onopen(callback: () => void) {
    this.openHandler = callback;
  }
  set onclose(callback: () => void) {
    this.closeHandler = callback;
  }
  set onerror(callback: () => void) {
    this.errorHandler = callback;
  }
  set onmessage(callback: (msg: { data: string }) => void) {
    this.messageHandler = callback;
  }
  send(_: string) {
    // console.log(`===> ${msg}`);
  }

  close() {
    this.closeHandler();
  }
}

export class MockWebSocketOpenFirstTime extends BaseWebSocket {
  constructor() {
    super();
    // console.log(`MockWebSocketOpenFirstTime`);
    setTimeout(() => {
      // console.log(`call openHandler`);
      this?.openHandler();
    }, 0);
    vi.advanceTimersByTimeAsync(1);
  }
}

export class MockWebSocketAlwaysFails extends BaseWebSocket {
  private static connectionCount = 0;
  private static secondsToNextRetry = 1;
  constructor() {
    super();
    MockWebSocketAlwaysFails.connectionCount += 1;
    setTimeout(() => {
      const { secondsToNextRetry } = MockWebSocketAlwaysFails;
      MockWebSocketAlwaysFails.secondsToNextRetry *= 2;
      this?.errorHandler({ message: "test error" });
      this?.closeHandler();
      vi.advanceTimersByTimeAsync(secondsToNextRetry * 1000);
    }, 0);
    vi.advanceTimersByTimeAsync(1);
  }
}

export class MockWebSocketAlwaysFailsLikeProxy extends BaseWebSocket {
  private static connectionCount = 0;
  private static secondsToNextRetry = 1;
  constructor() {
    super();
    MockWebSocketAlwaysFailsLikeProxy.connectionCount += 1;
    setTimeout(() => {
      MockWebSocketAlwaysFailsLikeProxy.secondsToNextRetry *= 2;
      this?.openHandler();
      setTimeout(() => {
        this?.errorHandler({ message: "test error" });
        this?.closeHandler();
      }, 0);
    }, 0);
    vi.advanceTimersByTimeAsync(1);
  }
}

export class MockWebSocketOpenFirstTimeLosesConnectionLater extends BaseWebSocket {
  constructor() {
    super();
    setTimeout(() => {
      this?.openHandler();
    }, 0);
    vi.advanceTimersByTimeAsync(1);
    setTimeout(() => {
      this.errorHandler();
      this.closeHandler();
    }, 100);
  }
}

export class MockWebSocketLoginSucceeds extends MockWebSocketOpenFirstTime {
  send(msg: string) {
    super.send(msg);
    if (msg.includes('"LOGIN"')) {
      setTimeout(() => {
        this.messageHandler({
          data: JSON.stringify({
            requestId: "req-1",
            sessionId: "sess-1",
            module: "CORE",
            body: {
              type: "LOGIN_SUCCESS",
            },
          }),
        });
      }, 0);
      vi.advanceTimersByTime(1);
    }
  }
}
export class MockWebSocketLoginSucceedsThenConnectionLost extends MockWebSocketOpenFirstTime {
  send(msg: string) {
    super.send(msg);
    if (msg.includes('"LOGIN"')) {
      setTimeout(() => {
        this.messageHandler({
          data: JSON.stringify({
            requestId: "req-1",
            sessionId: "sess-1",
            module: "CORE",
            body: {
              type: "LOGIN_SUCCESS",
            },
          }),
        });
      }, 0);
      vi.advanceTimersByTime(1);

      setTimeout(() => {
        this.errorHandler();
        this.closeHandler();
      }, 100);
    }
  }
}
export class MockWebSocketInvalidToken extends MockWebSocketOpenFirstTime {
  send(msg: string) {
    super.send(msg);
    if (msg.includes('"LOGIN"')) {
      setTimeout(() => {
        this.messageHandler({ data: "Invalid token" });
      }, 0);
      vi.advanceTimersByTime(1);
    }
  }
}
