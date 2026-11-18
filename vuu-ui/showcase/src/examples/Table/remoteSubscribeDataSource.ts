import type {
  DataSource,
  DataSourceSubscribeCallback,
  DataSourceSubscribeProps,
} from "@vuu-ui/vuu-data-types";

/**
 * Makes a local data source answer subscribe the way a remote one does: status
 * is "subscribing" and there is no tableSchema until the server replies. The
 * reply is sent when the caller invokes the function passed to onSubscribing.
 * A suspend before subscribe is ignored. One that arrives while subscribing
 * takes effect once subscribed, unless a resume cancels it first.
 */
export const withRemoteSubscribe = (
  dataSource: DataSource,
  onSubscribing: (completeSubscription: () => void) => void,
) => {
  const subscribe = dataSource.subscribe.bind(dataSource);
  const suspend = dataSource.suspend?.bind(dataSource);
  const resume = dataSource.resume?.bind(dataSource);
  const { table, tableSchema } = dataSource;
  const getStatus = () =>
    Reflect.get(Object.getPrototypeOf(dataSource), "status", dataSource);
  let state: "idle" | "subscribing" | "subscribed" = "idle";
  let pendingSuspend = false;
  let clientCallback: DataSourceSubscribeCallback | undefined;

  Object.defineProperties(dataSource, {
    status: {
      get: () => (state === "subscribing" ? "subscribing" : getStatus()),
    },
    table: { get: () => table },
    tableSchema: {
      get: () => (state === "subscribed" ? tableSchema : undefined),
      set: () => undefined,
    },
  });

  dataSource.subscribe = async (
    props: DataSourceSubscribeProps,
    callback: DataSourceSubscribeCallback,
  ) => {
    state = "subscribing";
    clientCallback = callback;
    onSubscribing(() => {
      if (state !== "subscribing") {
        return;
      }
      state = "subscribed";
      if (clientCallback) {
        subscribe(props, clientCallback);
      }
      if (pendingSuspend) {
        pendingSuspend = false;
        suspend?.();
      }
    });
  };
  dataSource.suspend = (...args) => {
    if (state === "subscribing") {
      pendingSuspend = true;
    } else if (state === "subscribed") {
      suspend?.(...args);
    }
  };
  dataSource.resume = (callback) => {
    if (state === "subscribing") {
      pendingSuspend = false;
      if (callback) {
        clientCallback = callback;
      }
    } else {
      resume?.(callback);
    }
  };
  return dataSource;
};
