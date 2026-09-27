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

export interface CommonShellProps {
  accent?: Accent;
  corner?: Corner;
  DataSourceProvider?: ComponentType<{ children: ReactNode }>;
  density?: Density;
  mode?: Mode;
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
  theme = "vuu-theme",
}: CommonShellProps & { children: ReactNode }) => (
  <SaltProviderNext
    accent={accent}
    corner={corner}
    density={density}
    mode={mode}
    theme={theme}
  >
    <ModalProvider>
      <DataSourceProvider>{children}</DataSourceProvider>
    </ModalProvider>
  </SaltProviderNext>
);
