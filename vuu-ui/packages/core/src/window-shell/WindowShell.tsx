import { FlexItem, FlexLayout } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import type { ReactNode } from "react";
import {
  CommonShell,
  type CommonShellProps,
} from "../common-shell/CommonShell";
import type { ModuleId } from "../connection-management/ModuleServerMap";
import { PortalNotificationsProvider } from "../notifications/PortalNotificationsProvider";
import type { PortalNotificationsOptions } from "../notifications/notification-types";

import windowShellCss from "./WindowShell.css";

const classBase = "vuuWindowShell";

export interface WindowShellProps extends CommonShellProps {
  children: ReactNode;
  id?: string;
  /**
   * Notifications from the servers this window connects to. There is no
   * server monitor in a window, so only the window's own modules connect.
   */
  notifications?: PortalNotificationsOptions | false;
  /** The module shown in the window; toasts are shown only for it. */
  openModuleId?: ModuleId;
}

export const WindowShell = ({
  children,
  id,
  notifications,
  openModuleId,
  ...providerProps
}: WindowShellProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-window-shell",
    css: windowShellCss,
    window: targetWindow,
  });

  return (
    <CommonShell {...providerProps}>
      <PortalNotificationsProvider
        openModuleId={openModuleId}
        options={notifications}
        portalId={providerProps.portalId}
      >
        <FlexLayout className={classBase} direction="column" id={id}>
          <FlexItem className={`${classBase}-content`}>
            <div className={`${classBase}-content`}>{children}</div>
          </FlexItem>
        </FlexLayout>
      </PortalNotificationsProvider>
    </CommonShell>
  );
};
