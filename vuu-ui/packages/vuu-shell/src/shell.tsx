import {
  GridLayout,
  GridLayoutItem,
  GridLayoutProvider,
} from "@heswell/grid-layout";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { useAuthenticatedUser } from "@vuu-ui/core";
import { ContextMenuProvider } from "@vuu-ui/vuu-context-menu";
import { useLostConnection } from "@vuu-ui/vuu-data-react";
import { NotificationsProvider } from "@vuu-ui/vuu-notifications";
import {
  ContextPanelProvider,
  ModalProvider,
  type ShowContextPanel,
} from "@vuu-ui/vuu-ui-controls";
import { VuuShellLocation } from "@vuu-ui/vuu-utils";
import cx from "clsx";
import {
  createContext,
  useCallback,
  isValidElement,
  useContext,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { AppHeader } from "./app-header";
import { ApplicationProvider } from "./application-provider";
import { LeftNav } from "./left-nav";
import {
  ContextPanel,
  SidePanel,
  type ShellLayoutProps,
} from "./shell-layout-templates";
import {
  WorkspaceHost,
  WorkspaceProvider,
  createWorkspaceComponentRegistries,
  shellWorkspaceComponentRegistrations,
  useWorkspaceContextMenuItems,
  useWorkspace,
  type WorkspaceProps,
} from "./workspace-management";
import shellCss from "./shell.css";

export interface ShellProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  readonly appHeader?: ReactNode;
  readonly children?: ReactNode;
  readonly leftNavWidth?: number;
  readonly logout?: () => void;
  readonly saveUrl?: string;
  readonly serverUrl?: string;
  /** @deprecated The shell now uses one canonical static GridLayout structure. */
  readonly shellLayoutProps?: ShellLayoutProps;
  readonly workspaceProps?: WorkspaceProps;
}

const defaultAppHeader = <AppHeader />;
const defaultRegistries = createWorkspaceComponentRegistries(
  shellWorkspaceComponentRegistrations,
);
type ShellContextPanelState = {
  readonly content: ReactElement;
  readonly title: string;
};
const ShellContextPanelStateContext = createContext<
  ShellContextPanelState | undefined
>(undefined);

const StaticContextPanel = () => {
  const contextPanel = useContext(ShellContextPanelStateContext);
  return (
    <ContextPanel
      content={contextPanel?.content}
      expanded={contextPanel !== undefined}
      id={VuuShellLocation.ContextPanel}
      overlay
      title={contextPanel?.title}
    />
  );
};

export interface StaticShellLayoutProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  readonly appHeader?: ReactNode;
  readonly leftNavWidth?: number;
  readonly workspaceHost?: ReactNode;
}

