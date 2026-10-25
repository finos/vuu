import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import clsx from "clsx";
import {
  Children,
  createContext,
  isValidElement,
  type ReactElement,
  type CSSProperties,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createBrowserRouter,
  Route,
  RouterProvider,
  Routes,
  useLocation,
} from "react-router-dom";
import { partition } from "@vuu-ui/vuu-utils";
import {
  isRoutedModule,
  type RemoteModuleDescriptor,
} from "../RemoteModuleDescriptor";
import { PortalModuleRegistryProvider } from "../portal-module-registry/PortalModuleRegistry";
import { PortalLinkProvider } from "../portal-link/PortalLink";
import { RemoteModule } from "../remote-module/RemoteModule";
import {
  CommonShell,
  type CommonShellProps,
} from "../common-shell/CommonShell";
import type { ServerMonitorOptions } from "../connection-management/server-status";
import {
  type ContextPanelSlotPlacement,
  useContextPanelSlot,
} from "../context-panel/ContextPanelSlot";
import {
  ShellContextPanel,
  ShellContextPanelProvider,
} from "../context-panel/ShellContextPanel";
import { ManualVuuServersProvider } from "../portal-servers/ManualVuuServers";
import { VuuTableChangeServerDialog } from "../portal-servers/VuuTableChangeServerDialog";
import {
  useOpenModuleId,
  useTrackOpenModule,
  VuuServerMonitorProvider,
} from "../server-monitor/VuuServerMonitorProvider";
import type { PortalNotificationsOptions } from "../notifications/notification-types";
import { NotificationsPanel } from "../notifications/NotificationsPanel";
import { PortalNotificationBanners } from "../notifications/PortalNotificationBanners";
import { PortalModuleIdContext } from "../notifications/PortalNotificationsContext";
import { PortalNotificationsProvider } from "../notifications/PortalNotificationsProvider";
import { PortalWorkspace } from "../portal-workspaces/PortalWorkspace";
import {
  type PortalWorkspacesOptions,
  PortalWorkspacesProvider,
} from "../portal-workspaces/PortalWorkspacesProvider";
import { WORKSPACE_ROUTE_PATTERN } from "../portal-workspaces/workspace-routing";
import { WindowHost } from "../window-host/WindowHost";
import { WINDOW_HOST_ROUTE } from "../window-host/window-host-routing";
import {
  PortalLandingPage,
  type PortalLandingPageProps,
} from "./PortalLandingPage";
import {
  PortalShellNavContext,
  type PortalShellNavContextValue,
} from "./PortalShellNavContext";

import portalShellCss from "./PortalShell.css";

const classBase = "vuuPortalShell";

const getRemoteRoutePath = (path: string) =>
  path.endsWith("*") ? path : `${path}/*`;

const isPortalLandingPage = (
  child: ReactNode,
): child is ReactElement<PortalLandingPageProps> =>
  isValidElement<PortalLandingPageProps>(child) &&
  child.type === PortalLandingPage;

export interface PortalShellContextPanelOptions {
  /**
   * How the shell's context panel is displayed for content that doesn't ask
   * for a placement when it claims the panel, including module context
   * panels. `"overlay"` (the default) slides out over the content;
   * `"inline"` takes its own column and the content shrinks.
   */
  placement?: ContextPanelSlotPlacement;
}

export interface PortalShellProps extends CommonShellProps {
  children?: ReactNode;
  /** Options for the shell's context panel. */
  contextPanel?: PortalShellContextPanelOptions;
  /**
   * Whether the layout has a header row for a `PortalHeader`. `false`
   * removes the row so the navigation and content take the full height.
   * Defaults to `true`.
   */
  header?: boolean;
  id?: string;
  /**
   * Width of the navigation column, a number of pixels or a CSS length.
   * Sets `--vuuPortalShell-navWidth`, which defaults to `56px`. Changes
   * animate over `--vuuPortalShell-navTransitionDuration` (default `0s`).
   * A `PortalNav` child sizes the column to its display mode, unless this
   * is set.
   */
  navWidth?: number | string;
  /**
   * Notifications from the applications' servers, shown as badges in the
   * navigation. `false` disables them.
   */
  notifications?: PortalNotificationsOptions | false;
  remoteModules: RemoteModuleDescriptor[];
  /**
   * Monitoring of the application servers in the navigation. `false` stops
   * connections being opened for applications that are not open.
   */
  serverMonitor?: ServerMonitorOptions | false;
  title: string;
  /**
   * Named workspaces: a `PortalNav` child lists them, and the
   * `/workspaces/:workspaceId` route renders them. Off when not set.
   */
  workspaces?: PortalWorkspacesOptions;
}

const PortalShellContext = createContext<PortalShellProps | undefined>(
  undefined,
);

const usePortalShellProps = () => {
  const props = useContext(PortalShellContext);
  if (!props) {
    throw new Error("Portal shell routes must be rendered within PortalShell");
  }
  return props;
};

const PortalWindowRoute = () => {
  const {
    accent,
    corner,
    DataSourceProvider,
    density,
    id,
    mode,
    notifications,
    persistence,
    portalId = id,
    theme,
  } = usePortalShellProps();
  return (
    <WindowHost
      accent={accent}
      corner={corner}
      DataSourceProvider={DataSourceProvider}
      density={density}
      mode={mode}
      notifications={notifications}
      persistence={persistence}
      portalId={portalId}
      theme={theme}
    />
  );
};

