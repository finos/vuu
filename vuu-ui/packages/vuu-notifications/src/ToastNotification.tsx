import { useFloatingComponent } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { Icon, IconButton } from "@vuu-ui/vuu-ui-controls";
import cx from "clsx";
import { RefCallback, useCallback } from "react";
import type { ToastNotificationDescriptor } from "./NotificationsContext";

import toastNotificationCss from "./ToastNotification.css";

export type ToastHoverHandler = (id?: string) => void;

export type ToastNotificationProps = {
  hidden?: boolean;
  id?: string;
  left?: number;
  notification: ToastNotificationDescriptor;
  onMeasured?: (id: string, height: number, width: number) => void;
  onDismiss?: (id?: string) => void;
  onHoverEntry?: ToastHoverHandler;
  onHoverExit?: ToastHoverHandler;
  opacity?: number;
  top?: number;
};

const classBase = "vuuToastNotification";

export const ToastNotification = ({
  hidden,
  id,
  left,
  onDismiss,
  onMeasured,
  top,
  notification,
  onHoverEntry,
  onHoverExit,
  opacity = 1,
}: ToastNotificationProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-toast-notification",
    css: toastNotificationCss,
    window: targetWindow,
  });

  const { Component: FloatingComponent } = useFloatingComponent();

  const {
    animationType,
    content,
    dismissal,
    header,
    icon,
    showCloseButton,
    status,
  } = notification;

  const iconName = icon === false ? undefined : (icon ?? status);

  const callbackRef = useCallback<RefCallback<HTMLDivElement>>(
    (el) => {
      if (el) {
        setTimeout(() => {
          const { height, width } = el.getBoundingClientRect();
          if (id) {
            onMeasured?.(id, height, width);
          }
        }, 60);
      }
    },
    [id, onMeasured],
  );

  const handleDismiss = useCallback(() => {
    onDismiss?.(id);
  }, [id, onDismiss]);

  const handleMouseEnter = useCallback(
    () => onHoverEntry?.(id),
    [id, onHoverEntry],
  );
  const handleMouseLeave = useCallback(
    () => onHoverExit?.(id),
    [id, onHoverExit],
  );

  if (dismissal === "manual" && showCloseButton === false) {
    console.warn(
      "[ToastNotification] invalid props, if dismissal is manual, showCloseButton should not be false",
    );
  }

  const withCloseButton = showCloseButton || dismissal === "manual";

  return (
    <FloatingComponent
      className={cx(classBase, `${classBase}-${notification.status}`, {
        [`${classBase}-hidden`]: hidden,
        [`${classBase}-transparent`]: opacity === 0,
        [`${classBase}-withContent`]: content !== undefined,
        [`${classBase}-withIcon`]: icon !== false,
        [`${classBase}-withTransition`]: animationType !== undefined && !hidden,
        [`${classBase}-withCloseButton`]: withCloseButton,
      })}
      id={id}
      left={left}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      open
      position="absolute"
      ref={callbackRef}
      role="alert"
      top={top}
    >
      {iconName ? <Icon name={iconName} /> : null}
      <h3 className={`${classBase}-header`}>{header}</h3>
      {content ? <div className={`${classBase}-content`}>{content}</div> : null}
      {withCloseButton ? (
        <IconButton
          className={`${classBase}-closeButton`}
          icon="close"
          onClick={handleDismiss}
          appearance="transparent"
          sentiment="neutral"
        />
      ) : null}
    </FloatingComponent>
  );
};
