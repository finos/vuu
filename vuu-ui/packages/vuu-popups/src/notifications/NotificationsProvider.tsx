import React, { ReactElement, useContext } from "react";
import { NotificationsCenter } from "./NotificationsCenter";
import { Notification } from "./notificationTypes";

export type DispatchNotification = (
  notification: Omit<Notification, "id">,
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
  #notify: DispatchNotification = () =>
    console.log("have you forgotten to provide a NotificationsCenter?");
  // We want the public notify method to be stable, setNotify call should not trigger re-renders
  notify: DispatchNotification = (notification) => this.#notify(notification);
  setNotify = (dispatcher: DispatchNotification) => {
    this.#notify = dispatcher;
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
  const { notify } = useContext(NotificationsContext);
  return notify;
};
