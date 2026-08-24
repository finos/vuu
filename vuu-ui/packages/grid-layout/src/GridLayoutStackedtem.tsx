import {
  TabBar,
  TabList as TabListNext,
  Tab as TabNext,
  TabTrigger as TabNextTrigger,
  Tabs as TabsNext,
} from "@salt-ds/core";
import { IconButton } from "@vuu-ui/vuu-ui-controls";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import {
  createElement,
  type ReactElement,
  type SyntheticEvent,
  useCallback,
  useEffect,
} from "react";
import { useDragContext } from "./drag-drop-next/DragDropProviderNext";
import {
  type ComponentTemplate,
  useGridModel,
} from "./GridLayoutContext";
import type { GridLayoutItemProps } from "./GridLayoutItem";
import { resolveMinimumGridItemSize } from "./GridModel";
import { TabMenu } from "./TabMenu";
import { useEditTabName } from "./useEditTabName";
import { useGridChildProps } from "./useGridChildProps";

import gridLayoutStackedItemCss from "./GridLayoutStackedItem.css";

const classBaseItem = "vuuGridLayoutStackedItem";

export interface GridLayoutStackedItemProps extends GridLayoutItemProps {
  allowAddTab?: boolean;
  getNewComponent?: () => Omit<ComponentTemplate, "label">;
  showMenu?: boolean;
}

export const GridLayoutStackedItem = ({
  allowAddTab,
  children,
  className: classNameProp,
  header,
  id,
  getNewComponent,
  minHeight,
  minWidth,
  resizeable,
  showMenu,
  style: styleProp,
  title,
  ...htmlAttributes
}: GridLayoutStackedItemProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-grid-layout-stacked-item",
    css: gridLayoutStackedItemCss,
    window: targetWindow,
  });

  const { dialog, showTabEditDialog } = useEditTabName({ getNewComponent, id });

  const { registerTabsForDragDrop } = useDragContext();
  const modelMinHeight = resolveMinimumGridItemSize(
    minHeight,
    styleProp?.minHeight,
  );
  const modelMinWidth = resolveMinimumGridItemSize(
    minWidth,
    styleProp?.minWidth,
  );

  useEffect(() => {
    registerTabsForDragDrop(id);
  }, [id, registerTabsForDragDrop]);

  const { gridArea, horizontalSplitter, verticalSplitter } = useGridChildProps({
    id,
    minHeight: modelMinHeight,
    minWidth: modelMinWidth,
    resizeable,
    style: styleProp,
    type: "stacked-content",
  });

  const { getTabState } = useGridModel();
  const tabState = getTabState(id, "create");

  const handleTabSelectionChange = useCallback(
    (_: SyntheticEvent | null, value: string) => {
      tabState.setActiveTab(value);
    },
    [tabState],
  );

  const className = cx(classBaseItem, "vuuGridLayoutItem", {
    "has-h-splitter": horizontalSplitter,
    "has-v-splitter": verticalSplitter,
  });

  const style = {
    ...styleProp,
    gridArea,
    ...(minHeight === undefined ? {} : { minHeight }),
    ...(minWidth === undefined ? {} : { minWidth }),
  };

  const tabsId = `tabs-${id}`;

  // console.log(
  //   `[GridLayoutStackedItem] render (#${tabState.activeTab.id} active)
  //    ${JSON.stringify(tabState.tabs, null, 2)}
  //   `,
  // );

  const handleClickAddTab = useCallback(() => {
    showTabEditDialog();
  }, [showTabEditDialog]);

  return (
    <>
      <div
        {...htmlAttributes}
        className={cx(className)}
        id={id}
        key={id}
        style={style}
      >
        <TabsNext
          onChange={handleTabSelectionChange}
          value={tabState.tabs[tabState.active]?.label ?? null}
        >
          <TabBar divider>
            <TabListNext
              appearance="transparent"
              className="vuuDragContainer"
              id={tabsId}
            >
              {tabState.tabs.map(({ id: gridLayoutItemId, label }, index) => (
                <TabNext
                  className="vuuDraggableItem"
                  data-index={index}
                  data-grid-layout-item-id={gridLayoutItemId}
                  data-label={label}
                  draggable
                  value={label}
                  key={label}
                >
                  <TabNextTrigger>{label}</TabNextTrigger>
                  {showMenu ? (
                    <TabMenu layoutItemId={gridLayoutItemId} tabLabel={label} />
                  ) : null}
                </TabNext>
              ))}
            </TabListNext>
            {allowAddTab ? (
              <IconButton
                aria-label="Create Tab"
                className={`${classBaseItem}-addTabButton`}
                data-embedded
                icon="add"
                data-overflow-priority="1"
                key="addButton"
                onClick={handleClickAddTab}
                variant="secondary"
                tabIndex={-1}
              />
            ) : null}
          </TabBar>
        </TabsNext>
      </div>
      {dialog}
    </>
  );
};

const GridLayoutStackedItemType = createElement(GridLayoutStackedItem).type;

export const isGridLayoutStackedItem = (element: ReactElement) =>
  element.type === GridLayoutStackedItemType;
