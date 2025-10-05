import React, { ReactElement, ReactNode, useContext } from "react";
import { NotificationsCenter } from "./NotificationsCenter";
import { ValueOf } from "@vuu-ui/vuu-utils";

export type DispatchShowNotification = (notification: Notification) => void;
export type DispatchHideNotification = () => void;

export type NotificationsContext = {
  hideNotification: DispatchHideNotification;
  showNotification: DispatchShowNotification;
  setNotify: (
    showNotificationDispatcher: DispatchShowNotification,
    hideNotificationDispatcher: DispatchHideNotification,
  ) => void;
};

export const NotificationLevel = {
  Error: "error",
  Info: "info",
  Success: "success",
  Warning: "warning",
} as const;

export type NotificationLevel = ValueOf<typeof NotificationLevel>;

export const NotificationType = {
  Toast: "toast",
  Workspace: "workspace",
} as const;

export type NotificationType = ValueOf<typeof NotificationType>;

interface NotificationDescriptorBase<T extends NotificationType> {
  level: NotificationLevel;
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

/*
  The Context is not exposed outside this module, only the notify
  prop can be accessed via the useNotifications hook.
  The NotificationsCenter receives the full context object and
  sets the notify method. State management around dispatched
  notifications is handled entirely within the NotificationsCenter,
  avoiding rerendering our children when notifications are 
  dispatched.
*/
class NotificationsContextObject implements NotificationsContext {
  #showNotification: DispatchShowNotification = () =>
    console.log("have you forgotten to provide a NotificationsCenter?");
  #hideNotification: DispatchHideNotification = () =>
    console.log("have you forgotten to provide a NotificationsCenter?");
  // We want the public notify method to be stable, setNotify call should not trigger re-renders
  showNotification: DispatchShowNotification = (notification) =>
    this.#showNotification(notification);
  hideNotification: DispatchHideNotification = () => this.#hideNotification();
  setNotify = (
    showNotificationDispatcher: DispatchShowNotification,
    hideNotificationDispatcher: DispatchHideNotification,
  ) => {
    this.#showNotification = showNotificationDispatcher;
    this.#hideNotification = hideNotificationDispatcher;
  };
}

const NotificationsContext = React.createContext<NotificationsContext>(
  new NotificationsContextObject(),
);

export const NotificationsProvider = (props: {
  children: ReactElement | ReactElement[];
}) => {
  const context = useContext(NotificationsContext);
  return (
    <NotificationsContext.Provider value={context}>
      <NotificationsCenter notificationsContext={context} />
      {props.children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const { hideNotification, showNotification } =
    useContext(NotificationsContext);
  return { hideNotification, showNotification };
};