const OpenModuleTracker = ({
  remoteModules,
}: Pick<PortalShellProps, "remoteModules">) => {
  useTrackOpenModule(remoteModules);
  return null;
};

/**
 * Content in the context panel belongs to the route that opened it, unless
 * its owner keeps it open across navigation (e.g. the Panels palette, which
 * stays open between workspaces).
 */
export const CloseContextPanelOnNavigation = () => {
  const { pathname } = useLocation();
  const closeContextPanel = useContextPanelSlot()?.closeOnNavigation;
  useEffect(() => {
    closeContextPanel?.();
  }, [closeContextPanel, pathname]);
  return null;
};

const OptionalWorkspaces = ({
  children,
  options,
  portalId,
}: {
  children: ReactNode;
  options?: PortalWorkspacesOptions;
  portalId?: string;
}) =>
  options ? (
    <PortalWorkspacesProvider options={options} portalId={portalId}>
      {children}
    </PortalWorkspacesProvider>
  ) : (
    children
  );

const PortalLayout = () => {
  const {
    children,
    contextPanel,
    header = true,
    id,
    navWidth,
    notifications,
    portalId = id,
    remoteModules,
    serverMonitor,
    title: _title,
    workspaces,
    ...providerProps
  } = usePortalShellProps();
  const targetWindow = useWindow();
  const openModuleId = useOpenModuleId(remoteModules);
  // Width requested by a PortalNav child; the navWidth prop takes precedence.
  const [managedNavWidth, setNavWidth] = useState<string | undefined>();
  const navContext = useMemo<PortalShellNavContextValue>(
    () => ({ setNavWidth }),
    [],
  );
  const columnWidth =
    navWidth === undefined
      ? managedNavWidth
      : typeof navWidth === "number"
        ? `${navWidth}px`
        : navWidth;
  const [
    [landingPage = <PortalLandingPage />, ...unexpectedLandingPages],
    portalChromeElements,
  ] = partition(Children.toArray(children), isPortalLandingPage);

  if (unexpectedLandingPages.length > 0) {
    throw new Error("PortalShell accepts only one <PortalLandingPage> child");
  }

  useComponentCssInjection({
    testId: "vuu-portal-shell",
    css: portalShellCss,
    window: targetWindow,
  });

  return (
    <VuuServerMonitorProvider options={serverMonitor}>
      <CommonShell
        {...providerProps}
        portalId={portalId}
        remoteModules={remoteModules}
      >
        <OpenModuleTracker remoteModules={remoteModules} />
        <ManualVuuServersProvider>
          <PortalNotificationsProvider
            openModuleId={openModuleId}
            options={notifications}
            portalId={portalId}
          >
            <OptionalWorkspaces options={workspaces} portalId={portalId}>
              <ShellContextPanelProvider
                defaultPlacement={contextPanel?.placement}
              >
                <CloseContextPanelOnNavigation />
                {workspaces ? <VuuTableChangeServerDialog /> : null}
                <div
                  className={clsx(classBase, {
                    [`${classBase}-noHeader`]: !header,
                    [`${classBase}-managedNav`]:
                      navWidth === undefined && managedNavWidth !== undefined,
                  })}
                  id={id}
                  style={
                    columnWidth === undefined
                      ? undefined
                      : ({
                          "--vuuPortalShell-navWidth": columnWidth,
                        } as CSSProperties)
                  }
                >
                  <PortalShellNavContext.Provider value={navContext}>
                    {portalChromeElements}
                  </PortalShellNavContext.Provider>
                  <div className={`${classBase}-banners`}>
                    <PortalNotificationBanners />
                  </div>
                  <div className={`${classBase}-content`}>
                    <Routes>
                      <Route path="/" element={landingPage} />
                      <Route path="*" element={landingPage} />
                      {workspaces ? (
                        <Route
                          path={WORKSPACE_ROUTE_PATTERN}
                          element={
                            <PortalWorkspace
                              emptyContent={workspaces.emptyContent}
                              headerActions={workspaces.headerActions}
                              paletteProps={workspaces.palette}
                            />
                          }
                        />
                      ) : null}
                      {remoteModules
                        .filter(isRoutedModule)
                        .map(({ id, path, ...feature }) => {
                          return (
                            <Route
                              key={id}
                              path={getRemoteRoutePath(path)}
                              element={
                                <PortalModuleIdContext.Provider value={id}>
                                  <PortalLinkProvider modulePath={path}>
                                    <PortalModuleRegistryProvider
                                      remoteModules={remoteModules}
                                    >
                                      <RemoteModule {...feature} />
                                    </PortalModuleRegistryProvider>
                                  </PortalLinkProvider>
                                </PortalModuleIdContext.Provider>
                              }
                            />
                          );
                        })}
                    </Routes>
                  </div>
                  <ShellContextPanel className={`${classBase}-context`} />
                  <NotificationsPanel />
                </div>
              </ShellContextPanelProvider>
            </OptionalWorkspaces>
          </PortalNotificationsProvider>
        </ManualVuuServersProvider>
      </CommonShell>
    </VuuServerMonitorProvider>
  );
};

export const PortalShell = (props: PortalShellProps) => {
  const router = useMemo(
    () =>
      createBrowserRouter([
        {
          path: WINDOW_HOST_ROUTE,
          element: <PortalWindowRoute />,
        },
        {
          path: "*",
          element: <PortalLayout />,
        },
      ]),
    [],
  );

  return (
    <PortalShellContext.Provider value={props}>
      <RouterProvider router={router} />
    </PortalShellContext.Provider>
  );
};
