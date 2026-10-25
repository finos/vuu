import type {
  DataSource,
  DataSourceSubscribeCallback,
  DataSourceSubscribeProps,
} from "@vuu-ui/vuu-data-types";
import { useEffect, useRef } from "react";

/**
 * Subscribes a component to a data source for as long as it is mounted.
 *
 * Session data sources outlive the components that use them: a component
 * in a stack tab unmounts when another tab is selected, and mounts again
 * when its tab is reselected. So the data source is only subscribed if it
 * has never been (or has been unsubscribed). Otherwise, e.g. while it is
 * still subscribing or after it was suspended, it is resumed with this
 * component's callback. On unmount, it is suspended, not unsubscribed.
 */
export const useDataSourceSubscription = (
  dataSource: DataSource | undefined,
  subscribeProps: DataSourceSubscribeProps,
  callback: DataSourceSubscribeCallback,
) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  const subscribePropsRef = useRef(subscribeProps);
  subscribePropsRef.current = subscribeProps;

  useEffect(() => {
    if (dataSource === undefined) {
      return;
    }
    const handleMessage: DataSourceSubscribeCallback = (message) =>
      callbackRef.current(message);

    if (
      dataSource.status === "initialising" ||
      dataSource.status === "unsubscribed"
    ) {
      Promise.resolve(
        dataSource.subscribe(subscribePropsRef.current, handleMessage),
      ).catch((error: unknown) => {
        console.error("[useDataSourceSubscription] subscribe failed", error);
      });
    } else {
      dataSource.resume?.(handleMessage);
    }

    return () => {
      dataSource.suspend?.();
    };
  }, [dataSource]);
};
