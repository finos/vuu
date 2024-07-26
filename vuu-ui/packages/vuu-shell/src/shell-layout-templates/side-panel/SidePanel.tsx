import { CSSProperties, HTMLAttributes, useMemo } from "react";
import cx from "clsx";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import sidePanelCss from "./SidePanel.css";
// import { useLayoutManager } from "../../layout-management";

const classBase = "vuuShellSidePanel";

export interface SidePanelProps extends HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  path?: string;
  sizeOpen?: number;
  sizeClosed?: number;
}

export const SidePanel = ({
  children,
  open = true,
  sizeClosed = 90,
  sizeOpen = 200,
  style: styleProp,
  ...htmlAttributes
}: SidePanelProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-side-panel",
    css: sidePanelCss,
    window: targetWindow,
  });

  //   const { applicationJson, saveApplicationSettings } = useLayoutManager();
  //   console.log(`settings`, {
  //     expanded: applicationJson?.settings?.leftNav?.expanded,
  //     active: applicationJson?.settings?.leftNav?.activeTabIndex,
  //   });

  const style = useMemo(
    () =>
      ({
        ...styleProp,
        "--shell-left-nav-size": open ? `${sizeOpen}px` : `${sizeClosed}px`,
      } as CSSProperties),
    [open, sizeClosed, sizeOpen, styleProp]
  );
  return (
    <div {...htmlAttributes} className={cx(classBase)} style={style}>
      {children}
    </div>
  );
};
