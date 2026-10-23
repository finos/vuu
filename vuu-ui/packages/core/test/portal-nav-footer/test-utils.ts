import { act } from "react";
import { vi } from "vitest";
import type {
  VuuServerPresence,
  VuuServerStatus,
  VuuServerStatusSource,
} from "../../src/connection-management/server-status";

export const serverStatus = (
  connectionId: string,
  presence: VuuServerPresence,
  detail?: VuuServerStatus["detail"],
): VuuServerStatus => ({
  connectionId,
  detail,
  monitored: true,
  presence,
  since: 0,
});

export class FakeServerMonitor implements VuuServerStatusSource {
  #listeners = new Set<() => void>();
  #statuses: Map<string, VuuServerStatus>;
  retry = vi.fn();
  retryModule = vi.fn();

  constructor(statuses: VuuServerStatus[]) {
    this.#statuses = new Map(statuses.map((s) => [s.connectionId, s]));
  }
  getStatus = (id: string) =>
    this.#statuses.get(id) ?? serverStatus(id, "unknown");
  getModuleStatus = (id: string) => this.getStatus(id);
  getStatuses = () => this.#statuses;
  subscribe = (listener: () => void) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };
  setDisplayOrder = () => undefined;
  setOpenModule = () => undefined;
  setVisibleModules = () => undefined;
  start = () => undefined;
  stop = () => undefined;

  update(status: VuuServerStatus) {
    this.#statuses = new Map(this.#statuses).set(status.connectionId, status);
    for (const listener of this.#listeners) listener();
  }
}

/** React listens for mouseover/mouseout to synthesise enter/leave. */
export const hover = (element: Element) =>
  act(() => {
    element.dispatchEvent(
      new MouseEvent("mouseover", {
        bubbles: true,
        relatedTarget: element.ownerDocument.body,
      }),
    );
  });

export const unhover = (element: Element) =>
  act(() => {
    element.dispatchEvent(
      new MouseEvent("mouseout", {
        bubbles: true,
        relatedTarget: element.ownerDocument.body,
      }),
    );
  });

export const click = (element: Element | null | undefined) =>
  act(() => {
    (element as HTMLElement).click();
  });

export const keyDown = (element: Element | null | undefined, key: string) =>
  act(() => {
    (element as HTMLElement).dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key }),
    );
  });
