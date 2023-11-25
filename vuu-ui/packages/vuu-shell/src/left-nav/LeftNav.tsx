import { VuuLogo } from "@finos/vuu-icons";
import { Stack, useLayoutProviderDispatch } from "@finos/vuu-layout";
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

const getDisplayStatus = (
  activeTabIndex: number,
  expanded: boolean
): NavDisplayStatus => {
  if (activeTabIndex === 0) {
    return expanded ? "menu-full" : "menu-icons";
  } else {
    return expanded ? "menu-full-content" : "menu-icons-content";
  }
};

export type NavDisplayStatusHandler = (
  navDisplayStatus: NavDisplayStatus
) => void;
export interface LeftNavProps extends HTMLAttributes<HTMLDivElement> {
  "data-path"?: string;
  defaultActiveTabIndex?: number;
  defaultExpanded?: boolean;
  features: FeatureProps[];
  onActiveChange?: (activeTabIndex: number) => void;
  onTogglePrimaryMenu?: (expanded: boolean) => void;
  sizeCollapsed?: number;
  sizeContent?: number;
  sizeExpanded?: number;
  tableFeatures: FeatureProps[];
}

type NavState = {
  activeTabIndex: number;
  expanded: boolean;
};

export const LeftNav = (props: LeftNavProps) => {
  const dispatch = useLayoutProviderDispatch();
  const [themeClass] = useThemeAttributes();
  const {
    "data-path": path,
    defaultExpanded = true,
    defaultActiveTabIndex = 0,
    features,
    onActiveChange,
    onTogglePrimaryMenu,
    sizeCollapsed = 80,
    sizeContent = 300,
    sizeExpanded = 240,
    style: styleProp,
    tableFeatures,
    ...htmlAttributes
  } = props;

  const [navState, setNavState] = useState<NavState>({
    activeTabIndex: defaultActiveTabIndex,
    expanded: defaultExpanded,
  });

  const getFullWidth = useCallback(
    (tabIndex: number, expanded: boolean): number => {
      if (tabIndex === 0) {
        return expanded ? sizeExpanded : sizeCollapsed;
      } else {
        return expanded
          ? sizeExpanded + sizeContent
          : sizeCollapsed + sizeContent;
      }
    },
    [sizeCollapsed, sizeContent, sizeExpanded]
  );

  const handleTabSelection = useCallback(
    (activeTabIndex: number) => {
      const { activeTabIndex: currentIndex, expanded } = navState;
      const newState = { activeTabIndex, expanded };
      setNavState(newState);
      if (activeTabIndex === 0 || currentIndex === 0) {
        const width = getFullWidth(activeTabIndex, expanded);
        dispatch({
          type: "layout-resize",
          path: "#vuu-side-panel",
          size: width,
        } as LayoutResizeAction);
      }
      onActiveChange?.(activeTabIndex);
    },
    [dispatch, getFullWidth, navState, onActiveChange]
  );

  const displayStatus = getDisplayStatus(
    navState.activeTabIndex,
    navState.expanded
  );

  const toggleExpanded = useCallback(() => {
    const { activeTabIndex, expanded } = navState;
    const primaryMenuExpanded = !expanded;
    const newState = { activeTabIndex, expanded: primaryMenuExpanded };
    setNavState(newState);
    dispatch({
      type: "layout-resize",
      path: "#vuu-side-panel",
      size: getFullWidth(activeTabIndex, primaryMenuExpanded),
    } as LayoutResizeAction);
    onTogglePrimaryMenu?.(primaryMenuExpanded);
  }, [dispatch, getFullWidth, navState, onTogglePrimaryMenu]);

  const style = {
    ...styleProp,
    "--nav-menu-collapsed-width": `${sizeCollapsed}px`,
    "--nav-menu-expanded-width": `${sizeExpanded}px`,
    "--nav-menu-content-width": `${sizeContent}px`,
  } as CSSProperties;

  return (
    <div
      {...htmlAttributes}
      className={cx(classBase, `${classBase}-${displayStatus}`)}
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
            <Tab data-icon="layouts" label="MY LAYOUTS"></Tab>
          </Tabstrip>
        </div>
        <div className="vuuLeftNav-buttonBar">
          <button
            className={cx("vuuLeftNav-toggleButton", {
              "vuuLeftNav-toggleButton-open":
                displayStatus.startsWith("menu-full"),
              "vuuLeftNav-toggleButton-closed":
                displayStatus.startsWith("menu-icons"),
            })}
            data-icon={
              displayStatus.startsWith("menu-full")
                ? "chevron-left"
                : "chevron-right"
            }
            onClick={toggleExpanded}
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
        <div className="vuuLeftNav-drawer">
          <LayoutsList />
        </div>
      </Stack>
    </div>
  );
};
