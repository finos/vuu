import { VuuLogo } from "@finos/vuu-icons";
import { Action, Stack, useLayoutProviderDispatch } from "@finos/vuu-layout";
import { LayoutResizeAction } from "@finos/vuu-layout/src/layout-reducer";
import { Tab, Tabstrip } from "@finos/vuu-ui-controls";
import cx from "classnames";
import { LayoutsList } from "../layout-management";
import { CSSProperties, HTMLAttributes, useCallback, useState } from "react";
import { FeatureProps } from "../feature";
import { FeatureList } from "../feature-list";
import { useThemeAttributes } from "../theme-provider";

import "./LeftNav.css";

const classBase = "vuuLeftNav";

export type NavDisplayStatus =
  | "menu-full"
  | "menu-icons"
  | "menu-full-content"
  | "menu-icons-content";

export type NavDisplayStatusHandler = (
  navDisplayStatus: NavDisplayStatus
) => void;
interface LeftNavProps extends HTMLAttributes<HTMLDivElement> {
  "data-path"?: string;
  defaultActiveTabIndex?: number;
  defaultDisplayStatus?: NavDisplayStatus;
  features: FeatureProps[];
  tableFeatures: FeatureProps[];
  onChangeDisplayStatus?: NavDisplayStatusHandler;
  onResize?: (size: number) => void;
  sizeCollapsed?: number;
  sizeContent?: number;
  sizeExpanded?: number;
}

type NavState = {
  activeTabIndex: number;
  navStatus: NavDisplayStatus;
};

export const LeftNav = ({
  "data-path": path,
  defaultDisplayStatus = "menu-full",
  defaultActiveTabIndex = 0,
  features,
  onChangeDisplayStatus,
  onResize,
  sizeCollapsed = 80,
  sizeContent = 300,
  sizeExpanded = 240,
  style: styleProp,
  tableFeatures,
  ...htmlAttributes
}: LeftNavProps) => {
  const dispatch = useLayoutProviderDispatch();
  const [navState, setNavState] = useState<NavState>({
    activeTabIndex: defaultActiveTabIndex,
    navStatus: defaultDisplayStatus,
  });
  const [themeClass] = useThemeAttributes();

  const toggleNavWidth = useCallback(
    (navStatus: NavDisplayStatus) => {
      switch (navStatus) {
        case "menu-icons":
          return sizeExpanded;
        case "menu-full":
          return sizeCollapsed;
        case "menu-full-content":
          return sizeCollapsed + sizeContent;
        case "menu-icons-content":
          return sizeExpanded + sizeContent;
      }
    },
    [sizeCollapsed, sizeContent, sizeExpanded]
  );

  const toggleNavStatus = (navStatus: NavDisplayStatus) => {
    switch (navStatus) {
      case "menu-icons":
        return "menu-full";
      case "menu-full":
        return "menu-icons";
      case "menu-full-content":
        return "menu-icons-content";
      case "menu-icons-content":
        return "menu-full-content";
    }
  };

  const getWidthAndStatus = useCallback(
    (
      navState: NavDisplayStatus,
      tabIndex: number
    ): [number, NavDisplayStatus] => {
      if (tabIndex === 0) {
        const newNavState =
          navState === "menu-full-content"
            ? "menu-full"
            : navState === "menu-icons-content"
            ? "menu-icons"
            : navState;

        return newNavState === "menu-icons"
          ? [sizeCollapsed, newNavState]
          : [sizeExpanded, newNavState];
      } else {
        const newNavState =
          navState === "menu-full"
            ? "menu-full-content"
            : navState === "menu-icons"
            ? "menu-icons-content"
            : navState;
        return newNavState === "menu-icons-content"
          ? [sizeCollapsed + sizeContent, newNavState]
          : [sizeExpanded + sizeContent, newNavState];
      }
    },
    [sizeCollapsed, sizeContent, sizeExpanded]
  );

  const handleTabSelection = useCallback(
    (value: number) => {
      const [width, navStatus] = getWidthAndStatus(navState.navStatus, value);
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
    [dispatch, getWidthAndStatus, navState, path]
  );

  const toggleSize = useCallback(() => {
    const { activeTabIndex, navStatus: currentNavStatus } = navState;
    const newNavStatus = toggleNavStatus(currentNavStatus);
    setNavState({
      activeTabIndex,
      navStatus: newNavStatus,
    });
    dispatch({
      type: Action.LAYOUT_RESIZE,
      path,
      size: toggleNavWidth(currentNavStatus),
    } as LayoutResizeAction);
    onChangeDisplayStatus?.(newNavStatus);
  }, [dispatch, navState, onChangeDisplayStatus, path, toggleNavWidth]);

  const style = {
    ...styleProp,
    "--nav-menu-collapsed-width": `${sizeCollapsed}px`,
    "--nav-menu-expanded-width": `${sizeExpanded}px`,
    "--nav-menu-content-width": `${sizeContent}px`,
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
            <Tab data-icon="features" label="VUU FEATURES"></Tab>
            <Tab data-icon="tables" label="VUU TABLES"></Tab>
            <Tab data-icon="templates" label="LAYOUT TEMPLATES"></Tab>
            <Tab data-icon="layouts" label="MY LAYOUTS"></Tab>
          </Tabstrip>
        </div>
        <div className="vuuLeftNav-buttonBar">
          <button
            className={cx("vuuLeftNav-toggleButton", {
              "vuuLeftNav-toggleButton-open":
                navState.navStatus.startsWith("menu-full"),
              "vuuLeftNav-toggleButton-closed":
                navState.navStatus.startsWith("menu-icons"),
            })}
            data-icon={
              navState.navStatus.startsWith("menu-full")
                ? "chevron-left"
                : "chevron-right"
            }
            onClick={toggleSize}
          />
        </div>
      </div>
      <Stack
        active={navState.activeTabIndex - 1}
        className={`${classBase}-menu-secondary`}
        showTabs={false}
      >
        <FeatureList features={features} title="VUU FEATURES" />
        <FeatureList features={tableFeatures} title="VUU TABLES" />
        <div style={{ background: "green", height: "100%" }}>
          LAYOUT TEMPLATES
        </div>
        <div className="vuuLeftNav-drawer">
          <LayoutsList />
        </div>
      </Stack>
    </div>
  );
};
