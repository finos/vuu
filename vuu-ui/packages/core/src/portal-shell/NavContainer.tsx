import type { ReactNode } from "react";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";

import navContainerCss from "./NavContainer.css";

export type NavContainerMode = "vertical-nav" | "dashboard";
export interface NavContainerProps {
  children: ReactNode;
  className?: string;
  mode?: NavContainerMode;
}

const classBase = "vuuNavContainer";

export const NavContainer = ({
  children,
  className,
  mode = "vertical-nav",
}: NavContainerProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-portal-shell",
    css: navContainerCss,
    window: targetWindow,
  });

  return (
    <div className={cx(classBase, className, `${classBase}-${mode}`)}>
      {children}
    </div>
  );
};
