import type { ModuleId } from "../connection-management/ModuleServerMap";
import type { PortalNotification } from "./notification-types";

export interface PresentationContext {
  /** The module whose route is open. */
  activeModuleId?: ModuleId;
  /** The server the open module uses. */
  activeConnectionId?: string;
  documentVisible: boolean;
  /** The notifications panel is showing. */
  panelOpen: boolean;
  doNotDisturb: boolean;
}

export type Presentation = "toast" | "banner" | "none";

/**
 * Decides how a notification is shown on screen. Notifications are recorded
 * and counted in badges whatever the policy decides.
 *
 * For client notifications, any result other than "none" shows the
 * notification as the caller requested.
 */
export type PresentationPolicy = (
  notification: PortalNotification,
  context: PresentationContext,
) => Presentation;

/**
 * Banners are shown portal-wide. Otherwise only notifications from the open
 * module, or from the portal itself, are shown; the rest are left to the
 * badges and the notifications viewer.
 */
export const defaultPresentationPolicy: PresentationPolicy = (
  { expired, initial, kind, origin },
  { activeModuleId, doNotDisturb, panelOpen },
) => {
  if (expired || doNotDisturb || kind === "silent") {
    return "none";
  }
  if (kind === "banner") {
    return "banner";
  }
  if (initial) {
    return "none";
  }
  const fromActiveModule =
    activeModuleId !== undefined && origin.moduleIds.includes(activeModuleId);
  if (origin.source === "client") {
    return fromActiveModule || origin.moduleIds.length === 0 ? "toast" : "none";
  }
  return fromActiveModule && !panelOpen ? "toast" : "none";
};

export interface ToastRateLimiterOptions<T> {
  /** Toasts visible at once. Default 3. */
  maxVisible?: number;
  /** Toasts from one source shown individually within `burstWindowMs`. Default 5. */
  burstSize?: number;
  burstWindowMs?: number;
  /** How long a toast stays visible. Default 7000. */
  visibleMs?: number;
  now?: () => number;
  /** Shows a toast, returning its id. */
  show: (item: T) => string | undefined;
  /** Hides a toast that is still visible. */
  hide: (id: string) => void;
  /** Shows one toast for toasts held back from a burst. */
  showSummary: (source: string, count: number) => string | undefined;
}

/**
 * Limits the toasts shown at once, hiding the oldest to make room, and
 * collapses a burst from one source: after `burstSize` toasts within
 * `burstWindowMs`, further toasts are held back and summarised in one toast
 * once the burst ends.
 */
export class ToastRateLimiter<T> {
  readonly #maxVisible: number;
  readonly #burstSize: number;
  readonly #burstWindowMs: number;
  readonly #visibleMs: number;
  readonly #now: () => number;
  readonly #options: ToastRateLimiterOptions<T>;
  #visible: { id: string; shownAt: number }[] = [];
  readonly #arrivals = new Map<string, number[]>();
  readonly #held = new Map<
    string,
    { count: number; timer: ReturnType<typeof setTimeout> }
  >();

  constructor(options: ToastRateLimiterOptions<T>) {
    this.#options = options;
    this.#maxVisible = options.maxVisible ?? 3;
    this.#burstSize = options.burstSize ?? 5;
    this.#burstWindowMs = options.burstWindowMs ?? 2000;
    this.#visibleMs = options.visibleMs ?? 7000;
    this.#now = options.now ?? Date.now;
  }

  present(item: T, source: string) {
    const now = this.#now();
    const arrivals = (this.#arrivals.get(source) ?? []).filter(
      (time) => now - time < this.#burstWindowMs,
    );
    arrivals.push(now);
    this.#arrivals.set(source, arrivals);

    const held = this.#held.get(source);
    if (held || arrivals.length > this.#burstSize) {
      if (held) {
        clearTimeout(held.timer);
      }
      this.#held.set(source, {
        count: (held?.count ?? 0) + 1,
        timer: setTimeout(() => this.#release(source), this.#burstWindowMs),
      });
    } else {
      this.#show(() => this.#options.show(item));
    }
  }

  dispose() {
    for (const { timer } of this.#held.values()) {
      clearTimeout(timer);
    }
    this.#held.clear();
    this.#arrivals.clear();
    this.#visible = [];
  }

  #release(source: string) {
    const held = this.#held.get(source);
    this.#held.delete(source);
    if (held) {
      this.#show(() => this.#options.showSummary(source, held.count));
    }
  }

  #show(show: () => string | undefined) {
    const now = this.#now();
    this.#visible = this.#visible.filter(
      ({ shownAt }) => now - shownAt < this.#visibleMs,
    );
    while (this.#visible.length >= this.#maxVisible) {
      const oldest = this.#visible.shift();
      if (oldest) {
        this.#options.hide(oldest.id);
      }
    }
    const id = show();
    if (id !== undefined) {
      this.#visible.push({ id, shownAt: now });
    }
  }
}
