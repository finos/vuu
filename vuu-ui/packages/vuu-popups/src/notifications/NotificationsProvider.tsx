import React, { useContext } from "react";
import { NotificationsCenter } from "./NotificationsCenter";
import { Notification } from "./notificationTypes";

export type DispatchNotification = (
  notification: Omit<Notification, "id">
) => void;

export type NotificationsContext = {
  notify: DispatchNotification;
  setNotify: (dispatcher: DispatchNotification) => void;
};

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
  notify: DispatchNotification = () =>
    "have you forgotten to provide a NotificationsCenter?";
  setNotify = (dispatcher: DispatchNotification) => {
    this.notify = dispatcher;
  };
}

const NotificationsContext = React.createContext<NotificationsContext>(
  new NotificationsContextObject()
);

export const NotificationsProvider = (props: {
  children: JSX.Element | JSX.Element[];
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
  const { notify } = useContext(NotificationsContext);
  return notify;
};
