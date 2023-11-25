import {
  DockLayout,
  DraggableLayout,
  Drawer,
  Flexbox,
  View,
} from "@finos/vuu-layout";

import { MouseEvent, ReactElement, useCallback, useRef, useState } from "react";
import { ShellLayoutProps } from "./useShellLayout";

export const useInlayLeftPanel = ({
  appHeader,
  LeftSidePanelProps,
}: ShellLayoutProps): ReactElement => {
  const paletteView = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(true);

  const handleDrawerClick = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      const target = e.target as HTMLElement;
      if (!paletteView.current?.contains(target)) {
        setOpen(!open);
      }
    },
    [open]
  );

  const getDrawers = useCallback(
    (leftSidePanel) => {
      const drawers: ReactElement[] = [];
      drawers.push(
        <Drawer
          key="left-panel"
          onClick={handleDrawerClick}
          open={open}
          position="left"
          inline
          peekaboo
          sizeOpen={200}
          toggleButton="end"
        >
          <View
            className="vuuShell-palette"
            id="vw-app-palette"
            key="app-palette"
            ref={paletteView}
            style={{ height: "100%" }}
          >
            {leftSidePanel}
          </View>
        </Drawer>
      );

      return drawers;
    },
    [handleDrawerClick, open]
  );

  return (
    <Flexbox
      className="App"
      style={{ flexDirection: "column", height: "100%", width: "100%" }}
    >
      {appHeader}
      <DockLayout style={{ flex: 1 }}>
        {getDrawers(LeftSidePanelProps?.children).concat(
          <DraggableLayout
            dropTarget
            key="main-content"
            style={{ width: "100%", height: "100%" }}
          />
        )}
      </DockLayout>
    </Flexbox>
  );
};
