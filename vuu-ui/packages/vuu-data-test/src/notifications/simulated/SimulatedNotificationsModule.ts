import { PermissionFilter } from "../../core/filter/PermissionFilter";
import { NotificationModule } from "../NotificationModule";
import { DismissNotificationRpcHandler } from "./DismissNotificationRpcHandler";
import { SimulatedNotificationsProvider } from "./SimulatedNotificationsProvider";

export interface SimulatedNotificationsModuleOptions {
  /**
   * Generate random notifications. When false, notifications are only
   * created by calls to `publish`. Default true.
   */
  simulate?: boolean;
}

const noSimulation = { start: () => undefined, stop: () => undefined };

export const SimulatedNotificationsModule = ({
  simulate = true,
}: SimulatedNotificationsModuleOptions = {}) =>
  new NotificationModule(
    (table) =>
      simulate ? new SimulatedNotificationsProvider(table) : noSimulation,
    // Example permission function: only show notifications where audience is
    // "all", the current user, or one of the demo roles
    (viewport) => {
      const currentUser = viewport.user.name;
      return PermissionFilter(
        "audience",
        new Set(["all", currentUser, "admin", "trader"]),
      );
    },
    DismissNotificationRpcHandler,
    "source:String",
    "priority:Int",
    "status:String",
    "dismissedBy:String",
  );
