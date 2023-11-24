import React, { useState, useContext, useCallback, useEffect } from "react";
import classNames from "classnames";
import { getUniqueId } from "@finos/vuu-utils";

import "./notifications.css";
import { Portal } from "../portal";

// animation times in milliseconds
const toastOffsetTop = 60;
const toastDisplayDuration = 6000;
const horizontalTransitionDuration = 1000;
const verticalTransitionDuration = 300;

// toast size in pixels
const toastHeight = 56;
const toastWidth = 300;
const toastContainerContentGap = 10;
const toastContainerLeftPadding = 10;
// rightPadding is used together with the toastWidth to compute the toast position
// at the beginning and at the end of the animation
const toastContainerRightPadding = 50;

const classBase = "vuuToastNotifications";

export enum NotificationLevel {
  Info = "info",
  Success = "success",
  Warning = "warning",
  Error = "error",
}

type Notification = {
  type: NotificationLevel;
  header: string;
  body: string;
  id: string;
};

export const NotificationsContext = React.createContext<{
  notify: (notification: Omit<Notification, "id">) => void;
}>({
  notify: () => "have you forgotten to provide a NotificationProvider?",
});

export const NotificationsProvider = (props: {
  children: JSX.Element | JSX.Element[];
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = useCallback((notification: Omit<Notification, "id">) => {
    const newNotification = { ...notification, id: getUniqueId() };

    setNotifications((prev) => [...prev, newNotification]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n !== newNotification));
    }, toastDisplayDuration + horizontalTransitionDuration * 2);
  }, []);

  return (
    <NotificationsContext.Provider value={{ notify }}>
      <div
        className={`${classBase}-toastContainer`}
        style={{
          width:
            toastWidth + toastContainerRightPadding + toastContainerLeftPadding,
        }}
      >
        {notifications.map((notification, i) => (
          <ToastNotification
            top={toastOffsetTop + (toastHeight + toastContainerContentGap) * i}
            notification={notification}
            key={notification.id}
          />
        ))}
      </div>
      {props.children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsContext);

type ToastNotificationProps = {
  top: number;
  notification: Notification;
  animated?: boolean;
};

// Only exported for use in individual toast examples. Normal usage will be through the provider
export const ToastNotification = (props: ToastNotificationProps) => {
  const { top, notification, animated = true } = props;

  const [right, setRight] = useState(-toastWidth - toastContainerRightPadding);

  useEffect(() => {
    setRight(toastContainerRightPadding);
    if (animated) {
      setTimeout(
        () => setRight(-toastWidth - toastContainerRightPadding),
        toastDisplayDuration + horizontalTransitionDuration
      );
    }
  }, [animated]);

  return (
    <Portal>
      <div
        className={classNames(`${classBase}-toast`, notification.type)}
        style={{
          height: toastHeight,
          right,
          width: toastWidth,
          top,
          transition: animated
            ? `right ${horizontalTransitionDuration}ms, top ${verticalTransitionDuration}ms `
            : "none",
        }}
      >
        <div
          className={classNames(
            `${classBase}-toastIcon`,
            `${notification.type}-icon`
          )}
        />
        <div className={`${classBase}-toastContent`}>
          <strong className={`${classBase}-toastHeader`}>
            {notification.header}
          </strong>
          <div>{notification.body}</div>
        </div>
      </div>
    </Portal>
  );
};
