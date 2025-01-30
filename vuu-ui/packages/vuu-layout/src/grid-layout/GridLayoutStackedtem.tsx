import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import {
  createElement,
  ReactElement,
  SyntheticEvent,
  useCallback,
  useEffect,
} from "react";

import {
  TabBar,
  TabListNext,
  TabNext,
  TabNextTrigger,
  TabsNext,
} from "@salt-ds/lab";
import gridLayoutCss from "./GridLayout.css";
import { GridLayoutItemProps } from "./GridLayoutItem";
import gridSplitterCss from "./GridSplitter.css";
import { useGridChildProps } from "./useGridChildProps";
import { useDragContext } from "../drag-drop-next/DragDropProviderNext";
import { useGridModel } from "./GridLayoutContext";

const classBaseItem = "vuuGridLayoutStackedItem";

export const GridLayoutStackedItem = ({
  children,
  className: classNameProp,
  header,
  id,
  resizeable,
  style: styleProp,
  title,
  ...htmlAttributes
}: GridLayoutItemProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-grid-layout",
    css: gridLayoutCss,
    window: targetWindow,
  });
  useComponentCssInjection({
    testId: "vuu-grid-splitter",
    css: gridSplitterCss,
    window: targetWindow,
  });

  const { registerTabsForDragDrop } = useDragContext();

  useEffect(() => {
    registerTabsForDragDrop(id);
  }, [id, registerTabsForDragDrop]);

  const layoutProps = useGridChildProps({
    id,
    resizeable,
    style: styleProp,
    type: "stacked-content",
  });

  const { getTabState } = useGridModel();
  const tabState = getTabState(id);

  const handleTabSelectionChange = useCallback(
    (_: SyntheticEvent | null, value: string) => {
      tabState.setActiveTab(value);
    },
    [tabState],
  );

  const className = cx(classBaseItem, "vuuGridLayoutItem");

  const style = {
    ...styleProp,
    ...layoutProps,
  };

  const tabsId = `tabs-${id}`;

  // console.log(
  //   `[GridLayoutStackedItem] render (#${tabState.activeTab.id} active)
  //    ${JSON.stringify(tabState.tabs, null, 2)}
  //   `,
  // );

  console.log(
    `[GridLayoutStackedItem] render ${tabState.tabs.map((t) => t.label)}`,
  );

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
          value={tabState.tabs[tabState.active].label}
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
                </TabNext>
              ))}
            </TabListNext>
          </TabBar>
        </TabsNext>
      </div>
    </>
  );
};

const GridLayoutStackedItemType = createElement(GridLayoutStackedItem).type;

export const isGridLayoutStackedItem = (element: ReactElement) =>
  element.type === GridLayoutStackedItemType;
