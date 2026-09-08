import { VuuLogo } from "@vuu-ui/vuu-icons";
import { GridLayout, GridLayoutItem } from "@heswell/grid-layout";
import { IconButton, Tab, Tabstrip } from "@vuu-ui/vuu-ui-controls";
import {
  type DynamicFeatureProps,
  type FilterTableFeatureProps,
  hasFilterTableFeatureProps,
} from "@vuu-ui/vuu-utils";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import {
  type CSSProperties,
  type HTMLAttributes,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { FeatureList, type GroupedFeatureProps } from "../feature-list";
import { LayoutList, useWorkspace } from "../workspace-management";

import leftNavCss from "./LeftNav.css";
import { useFeatures } from "../feature-and-layout-provider";

const classBase = "vuuLeftNav";

export type NavDisplayStatus =
  | "menu-full"
  | "menu-icons"
  | "menu-full-content"
  | "menu-icons-content";

const getDisplayStatus = (
  activeTabIndex: number,
  expanded: boolean,
): NavDisplayStatus => {
  if (activeTabIndex === 0) {
    return expanded ? "menu-full" : "menu-icons";
  } else {
    return expanded ? "menu-full-content" : "menu-icons-content";
  }
};

export type NavDisplayStatusHandler = (
  navDisplayStatus: NavDisplayStatus,
) => void;
export interface LeftNavProps extends HTMLAttributes<HTMLDivElement> {
  "data-path"?: string;
  defaultActiveTabIndex?: number;
  defaultExpanded?: boolean;
  onActiveChange?: (activeTabIndex: number) => void;
  onTogglePrimaryMenu?: (expanded: boolean) => void;
  onWidthChange?: (width: number) => void;
  sizeCollapsed?: number;
  sizeContent?: number;
  sizeExpanded?: number;
}

type NavState = {
  activeTabIndex: number;
  expanded: boolean;
  scopeIdentity: string;
};

const byModule = (
  f1: DynamicFeatureProps<FilterTableFeatureProps>,
  f2: DynamicFeatureProps<FilterTableFeatureProps>,
) => {
  const t1 = f1.ComponentProps?.tableSchema.table;
  const t2 = f2.ComponentProps?.tableSchema.table;
  if (t1 && t2) {
    const m1 = t1.module.toLowerCase();
    const m2 = t2.module.toLowerCase();
    if (m1 < m2) {
      return -1;
    } else if (m1 > m2) {
      return 1;
    } else if (t1.table < t2.table) {
      return -1;
    } else if (t1.table > t2.table) {
      return 1;
    } else {
      return 0;
    }
  } else {
    throw Error("Invalid tableFeature");
  }
};

export const LeftNav = (props: LeftNavProps) => {
  const {
    "data-path": path,
    defaultExpanded = true,
    defaultActiveTabIndex = 0,
    onActiveChange,
    onTogglePrimaryMenu,
    onWidthChange,
    sizeCollapsed = 80,
    sizeContent = 300,
    sizeExpanded = 240,
    style: styleProp,
    ...htmlAttributes
  } = props;
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-left-nav",
    css: leftNavCss,
    window: targetWindow,
  });

  const { dynamicFeatures = [], tableFeatures = [] } = useFeatures();
  const {
    getApplicationSetting,
    scopeIdentity,
    setApplicationSetting,
    status,
  } = useWorkspace();
  const storedActiveTabIndex = getApplicationSetting("leftNav.activeTabIndex");
  const storedExpanded = getApplicationSetting("leftNav.expanded");

  const [navState, setNavState] = useState<NavState>({
    activeTabIndex:
      typeof storedActiveTabIndex === "number"
        ? storedActiveTabIndex
        : defaultActiveTabIndex,
    expanded:
      typeof storedExpanded === "boolean" ? storedExpanded : defaultExpanded,
    scopeIdentity: status === "loading" ? "" : scopeIdentity,
  });
  const visibleNavState =
    status !== "loading" && navState.scopeIdentity === scopeIdentity
      ? navState
      : {
          activeTabIndex: defaultActiveTabIndex,
          expanded: defaultExpanded,
          scopeIdentity: "",
        };

  useEffect(() => {
    if (status === "loading") {
      setNavState({
        activeTabIndex: defaultActiveTabIndex,
        expanded: defaultExpanded,
        scopeIdentity: "",
      });
    } else {
      setNavState({
        activeTabIndex:
          typeof storedActiveTabIndex === "number"
            ? storedActiveTabIndex
            : defaultActiveTabIndex,
        expanded:
          typeof storedExpanded === "boolean"
            ? storedExpanded
            : defaultExpanded,
        scopeIdentity,
      });
    }
  }, [
    defaultActiveTabIndex,
    defaultExpanded,
    scopeIdentity,
    status,
    storedActiveTabIndex,
    storedExpanded,
  ]);

  const tableFeaturesByGroup = useMemo(
    () =>
      tableFeatures
        ?.sort(byModule)
        .reduce<GroupedFeatureProps<FilterTableFeatureProps>>(
          (acc, filterTableFeature) => {
            if (hasFilterTableFeatureProps(filterTableFeature)) {
              const { table } = filterTableFeature.ComponentProps.tableSchema;
              const key = `${table.module} Tables`;
              if (!acc[key]) {
                acc[key] = [];
              }
              acc[key].push(filterTableFeature);
              return acc;
            } else {
              return acc;
              // throw Error("LeftNaV invalid tableFeature");
            }
          },
          {},
        ),
    [tableFeatures],
  );

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
    [sizeCollapsed, sizeContent, sizeExpanded],
  );

  useEffect(() => {
    onWidthChange?.(
      getFullWidth(visibleNavState.activeTabIndex, visibleNavState.expanded),
    );
  }, [getFullWidth, onWidthChange, visibleNavState]);

  const handleTabSelection = useCallback(
    (activeTabIndex: number) => {
      const { activeTabIndex: currentIndex, expanded } = visibleNavState;
      const newState = { activeTabIndex, expanded, scopeIdentity };
      setNavState(newState);
      void currentIndex;
      void getFullWidth(activeTabIndex, expanded);
      void setApplicationSetting("leftNav.activeTabIndex", activeTabIndex);
      onActiveChange?.(activeTabIndex);
    },
    [
      getFullWidth,
      onActiveChange,
      scopeIdentity,
      setApplicationSetting,
      visibleNavState,
    ],
  );

  const displayStatus = getDisplayStatus(
    visibleNavState.activeTabIndex,
    visibleNavState.expanded,
  );

  const toggleExpanded = useCallback(() => {
    const { activeTabIndex, expanded } = visibleNavState;
    const primaryMenuExpanded = !expanded;
    const newState = {
      activeTabIndex,
      expanded: primaryMenuExpanded,
      scopeIdentity,
    };
    setNavState(newState);
    void getFullWidth(activeTabIndex, primaryMenuExpanded);
    void setApplicationSetting("leftNav.expanded", primaryMenuExpanded);
    onTogglePrimaryMenu?.(primaryMenuExpanded);
  }, [
    getFullWidth,
    onTogglePrimaryMenu,
    scopeIdentity,
    setApplicationSetting,
    visibleNavState,
  ]);

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
      <GridLayout
        colsAndRows={{
          cols: [
            `${visibleNavState.expanded ? sizeExpanded : sizeCollapsed}px`,
            `${visibleNavState.activeTabIndex === 0 ? 0 : sizeContent}px`,
          ],
          rows: ["1fr"],
        }}
        id="vuu-left-nav-grid"
        key={`${visibleNavState.expanded}-${visibleNavState.activeTabIndex}`}
      >
        <GridLayoutItem
          className={cx(`${classBase}-menu-primary`)}
          data-mode="dark"
          id="vuu-left-nav-primary"
          style={{ gridArea: "1/1/2/2" }}
        >
          <div className="vuuLeftNav-logo">
            <VuuLogo />
          </div>
          <div className={`${classBase}-main`}>
            <Tabstrip
              activeTabIndex={visibleNavState.activeTabIndex}
              animateSelectionThumb={false}
              className={`${classBase}-Tabstrip`}
              onActiveChange={handleTabSelection}
              orientation="vertical"
            >
              <Tab data-icon="demo" label="DEMO" />
              <Tab data-icon="features" label="VUU FEATURES" />
              <Tab data-icon="tables" label="VUU TABLES" />
              <Tab data-icon="layouts" label="MY LAYOUTS" />
            </Tabstrip>
          </div>
          <div className="vuuLeftNav-buttonBar">
            <IconButton
              className={cx("vuuLeftNav-toggleButton", {
                "vuuLeftNav-toggleButton-open":
                  displayStatus.startsWith("menu-full"),
                "vuuLeftNav-toggleButton-closed":
                  displayStatus.startsWith("menu-icons"),
              })}
              icon={
                displayStatus.startsWith("menu-full")
                  ? "chevron-left"
                  : "chevron-right"
              }
              onClick={toggleExpanded}
            />
          </div>
        </GridLayoutItem>
        <GridLayoutItem
          className={`${classBase}-menu-secondary`}
          id="vuu-left-nav-secondary"
          style={{ gridArea: "1/2/2/3" }}
        >
          {visibleNavState.activeTabIndex === 1 ? (
            <FeatureList features={dynamicFeatures} title="VUU FEATURES" />
          ) : visibleNavState.activeTabIndex === 2 ? (
            <FeatureList features={tableFeaturesByGroup} title="VUU TABLES" />
          ) : visibleNavState.activeTabIndex === 3 ? (
            <LayoutList title="MY LAYOUTS" />
          ) : null}
        </GridLayoutItem>
      </GridLayout>
    </div>
  );
};
