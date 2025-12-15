import cx from "clsx";
import { Toast, ToastContent, useFloatingComponent } from "@salt-ds/core";
import { useEffect, useState } from "react";
import type { ToastNotificationDescriptor } from "./NotificationsContext";

const toastContainerRightPadding = 20;
const toastDisplayDuration = 1200;
const horizontalTransitionDuration = 400;
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

  const { animationType = "slide-in,slide-out" } = notification;

  const slideIn = animationType.includes("slide-in");

  const [right, setRight] = useState(
    slideIn
      ? -TOAST_WIDTH - toastContainerRightPadding
      : toastContainerRightPadding,
  );

  useEffect(() => {
    if (slideIn) {
      setTimeout(() => setRight(toastContainerRightPadding));
    }

    if (animated) {
      console.log(
        `animated ${toastDisplayDuration + horizontalTransitionDuration}`,
      );
      setTimeout(
        () => setRight(-TOAST_WIDTH - toastContainerRightPadding),
        toastDisplayDuration + horizontalTransitionDuration,
      );
    }
  }, [animated, slideIn]);

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
