import { Icon } from "@finos/vuu-ui-controls";
import cx from "clsx";
import { useEffect, useState } from "react";
import { Portal } from "../portal";
import type { Notification } from "./notificationTypes";

import "./ToastNotification.css";

const toastWidth = 300;
const toastContainerRightPadding = 50;
const toastDisplayDuration = 6000;
const horizontalTransitionDuration = 1000;
const toastHeight = 56;
const verticalTransitionDuration = 300;

export type ToastNotificationProps = {
  top: number;
  notification: Notification;
  animated?: boolean;
};

const classBase = "vuuToastNotification";

const icon = {
  error: "error",
  info: "info-circle",
  success: "tick",
  warning: "warn-triangle",
};

export const ToastNotification = (props: ToastNotificationProps) => {
  const { top, notification, animated = true } = props;

  const [right, setRight] = useState(-toastWidth - toastContainerRightPadding);

  useEffect(() => {
    setTimeout(() => setRight(toastContainerRightPadding));

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
        className={cx(classBase, `${classBase}-${notification.type}`)}
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
        <Icon name={icon[notification.type]} />
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
