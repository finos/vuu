import { VuuLogo } from "@finos/vuu-icons";
import {
  LayoutResizeAction,
  Stack,
  useLayoutProviderDispatch,
} from "@finos/vuu-layout";
import { Tab, Tabstrip } from "@finos/vuu-ui-controls";
import {
  FilterTableFeatureProps,
  hasFilterTableFeatureProps,
  useThemeAttributes,
} from "@finos/vuu-utils";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import {
  CSSProperties,
  HTMLAttributes,
  useCallback,
  useMemo,
  useState,
} from "react";
import { FeatureProps } from "../feature";
import { FeatureList, GroupedFeatureProps } from "../feature-list";
import { LayoutList } from "../layout-management";

import leftNavCss from "./LeftNav.css";

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
  tableFeatures: FeatureProps<FilterTableFeatureProps>[];
}

type NavState = {
  activeTabIndex: number;
  expanded: boolean;
};

const byModule = (
  f1: FeatureProps<FilterTableFeatureProps>,
  f2: FeatureProps<FilterTableFeatureProps>
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

  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-left-nav",
    css: leftNavCss,
    window: targetWindow,
  });

  const [navState, setNavState] = useState<NavState>({
    activeTabIndex: defaultActiveTabIndex,
    expanded: defaultExpanded,
  });

  const tableFeaturesByGroup = useMemo(
    () =>
      tableFeatures
        .sort(byModule)
        .reduce<GroupedFeatureProps<FilterTableFeatureProps>>(
          (acc, filterTableFeature) => {
            if (hasFilterTableFeatureProps(filterTableFeature)) {
              const { table } = filterTableFeature.ComponentProps.tableSchema;
              const key = `${table.module} Tables`;
              if (!acc[key]) {
                acc[key] = [];
              }
              return {
                ...acc,
                [key]: acc[key].concat(filterTableFeature),
              };
            } else {
              return acc;
              // throw Error("LeftNaV invalid tableFeature");
            }
          },
          {}
        ),
    [tableFeatures]
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
        <FeatureList features={tableFeaturesByGroup} title="VUU TABLES" />
        <LayoutList title="MY LAYOUTS" />
      </Stack>
    </div>
  );
};
