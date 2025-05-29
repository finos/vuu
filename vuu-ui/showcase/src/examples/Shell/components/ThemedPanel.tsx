import { ThemeSwitch } from "@vuu-ui/vuu-shell";
import { ThemeMode, ThemeProvider } from "@vuu-ui/vuu-utils";
import cx from "clsx";
import {
  HTMLAttributes,
  MouseEventHandler,
  useCallback,
  useState,
} from "react";

import { useContextMenu } from "@vuu-ui/vuu-popups";
import { Button } from "@salt-ds/core";
import "./ThemedPanel.css";

const classBase = "vuuThemedPanel";

export interface ThemedPanelProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
}

export const ThemedPanel = ({ children, className }: ThemedPanelProps) => {
  const [showContextMenu] = useContextMenu();

  const [mode, setMode] = useState<ThemeMode | undefined>(undefined);

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
      <ThemeProvider themeMode={mode}>
        <div className={`${classBase}-content`}>
          <div
            className={`${classBase}-content-menu`}
            onContextMenu={handleContextMenu}
          />
          <div className={`${classBase}-content-main`}>{children}</div>
        </div>
      </ThemeProvider>
    </div>
  );
};
