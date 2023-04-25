import {
  HTMLAttributes,
  MouseEventHandler,
  useCallback,
  useState,
} from "react";
import cx from "classnames";
import { ThemeMode, ThemeSwitch } from "@finos/vuu-shell";

import "./ThemedPanel.css";
import { useContextMenu } from "@finos/vuu-popups";
import { Button } from "@salt-ds/core";

const classBase = "vuuThemedPanel";

export interface ThemedPanelProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
}

export const ThemedPanel = ({ children, className }: ThemedPanelProps) => {
  const showContextMenu = useContextMenu();

  const [mode, setMode] = useState<string | undefined>(undefined);

  const handleContextMenu: MouseEventHandler<HTMLDivElement> = (e) => {
    console.log(`ComponentWithMenu<${location}> handleContextMenu`);
    showContextMenu(e, "*", {});
  };

  const switchTheme = useCallback((mode: ThemeMode) => {
    setMode(mode);
  }, []);

  const clearTheme = useCallback(() => {
    setMode(undefined);
  }, []);

  return (
    <div className={cx(classBase, className)}>
      <div className={`${classBase}-toolbar`}>
        <ThemeSwitch onChange={switchTheme} />
        <Button onClick={clearTheme}>clear theme</Button>
      </div>
      <div className={`${classBase}-content salt-theme`} data-mode={mode}>
        <div
          className={`${classBase}-content-menu`}
          onContextMenu={handleContextMenu}
        />
        <div className={`${classBase}-content-main`}>{children}</div>
      </div>
    </div>
  );
};
