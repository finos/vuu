import { type ValidationStatus } from "@salt-ds/core";
import { ValueOf } from "@vuu-ui/vuu-utils";
import { ReactNode } from "react";

export type DispatchShowNotification = (notification: Notification) => void;
export type DispatchHideNotification = () => void;

export const NotificationType = {
  Toast: "toast",
  Workspace: "workspace",
} as const;

export type NotificationType = ValueOf<typeof NotificationType>;

export type DismissalStyle = "automatic" | "manual";

export type NotificationAnimationType =
  | "slide-in"
  | "slide-out"
  | "slide-in,slide-out";

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
  renderPostRefresh?: boolean;
  showCloseButton?: boolean;
  status: ValidationStatus;
  type: T;
}

export interface ToastNotificationDescriptor
  extends NotificationDescriptorBase<"toast"> {
  content?: ReactNode;
  header: string;
}

export interface WorkspaceNotificationDescriptor
  extends NotificationDescriptorBase<"workspace"> {
  content: ReactNode;
}

export type Notification =
  | ToastNotificationDescriptor
  | WorkspaceNotificationDescriptor;

export const isToastNotification = (
  n: Notification,
): n is ToastNotificationDescriptor => n.type === NotificationType.Toast;

export const isWorkspaceNotification = (
  n: Notification,
): n is WorkspaceNotificationDescriptor =>
  n.type === NotificationType.Workspace;

export type NotificationsContext = {
  hideNotification: DispatchHideNotification;
  showNotification: DispatchShowNotification;
  setNotify: (
    showNotificationDispatcher: DispatchShowNotification,
    hideNotificationDispatcher: DispatchHideNotification,
  ) => void;
};
