import React, { ReactElement, useContext, useMemo } from "react";
import { NotificationsCenter } from "./NotificationsCenter";
import {
  DispatchHideNotification,
  DispatchShowNotification,
  type NotificationsContext,
  ToastNotificationDescriptor,
} from "./NotificationsContext";
import { getLocalEntity } from "@vuu-ui/vuu-utils";

interface ToastWithExpiry extends ToastNotificationDescriptor {
  expires: number;
}

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
  console.log(`%c[NotificationsProvider]`, "color:green;font-weight: bold;");
  const context = useContext(NotificationsContext);
  const startupToastNotification = useMemo<
    ToastNotificationDescriptor | undefined
  >(() => {
    const toast = getLocalEntity<ToastWithExpiry>("startup-notification", true);
    if (toast && toast.expires >= +Date.now()) {
      const { expires, ...toastDescriptor } = toast;
      return toastDescriptor;
    }
  }, []);
  return (
    <NotificationsContext.Provider value={context}>
      <NotificationsCenter
        startupToastNotification={startupToastNotification}
        notificationsContext={context}
      />
      {props.children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const { hideNotification, showNotification } =
    useContext(NotificationsContext);
  return { hideNotification, showNotification };
};
