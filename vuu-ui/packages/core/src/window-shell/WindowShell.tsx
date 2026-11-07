import { FlexItem, FlexLayout } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import type { ReactNode } from "react";
import {
  CommonShell,
  type CommonShellProps,
} from "../common-shell/CommonShell";
import type { ModuleId } from "../connection-management/ModuleServerMap";
import {
  ShellContextPanel,
  ShellContextPanelProvider,
} from "../context-panel/ShellContextPanel";
import { PortalNotificationsProvider } from "../notifications/PortalNotificationsProvider";
import type { PortalNotificationsOptions } from "../notifications/notification-types";
import { VuuServerMonitorProvider } from "../server-monitor/VuuServerMonitorProvider";

import windowShellCss from "./WindowShell.css";

const classBase = "vuuWindowShell";

export interface WindowShellProps extends CommonShellProps {
  children: ReactNode;
  id?: string;
  /**
   * Notifications from the servers this window connects to. The window's
   * server monitor doesn't acquire connections, so only the window's own
   * modules connect.
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

  // Observes, but never acquires, connections: the window's module holds its
  // own, and its connection lost overlay needs their status.
  return (
    <VuuServerMonitorProvider options={false}>
      <CommonShell {...providerProps}>
        <PortalNotificationsProvider
          openModuleId={openModuleId}
          options={notifications}
          portalId={providerProps.portalId}
        >
          <ShellContextPanelProvider>
            <FlexLayout className={classBase} direction="column" id={id}>
              <FlexItem className={`${classBase}-content`}>
                <div className={`${classBase}-content`}>{children}</div>
              </FlexItem>
              <ShellContextPanel className={`${classBase}-context`} />
            </FlexLayout>
          </ShellContextPanelProvider>
        </PortalNotificationsProvider>
      </CommonShell>
    </VuuServerMonitorProvider>
  );
};
