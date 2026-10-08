import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import {
  Children,
  createContext,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useContext,
  useMemo,
} from "react";
import {
  createBrowserRouter,
  Route,
  RouterProvider,
  Routes,
} from "react-router-dom";
import { partition } from "@vuu-ui/vuu-utils";
import type { RemoteModuleDescriptor } from "../RemoteModuleDescriptor";
import { PortalModuleRegistryProvider } from "../portal-module-registry/PortalModuleRegistry";
import { PortalLinkProvider } from "../portal-link/PortalLink";
import { RemoteModule } from "../remote-module/RemoteModule";
import {
  CommonShell,
  type CommonShellProps,
} from "../common-shell/CommonShell";
import type { ServerMonitorOptions } from "../connection-management/server-status";
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
import { WindowHost } from "../window-host/WindowHost";
import { WINDOW_HOST_ROUTE } from "../window-host/window-host-routing";
import {
  PortalLandingPage,
  type PortalLandingPageProps,
} from "./PortalLandingPage";

import portalShellCss from "./PortalShell.css";

const classBase = "vuuPortalShell";

const getRemoteRoutePath = (path: string) =>
  path.endsWith("*") ? path : `${path}/*`;

const isPortalLandingPage = (
  child: ReactNode,
): child is ReactElement<PortalLandingPageProps> =>
  isValidElement<PortalLandingPageProps>(child) &&
  child.type === PortalLandingPage;

export interface PortalShellProps extends CommonShellProps {
  children?: ReactNode;
  id?: string;
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

const PortalLayout = () => {
  const {
    children,
    id,
    notifications,
    portalId = id,
    remoteModules,
    serverMonitor,
    title: _title,
    ...providerProps
  } = usePortalShellProps();
  const targetWindow = useWindow();
  const openModuleId = useOpenModuleId(remoteModules);
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
        <PortalNotificationsProvider
          openModuleId={openModuleId}
          options={notifications}
          portalId={portalId}
        >
          <div className={classBase} id={id}>
            {portalChromeElements}
            <div className={`${classBase}-banners`}>
              <PortalNotificationBanners />
            </div>
            <div className={`${classBase}-content`}>
              <Routes>
                <Route path="/" element={landingPage} />
                <Route path="*" element={landingPage} />
                {remoteModules.map(({ id, path, ...feature }) => {
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
            <NotificationsPanel />
          </div>
        </PortalNotificationsProvider>
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
