import type { Density, Mode } from "@salt-ds/core";
import {
  AuthenticationProvider,
  type ContextPanelPlacement,
  type PortalModuleRegistry,
  type RemoteModuleDescriptor,
} from "@vuu-ui/core";
import {
  NavContainer,
  PortalHeader,
  PortalLogo,
  PortalShell,
} from "@vuu-ui/core/portal";
import { VuuLogo } from "@vuu-ui/vuu-icons";
import type { ComponentType, ReactNode } from "react";
import { useMemo } from "react";
import type { ComponentDescriptor } from "./shared-utils";

export const SHOWCASE_REMOTE_NAME = "showcase_examples";
export const SHOWCASE_REMOTE_URL = "/showcase-examples";

const asContextPanelPlacement = (
  value: string | undefined,
): ContextPanelPlacement | undefined =>
  value === "module" || value === "shell" ? value : undefined;

/**
 * Describes a showcase example as a remote module of the showcase remote.
 * The route is the example's own path, so the module is open on load.
 */
export const getExampleModuleDescriptor = (
  { attributes = {}, componentName, moduleName }: ComponentDescriptor,
  path: string,
): RemoteModuleDescriptor => ({
  accessRole: "",
  clientIdentifier: `showcase-${moduleName}/${componentName}`,
  contextPanelPlacement: asContextPanelPlacement(
    attributes.contextPanelPlacement,
  ),
  description: componentName,
  id: path,
  mfComponent: moduleName,
  mfExport: componentName,
  mfScope: SHOWCASE_REMOTE_NAME,
  mfUrl: SHOWCASE_REMOTE_URL,
  name: componentName,
  navLocation: `/${componentName}`,
  path,
  title: attributes.title ?? componentName,
  version: 1,
});

export interface ShowcasePortalHostProps {
  DataSourceProvider: ComponentType<{ children: ReactNode }>;
  density: Density;
  descriptor: ComponentDescriptor;
  mode: Mode;
  path: string;
  theme: string;
}

/**
 * Hosts an example the way a portal hosts an application: PortalShell loads
 * it from the showcase remote with RemoteModule, so it receives the portal's
 * services (context panel, modals, notifications, saved state).
 */
export const ShowcasePortalHost = ({
  DataSourceProvider,
  density,
  descriptor,
  mode,
  path,
  theme,
}: ShowcasePortalHostProps) => {
  const registry = useMemo<PortalModuleRegistry>(
    () => ({ modules: [getExampleModuleDescriptor(descriptor, path)] }),
    [descriptor, path],
  );

  return (
    <AuthenticationProvider mode="local" registry={registry}>
      <PortalShell
        DataSourceProvider={DataSourceProvider}
        density={density}
        id="vuu-showcase-portal"
        mode={mode}
        persistence={false}
        remoteModules={registry.modules}
        theme={theme}
        title="Vuu Showcase"
      >
        <NavContainer>
          <PortalLogo alt="Showcase portal" style={{ gridArea: "logo" }}>
            <VuuLogo size={30} />
          </PortalLogo>
        </NavContainer>
        <PortalHeader />
      </PortalShell>
    </AuthenticationProvider>
  );
};
