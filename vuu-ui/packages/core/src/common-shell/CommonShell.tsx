import {
  SaltProviderNext,
  type Accent,
  type Corner,
  type Density,
  type Mode,
  type ThemeName,
} from "@salt-ds/core";
import { VuuDataSourceProvider } from "@vuu-ui/vuu-data-react";
import type { ComponentType, ReactNode } from "react";
import { ModalProvider } from "../modal-provider/ModalProvider";
import type { RemoteModuleDescriptor } from "../RemoteModuleDescriptor";
import { SavedStateProvider } from "../saved-state/SavedStateProvider";
import {
  PortalPersistenceRoot,
  type PortalPersistenceProps,
} from "./PortalPersistenceRoot";

export interface CommonShellProps extends PortalPersistenceProps {
  accent?: Accent;
  corner?: Corner;
  DataSourceProvider?: ComponentType<{ children: ReactNode }>;
  density?: Density;
  mode?: Mode;
  /** Registered modules, for the Saved state dialog's titles and order. */
  remoteModules?: RemoteModuleDescriptor[];
  theme?: ThemeName;
}

const accentPurple = "purple" as Accent;

export const CommonShell = ({
  accent = accentPurple,
  children,
  corner = "rounded",
  DataSourceProvider = VuuDataSourceProvider,
  density = "medium",
  mode = "light",
  persistence,
  portalId,
  remoteModules,
  theme = "vuu-theme",
}: CommonShellProps & { children: ReactNode }) => (
  <SaltProviderNext
    accent={accent}
    corner={corner}
    density={density}
    mode={mode}
    theme={theme}
  >
    <PortalPersistenceRoot persistence={persistence} portalId={portalId}>
      <SavedStateProvider remoteModules={remoteModules}>
        <ModalProvider>
          <DataSourceProvider>{children}</DataSourceProvider>
        </ModalProvider>
      </SavedStateProvider>
    </PortalPersistenceRoot>
  </SaltProviderNext>
);
