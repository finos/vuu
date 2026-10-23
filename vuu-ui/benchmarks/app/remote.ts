/**
 * Remote data for the benchmark app: a VuuDataSource, with its worker and
 * server proxy, connected to the runner's mock Vuu server, and a control
 * channel to that server for starting update feeds.
 *
 * The server url comes from the page url, ?vuuServer=ws://host:port/, which
 * the runner sets. window.__vuuBench is the same for local and remote data.
 */
import { ConnectionManager, VuuDataSource } from "@vuu-ui/vuu-data-remote";
import { datasetColumns, datasetTableName } from "../harness/dataset";
import type {
  DatasetConfig,
  MockControlRequest,
  MockControlResponse,
  TickConfig,
} from "../harness/types";

const serverUrl = () => {
  const url = new URLSearchParams(location.search).get("vuuServer");
  if (!url) {
    throw Error(
      "[benchmarks] remote scenarios need a mock Vuu server, open the page with ?vuuServer=ws://host:port/",
    );
  }
  return url;
};

let connection: Promise<void> | undefined;

/**
 * Opens the worker's connection to the server, once per page. Resolves with
 * the time taken, or undefined when the page was already connected.
 */
export const connectToServer = async () => {
  if (connection) {
    await connection;
    return undefined;
  }
  const t0 = performance.now();
  connection = ConnectionManager.connect(
    { url: serverUrl(), token: "benchmark" },
    true,
  ).then((result) => {
    if (result !== "connected") {
      throw Error(`[benchmarks] mock Vuu server connection ${result}`);
    }
  });
  await connection;
  return Math.round(performance.now() - t0);
};

export const createRemoteDataSource = (dataset: DatasetConfig) =>
  new VuuDataSource({
    columns: datasetColumns(dataset).map(({ name }) => name),
    table: { module: "BENCHMARK", table: datasetTableName(dataset) },
  });

type WithoutId<T> = T extends unknown ? Omit<T, "id"> : never;
type PendingResponse = (response: MockControlResponse) => void;

/** Control channel to the mock Vuu server, see MockControlRequest */
export class MockServerControl {
  #ws: WebSocket;
  #nextId = 1;
  #pending = new Map<number, PendingResponse>();
  /** server clock minus page clock, both as epoch ms */
  #clockOffset = 0;

  private constructor(ws: WebSocket) {
    this.#ws = ws;
    ws.onmessage = ({ data }) => {
      const response = JSON.parse(data) as MockControlResponse;
      this.#pending.get(response.id)?.(response);
      this.#pending.delete(response.id);
    };
  }

  static async open() {
    const ws = new WebSocket(new URL("control", serverUrl()));
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });
    const control = new MockServerControl(ws);
    await control.#syncClock();
    return control;
  }

  #request<T extends MockControlResponse>(
    request: WithoutId<MockControlRequest>,
  ) {
    const id = this.#nextId++;
    return new Promise<T>((resolve) => {
      this.#pending.set(id, resolve as PendingResponse);
      this.#ws.send(JSON.stringify({ ...request, id }));
    });
  }

  /**
   * Estimates the server clock offset from a few round trips, keeping the
   * one with the shortest round trip, which bounds the error by half of it.
   */
  async #syncClock() {
    let bestRoundTrip = Infinity;
    for (let i = 0; i < 8; i++) {
      const t0 = performance.timeOrigin + performance.now();
      const { serverTime } = await this.#request<
        Extract<MockControlResponse, { type: "clock" }>
      >({ type: "clock" });
      const t1 = performance.timeOrigin + performance.now();
      if (t1 - t0 < bestRoundTrip) {
        bestRoundTrip = t1 - t0;
        this.#clockOffset = serverTime - (t0 + t1) / 2;
      }
    }
  }

  /** a server timestamp as a page performance.now() time */
  toPageTime(serverTime: number) {
    return serverTime - this.#clockOffset - performance.timeOrigin;
  }

  /**
   * Runs an update feed on the server for the viewport on `dataset`.
   * Resolves when the feed ends, with the page time each batch was sent.
   */
  async tick(dataset: DatasetConfig, config: TickConfig) {
    const { updatesEmitted, batchTimes } = await this.#request<
      Extract<MockControlResponse, { type: "tick-done" }>
    >({
      type: "tick",
      table: datasetTableName(dataset),
      config,
      seed: dataset.seed,
    });
    return {
      updatesEmitted,
      batchTimes: batchTimes.map((t) => this.toPageTime(t)),
    };
  }

  close() {
    this.#ws.close();
  }
}
