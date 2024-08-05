import {
  DockLayout,
  LayoutContainer,
  Drawer,
  Flexbox,
  View,
} from "@finos/vuu-layout";

import { VuuShellLocation } from "@finos/vuu-utils";
import {
  MouseEvent,
  ReactElement,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { ShellLayoutTemplateHook } from "../useShellLayout";

export const useInlayLeftPanel: ShellLayoutTemplateHook = ({
  LeftSidePanelProps,
  appHeader,
  htmlAttributes,
}) => {
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

  return useMemo(() => {
    const getDrawers = (leftSidePanel: ReactNode) => {
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
    };

    return (
      <Flexbox
        {...htmlAttributes}
        style={{
          ...htmlAttributes?.style,
          flexDirection: "column",
        }}
      >
        {appHeader}
        <DockLayout style={{ flex: 1 }}>
          {getDrawers(LeftSidePanelProps?.children).concat(
            <LayoutContainer
              dropTarget
              id={VuuShellLocation.WorkspaceContainer}
              key="main-content"
              style={{ width: "100%", height: "100%" }}
            />
          )}
        </DockLayout>
      </Flexbox>
    );
  }, [LeftSidePanelProps, appHeader, handleDrawerClick, htmlAttributes, open]);
};
