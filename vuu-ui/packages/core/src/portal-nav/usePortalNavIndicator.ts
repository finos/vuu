import type { ModuleId } from "../connection-management/ModuleServerMap";
import type { NotificationUnreadSeverity } from "../notifications/notification-types";
import {
  useModulesUnreadSeverity,
  useUnreadCount,
} from "../notifications/PortalNotificationsProvider";

/**
 * Severity of a nav notification dot: the worst unread notification,
 * `error` > `warning` > `unread` (info or success).
 */
export type PortalNavIndicatorSeverity = NotificationUnreadSeverity;

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
 * reports the unread notifications attributed to the modules (by topic, or
 * by server connection) and their worst severity. Notifications claimed by
 * the open module are read, so they badge no entry. Callers exclude the
 * active item.
 */
export const usePortalNavIndicator = (
  moduleIds: readonly ModuleId[],
): PortalNavIndicator | undefined => {
  const count = useUnreadCount({ moduleIds: moduleIds as ModuleId[] });
  const severity = useModulesUnreadSeverity(moduleIds);
  return count > 0 && severity ? { count, severity } : undefined;
};
