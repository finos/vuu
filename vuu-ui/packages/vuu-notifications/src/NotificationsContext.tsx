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

export type NotificationAnimationType =
  | "slide-in"
  | "slide-out"
  | "slide-in,slide-out";

interface NotificationDescriptorBase<T extends NotificationType> {
  animationType?: NotificationAnimationType;
  renderPostRefresh?: boolean;
  status: ValidationStatus;
  type: T;
}

export interface ToastNotificationDescriptor
  extends NotificationDescriptorBase<"toast"> {
  content: string;
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
