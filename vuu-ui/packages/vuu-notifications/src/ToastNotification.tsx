import { useFloatingComponent } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { Icon, IconButton } from "@vuu-ui/vuu-ui-controls";
import cx from "clsx";
import { RefCallback, useCallback } from "react";
import type { ToastNotificationDescriptor } from "./NotificationsContext";

import toastNotificationCss from "./ToastNotification.css";

export type ToastNotificationProps = {
  hidden?: boolean;
  id?: string;
  left?: number;
  notification: ToastNotificationDescriptor;
  onMeasured?: (id: string, height: number, width: number) => void;
  opacity?: number;
  top?: number;
};

const classBase = "vuuToastNotification";

export const ToastNotification = (props: ToastNotificationProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-toast-notification",
    css: toastNotificationCss,
    window: targetWindow,
  });

  const {
    hidden,
    id,
    left,
    onMeasured,
    top,
    notification,
    opacity = 1,
  } = props;

  const { Component: FloatingComponent } = useFloatingComponent();

  const { animationType, content, header, icon, showCloseButton, status } =
    notification;

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

  console.log(
    `ToastNotification opacity=${opacity} hidden=${hidden} left=${left}`,
  );

  return (
    <FloatingComponent
      className={cx(classBase, `${classBase}-${notification.status}`, {
        [`${classBase}-hidden`]: hidden,
        [`${classBase}-transparent`]: opacity === 0,
        [`${classBase}-withContent`]: content !== undefined,
        [`${classBase}-withIcon`]: icon !== false,
        [`${classBase}-withTransition`]: animationType !== undefined && !hidden,
        [`${classBase}-withCloseButton`]: showCloseButton,
      })}
      id={id}
      left={left}
      open
      position="absolute"
      ref={callbackRef}
      top={top}
    >
      {iconName ? <Icon name={iconName} /> : null}
      <h3 className={`${classBase}-header`}>{header}</h3>
      {content ? <div className={`${classBase}-content`}>{content}</div> : null}
      {showCloseButton ? (
        <IconButton
          className={`${classBase}-closeButton`}
          icon="close"
          appearance="transparent"
          sentiment="neutral"
        />
      ) : null}
    </FloatingComponent>
  );
};
