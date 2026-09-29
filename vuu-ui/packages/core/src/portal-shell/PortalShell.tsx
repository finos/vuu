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
import { RemoteModule } from "../remote-module/RemoteModule";
import {
  CommonShell,
  type CommonShellProps,
} from "../common-shell/CommonShell";
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
    <CommonShell
      {...providerProps}
      portalId={portalId}
      remoteModules={remoteModules}
    >
      <div className={classBase} id={id}>
        {portalChromeElements}
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
