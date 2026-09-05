import { GridLayoutProvider } from "@heswell/grid-layout";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { useAuthenticatedUser } from "@vuu-ui/core";
import { ContextMenuProvider } from "@vuu-ui/vuu-context-menu";
import { useLostConnection } from "@vuu-ui/vuu-data-react";
import { NotificationsProvider } from "@vuu-ui/vuu-notifications";
import { ModalProvider } from "@vuu-ui/vuu-ui-controls";
import { useMemo, type HTMLAttributes, type ReactNode } from "react";
import { AppHeader } from "./app-header";
import { ApplicationProvider } from "./application-provider";
import {
  type ShellLayoutProps,
  useShellLayout,
} from "./shell-layout-templates";
import {
  WorkspaceHost,
  WorkspaceProvider,
  createWorkspaceComponentRegistries,
  shellWorkspaceComponentRegistrations,
  useWorkspaceContextMenuItems,
  type WorkspaceProps,
} from "./workspace-management";
import shellCss from "./shell.css";

export type LayoutTemplateName = "full-height" | "inlay";

export interface ShellProps extends HTMLAttributes<HTMLDivElement> {
  readonly children?: ReactNode;
  readonly logout?: () => void;
  readonly saveUrl?: string;
  readonly serverUrl?: string;
  readonly shellLayoutProps?: ShellLayoutProps;
  readonly workspaceProps?: WorkspaceProps;
}

const defaultAppHeader = <AppHeader />;
const defaultRegistries = createWorkspaceComponentRegistries(
  shellWorkspaceComponentRegistrations,
);

const VuuApplication = ({
  children,
  shellLayoutProps,
}: Pick<ShellProps, "children" | "shellLayoutProps">) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-shell",
    css: shellCss,
    window: targetWindow,
  });
  const { buildMenuOptions, handleMenuAction } = useWorkspaceContextMenuItems();
  const staticShell = useShellLayout({
    ...shellLayoutProps,
    appHeader: shellLayoutProps?.appHeader ?? defaultAppHeader,
    htmlAttributes: {
      className: "vuuShell",
      ...shellLayoutProps?.htmlAttributes,
    },
    workspaceHost: <WorkspaceHost />,
  });
  useLostConnection();

  return (
    <ContextMenuProvider
      menuActionHandler={handleMenuAction}
      menuBuilder={buildMenuOptions}
    >
      <GridLayoutProvider>{staticShell}</GridLayoutProvider>
      {children}
    </ContextMenuProvider>
  );
};

export const Shell = ({ logout, workspaceProps, ...props }: ShellProps) => {
  const user = useAuthenticatedUser();
  const resolvedWorkspaceProps = useMemo<WorkspaceProps>(
    () => ({
      ...workspaceProps,
      componentRenderers:
        workspaceProps?.componentRenderers ?? defaultRegistries.renderers,
      settingsCodecs:
        workspaceProps?.settingsCodecs ?? defaultRegistries.settingsCodecs,
    }),
    [workspaceProps],
  );

  return (
    <ApplicationProvider density="high" logout={logout} theme="vuu-theme">
      <ModalProvider>
        <NotificationsProvider>
          <WorkspaceProvider {...resolvedWorkspaceProps} userId={user.userName}>
            <VuuApplication {...props} />
          </WorkspaceProvider>
        </NotificationsProvider>
      </ModalProvider>
    </ApplicationProvider>
  );
};
