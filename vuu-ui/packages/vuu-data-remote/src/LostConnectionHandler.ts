import { VuuAuthenticator } from "./VuuAuthenticator";

interface RetryOptions {
  interval: number;
  next: () => void;
  remaining: number;
}

class RetryOptionsImpl implements RetryOptions {
  private ind = 0;
  constructor(private retryIntervals: number[]) {}
  next() {
    this.ind = Math.min(this.retryIntervals.length, this.ind + 1);
  }
  get remaining() {
    return this.retryIntervals.length - this.ind;
  }
  get interval() {
    if (this.ind === this.retryIntervals.length) {
      return -1;
    } else {
      return this.retryIntervals[this.ind] * 1000;
    }
  }
}

export function RetryOptions(retryIntervals: number[]): RetryOptions;
export function RetryOptions(
  retryAttempts: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10,
  retryInterval: number,
): RetryOptions;
export function RetryOptions(
  retryAttempts: number | number[],
  retryInterval?: number,
) {
  if (Array.isArray(retryAttempts) && retryInterval === undefined) {
    return new RetryOptionsImpl(retryAttempts);
  } else if (
    typeof retryAttempts === "number" &&
    typeof retryInterval === "number"
  ) {
    return new RetryOptionsImpl(new Array(retryAttempts).fill(retryInterval));
  } else {
    throw Error("[lostConnectionHandler] RetryOptions, invalid params");
  }
}

const defaultRetryOptions = RetryOptions([1, 10, 30, 60, 120]);

export class RetryGenerator {
  private options: RetryOptions;

  constructor(
    private vuuAuth: VuuAuthenticator,
    options: RetryOptions,
  ) {
    this.options = options;
  }

  async *[Symbol.asyncIterator](): AsyncGenerator {
    let connected = false;
    do {
      await new Promise((resolve) =>
        setTimeout(resolve, this.options.interval),
      );
      try {
        await this.vuuAuth.login();
        connected = true;
        yield "connected";
      } catch (err) {
        // try again
      }
      this.options.next();
    } while (!connected && this.options.interval !== -1);
    if (connected) {
      return;
    } else {
      yield "connection-failed";
    }
  }
}

export class LostConnectionHandler {
  constructor(
    private vuuAuth: VuuAuthenticator,
    private retryOptions: RetryOptions = defaultRetryOptions,
  ) {}
  async reconnect() {
    for await (const result of new RetryGenerator(
      this.vuuAuth,
      this.retryOptions,
    )) {
      console.log(`  ... async iterator result = ${result}`);
    }
  }
}
