import type { ValidationStatus } from "@salt-ds/core";
import type { ValueOf } from "@vuu-ui/vuu-utils";
import type { ReactNode } from "react";

export type DispatchShowNotification = (
  notification: Notification,
) => string | undefined;
export type DispatchHideNotification = (id?: string) => void;

export const NotificationType = {
  Toast: "toast",
  Workspace: "workspace",
} as const;

export type NotificationType = ValueOf<typeof NotificationType>;

export type DismissalStyle = "automatic" | "manual";

export type NotificationAnimationType =
  "slide-in" | "slide-out" | "slide-in,slide-out";

/**
 * Where a notification was raised. Filled in by `useNotifications` from the
 * nearest `NotificationOriginProvider`, e.g. the portal module rendering the
 * caller.
 */
export interface NotificationOrigin {
  moduleId?: string | number;
  /** The Vuu server the module uses. */
  connectionId?: string;
  /** The module hosting the origin's module, for nested modules. */
  parentModuleId?: string | number;
}

interface NotificationDescriptorBase<T extends NotificationType> {
  animationType?: NotificationAnimationType;
  /**
   * 'automatic' dismissal means the Notification will be removed after a configurable delay
   * (6 seconds by default). 'manual' means a close button will be rendered and user must
   * manually dismiss by clicking the close button.
   */
  dismissal?: DismissalStyle;
  /**
   * A custom icon can be provided or false can be used to suppress rendering of any icon.
   * Default icons will be rendered for the different status values.
   */
  icon?: string | false;
  /** Set automatically by `useNotifications`, when a provider gives one. */
  origin?: NotificationOrigin;
  /**
   * Whether a host that keeps a notification history (e.g. a portal) should
   * record this notification. Hosts choose the default.
   */
  record?: boolean;
  renderPostRefresh?: boolean;
  showCloseButton?: boolean;
  status: ValidationStatus;
  type: T;
}

export interface ToastNotificationDescriptor extends NotificationDescriptorBase<"toast"> {
  className?: string;
  content?: ReactNode;
  header: string;
}

export interface WorkspaceNotificationDescriptor extends NotificationDescriptorBase<"workspace"> {
  content: ReactNode;
}

export type Notification =
  ToastNotificationDescriptor | WorkspaceNotificationDescriptor;

export const isToastNotification = (
  n: Notification,
): n is ToastNotificationDescriptor => n.type === NotificationType.Toast;

export const isWorkspaceNotification = (
  n: Notification,
): n is WorkspaceNotificationDescriptor =>
  n.type === NotificationType.Workspace;

/**
 * Decides whether a notification is shown. Given to the outermost
 * `NotificationsProvider`, it sees every notification raised beneath it,
 * including those raised inside nested providers.
 */
export type NotificationInterceptor = (
  notification: Notification,
) => "present" | "suppress";

export type NotificationsContextProps = {
  hideNotification: DispatchHideNotification;
  showNotification: DispatchShowNotification;
  setNotify: (
    showNotificationDispatcher: DispatchShowNotification,
    hideNotificationDispatcher: DispatchHideNotification,
  ) => void;
};
