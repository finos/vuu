import type { ReactNode } from "react";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import navContainerCss from "./NavContainer.css";

export interface NavContainerProps {
  children: ReactNode;
}

const classBase = "vuuNavContainer";

export const NavContainer = ({ children }: NavContainerProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-portal-shell",
    css: navContainerCss,
    window: targetWindow,
  });

  return <div className={classBase}>{children}</div>;
};
