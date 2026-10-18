import { MenuPanel, type MenuPanelProps } from "@salt-ds/core";
import cx from "clsx";
import { useChromeModeContext } from "./ChromeModeContext";

import "./ChromeMenu.css";

/**
 * A Salt MenuPanel styled with the chrome tokens. Menus render in a portal,
 * outside the shell, so the chrome mode is applied explicitly.
 */
export const ChromeMenuPanel = ({
  className,
  heading,
  children,
  ...props
}: MenuPanelProps & { heading?: string }) => {
  const { chromeMode } = useChromeModeContext();
  return (
    <MenuPanel
      {...props}
      className={cx("ShowcaseChrome", "ShowcaseMenu", className)}
      data-chrome-mode={chromeMode}
    >
      {heading ? <div className="ShowcaseMenu-heading">{heading}</div> : null}
      {children}
    </MenuPanel>
  );
};
