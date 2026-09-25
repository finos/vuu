import { FlexItem, FlexLayout } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { VuuLogo } from "@vuu-ui/vuu-icons";
import { Route, Routes } from "react-router-dom";
import type { RemoteModuleDescriptor } from "../RemoteModuleDescriptor";
import { PortalModuleRegistryProvider } from "../portal-module-registry/PortalModuleRegistry";
import { PortalHeader } from "../portal-header/PortalHeader";
import { PortalNav } from "../portal-nav/PortalNav";
import { RemoteModule } from "../remote-module/RemoteModule";
import {
  ShellProviders,
  type ShellProviderProps,
} from "../shell-providers/ShellProviders";

import portalShellCss from "./PortalShell.css";

const classBase = "vuuPortalShell";

const getRemoteRoutePath = (path: string) =>
  path.endsWith("*") ? path : `${path}/*`;

export interface PortalShellProps extends ShellProviderProps {
  id?: string;
  remoteModules: RemoteModuleDescriptor[];
  title: string;
}

export const PortalShell = ({
  id,
  remoteModules,
  title,
  ...providerProps
}: PortalShellProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-portal-shell",
    css: portalShellCss,
    window: targetWindow,
  });

  return (
    <ShellProviders {...providerProps}>
      <FlexLayout className={classBase} id={id}>
        <FlexItem className={`${classBase}-leftPanel`}>
          <FlexLayout className={`${classBase}-leftPanel`} direction="column">
            <FlexItem className={`${classBase}-leftPanelHeader`}>
              <VuuLogo />
              <h3 className={`${classBase}-leftPanel-title`}>{title}</h3>
            </FlexItem>
            <FlexItem className={`${classBase}-nav`}>
              <PortalNav remoteModules={remoteModules} />
            </FlexItem>
          </FlexLayout>
        </FlexItem>
        <FlexItem className={`${classBase}-main`}>
          <FlexLayout className={`${classBase}-main`} direction="column">
            <FlexItem className={`${classBase}-header`}>
              <PortalHeader />
            </FlexItem>
            <FlexItem className={`${classBase}-content`}>
              <div className={`${classBase}-content`}>
                <Routes>
                  <Route
                    path="/"
                    element={
                      <div style={{ background: "black", height: "100%" }} />
                    }
                  />
                  {remoteModules.map(({ id, path, ...feature }) => {
                    return (
                      <Route
                        key={id}
                        path={getRemoteRoutePath(path)}
                        element={
                          <PortalModuleRegistryProvider
                            remoteModules={remoteModules}
                          >
                            <RemoteModule {...feature} />
                          </PortalModuleRegistryProvider>
                        }
                      />
                    );
                  })}
                </Routes>
              </div>
            </FlexItem>
          </FlexLayout>
        </FlexItem>
      </FlexLayout>
    </ShellProviders>
  );
};
