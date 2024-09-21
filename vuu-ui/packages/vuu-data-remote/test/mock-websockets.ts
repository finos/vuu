import { vi } from "vitest";
import {
  VuuServerMessageCallback,
  WebSocketConnectionConfig,
} from "../src/WebSocketConnection";
import { EventEmitter } from "@finos/vuu-utils";

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

  callback: VuuServerMessageCallback;

  constructor() {
    websocketMessageEmitter.on("test", this.receiveMessage);
  }

  private receiveMessage = (message: unknown) => {
    console.log(`BaseWebSocket receives message`);
    this.messageHandler({ data: JSON.stringify(message) });
  };

  set onopen(callback) {
    this.openHandler = callback;
  }
  set onclose(callback) {
    this.closeHandler = callback;
  }
  set onerror(callback) {
    this.errorHandler = callback;
  }
  set onmessage(callback) {
    this.messageHandler = callback;
  }
  send(msg: string) {
    console.log(`===> ${msg}`);
  }
}

export class MockWebSocketOpenFirstTime extends BaseWebSocket {
  constructor() {
    super();
    console.log(`MockWebSocketOpenFirstTime`);
    setTimeout(() => {
      console.log(`call openHandler`);
      this?.openHandler();
    }, 0);
    vi.advanceTimersByTimeAsync(1);
  }
}

export class MockWebSocketConnectsOnSecondAttempt extends BaseWebSocket {
  private static connectionCount = 0;
  constructor() {
    super();
    MockWebSocketConnectsOnSecondAttempt.connectionCount += 1;
    setTimeout(() => {
      if (MockWebSocketConnectsOnSecondAttempt.connectionCount === 2) {
        MockWebSocketConnectsOnSecondAttempt.connectionCount = 0;
        this?.openHandler();
      } else {
        this?.errorHandler({ message: "test error" });
        this?.closeHandler();
        vi.advanceTimersByTimeAsync(1000);
      }
    }, 0);
    vi.advanceTimersByTimeAsync(1);
  }
}

export class MockWebSocketConnectsOnThirdAttempt extends BaseWebSocket {
  private static connectionCount = 0;
  private static secondsToNextRetry = 1;
  constructor() {
    super();
    MockWebSocketConnectsOnThirdAttempt.connectionCount += 1;
    setTimeout(() => {
      if (MockWebSocketConnectsOnThirdAttempt.connectionCount === 3) {
        MockWebSocketConnectsOnThirdAttempt.connectionCount = 0;
        this?.openHandler();
      } else {
        const { secondsToNextRetry } = MockWebSocketConnectsOnThirdAttempt;
        MockWebSocketConnectsOnThirdAttempt.secondsToNextRetry *= 2;
        this?.errorHandler({ message: "test error" });
        this?.closeHandler();
        vi.advanceTimersByTimeAsync(secondsToNextRetry * 1000);
      }
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
    console.log(`MockWebSocketOpenFirstTimeLosesConnectionLater`);
    setTimeout(() => {
      console.log(`call openHandler`);
      this?.openHandler();
    }, 0);
    vi.advanceTimersByTimeAsync(1);
    setTimeout(() => {
      console.log(`KILL connection`);
      this.errorHandler();
      this.closeHandler();
    }, 100);
  }
}
