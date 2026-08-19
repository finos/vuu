import { use } from "react";
import type { ApplicationStateStore } from "./ApplicationStateStore";

const READY = Object.assign(Promise.resolve(), {
  status: "fulfilled",
  value: undefined,
});

/**
 * Suspends until the store has loaded. `use` must be called on every render;
 * a thenable already marked as fulfilled doesn't suspend.
 */
export const useStoreReady = (store: ApplicationStateStore | undefined) => {
  use(store?.status === "loading" ? store.ready : READY);
};
