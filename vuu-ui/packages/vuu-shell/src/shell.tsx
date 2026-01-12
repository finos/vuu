import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { ContextMenuProvider } from "@vuu-ui/vuu-context-menu";
import { useRemoteConnection } from "@vuu-ui/vuu-data-react";
import type { LayoutChangeHandler } from "@vuu-ui/vuu-layout";
import { LayoutProvider, StackLayout } from "@vuu-ui/vuu-layout";
import { NotificationsProvider } from "@vuu-ui/vuu-notifications";
import { ModalProvider } from "@vuu-ui/vuu-ui-controls";
import { VuuUser, logger, registerComponent } from "@vuu-ui/vuu-utils";
import {
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useMemo,
} from "react";
import { AppHeader } from "./app-header";
import { ApplicationProvider } from "./application-provider";
import {
  IPersistenceManager,
  LocalPersistenceManager,
  PersistenceProvider,
  usePersistenceManager,
} from "./persistence-manager";
import { ShellLayoutProps, useShellLayout } from "./shell-layout-templates";
import { SettingsSchema, UserSettingsPanel } from "./user-settings";
import {
  WorkspaceProps,
  WorkspaceProvider,
  useWorkspace,
  useWorkspaceContextMenuItems,
} from "./workspace-management";
import { loadingJSON } from "./workspace-management/defaultWorkspaceJSON";

import shellCss from "./shell.css";

registerComponent("ApplicationSettings", UserSettingsPanel, "view");

if (process.env.NODE_ENV === "production") {
  // StackLayout is loaded just to force component registration, we know it will be
  // required when default layout is instantiated. This is only required in prod
  // to avoif tree shaking the Stack away. Causes a runtime issue in dev.
  if (typeof StackLayout !== "function") {
    console.warn(
      "StackLayout module not loaded, will be unable to deserialize from layout JSON",
    );
  }
}

const { error } = logger("Shell");

export type LayoutTemplateName = "full-height" | "inlay";

export interface ShellProps extends HTMLAttributes<HTMLDivElement> {
  shellLayoutProps?: ShellLayoutProps;
  userSettingsSchema?: SettingsSchema;
  workspaceProps?: WorkspaceProps;
  children?: ReactNode;
  loginUrl?: string;
  saveUrl?: string;
  serverUrl?: string;
  user: VuuUser;
}

const defaultAppHeader = <AppHeader />;

const getAppHeader = (shellLayoutProps?: ShellLayoutProps) =>
  shellLayoutProps?.appHeader ?? defaultAppHeader;

const defaultHTMLAttributes: HTMLAttributes<HTMLDivElement> = {
  className: "vuuShell",
};

const getHTMLAttributes = (props?: ShellLayoutProps) => {
  if (props?.htmlAttributes) {
    return {
      ...defaultHTMLAttributes,
      ...props.htmlAttributes,
    };
  } else {
    return defaultHTMLAttributes;
  }
};

const VuuApplication = ({
  shellLayoutProps: ShellLayoutProps,
  children,
  // loginUrl, // need to make this available to app header
  serverUrl,
  user,
}: Omit<
  ShellProps,
  "ContentLayoutProps" | "loginUrl" | "userSettingsSchema" | "workspaceProps"
>) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-shell",
    css: shellCss,
    window: targetWindow,
  });

  const { workspaceJSON, saveApplicationLayout } = useWorkspace();

  const { buildMenuOptions, handleMenuAction } = useWorkspaceContextMenuItems();

  const handleLayoutChange = useCallback<LayoutChangeHandler>(
    (layout) => {
      try {
        saveApplicationLayout(layout);
      } catch {
        error?.("Failed to save layout");
      }
    },
    [saveApplicationLayout],
  );

  useRemoteConnection({ serverUrl, user });

  const isLayoutLoading = workspaceJSON === loadingJSON;

  const initialLayout = useShellLayout({
    ...ShellLayoutProps,
    appHeader: getAppHeader(ShellLayoutProps),
    htmlAttributes: getHTMLAttributes(ShellLayoutProps),
  });

  return isLayoutLoading ? null : (
    <ContextMenuProvider
      menuActionHandler={handleMenuAction}
      menuBuilder={buildMenuOptions}
    >
      <LayoutProvider
        workspaceJSON={workspaceJSON}
        onLayoutChange={handleLayoutChange}
      >
        {initialLayout}
      </LayoutProvider>
      {children}
    </ContextMenuProvider>
  );
};

export const Shell = ({
  loginUrl,
  user,
  userSettingsSchema,
  workspaceProps,
  ...props
}: ShellProps) => {
  // If user has provided an implementation of IPersistenceManager
  // by wrapping higher level PersistenceProvider, use it, otw
  // default to LocalPersistenceManager
  const persistenceManager = usePersistenceManager();
  const localPersistenceManager = useMemo<
    IPersistenceManager | undefined
  >(() => {
    if (persistenceManager) {
      return undefined;
    }
    console.log(
      `No Persistence Manager, configuration data will be persisted to Local Storage, key: 'vuu/${user.username}'`,
    );
    return new LocalPersistenceManager(`vuu/${user.username}`);
  }, [persistenceManager, user.username]);

  // ApplicationProvider must go outside Dialog and Notification providers
  // ApplicationProvider injects the SaltProvider and this must be the root
  // SaltProvider.

  const shellProviders = (
    <ApplicationProvider
      density="high"
      loginUrl={loginUrl}
      theme="vuu-theme"
      user={user}
      userSettingsSchema={userSettingsSchema}
    >
      <WorkspaceProvider {...workspaceProps}>
        <ModalProvider>
          <NotificationsProvider>
            <VuuApplication {...props} user={user} />
          </NotificationsProvider>
        </ModalProvider>
      </WorkspaceProvider>
    </ApplicationProvider>
  );

  if (persistenceManager) {
    return shellProviders;
  } else {
    return (
      <PersistenceProvider persistenceManager={localPersistenceManager}>
        {shellProviders}
      </PersistenceProvider>
    );
  }
};
