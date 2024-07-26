import { connectToServer } from "@finos/vuu-data-remote";
import type { LayoutChangeHandler, StackProps } from "@finos/vuu-layout";
import { LayoutProvider, StackLayout } from "@finos/vuu-layout";
import {
  ContextMenuProvider,
  DialogProvider,
  NotificationsProvider,
} from "@finos/vuu-popups";
import { VuuUser, logger, registerComponent } from "@finos/vuu-utils";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import {
  HTMLAttributes,
  ReactNode,
  useCallback,
  useMemo,
  useState,
} from "react";
import { AppHeader } from "./app-header";
import { ApplicationProvider } from "./application-provider";
import {
  LayoutManagementProvider,
  LayoutManagementProviderProps,
  useLayoutContextMenuItems,
  useLayoutManager,
} from "./layout-management";
import { loadingJSON } from "./layout-management/defaultWorkspaceJSON";
import {
  IPersistenceManager,
  LocalPersistenceManager,
  PersistenceProvider,
  usePersistenceManager,
} from "./persistence-manager";
import { ShellLayoutProps, useShellLayout } from "./shell-layout-templates";
import { UserSettingsPanel } from "./user-settings";

import shellCss from "./shell.css";
import { StackLayoutProps } from "@salt-ds/core";

registerComponent("ApplicationSettings", UserSettingsPanel, "view");

if (process.env.NODE_ENV === "production") {
  // StackLayout is loaded just to force component registration, we know it will be
  // required when default layout is instantiated. This is only required in prod
  // to avoif tree shaking the Stack away. Causes a runtime issue in dev.
  if (typeof StackLayout !== "function") {
    console.warn(
      "StackLayout module not loaded, will be unsbale to deserialize from layout JSON"
    );
  }
}

const { error } = logger("Shell");

export type LayoutTemplateName = "full-height" | "inlay";

export type ContentLayoutProps = Pick<
  LayoutManagementProviderProps,
  "layoutJSON" | "workspaceJSON" | "WorkspaceProps"
>;

export interface ShellProps extends HTMLAttributes<HTMLDivElement> {
  ContentLayoutProps?: ContentLayoutProps;
  ShellLayoutProps?: ShellLayoutProps;
  children?: ReactNode;
  loginUrl?: string;
  saveUrl?: string;
  serverUrl?: string;
  user: VuuUser;
}

const getAppHeader = (shellLayoutProps?: ShellLayoutProps, loginUrl?: string) =>
  shellLayoutProps?.appHeader ?? <AppHeader loginUrl={loginUrl} />;

const defaultHTMLAttributes: HTMLAttributes<HTMLDivElement> = {
  className: "vuuShell",
  style: {
    height: "100%",
    width: "100%",
  },
};

const getHTMLAttributes = (props?: ShellLayoutProps) => {
  if (props?.htmlAttributes) {
    return {
      ...defaultHTMLAttributes,
      ...props.htmlAttributes,
      style: {
        ...defaultHTMLAttributes.style,
        ...props.htmlAttributes.style,
      },
    };
  } else {
    return defaultHTMLAttributes;
  }
};

const VuuApplication = ({
  ShellLayoutProps,
  children,
  loginUrl,
  serverUrl,
  user,
}: Omit<ShellProps, "ContentLayoutProps">) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-shell",
    css: shellCss,
    window: targetWindow,
  });

  const shellLayout = useShellLayout({
    ...ShellLayoutProps,
    appHeader: getAppHeader(ShellLayoutProps, loginUrl),
    htmlAttributes: getHTMLAttributes(ShellLayoutProps),
  });

  const { workspaceJSON, saveApplicationLayout } = useLayoutManager();

  const { buildMenuOptions, handleMenuAction } = useLayoutContextMenuItems();
  const [connectionStatus, setConnectionStatus] = useState<
    "initialising" | "connected" | "rejected"
  >("initialising");

  const handleLayoutChange = useCallback<LayoutChangeHandler>(
    (layout) => {
      try {
        saveApplicationLayout(layout);
      } catch {
        error?.("Failed to save layout");
      }
    },
    [saveApplicationLayout]
  );

  useMemo(async () => {
    if (serverUrl && user.token) {
      const connectionStatus = await connectToServer({
        authToken: user.token,
        url: serverUrl,
        username: user.username,
      });
      setConnectionStatus(connectionStatus);
    } else {
      console.warn(
        `Shell: serverUrl: '${serverUrl}', token: '${Array(user.token.length)
          .fill("#")
          .join("")}'  
        `
      );
    }
  }, [serverUrl, user.token, user.username]);

  const isLayoutLoading = workspaceJSON === loadingJSON;

  if (connectionStatus === "rejected") {
    console.log("game over, no connection to server");
  }

  return isLayoutLoading ? null : (
    <ContextMenuProvider
      menuActionHandler={handleMenuAction}
      menuBuilder={buildMenuOptions}
    >
      <LayoutProvider
        workspaceJSON={workspaceJSON}
        onLayoutChange={handleLayoutChange}
      >
        {shellLayout}
      </LayoutProvider>
      {children}
    </ContextMenuProvider>
  );
};

export const Shell = ({ ContentLayoutProps, user, ...props }: ShellProps) => {
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
      `No Persistence Manager, configuration data will be persisted to Local Storage, key: 'vuu/${user.username}'`
    );
    return new LocalPersistenceManager(`vuu/${user.username}`);
  }, [persistenceManager, user.username]);

  // ApplicationProvider must go outside Dialog and Notification providers
  // ApplicationProvider injects the SaltProvider and this must be the root
  // SaltProvider.

  const shellProviders = (
    <ApplicationProvider density="high" theme="vuu-theme" user={user}>
      <LayoutManagementProvider {...ContentLayoutProps}>
        <DialogProvider>
          <NotificationsProvider>
            <VuuApplication {...props} user={user} />
          </NotificationsProvider>
        </DialogProvider>
      </LayoutManagementProvider>
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