export const StaticShellLayout = ({
  appHeader = defaultAppHeader,
  className,
  leftNavWidth: initialLeftNavWidth = 200,
  style,
  workspaceHost = <WorkspaceHost />,
  ...htmlAttributes
}: StaticShellLayoutProps) => {
  const { setApplicationSetting } = useWorkspace();
  const [leftNavWidth, setLeftNavWidth] = useState(initialLeftNavWidth);
  const [contextPanel, setContextPanel] = useState<ShellContextPanelState>();
  const contextPanelTrigger = useRef<HTMLElement | null>(null);
  const handleLeftNavWidthChange = useCallback((width: number) => {
    setLeftNavWidth(width);
  }, []);
  const showContextPanel = useCallback<ShowContextPanel>((content, title) => {
    if (!isValidElement(content)) {
      throw new Error(
        `Context panel component "${content}" must be provided as a React element`,
      );
    }
    contextPanelTrigger.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setContextPanel({ content, title });
  }, []);
  const hideContextPanel = useCallback(() => {
    setContextPanel(undefined);
    void setApplicationSetting("applicationSettings.panelOpen", false).catch(
      () => undefined,
    );
    requestAnimationFrame(() => contextPanelTrigger.current?.focus());
  }, [setApplicationSetting]);

  return (
    <ContextPanelProvider
      hideContextPanel={hideContextPanel}
      showContextPanel={showContextPanel}
    >
      <ShellContextPanelStateContext.Provider value={contextPanel}>
        <GridLayout
          {...htmlAttributes}
          className={cx("vuuShell", "vuuShell-staticGrid", className)}
          colsAndRows={{
            cols: [`${initialLeftNavWidth}px`, "1fr", "0px"],
            rows: ["40px", "1fr"],
          }}
          full-page
          id="vuu-shell-grid"
          style={{
            ...style,
            gridTemplateColumns: `${leftNavWidth}px minmax(0, 1fr) 0px`,
          }}
        >
          <GridLayoutItem
            id="vuu-shell-left-nav"
            style={{ gridArea: "1/1/3/2" }}
          >
            <SidePanel id="vuu-side-panel" sizeOpen={initialLeftNavWidth}>
              <LeftNav
                onWidthChange={handleLeftNavWidthChange}
                sizeExpanded={initialLeftNavWidth}
              />
            </SidePanel>
          </GridLayoutItem>
          <GridLayoutItem id="vuu-shell-header" style={{ gridArea: "1/2/2/3" }}>
            {appHeader}
          </GridLayoutItem>
          <GridLayoutItem
            className="vuuShell-content"
            id="vuu-shell-workspace-host"
            style={{ gridArea: "2/2/3/3" }}
          >
            {workspaceHost}
          </GridLayoutItem>
          <GridLayoutItem
            id="vuu-shell-context-panel-host"
            style={{
              gridArea: "1/3/3/4",
              overflow: "visible",
              position: "relative",
            }}
          >
            <StaticContextPanel />
          </GridLayoutItem>
        </GridLayout>
      </ShellContextPanelStateContext.Provider>
    </ContextPanelProvider>
  );
};

const VuuApplication = ({
  appHeader,
  children,
  htmlAttributes,
  leftNavWidth,
}: Pick<ShellProps, "appHeader" | "children" | "leftNavWidth"> & {
  readonly htmlAttributes: Omit<HTMLAttributes<HTMLDivElement>, "onChange">;
}) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-shell",
    css: shellCss,
    window: targetWindow,
  });
  const { buildMenuOptions, handleMenuAction } = useWorkspaceContextMenuItems();
  useLostConnection();

  return (
    <ContextMenuProvider
      menuActionHandler={handleMenuAction}
      menuBuilder={buildMenuOptions}
    >
      <GridLayoutProvider>
        <StaticShellLayout
          {...htmlAttributes}
          appHeader={appHeader}
          leftNavWidth={leftNavWidth}
        />
      </GridLayoutProvider>
      {children}
    </ContextMenuProvider>
  );
};

export const Shell = ({
  appHeader,
  children,
  leftNavWidth,
  logout,
  saveUrl: _saveUrl,
  serverUrl: _serverUrl,
  shellLayoutProps,
  workspaceProps,
  ...htmlAttributes
}: ShellProps) => {
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
  const resolvedHtmlAttributes = {
    ...htmlAttributes,
    ...shellLayoutProps?.htmlAttributes,
    className: cx(
      htmlAttributes.className,
      shellLayoutProps?.htmlAttributes?.className,
    ),
    style: {
      ...htmlAttributes.style,
      ...shellLayoutProps?.htmlAttributes?.style,
    },
  };

  return (
    <ApplicationProvider density="high" logout={logout} theme="vuu-theme">
      <ModalProvider>
        <NotificationsProvider>
          <WorkspaceProvider {...resolvedWorkspaceProps} userId={user.userName}>
            <VuuApplication
              appHeader={appHeader ?? shellLayoutProps?.appHeader}
              htmlAttributes={resolvedHtmlAttributes}
              leftNavWidth={
                leftNavWidth ?? shellLayoutProps?.SidePanelProps?.sizeOpen
              }
            >
              {children}
            </VuuApplication>
          </WorkspaceProvider>
        </NotificationsProvider>
      </ModalProvider>
    </ApplicationProvider>
  );
};
