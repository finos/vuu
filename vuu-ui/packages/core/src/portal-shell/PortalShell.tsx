import {
  FlexItem,
  FlexLayout,
  SaltProviderNext,
  type Accent,
  type Corner,
  type Density,
  type Mode,
  type ThemeName,
} from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { VuuLogo } from "@vuu-ui/vuu-icons";
import { VuuDataSourceProvider } from "@vuu-ui/vuu-data-react";
import type { ComponentType, ReactNode } from "react";
import { Route, Routes } from "react-router-dom";
import type { RemoteModuleDescriptor } from "../RemoteModuleDescriptor";
import { ModalProvider } from "../modal-provider/ModalProvider";
import { PortalModuleRegistryProvider } from "../portal-module-registry/PortalModuleRegistry";
import { PortalHeader } from "../portal-header/PortalHeader";
import { PortalNav } from "../portal-nav/PortalNav";
import { RemoteModule } from "../remote-module/RemoteModule";

import portalShellCss from "./PortalShell.css";

const classBase = "vuuPortalShell";

const accentPurple = "purple" as Accent;

const getRemoteRoutePath = (path: string) =>
  path.endsWith("*") ? path : `${path}/*`;

export interface PortalShellProps {
  accent?: Accent;
  corner?: Corner;
  DataSourceProvider?: ComponentType<{ children: ReactNode }>;
  density?: Density;
  id?: string;
  mode?: Mode;
  remoteModules: RemoteModuleDescriptor[];
  theme?: ThemeName;
  title: string;
}

export const PortalShell = ({
  accent = accentPurple,
  corner = "rounded",
  DataSourceProvider = VuuDataSourceProvider,
  density = "medium",
  id,
  mode = "light",
  remoteModules,
  theme = "vuu-theme",
  title,
}: PortalShellProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-portal-shell",
    css: portalShellCss,
    window: targetWindow,
  });

  return (
    <SaltProviderNext
      accent={accent}
      corner={corner}
      density={density}
      mode={mode}
      theme={theme}
    >
      <ModalProvider>
        <DataSourceProvider>
          <FlexLayout className={classBase} id={id}>
            <FlexItem className={`${classBase}-leftPanel`}>
              <FlexLayout
                className={`${classBase}-leftPanel`}
                direction="column"
              >
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
                          <div
                            style={{ background: "black", height: "100%" }}
                          />
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
        </DataSourceProvider>
      </ModalProvider>
    </SaltProviderNext>
  );
};
