import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import {
  createElement,
  ReactElement,
  SyntheticEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  TabBar,
  TabListNext,
  TabNext,
  TabNextTrigger,
  TabsNext,
} from "@salt-ds/lab";
import { GridLayoutItemProps } from "./GridLayoutItem";
import { useGridChildProps } from "./useGridChildProps";
import { useDragContext } from "./drag-drop-next/DragDropProviderNext";
import {
  ComponentTemplate,
  useGridLayoutDispatch,
  useGridModel,
} from "./GridLayoutContext";
import { IconButton } from "@vuu-ui/vuu-ui-controls";
import { TabMenu } from "./TabMenu";
import { AddTabDialog } from "./AddTabDialog";

import gridLayoutStackedItemCss from "./GridLayoutStackedItem.css";

const classBaseItem = "vuuGridLayoutStackedItem";

export interface GridLayoutStackedItemProps extends GridLayoutItemProps {
  allowAddTab?: boolean;
  getNewComponent?: () => ComponentTemplate;
  showMenu?: boolean;
}

export const GridLayoutStackedItem = ({
  allowAddTab,
  children,
  className: classNameProp,
  header,
  id,
  getNewComponent,
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
  const [confirmationOpen, setConfirmationOpen] = useState(false);

  console.log(`[GridLayoutStackedItem#${id}] render`);

  const { registerTabsForDragDrop } = useDragContext();

  useEffect(() => {
    registerTabsForDragDrop(id);
  }, [id, registerTabsForDragDrop]);

  const { gridArea, horizontalSplitter, verticalSplitter } = useGridChildProps({
    id,
    resizeable,
    style: styleProp,
    type: "stacked-content",
  });

  const dispatch = useGridLayoutDispatch();

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

  const handleConfirm = (newTab: string) => {
    const componentTemplate = getNewComponent?.();
    if (componentTemplate) {
      dispatch({
        title: newTab,
        type: "add-child",
        componentTemplate,
        stackId: id,
      });
    }
    setConfirmationOpen(false);
  };

  const handleCancel = () => {
    setConfirmationOpen(false);
  };

  const handleClickAddTab = useCallback(() => {
    setConfirmationOpen(true);
    // const componentTemplate = getNewComponent?.();
    // if (componentTemplate) {
    //   console.log("we have a new component template", {
    //     componentTemplate,
    //   });
    //   dispatch({
    //     type: "add-child",
    //     componentTemplate,
    //     stackId: id,
    //   });
    // }
  }, []);

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
                    <TabMenu layoutItemId={gridLayoutItemId} />
                  ) : null}
                </TabNext>
              ))}
            </TabListNext>
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
          </TabBar>
        </TabsNext>
      </div>
      <AddTabDialog
        open={confirmationOpen}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
};

const GridLayoutStackedItemType = createElement(GridLayoutStackedItem).type;

export const isGridLayoutStackedItem = (element: ReactElement) =>
  element.type === GridLayoutStackedItemType;
