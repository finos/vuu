import { useFloatingComponent } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { VuuShellLocation } from "@vuu-ui/vuu-utils";
import cx from "clsx";
import { HTMLAttributes, ReactNode, useMemo } from "react";

import workspaceNotificationCss from "./WorkspaceNotification.css";

const classBase = "vuuWorkspaceNotification";

export interface WorkspaceNotificationProps
  extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const WorkspaceNotification = ({
  children,
  className,
  style: styleProp,
  ...htmlAttributes
}: WorkspaceNotificationProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-toast-notification",
    css: workspaceNotificationCss,
    window: targetWindow,
  });

  const { Component: FloatingComponent } = useFloatingComponent();

  const [left, top, width, height] = useMemo<
    [number, number, number, number]
  >(() => {
    const target = document.querySelector(
      `#${VuuShellLocation.WorkspaceContainer}`,
    );
    if (target) {
      const { left, top, width, height } = target.getBoundingClientRect();
      return [left, top, width, height];
    } else {
      return [0, 0, 200, 200];
    }
  }, []);

  return (
    <FloatingComponent
      {...htmlAttributes}
      className={cx(classBase, className)}
      open
      role="alert"
      left={left}
      top={top}
    >
      <div className={`${classBase}-content`} style={{ height, width }}>
        {children}
      </div>
    </FloatingComponent>
  );
};
