import { Toolbar, ToolbarContent, Tooltray } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import type { HTMLAttributes, ReactNode } from "react";
import {
  NotificationsIndicator,
  type NotificationsIndicatorProps,
} from "../notifications/NotificationsIndicator";
import { PortalUserMenu } from "./PortalUserMenu";

import portalHeaderCss from "./PortalHeader.css";

const classBase = "vuuPortalHeader";

export interface PortalHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * The notifications bell, shown when the portal has notifications.
   * `false` hides it. Default `true`.
   */
  notificationsIndicator?: boolean | NotificationsIndicatorProps;
  /** Extra user menu items, shown above **Saved state…**. */
  userMenuItems?: ReactNode;
}

export const PortalHeader = ({
  className: classNameProp,
  notificationsIndicator = true,
  userMenuItems,
  ...htmlAttributes
}: PortalHeaderProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-portal-header",
    css: portalHeaderCss,
    window: targetWindow,
  });

  const className = cx(classBase, classNameProp);

  return (
    <Toolbar className={className} role="banner" {...htmlAttributes}>
      <ToolbarContent position="end">
        <Tooltray align="end">
          {notificationsIndicator ? (
            <NotificationsIndicator
              {...(notificationsIndicator === true
                ? undefined
                : notificationsIndicator)}
            />
          ) : null}
          <PortalUserMenu>{userMenuItems}</PortalUserMenu>
        </Tooltray>
      </ToolbarContent>
    </Toolbar>
  );
};
