import cx from "clsx";
import { Toast, ToastContent, useFloatingComponent } from "@salt-ds/core";
import { useEffect, useState } from "react";
import type { ToastNotificationDescriptor } from "./NotificationsContext";

const toastContainerRightPadding = 50;
const toastDisplayDuration = 6000;
const horizontalTransitionDuration = 1000;
export const TOAST_HEIGHT = 80;
export const TOAST_WIDTH = 300;
const verticalTransitionDuration = 300;

export type ToastNotificationProps = {
  top: number;
  notification: ToastNotificationDescriptor;
  animated?: boolean;
};

const classBase = "vuuToastNotification";

export const ToastNotification = (props: ToastNotificationProps) => {
  const { top, notification, animated = true } = props;

  const { Component: FloatingComponent } = useFloatingComponent();

  const [right, setRight] = useState(-TOAST_WIDTH - toastContainerRightPadding);

  useEffect(() => {
    setTimeout(() => setRight(toastContainerRightPadding));

    if (animated) {
      setTimeout(
        () => setRight(-TOAST_WIDTH - toastContainerRightPadding),
        toastDisplayDuration + horizontalTransitionDuration,
      );
    }
  }, [animated]);

  return (
    <FloatingComponent
      className={cx(classBase, `${classBase}-${notification.type}`)}
      open
      style={{
        position: "absolute",
        right,
        top,
        transition: animated
          ? `right ${horizontalTransitionDuration}ms, top ${verticalTransitionDuration}ms `
          : "none",
      }}
    >
      <Toast
        status={notification.status}
        style={{
          height: TOAST_HEIGHT,
          width: TOAST_WIDTH,
        }}
      >
        <ToastContent>
          <h3 className={`${classBase}-toastHeader`}>{notification.header}</h3>
          <div>{notification.content}</div>
        </ToastContent>
      </Toast>
    </FloatingComponent>
  );
};
