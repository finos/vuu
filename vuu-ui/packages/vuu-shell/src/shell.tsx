import { connectToServer /*, useViewserver */ } from "@vuu-ui/vuu-data";
import {
  HTMLAttributes,
  MouseEvent,
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import useLayoutConfig from "./use-layout-config";
import { ShellContextProvider } from "./ShellContextProvider";
import cx from "classnames";

import {
  Chest,
  DraggableLayout,
  Drawer,
  FlexboxLayout as Flexbox,
  LayoutProvider,
  View,
} from "@vuu-ui/vuu-layout";

import { AppHeader } from "./app-header";
// import { AppPalette } from "./app-palette";

import { LayoutJSON } from "@vuu-ui/vuu-layout/src/layout-reducer";
import "./shell.css";

export type VuuUser = {
  username: string;
  token: string;
};

const warningLayout = {
  type: "View",
  props: {
    style: { height: "calc(100% - 6px)" },
  },
  children: [
    {
      props: {
        className: "vuuShell-warningPlaceholder",
      },
      type: "Placeholder",
    },
  ],
};

export interface ShellProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  defaultLayout?: LayoutJSON;
  leftSidePanel?: ReactElement;
  loginUrl?: string;
  // paletteConfig: any;
  serverUrl?: string;
  user: VuuUser;
}

export const Shell = ({
  children,
  className,
  defaultLayout = warningLayout,
  leftSidePanel,
  loginUrl,
  serverUrl,
  user,
  ...htmlAttributes
}: ShellProps) => {
  const paletteView = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const layoutId = useRef("latest");

  const [layout, setLayoutConfig, loadLayoutById] = useLayoutConfig(
    user,
    defaultLayout
  );

  const handleLayoutChange = useCallback(
    (layout) => {
      setLayoutConfig(layout);
    },
    [setLayoutConfig]
  );

  const handleDrawerClick = (e: MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    if (!paletteView.current?.contains(target)) {
      setOpen(!open);
    }
  };

  const handleNavigate = useCallback(
    (id) => {
      layoutId.current = id;
      loadLayoutById(id);
    },
    [loadLayoutById]
  );

  useEffect(() => {
    if (serverUrl && user.token) {
      connectToServer(serverUrl, user.token);
    }
  }, [serverUrl, user.token]);

  const getDrawers = () => {
    const drawers: ReactElement[] = [];
    if (leftSidePanel) {
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
    }

    return drawers;
  };

  return (
    // ShellContext TBD
    <ShellContextProvider value={undefined}>
      <LayoutProvider layout={layout} onLayoutChange={handleLayoutChange}>
        <DraggableLayout
          className={cx("vuuShell", className)}
          {...htmlAttributes}
        >
          <Flexbox
            className="App"
            style={{ flexDirection: "column", height: "100%", width: "100%" }}
          >
            <AppHeader
              layoutId={layoutId.current}
              loginUrl={loginUrl}
              user={user}
              onNavigate={handleNavigate}
            />
            <Chest style={{ flex: 1 }}>
              {getDrawers().concat(
                <DraggableLayout
                  dropTarget
                  key="main-content"
                  style={{ width: "100%", height: "100%" }}
                />
              )}
            </Chest>
          </Flexbox>
        </DraggableLayout>
      </LayoutProvider>
      {children}
    </ShellContextProvider>
  );
};
