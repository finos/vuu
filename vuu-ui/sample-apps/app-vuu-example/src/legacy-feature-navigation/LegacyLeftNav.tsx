import { VuuLogo } from "@vuu-ui/vuu-icons";
import {
  Stack,
  type LayoutResizeAction,
  useLayoutProviderDispatch,
} from "@vuu-ui/vuu-layout";
import { IconButton, Tab, Tabstrip } from "@vuu-ui/vuu-ui-controls";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import {
  type CSSProperties,
  type HTMLAttributes,
  useCallback,
  useMemo,
  useState,
} from "react";
import { LayoutList } from "@vuu-ui/vuu-shell";
import {
  LegacyFeatureList,
  type GroupedFeatureProps,
} from "./LegacyFeatureList";
import { useLegacyFeatures } from "./LegacyFeatureAndLayoutProvider";
import {
  hasFilterTableFeatureProps,
  type DynamicFeatureProps,
  type FilterTableFeatureProps,
} from "./types";

import leftNavCss from "../../../../packages/vuu-shell/src/left-nav/LeftNav.css";

const classBase = "vuuLeftNav";

const byModule = (
  first: DynamicFeatureProps<FilterTableFeatureProps>,
  second: DynamicFeatureProps<FilterTableFeatureProps>,
) => {
  const firstTable = first.ComponentProps?.tableSchema.table;
  const secondTable = second.ComponentProps?.tableSchema.table;
  if (!firstTable || !secondTable) {
    throw Error("Invalid legacy table feature");
  }
  return (
    firstTable.module.localeCompare(secondTable.module) ||
    firstTable.table.localeCompare(secondTable.table)
  );
};

export const LegacyLeftNav = ({
  defaultExpanded = true,
  defaultActiveTabIndex = 0,
  sizeCollapsed = 80,
  sizeContent = 300,
  sizeExpanded = 240,
  style: styleProp,
  ...htmlAttributes
}: HTMLAttributes<HTMLDivElement> & {
  defaultActiveTabIndex?: number;
  defaultExpanded?: boolean;
  sizeCollapsed?: number;
  sizeContent?: number;
  sizeExpanded?: number;
}) => {
  const dispatch = useLayoutProviderDispatch();
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "legacy-vuu-left-nav",
    css: leftNavCss,
    window: targetWindow,
  });

  const { dynamicFeatures, tableFeatures } = useLegacyFeatures();
  const [activeTabIndex, setActiveTabIndex] = useState(defaultActiveTabIndex);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const tableFeaturesByGroup = useMemo(
    () =>
      tableFeatures
        .sort(byModule)
        .reduce<GroupedFeatureProps<FilterTableFeatureProps>>(
          (groups, feature) => {
            if (!hasFilterTableFeatureProps(feature)) {
              return groups;
            }
            const { table } = feature.ComponentProps.tableSchema;
            const group = `${table.module} Tables`;
            groups[group] = [...(groups[group] ?? []), feature];
            return groups;
          },
          {},
        ),
    [tableFeatures],
  );

  const getFullWidth = useCallback(
    (tabIndex: number, isExpanded: boolean) =>
      tabIndex === 0
        ? isExpanded
          ? sizeExpanded
          : sizeCollapsed
        : isExpanded
          ? sizeExpanded + sizeContent
          : sizeCollapsed + sizeContent,
    [sizeCollapsed, sizeContent, sizeExpanded],
  );

  const setActiveTab = useCallback(
    (nextActiveTabIndex: number) => {
      setActiveTabIndex((currentActiveTabIndex) => {
        if (nextActiveTabIndex === 0 || currentActiveTabIndex === 0) {
          dispatch({
            type: "layout-resize",
            path: "#vuu-side-panel",
            size: getFullWidth(nextActiveTabIndex, expanded),
          } as LayoutResizeAction);
        }
        return nextActiveTabIndex;
      });
    },
    [dispatch, expanded, getFullWidth],
  );

  const toggleExpanded = useCallback(() => {
    setExpanded((currentExpanded) => {
      const nextExpanded = !currentExpanded;
      dispatch({
        type: "layout-resize",
        path: "#vuu-side-panel",
        size: getFullWidth(activeTabIndex, nextExpanded),
      } as LayoutResizeAction);
      return nextExpanded;
    });
  }, [activeTabIndex, dispatch, getFullWidth]);

  const displayStatus =
    activeTabIndex === 0
      ? expanded
        ? "menu-full"
        : "menu-icons"
      : expanded
        ? "menu-full-content"
        : "menu-icons-content";
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
      <div className={`${classBase}-menu-primary`} data-mode="dark">
        <div className="vuuLeftNav-logo">
          <VuuLogo />
        </div>
        <div className={`${classBase}-main`}>
          <Tabstrip
            activeTabIndex={activeTabIndex}
            animateSelectionThumb={false}
            className={`${classBase}-Tabstrip`}
            onActiveChange={setActiveTab}
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
      </div>
      <Stack
        active={activeTabIndex - 1}
        className={`${classBase}-menu-secondary`}
        showTabs={false}
      >
        <LegacyFeatureList features={dynamicFeatures} title="VUU FEATURES" />
        <LegacyFeatureList features={tableFeaturesByGroup} title="VUU TABLES" />
        <LayoutList title="MY LAYOUTS" />
      </Stack>
    </div>
  );
};
