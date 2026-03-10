import cx from "clsx";
import { Toast, ToastContent, useFloatingComponent } from "@salt-ds/core";
import { useEffect, useMemo, useState } from "react";
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

  const pageWidth = useMemo(() => document.body.clientWidth, []);

  const [left, setLeft] = useState(
    slideIn
      ? pageWidth + TOAST_WIDTH - toastContainerRightPadding
      : pageWidth - TOAST_WIDTH - toastContainerRightPadding,
  );

  useEffect(() => {
    if (slideIn) {
      setTimeout(() =>
        setLeft(pageWidth - TOAST_WIDTH - toastContainerRightPadding),
      );
    }

    if (animated) {
      setTimeout(
        () =>
          setLeft(
            document.body.clientWidth +
              TOAST_WIDTH -
              toastContainerRightPadding,
          ),
        toastDisplayDuration + horizontalTransitionDuration,
      );
    }
  }, [animated, pageWidth, slideIn]);

  console.log(`left ${left}`);

  return (
    <FloatingComponent
      className={cx(classBase, `${classBase}-${notification.type}`)}
      position="absolute"
      left={left}
      top={top}
      open
      style={{
        transition: animated
          ? `left ${horizontalTransitionDuration}ms, top ${verticalTransitionDuration}ms `
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
