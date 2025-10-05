import { getUniqueId } from "@vuu-ui/vuu-utils";
import { ReactNode, useCallback, useMemo, useState } from "react";
import {
  isToastNotification,
  isWorkspaceNotification,
  Notification,
  NotificationsContext,
  ToastNotificationDescriptor as ToastNotificationType,
} from "./NotificationsContext";
import { ToastNotification } from "./ToastNotification";
import { WorkspaceNotification } from "./WorkspaceNotification";

export interface NotificationsCenterProps {
  notificationsContext: NotificationsContext;
}

interface ToastNotificationWithId extends ToastNotificationType {
  id: string;
}

// animation times in milliseconds
const toastOffsetTop = 60;
const toastDisplayDuration = 6000;
const horizontalTransitionDuration = 1000;

// toast size in pixels
const toastHeight = 56;
const toastContainerContentGap = 10;
// rightPadding is used together with the toastWidth to compute the toast position
// at the beginning and at the end of the animation

export const NotificationsCenter = ({
  notificationsContext,
}: NotificationsCenterProps) => {
  const [workspaceNotification, setWorkspaceNotification] =
    useState<ReactNode>(null);
  const [notifications, setNotifications] = useState<ToastNotificationWithId[]>(
    [],
  );

  const showNotification = useCallback((notification: Notification) => {
    if (isToastNotification(notification)) {
      const newNotification: ToastNotificationWithId = {
        ...notification,
        id: getUniqueId(),
      };
      setNotifications((prev) => prev.concat(newNotification));
      setTimeout(
        () => {
          setNotifications((prev) => prev.filter((n) => n !== newNotification));
        },
        toastDisplayDuration + horizontalTransitionDuration * 2,
      );
    } else if (isWorkspaceNotification(notification)) {
      setWorkspaceNotification(
        <WorkspaceNotification>{notification.content}</WorkspaceNotification>,
      );
    } else {
      throw Error("[NotificationsCenter] invalid notification received");
    }
  }, []);

  const hideNotification = useCallback(() => {
    setWorkspaceNotification(null);
  }, []);

  useMemo(() => {
    notificationsContext.setNotify(showNotification, hideNotification);
  }, [hideNotification, notificationsContext, showNotification]);

  return (
    <>
      {workspaceNotification}
      {notifications.map((notification, i) => (
        <ToastNotification
          top={toastOffsetTop + (toastHeight + toastContainerContentGap) * i}
          notification={notification}
          key={notification.id}
        />
      ))}
    </>
  );
};
