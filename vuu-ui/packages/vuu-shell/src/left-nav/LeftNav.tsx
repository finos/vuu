import { VuuLogo } from "@finos/vuu-icons";
import { Action, Stack, useLayoutProviderDispatch } from "@finos/vuu-layout";
import { LayoutResizeAction } from "@finos/vuu-layout/src/layout-reducer";
import { Tab, Tabstrip } from "@finos/vuu-ui-controls";
import cx from "classnames";
import {
  CSSProperties,
  HTMLAttributes,
  useCallback,
  useRef,
  useState,
} from "react";
import { LayoutsList } from "../layout-management";
import { useThemeAttributes } from "../theme-provider";

import "./LeftNav.css";

const classBase = "vuuLeftNav";

interface LeftNavProps extends HTMLAttributes<HTMLDivElement> {
  "data-path"?: string;
  onResize?: (size: number) => void;
  open?: boolean;
  sizeCollapsed?: number;
  sizeContent?: number;
  sizeExpanded?: number;
}

type NavStatus = "menu-full" | "menu-icons" | "menu-content";
type NavState = {
  activeTabIndex: number;
  navStatus: NavStatus;
};

export const LeftNav = ({
  "data-path": path,
  onResize,
  open = true,
  sizeCollapsed = 80,
  sizeContent = 240,
  sizeExpanded = 240,
  style: styleProp,
  ...htmlAttributes
}: LeftNavProps) => {
  const dispatch = useLayoutProviderDispatch();
  const openRef = useRef(open);
  const [navState, setNavState] = useState<NavState>({
    activeTabIndex: 0,
    navStatus: "menu-full",
  });
  const [themeClass] = useThemeAttributes();

  const getWidthAndStatus = useCallback(
    (isOpen: boolean, tabIndex: number): [number, NavStatus] => {
      switch (tabIndex) {
        case 0:
          return isOpen
            ? [sizeExpanded, "menu-full"]
            : [sizeCollapsed, "menu-icons"];
        default:
          return [sizeCollapsed + sizeContent, "menu-content"];
      }
    },
    [sizeCollapsed, sizeContent, sizeExpanded]
  );

  const handleTabSelection = useCallback(
    (value: number) => {
      const [width, navStatus] = getWidthAndStatus(openRef.current, value);
      setNavState({
        activeTabIndex: value,
        navStatus,
      });
      dispatch({
        type: Action.LAYOUT_RESIZE,
        path,
        size: width,
      } as LayoutResizeAction);
    },
    [dispatch, getWidthAndStatus, path]
  );

  const toggleSize = useCallback(() => {
    openRef.current = !openRef.current;
    setNavState(({ activeTabIndex, navStatus }) => ({
      activeTabIndex,
      navStatus: navStatus === "menu-icons" ? "menu-full" : "menu-icons",
    }));
    dispatch({
      type: Action.LAYOUT_RESIZE,
      path,
      size: openRef.current ? 240 : 80,
    } as LayoutResizeAction);
  }, [dispatch, path]);

  const style = {
    ...styleProp,
    "--nav-menu-collapsed-width": `${sizeCollapsed}px`,
    "--nav-menu-expanded-width": `${sizeExpanded}px`,
  } as CSSProperties;
  return (
    <div
      {...htmlAttributes}
      className={cx(classBase, `${classBase}-${navState.navStatus}`)}
      style={style}
    >
      <div
        className={cx(`${classBase}-menu-primary`, themeClass)}
        data-mode="dark"
      >
        <div className="vuuLeftNav-logo">
          <VuuLogo />
        </div>
        <div className={`${classBase}-main`}>
          <Tabstrip
            activeTabIndex={navState.activeTabIndex}
            animateSelectionThumb={false}
            className={`${classBase}-Tabstrip`}
            onActiveChange={handleTabSelection}
            orientation="vertical"
          >
            <Tab data-icon="demo" label="DEMO"></Tab>
            <Tab data-icon="tables" label="VUU TABLES"></Tab>
            <Tab data-icon="templates" label="LAYOUT TEMPLATES"></Tab>
            <Tab data-icon="layouts" label="MY LAYOUTS"></Tab>
          </Tabstrip>
        </div>
        <div className="vuuLeftNav-buttonBar">
          <button
            className={cx("vuuLeftNav-toggleButton", {
              "vuuLeftNav-toggleButton-open": openRef.current,
              "vuuLeftNav-toggleButton-closed": !openRef.current,
            })}
            data-icon={openRef.current ? "chevron-left" : "chevron-right"}
            onClick={toggleSize}
          />
        </div>
      </div>
      <Stack
        active={navState.activeTabIndex - 1}
        className={`${classBase}-menu-secondary`}
        showTabs={false}
      >
        <div style={{ background: "yellow", height: "100%" }}>VUU Tables</div>
        <div style={{ background: "green", height: "100%" }}>
          Layout Templates
        </div>
        <div className="vuuLeftNav-drawer">
          <LayoutsList layouts={[]} />
        </div>
      </Stack>
    </div>
  );
};
