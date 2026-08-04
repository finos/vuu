import {
  FlexItem,
  FlexLayout,
  SaltProviderNext,
  type Accent,
} from "@salt-ds/core";
import { VuuLogo } from "@vuu-ui/vuu-icons";

import type { RemoteModuleDescriptor } from "../../module-federation/mf-utils";
import { PortalHeader } from "../portal-header/PortalHeader";
import { PortalNav } from "../portal-nav/PortalNav";

import "./PortalShell.css";
import { Route, Routes } from "react-router-dom";
import { Feature } from "@vuu-ui/vuu-shell";
import { VuuDataSourceProvider } from "@vuu-ui/vuu-data-react";

const classBase = "vuuPortalShell";

const accentPurple = "purple" as Accent;

export interface PortalShellProps {
  id?: string;
  remoteModules: RemoteModuleDescriptor[];
  title: string;
}

export const PortalShell = ({ id, remoteModules, title }: PortalShellProps) => {
  console.log({ remoteModules })
  return (
    <SaltProviderNext
      accent={accentPurple}
      corner="rounded"
      density="medium"
      mode="light"
      theme="vuu-theme"
    >
      <VuuDataSourceProvider>
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
                    {remoteModules.map(({ id, path, ...feature }) => (
                      <Route
                        key={id}
                        path={path}
                        element={<Feature {...feature} />}
                      />
                    ))}
                  </Routes>
                </div>
              </FlexItem>
            </FlexLayout>
          </FlexItem>
        </FlexLayout>
      </VuuDataSourceProvider>
    </SaltProviderNext>
  );
};
