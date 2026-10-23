import type { ModuleId } from "../connection-management/ModuleServerMap";
import { useUnreadCount } from "../notifications/PortalNotificationsProvider";

/**
 * Severity of a nav notification dot. `unread` is the neutral dot shown for
 * unread notifications of unknown severity; `error` and `warning` are for
 * severity-aware routing (topic routing, UI-5).
 */
export type PortalNavIndicatorSeverity = "error" | "warning" | "unread";

export interface PortalNavIndicator {
  /** Unread notifications behind the indicator. */
  count: number;
  severity: PortalNavIndicatorSeverity;
}

/**
 * The notification dot for nav entries: an item (one module), a collapsed
 * section or the minimized nav (several modules). `undefined` for no dot.
 *
 * This is the single seam for notification indicators in `PortalNav`. It
 * currently reports unread notifications attributed to the modules (by
 * server connection) as `unread`. Topic routing (UI-5) replaces the body to
 * return the worst unread severity, `error` > `warning`; `PortalNav` and its
 * CSS already render all three severities. Callers exclude the active item.
 */
export const usePortalNavIndicator = (
  moduleIds: readonly ModuleId[],
): PortalNavIndicator | undefined => {
  const count = useUnreadCount({ moduleIds: moduleIds as ModuleId[] });
  return count > 0 ? { count, severity: "unread" } : undefined;
};
