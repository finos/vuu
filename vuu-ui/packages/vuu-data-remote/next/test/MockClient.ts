import {
  DataSource,
  DataSourceConstructorProps,
  DataSourceDataMessage,
  DataSourceRow,
  DataSourceSubscribeCallback,
} from "@vuu-ui/vuu-data-types";
import { VuuRange, VuuSort } from "@vuu-ui/vuu-protocol-types";
import { IKeySet, KeySet, NULL_RANGE, Range } from "@vuu-ui/vuu-utils";
import { ViewportNext } from "../ViewportNext";
import { MessageHandler, WebSocketConstructorProps } from "./IWebsocket";
import { MockDataSource } from "./MockDataSource";
import { MockKeySet } from "./MockKeySet";
import { MovingWindow } from "./MockMovingWindow";
import { MockServer } from "./MockServer";
import { MockWebSocket } from "./MockWebSocket";

const incrementRange = (range: VuuRange, increment = 1) => ({
  from: range.from + increment,
  to: range.to + increment,
});

export interface IClient {
  data: DataSourceRow[];
  receiveDataFromServer: MessageHandler<DataSourceDataMessage>;
  subscribe: () => void;
  /**
   * Scroll forwards by n number of rows, repeat n times, with n milliseconds between repeats
   * @param rowsToScrollBy number of rows ro scroll by
   * @param repeatTimes number of times to repeat scroll operation
   * @param interval milliseconds between repeats
   * @returns
   */
  scrollForwardRows: (
    rowsToScrollBy: number,
    repeatTimes?: number,
    interval?: number,
  ) => Promise<number>;

  scroll: (
    direction: "fwd" | "bwd",
    rowsToScrollBy: number,
    repeatTimes?: number,
    interval?: number,
  ) => Promise<number>;

  sort: (sort: VuuSort) => void;
}

class MockClientImpl implements IClient {
  #dataSource: DataSource | undefined;
  #vpRowCount: number;
  #dataWindow = new MovingWindow(NULL_RANGE);
  constructor(
    {
      dataSource,
      vpRowCount = 10,
    }: {
      dataSource: Promise<DataSource>;
      vpRowCount?: number;
    },
    onReady: (client: IClient) => void,
  ) {
    dataSource.then((ds) => {
      this.#dataSource = ds;
      onReady(this);
    });
    this.#vpRowCount = vpRowCount;
  }

  get data() {
    return this.#dataWindow.data;
  }

  subscribe() {
    // console.log(
    //   `==> [MockClient] requestInitialRows (${JSON.stringify({ from: 0, to: this.#vpRowCount })})`,
    // );
    const range = { from: 0, to: this.#vpRowCount };
    this.#dataWindow.setRange(range);
    this.#dataSource?.subscribe(
      { range: Range(0, this.#vpRowCount) },
      this.receiveDataFromServer,
    );
  }

  receiveDataFromServer: DataSourceSubscribeCallback = (message) => {
    // const now = new Date().getTime();
    // console.log(`[MockClient] ${now} receive data from server `);
    if (message.type === "viewport-update") {
      // console.table(message.rows);
      const { rows, size } = message;
      if (size) {
        // console.log(`[MockClient] size = ${size}`);
      }
      if (rows) {
        for (const row of rows) {
          this.#dataWindow.add(row);
          // logLatency(row);
        }
      }
    }
  };

  scrollForwardRows(rowCount: number, repeat = 1, interval = 0) {
    // console.log(`==> [MockClient] scrollForwardRows `);
    this.subscribe();
    return this.scroll("fwd", rowCount, repeat, interval);
  }

  sort(sort: VuuSort) {
    console.log(`[MockClient] sort ${JSON.stringify(sort)}`);
    if (this.#dataSource) {
      this.#dataSource.sort = sort;
    }
  }

  async scroll(
    direction: "fwd" | "bwd",
    rowCount: number,
    repeat = 1,
    interval = 0,
  ) {
    const { promise, resolve } = Promise.withResolvers<number>();
    const start = performance.now();
    const run = (
      remainingRuns: number,
      range = incrementRange(this.#dataSource?.range ?? NULL_RANGE, rowCount),
    ) => {
      // console.log(`run test loop remainingRuns: ${remainingRuns}`);
      setTimeout(() => {
        // console.log(
        //   `[MockClient] scroll, set datasource range (${JSON.stringify(range)}) interval ${interval}`,
        // );

        if (remainingRuns === 0) {
          // possibly a timeout here in case this never happens ?
          this.#dataWindow.on("range-filled", (filledRange) => {
            // console.log(
            //   `[MockCLient] dataWIndow "range-filled" ${JSON.stringify(filledRange)}`,
            // );
            if (
              filledRange.from === range.from &&
              filledRange.to === range.to
            ) {
              const end = performance.now();
              // this should be resolved when dataWindow holds full range
              resolve(end - start);
            }
          });
        }

        this.#dataWindow.setRange(range);
        if (this.#dataSource) {
          this.#dataSource.range = Range(range.from, range.to);
        } else {
          throw Error(`[MockClient] scroll, no DataSource`);
        }

        if (remainingRuns > 0) {
          run(remainingRuns - 1, incrementRange(range, rowCount));
        }
      }, interval);
    };
    run(repeat - 1);
    return promise;
  }
}

const defaultWebSocketProps: WebSocketConstructorProps = {
  WebSocketClass: MockWebSocket,
  latency: 0,
};

const defaultDataSourceProps: DataSourceConstructorProps = {
  table: { module: "ORDERS", table: "parentOrders" },
};

/**
 * Factory function to create Client instance
 */
export async function MockClient(
  {
    bufferSize = 0,
    dataSourceProps = defaultDataSourceProps,
    keys: keysProp = new KeySet(NULL_RANGE),
    WebSocketProps = defaultWebSocketProps,
  }: {
    bufferSize?: number;
    dataSourceProps?: DataSourceConstructorProps;
    latency?: number;
    keys?: number[] | IKeySet;
    WebSocketProps?: WebSocketConstructorProps;
  } = {
    bufferSize: 0,
    dataSourceProps: defaultDataSourceProps,
    latency: 0,
  },
): Promise<IClient> {
  // const ws = await (webSocket ?? MockWebSocket({ latency }));
  return new Promise((resolve) => {
    const keys = Array.isArray(keysProp) ? new MockKeySet(keysProp) : keysProp;
    new MockClientImpl(
      {
        dataSource: MockDataSource({
          ...dataSourceProps,
          server: MockServer({
            ViewportProps: { Viewport: ViewportNext, bufferSize, keys },
            WebSocketProps,
          }),
        }),
      },
      (mockClient: IClient) => {
        resolve(mockClient);
      },
    );
  });
}
