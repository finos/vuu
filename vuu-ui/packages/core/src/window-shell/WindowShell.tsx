import { FlexItem, FlexLayout } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import type { ReactNode } from "react";
import { PortalHeader } from "../portal-header/PortalHeader";
import {
  ShellProviders,
  type ShellProviderProps,
} from "../shell-providers/ShellProviders";

import windowShellCss from "./WindowShell.css";

const classBase = "vuuWindowShell";

export interface WindowShellProps extends ShellProviderProps {
  children: ReactNode;
  id?: string;
}

export const WindowShell = ({
  children,
  id,
  ...providerProps
}: WindowShellProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-window-shell",
    css: windowShellCss,
    window: targetWindow,
  });

  return (
    <ShellProviders {...providerProps}>
      <FlexLayout className={classBase} direction="column" id={id}>
        <FlexItem className={`${classBase}-header`}>
          <PortalHeader />
        </FlexItem>
        <FlexItem className={`${classBase}-content`}>
          <div className={`${classBase}-content`}>{children}</div>
        </FlexItem>
      </FlexLayout>
    </ShellProviders>
  );
};
