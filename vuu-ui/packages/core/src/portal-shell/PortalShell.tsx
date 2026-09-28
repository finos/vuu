import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { createContext, type ReactNode, useContext, useMemo } from "react";
import {
  createBrowserRouter,
  Route,
  RouterProvider,
  Routes,
} from "react-router-dom";
import type { RemoteModuleDescriptor } from "../RemoteModuleDescriptor";
import { PortalNavPanel } from "../portal-nav-panel/PortalNavPanel";
import { PortalModuleRegistryProvider } from "../portal-module-registry/PortalModuleRegistry";
import { RemoteModule } from "../remote-module/RemoteModule";
import {
  CommonShell,
  type CommonShellProps,
} from "../common-shell/CommonShell";
import { WindowHost } from "../window-host/WindowHost";
import { WINDOW_HOST_ROUTE } from "../window-host/window-host-routing";

import portalShellCss from "./PortalShell.css";

const classBase = "vuuPortalShell";

const getRemoteRoutePath = (path: string) =>
  path.endsWith("*") ? path : `${path}/*`;

export interface PortalShellProps extends CommonShellProps {
  children?: ReactNode;
  id?: string;
  remoteModules: RemoteModuleDescriptor[];
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
    DataSourceProvider,
    id,
    persistence,
    portalId = id,
  } = usePortalShellProps();
  return (
    <WindowHost
      DataSourceProvider={DataSourceProvider}
      persistence={persistence}
      portalId={portalId}
    />
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

const PortalLayout = () => {
  const {
    children,
    id,
    portalId = id,
    remoteModules,
    title: _title,
    ...providerProps
  } = usePortalShellProps();
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-portal-shell",
    css: portalShellCss,
    window: targetWindow,
  });

  return (
    <CommonShell
      {...providerProps}
      portalId={portalId}
      remoteModules={remoteModules}
    >
      <div className={classBase} id={id}>
        {children}
        <div className={`${classBase}-content`}>
          <Routes>
            <Route
              path="/"
              element={<PortalNavPanel remoteModules={remoteModules} />}
            />
            {remoteModules.map(({ id, path, ...feature }) => {
              return (
                <Route
                  key={id}
                  path={getRemoteRoutePath(path)}
                  element={
                    <PortalModuleRegistryProvider remoteModules={remoteModules}>
                      <RemoteModule {...feature} />
                    </PortalModuleRegistryProvider>
                  }
                />
              );
            })}
          </Routes>
        </div>
      </div>
    </CommonShell>
  );
};
