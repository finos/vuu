import { useMemo, useState } from "react";
import { NotificationsContext } from "./NotificationsProvider";
import { getUniqueId } from "@finos/vuu-utils";
import { ToastNotification } from "./ToastNotification";
import { Notification } from "./notificationTypes";

export interface NotificationsCenterProps {
  notificationsContext: NotificationsContext;
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
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useMemo(() => {
    notificationsContext.setNotify((notification) => {
      const newNotification: Notification = {
        ...notification,
        id: getUniqueId(),
      };
      setNotifications((prev) => prev.concat(newNotification));
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n !== newNotification));
      }, toastDisplayDuration + horizontalTransitionDuration * 2);
    });
  }, [notificationsContext]);

  return (
    <>
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
