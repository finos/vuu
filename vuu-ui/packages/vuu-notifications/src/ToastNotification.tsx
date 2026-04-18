import cx from "clsx";
import { useFloatingComponent } from "@salt-ds/core";
import { useEffect, useMemo, useState } from "react";
import type { ToastNotificationDescriptor } from "./NotificationsContext";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

const toastContainerRightPadding = 20;
// const toastDisplayDuration = 1200;
const toastDisplayDuration = 1200000;
const horizontalTransitionDuration = 400;
export const TOAST_HEIGHT = 80;
export const TOAST_WIDTH = 300;
const verticalTransitionDuration = 300;

import toastNotificationCss from "./ToastNotification.css";

export type ToastNotificationProps = {
  top: number;
  notification: ToastNotificationDescriptor;
  animated?: boolean;
};

const classBase = "vuuToastNotification";

export const ToastNotification = (props: ToastNotificationProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-toast-notification",
    css: toastNotificationCss,
    window: targetWindow,
  });

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

  return (
    <FloatingComponent
      className={cx(
        classBase,
        `${classBase}-${notification.type}`,
        `${classBase}-${notification.status}`,
      )}
      left={left}
      open
      position="absolute"
      top={top}
      style={{
        transition: animated
          ? `left ${horizontalTransitionDuration}ms, top ${verticalTransitionDuration}ms `
          : "none",
      }}
    >
      <div
        style={{
          height: TOAST_HEIGHT,
          width: TOAST_WIDTH,
        }}
      >
        <div>
          <h3 className={`${classBase}-toastHeader`}>{notification.header}</h3>
          <div>{notification.content}</div>
        </div>
      </div>
    </FloatingComponent>
  );
};
