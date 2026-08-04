import {
  FlexItem,
  FlexLayout,
  SaltProviderNext,
  type Accent,
} from "@salt-ds/core";

import type { RemoteModuleDescriptor } from "../../module-federation/mf-utils";
import { PortalHeader } from "../portal-header/PortalHeader";
import { PortalNav } from "../portal-nav/PortalNav";

import "./PortalShell.css";
import { Route, Routes } from "react-router-dom";
import { Feature } from "@vuu-ui/vuu-shell";

const classBase = "vuuPortalShell";

const accentPurple = "purple" as Accent;

export interface PortalShellProps {
  remoteModules: RemoteModuleDescriptor[];
}

export const PortalShell = ({ remoteModules }: PortalShellProps) => {
  return (
    <SaltProviderNext
      accent={accentPurple}
      corner="rounded"
      density="high"
      mode="light"
      theme="vuu-theme"
    >
      <FlexLayout className={classBase}>
        <FlexItem className={`${classBase}-leftPanel`}>
          <FlexLayout className={`${classBase}-leftPanel`} direction="column">
            <FlexItem className={`${classBase}-logo`}>
              <div className={`${classBase}-logo`} />
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
    </SaltProviderNext>
  );
};
