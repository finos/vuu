import { FlexItem, FlexLayout } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import type { ReactNode } from "react";
import {
  CommonShell,
  type CommonShellProps,
} from "../common-shell/CommonShell";

import windowShellCss from "./WindowShell.css";

const classBase = "vuuWindowShell";

export interface WindowShellProps extends CommonShellProps {
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
    <CommonShell {...providerProps}>
      <FlexLayout className={classBase} direction="column" id={id}>
        <FlexItem className={`${classBase}-content`}>
          <div className={`${classBase}-content`}>{children}</div>
        </FlexItem>
      </FlexLayout>
    </CommonShell>
  );
};
