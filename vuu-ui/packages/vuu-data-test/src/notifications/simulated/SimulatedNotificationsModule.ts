import { PermissionFilter } from "../../core/filter/PermissionFilter";
import { NotificationModule } from "../NotificationModule";
import { DismissNotificationRpcHandler } from "./DismissNotificationRpcHandler";
import { SimulatedNotificationsProvider } from "./SimulatedNotificationsProvider";

export const SimulatedNotificationsModule = () =>
  new NotificationModule(
    (table) => new SimulatedNotificationsProvider(table),
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
