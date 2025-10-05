import { Icon } from "@vuu-ui/vuu-ui-controls";
import cx from "clsx";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { useEffect, useState } from "react";
import { Portal } from "../portal";
import type { ToastNotificationDescriptor } from "./NotificationsContext";

import toastNotificationCss from "./ToastNotification.css";

const toastWidth = 300;
const toastContainerRightPadding = 50;
const toastDisplayDuration = 6000;
const horizontalTransitionDuration = 1000;
const toastHeight = 56;
const verticalTransitionDuration = 300;

export type ToastNotificationProps = {
  top: number;
  notification: ToastNotificationDescriptor;
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
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-toast-notification",
    css: toastNotificationCss,
    window: targetWindow,
  });

  const [right, setRight] = useState(-toastWidth - toastContainerRightPadding);

  useEffect(() => {
    setTimeout(() => setRight(toastContainerRightPadding));

    if (animated) {
      setTimeout(
        () => setRight(-toastWidth - toastContainerRightPadding),
        toastDisplayDuration + horizontalTransitionDuration,
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
        <Icon name={icon[notification.level]} />
        <div className={`${classBase}-toastContent`}>
          <strong className={`${classBase}-toastHeader`}>
            {notification.header}
          </strong>
          <div>{notification.content}</div>
        </div>
      </div>
    </Portal>
  );
};
