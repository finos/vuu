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
import { Icon } from "@vuu-ui/vuu-ui-controls";

export type ToastNotificationProps = {
  animated?: boolean;
  notification: ToastNotificationDescriptor;
  top: number;
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

  const {
    animationType = "slide-in,slide-out",
    content,
    dismiss = "automatic",
    header,
    icon,
    status,
  } = notification;

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

  const iconName = icon === false ? undefined : (icon ?? status);

  return (
    <FloatingComponent
      className={cx(classBase, `${classBase}-${notification.status}`, {
        [`${classBase}-withIcon`]: icon !== false,
        [`${classBase}-withContent`]: content !== undefined,
      })}
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
      {iconName ? <Icon name={iconName} /> : null}
      <h3 className={`${classBase}-header`}>{header}</h3>
      {content ? <div className={`${classBase}-content`}>{content}</div> : null}
    </FloatingComponent>
  );
};
