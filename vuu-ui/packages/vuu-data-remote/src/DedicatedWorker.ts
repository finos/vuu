import {
  ConnectOptions,
  VuuUIMessageIn,
  VuuUIMessageOut,
  WithRequestId,
} from "@vuu-ui/vuu-data-types";
import { DeferredPromise, getLoggingConfigForWorker } from "@vuu-ui/vuu-utils";

// Note: inlined-worker is a generated file, it must be built
import { workerSourceCode } from "./inlined-worker";
import {
  VuuCreateVisualLink,
  VuuRemoveVisualLink,
  VuuRpcMenuRequest,
  VuuRpcServiceRequest,
} from "@vuu-ui/vuu-protocol-types";

const workerBlob = new Blob([getLoggingConfigForWorker() + workerSourceCode], {
  type: "text/javascript",
});
const workerBlobUrl = URL.createObjectURL(workerBlob);

export class DedicatedWorker {
  #deferredConnection?: DeferredPromise<
    "connected" | "reconnected" | "rejected"
  >;
  #worker: Promise<Worker>;

  constructor(onMessage: (msg: VuuUIMessageIn) => void) {
    const deferredWorker = new DeferredPromise<Worker>();
    this.#worker = deferredWorker.promise;
    const worker = new Worker(workerBlobUrl);
    const timer: number | null = window.setTimeout(() => {
      console.warn("timed out waiting for worker to load");
    }, 1000);
    worker.onmessage = (msg: MessageEvent<VuuUIMessageIn>) => {
      const { data: message } = msg;
      if (message.type === "ready") {
        window.clearTimeout(timer);
        deferredWorker.resolve(worker);
      } else if (message.type === "connected") {
        // how do we detect reconnected
        this.#deferredConnection?.resolve("connected");
      } else if (message.type === "connection-failed") {
        this.#deferredConnection?.resolve("rejected");
        // this.#deferredConnection?.reject(message.reason);
      } else {
        onMessage(message);
      }
    };
  }

  async connect(options: ConnectOptions) {
    this.#deferredConnection = new DeferredPromise<
      "connected" | "reconnected" | "rejected"
    >();
    this.send({
      ...options,
      type: "connect",
    });
    return this.#deferredConnection.promise;
  }

  async send(
    message:
      | VuuUIMessageOut
      | WithRequestId<
          | VuuCreateVisualLink
          | VuuRemoveVisualLink
          | VuuRpcServiceRequest
          | VuuRpcMenuRequest
        >,
  ) {
    (await this.#worker).postMessage(message);
  }

  async terminate() {
    (await this.#worker).terminate();
  }
}
