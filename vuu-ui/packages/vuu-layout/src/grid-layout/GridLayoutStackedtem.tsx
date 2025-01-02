import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import React, {
  ReactElement,
  ReactNode,
  SyntheticEvent,
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { useAsDropTarget } from "./useAsDropTarget";
import { useNotDropTarget } from "./useNotDropTarget";

import {
  TabBar,
  TabListNext,
  TabNext,
  TabNextTrigger,
  TabsNext,
} from "@finos/vuu-ui-controls";
import { moveItem, uuid } from "@finos/vuu-utils";
import {
  DropHandler,
  sourceIsTemplate,
} from "../drag-drop-next/DragContextNext";
import { DragDropProviderNext as DragDropProvider } from "../drag-drop-next/DragDropProviderNext";
import { getDefaultTabLabel } from "../layout-reducer";
import { Stack } from "../stack";
import gridLayoutCss from "./GridLayout.css";
import { GridLayoutItemProps } from "./GridLayoutItem";
import {
  useGridChildProps,
  useGridLayoutProviderDispatch,
} from "./GridLayoutProvider";
import gridSplitterCss from "./GridSplitter.css";

const classBaseItem = "vuuGridLayoutStackedItem";

const getChildElements = <T extends ReactElement = ReactElement>(
  children: ReactNode,
): T[] => {
  const elements: T[] = [];
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      elements.push(child as T);
    } else {
      console.warn(`Stack has unexpected child element type`);
    }
  });
  return elements;
};

export class TabState {
  constructor(
    public active: number,
    public tabs: string[],
  ) {}
  get activeTab() {
    return this.tabs[this.active];
  }
  insertTab(newTab: string, index: number) {
    return new TabState(0, this.tabs.toSpliced(index, 0, newTab));
  }
  moveTab(fromIndex: number, toIndex: number) {
    return this.setTabs(moveItem(this.tabs, fromIndex, toIndex));
  }
  setActiveTab(value: string) {
    return new TabState(this.tabs.indexOf(value), this.tabs);
  }
  setTabs(tabs: string[]) {
    if (tabs.includes(this.activeTab)) {
      return new TabState(tabs.indexOf(this.activeTab), tabs);
    } else {
      const i = this.tabs.indexOf(this.activeTab);
      return new TabState(Math.min(tabs.length - 1, i), tabs);
    }
  }
}

export const GridLayoutStackedItem = ({
  active = 0,
  children,
  className: classNameProp,
  header,
  id,
  isDropTarget = true,
  resizeable,
  style: styleProp,
  title,
  ...htmlAttributes
}: GridLayoutItemProps & {
  active?: number;
}) => {
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

  const dispatch = useGridLayoutProviderDispatch();
  const layoutProps = useGridChildProps(id);

  // TODO need to add children to state OR DO WE ?
  //
  const initialTabState = useMemo<TabState>(
    () =>
      new TabState(
        active,
        getChildElements(children).map((child, idx) =>
          getDefaultTabLabel(child, idx, []),
        ),
      ),
    [active, children],
  );
  const [tabState, setTabState] = useState<TabState>(initialTabState);

  const handleChange = useCallback(
    (_: SyntheticEvent | null, value: string) => {
      setTabState((state) => state.setActiveTab(value));
    },
    [],
  );

  const handleDrop = useCallback<DropHandler>(
    ({ dragSource, toIndex }) => {
      if (sourceIsTemplate(dragSource)) {
        setTabState((state) => state.insertTab("New Tab", toIndex));
        // TODO instantiate component and add to children array
        dispatch({ type: "insert-tab", id, childId: uuid() });
      } else {
        setTabState((state) => state.moveTab(dragSource.index, toIndex));
      }
    },
    [dispatch, id],
  );

  useLayoutEffect(
    () => setTabState((state) => state.setActiveTab(state.tabs[active])),
    [active],
  );

  const useDropTargetHook = isDropTarget ? useAsDropTarget : useNotDropTarget;
  const droppableProps = useDropTargetHook();

  const className = cx(classBaseItem, "vuuGridLayoutItem", {
    [`${classBaseItem}-resizeable-h`]: resizeable === "h",
    [`${classBaseItem}-resizeable-v`]: resizeable === "v",
    [`${classBaseItem}-resizeable-vh`]: resizeable === "hv",
  });

  const style = {
    ...styleProp,
    ...layoutProps,
  };

  const stackId = `stack-${id}`;
  const tabsId = `tabs-${id}`;

  return (
    <div
      {...htmlAttributes}
      {...droppableProps}
      className={cx(className)}
      id={id}
      key={id}
      style={style}
    >
      <div className={`${classBaseItem}Header`}>
        <DragDropProvider
          dragSources={{ [tabsId]: { dropTargets: [tabsId] } }}
          onDrop={handleDrop}
        >
          <TabsNext
            onChange={handleChange}
            value={tabState.tabs[tabState.active]}
          >
            <TabBar divider>
              <TabListNext
                appearance="transparent"
                className="vuuDragContainer"
                data-drop-target={id}
                id={tabsId}
              >
                {tabState.tabs.map((label, index) => (
                  <TabNext
                    className="vuuDraggableItem"
                    data-index={index}
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
        </DragDropProvider>
      </div>
      <div className={`${classBaseItem}Content`} data-drop-target={id}>
        <Stack active={tabState.active} id={stackId} showTabs={false}>
          {children}
        </Stack>
      </div>
    </div>
  );
};
