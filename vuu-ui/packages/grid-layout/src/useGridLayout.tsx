import {
  asReactElements,
  isGridLayoutSplitDirection,
  isSimpleStateValue,
  queryClosest,
  uuid,
} from "@vuu-ui/vuu-utils";
import {
  ReactElement,
  ReactNode,
  RefCallback,
  SetStateAction,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DragContextDetachTabHandler,
  DragContextDropHandler,
} from "./drag-drop-next/DragContextNext";
import { layoutFromJson } from "./layoutFromJson";
import {
  getClosestGridLayout,
  setGridColumn,
  setGridRow,
} from "./grid-dom-utils";
import {
  getActiveIndex,
  getGridArea,
  getSharedGridPosition,
} from "./grid-layout-utils";
import {
  GridLayoutDispatch,
  GridLayoutDropHandler,
  sourceIsComponent,
  sourceIsTabbedComponent,
  sourceIsTemplate,
  useGridLayoutId,
} from "./GridLayoutContext";
import { GridLayoutItem, GridLayoutItemProps } from "./GridLayoutItem";
import { GridItemRemoveReason, GridLayoutModel } from "./GridLayoutModel";
import {
  GridLayoutDragEndHandler,
  useGridChangeHandler,
  useGridLayoutOptions,
  useSavedGrid,
} from "./GridLayoutProvider";
import {
  GridChildPositionChangeHandler,
  GridColumnsAndRows,
  GridLayoutChangeHandler,
  GridLayoutDescriptor,
  GridModel,
  GridModelChildItem,
  GridTrackResizeHandler,
  ISplitter,
  isStackedItem,
  NonContentResetOptions,
  TabsChangeHandler,
  TabSelectionChangeHandler,
} from "./GridModel";
import {
  addChildToStackedGridItem,
  getGridItemChild,
} from "./react-element-utils";
import { GridLayoutDragStartHandler } from "./useDraggable";
import { LayoutJSON } from "./componentToJson";

export type GridLayoutHookProps = {
  children: ReactNode;
  id: string;
  colsAndRows?: GridColumnsAndRows;
  onChange?: GridLayoutChangeHandler;
};

type GridLayoutItemElements = Array<ReactElement<GridLayoutItemProps>>;

type NonContentGridItems = {
  splitters: ISplitter[];
  placeholders: GridModelChildItem[];
  stackedItems: GridModelChildItem[];
};

/**
 * Create the GridModel and bind model changes to DOM changes.
 * The GridModel is constructed from a GridLayoutDescriptor, which may
 * have been passed explicitly or extracted from GridLayoutItems.
 *
 * Create the list of GridLayoutItem elements to be rendered.
 * The GridLayoutItem elements may be explicitly coded in JSX.
 */
export const useGridLayout = ({
  children: childrenProp,
  id,
  colsAndRows,
  onChange,
}: GridLayoutHookProps) => {
  const containerRef = useRef<HTMLDivElement>();
  const { onChangeChildElements, onChangeLayout } = useGridChangeHandler();
  const layoutOptions = useGridLayoutOptions();

  const layoutId = useGridLayoutId();
  const getSavedGrid = useSavedGrid();

  const [, forceRender] = useState({});

  useMemo(() => {
    console.log(`colsAndRows has changed`, {
      colsAndRows,
    });
  }, [colsAndRows]);

  useMemo(() => {
    console.log(`childrenProp has changed`, {
      childrenProp,
    });
  }, [childrenProp]);

  /**
   * Construct the initial set of child elements and the GridLayoutDescriptor
   * which will be used to create the GridModel. We also save in state a copy
   * of the child elements as a map, keyed by id.
   */
  const [children, layout] = useMemo<
    [GridLayoutItemElements, GridLayoutDescriptor]
  >(() => {
    const savedGrid = getSavedGrid?.(id);
    console.log(`[useGridLayout#${id}] children has changed`, {
      savedGrid,
    });
    if (savedGrid) {
      const { components: savedChildren, layout: savedLayout } = savedGrid;
      return [Object.values(savedChildren), savedLayout];
    } else if (colsAndRows) {
      const reactElements = asReactElements(childrenProp);
      const layoutDescriptor = {
        ...colsAndRows,
      };

      return [reactElements, layoutDescriptor];
    } else {
      throw Error(
        `[useGridLayout] useMemo no saved grid details available and no layout provided. Either pass layout prop or provide layout using a GridLayoutProvider`,
      );
    }
  }, [childrenProp, getSavedGrid, id, colsAndRows]);

  // Note we initialise this ref with the initial children from props. We subsequently
  // only update it in response to manipulation of the GridLayout NOT in case of the
  // children prop changing.
  const childrenRef = useRef<GridLayoutItemElements>(children);

  console.log({ children, fromRef: childrenRef.current });

  const setChildren = useCallback(
    (
      newChildren:
        | GridLayoutItemElements
        | SetStateAction<GridLayoutItemElements>,
    ) => {
      if (isSimpleStateValue(newChildren)) {
        childrenRef.current = newChildren;
      } else {
        const { current: prev } = childrenRef;
        childrenRef.current = newChildren(prev);
      }

      onChangeChildElements?.(id, childrenRef.current);

      forceRender({});
    },
    [id, onChangeChildElements],
  );

  const [nonContentGridItems, setNonContentGridItems] =
    useState<NonContentGridItems>({
      splitters: [],
      placeholders: [],
      stackedItems: [],
    });

  useMemo(() => {
    console.log(
      `[useGridLayout] savedLayout has changed ${JSON.stringify(layout, null, 2)}`,
    );
  }, [layout]);

  const [gridModel, gridLayoutModel, containerCallback] = useMemo(
    // TODO handling runtime change of cols, rows etc currently not supported
    () => {
      // console.log(
      //   `%c[useGridLayout#${id}] useMemo create the GridModel`,
      //   "color: green",
      // );
      const gridModel = new GridModel(id, layout);
      const gridLayoutModel = new GridLayoutModel(gridModel);
      const callbackRef: RefCallback<HTMLDivElement> = (el) => {
        if (el) {
          containerRef.current = el;
        }
      };

      return [gridModel, gridLayoutModel, callbackRef];
    },
    [id, layout],
  );

  const saveGridLayout = useCallback<GridLayoutChangeHandler>(
    (id, gridLayout) => {
      onChange?.(id, gridLayout);
      onChangeLayout?.(id, gridLayout);
    },
    [onChangeLayout, onChange],
  );

  const updateGridChildItems = useCallback<GridChildPositionChangeHandler>(
    (updates, { placeholders, splitters } = NonContentResetOptions) => {
      console.log("[useGridLayout] updateGridChildItems", { updates });
      updates.forEach(([id, { column: columnPosition, row: rowPosition }]) => {
        if (columnPosition) {
          setGridColumn(id, columnPosition);
        }
        if (rowPosition) {
          setGridRow(id, rowPosition);
        }
      });

      if (splitters) {
        const splitters = gridLayoutModel.createSplitters();
        setNonContentGridItems((items) => ({ ...items, splitters }));
      }
      if (placeholders) {
        const placeholders = gridModel.getPlaceholders();
        setNonContentGridItems((items) => ({ ...items, placeholders }));
      }
    },
    [gridLayoutModel, gridModel],
  );

  const removeGridItem = useCallback(
    (id: string, reason: Extract<GridItemRemoveReason, "close" | "drag">) => {
      if (reason === "close") {
        setChildren((c) => c.filter((c) => c.props.id !== id));
      } else {
        // set a className
        // this should be set in code that handles dragging, not code that handles close
        const gridLayoutItem = gridModel.getChildItem(id, true);
        gridLayoutItem.dragging = true;
      }

      gridLayoutModel.removeGridItem(id, reason);
    },
    [gridLayoutModel, gridModel, setChildren],
  );

  const handleDragStart = useCallback<GridLayoutDragStartHandler>(
    (evt, options) => {
      console.log(`[useGridLayout] handleDragStart layoutId ${layoutId}`);

      const { current: grid } = containerRef;
      if (grid) {
        requestAnimationFrame(() => {
          grid.classList.add("vuuDragging");
          //TODO make this check more explicit
          if (options.type === "text/plain") {
            removeGridItem(options.id, "drag");
          }
        });
      }
    },
    [containerRef, layoutId, removeGridItem],
  );

  const handleDragEnd = useCallback<GridLayoutDragEndHandler>(() => {
    const { current: grid } = containerRef;
    console.log(`[useGridLayout] drag end layoutId ${layoutId}`);
    if (grid) {
      grid.classList.remove("vuuDragging");
    }
  }, [layoutId]);

  const addChildComponent = useCallback(
    (
      component: JSX.Element,
      { column, header, id, row, title, type }: GridModelChildItem,
    ) => {
      console.log(`[useGridLayout] addChildComponent #${id}`);

      // TODO we want to store components internally in a map, as well as providing an
      // array for rendering. The map will be used for persistence, to tie the component
      // to layout props - Q do we need to, can't the layout props be derived from the
      // GridLayoutItem ?

      if (type === "stacked-content") {
        const stackedGridItem = getGridItemChild(childrenRef.current, id);
        const newChild = addChildToStackedGridItem(stackedGridItem, component);
        setChildren((c) =>
          c.map((child) => (child.props.id === id ? newChild : child)),
        );
      } else {
        console.log(`[useGridLayout] header = ${header}`);
        const newChild = (
          <GridLayoutItem
            data-drop-target
            header={header}
            id={id}
            key={id}
            resizeable="hv"
            style={{
              gridArea: getGridArea({ column, row }),
            }}
            title={title}
          >
            {component}
          </GridLayoutItem>
        );
        setChildren((c) => c.concat(newChild));
      }
    },
    [setChildren],
  );

  /**
   * payload is either the id of an existing gridLayoutItem that we are dragging
   * of a json description of a new component
   */
  const handleDrop = useCallback<GridLayoutDropHandler>(
    (targetItemId, dragSource, position) => {
      // console.log(`[useGridLayout#${id}] handleDrop`, {
      //   targetItemId,
      //   dragSource,
      //   position,
      // });

      const targetGridItem = gridModel.getChildItem(targetItemId, true);

      containerRef.current?.classList.remove("vuuDragging");

      if (sourceIsComponent(dragSource)) {
        const droppedItemId = gridModel.validateChildId(dragSource.id);
        const targetId = isStackedItem(targetGridItem)
          ? targetGridItem.stackId
          : targetItemId;

        const droppedGridItem = gridModel.getChildItem(droppedItemId, true);
        droppedGridItem.dragging = false;

        // const gridItemElement = document.getElementById(droppedItemId);
        // gridItemElement?.classList.remove("vuuGridLayoutItem-dragging");

        if (isGridLayoutSplitDirection(position)) {
          gridLayoutModel.dropSplitGridItem(droppedItemId, targetId, position);

          const placeholders = gridModel.getPlaceholders();
          const splitters = gridLayoutModel.createSplitters();
          setNonContentGridItems(({ stackedItems }) => ({
            placeholders,
            splitters,
            stackedItems,
          }));
        } else if (position === "centre") {
          const { column, row } = gridLayoutModel.dropReplaceGridItem(
            droppedItemId,
            targetItemId,
          );
          setGridColumn(droppedItemId, column);
          setGridRow(droppedItemId, row);

          setChildren((c) =>
            c.filter((child) => child.props.id !== targetItemId),
          );
        } else if (position === "header") {
          gridModel.stackChildItems(targetId, dragSource.id);
          gridModel.notifyChange();
        } else {
          console.log(`[useGridLayout] how do we handle ${position}`);
        }
      } else if (sourceIsTabbedComponent(dragSource)) {
        // We are dropping a component dragged from a tabstrip and dropping it into
        // a regular grid position (i.e. not into another or same tabstrip)

        const sourceGridItem = gridModel.getChildItem(dragSource.tab.id, true);

        const targetId = isStackedItem(targetGridItem)
          ? targetGridItem.stackId
          : targetItemId;

        sourceGridItem.stackId = undefined;
        sourceGridItem.contentVisible = true;
        sourceGridItem.contentDetached = undefined;

        if (isGridLayoutSplitDirection(position)) {
          gridLayoutModel.dropSplitGridItem(
            dragSource.tab.id,
            targetId,
            position,
          );

          // Important that we defer removing the tab until after the drop
          // handling. Removing the tab will remove the entire tabstrip if
          // only one tab remains after removing the dragged tab.
          const tabState = gridModel.getTabState(dragSource.tabsId);
          tabState?.removeTab(sourceGridItem.id);

          const placeholders = gridModel.getPlaceholders();
          const splitters = gridLayoutModel.createSplitters();
          setNonContentGridItems(({ stackedItems }) => ({
            placeholders,
            splitters,
            stackedItems,
          }));
        }
      } else if (sourceIsTemplate(dragSource)) {
        // dragging from palette or similar
        const { label = "New Item", ...restJSON } = JSON.parse(
          dragSource.componentJson,
        );

        const newChildId = uuid();
        const gridModelChildItem = new GridModelChildItem({
          id: newChildId,
          column: { start: 1, end: 1 },
          dropTarget: true,
          header: layoutOptions?.newChildItem.header,
          resizeable: "hv",
          row: { start: 1, end: 1 },
          title: label,
        });
        gridModel.addChildItem(gridModelChildItem);

        const component = layoutFromJson(restJSON as LayoutJSON, "");
        if (position === "centre") {
          const newGridItem = gridLayoutModel.dropReplaceGridItem(
            gridModelChildItem.id,
            targetItemId,
          );
          addChildComponent(component, newGridItem);
        } else if (position === "header") {
          gridModel.stackChildItems(targetItemId, newChildId);
          addChildComponent(component, gridModelChildItem);
          gridModel.notifyChange();
        } else {
          gridLayoutModel.dropSplitGridItem(
            gridModelChildItem.id,
            targetItemId,
            position,
          );
          addChildComponent(component, gridModelChildItem);
          gridModel.notifyChange();
        }
      } else {
        throw Error("wtf");
      }
    },
    [
      addChildComponent,
      gridLayoutModel,
      gridModel,
      layoutOptions?.newChildItem.header,
      setChildren,
    ],
  );

  const handleDetachTab = useCallback<DragContextDetachTabHandler>(
    ({ gridId, tabsId, value }) => {
      if (gridId === id) {
        console.log(
          `[useGridLayout#${id}] handleDetachTab #${gridId}:${tabsId}`,
        );
        const tabState = gridModel.getTabState(tabsId);
        if (tabState.activeTab.label === value) {
          tabState.detachTab(value);
        }
      }
    },
    [gridModel, id],
  );

  const handleDropStackedItem = useCallback<DragContextDropHandler>(
    ({ dragSource, tabsId: targetStackItemId, dropPosition }) => {
      console.log(
        `[useGridLayout#${id}] handleDropStackedItem#${dragSource.layoutId}`,
      );

      if (sourceIsTabbedComponent(dragSource)) {
        const { id: sourceStackItemId } = queryClosest(
          document.getElementById(dragSource.tabsId),
          ".vuuGridLayoutItem",
          true,
        );

        console.log(
          `[useGridLayout#${id}] dragging tab from (#${dragSource.layoutId}) tabstrip ${sourceStackItemId} to tabstrip ${targetStackItemId}`,
        );
        if (sourceStackItemId === targetStackItemId) {
          // ignore a drag within tabstrip this is not the closest layout, it will
          // be handled by closest layout to tabstrip.
          if (dragSource.layoutId === id) {
            if (dropPosition) {
              console.log(
                `[useGridLayout] drag within tabstrip ${sourceStackItemId}`,
              );

              gridModel.moveItemWithinTabs(
                sourceStackItemId,
                dragSource.tab,
                dropPosition,
                dragSource.isSelectedTab,
              );
            } else {
              throw Error(
                "[useGridLayout] handleDropStackedItem no dropPosition for drop onto tabs",
              );
            }
          }
        } else if (sourceStackItemId && targetStackItemId && dropPosition) {
          console.log(
            `[useGridLayout] dragging from one set of tabs to another`,
          );

          gridModel.moveItemBetweenTabs(
            sourceStackItemId,
            targetStackItemId,
            dragSource.tab,
            dropPosition,
          );
        }
      } else if (targetStackItemId && dropPosition) {
        if (sourceIsComponent(dragSource)) {
          // console.log(
          //   `[useGridLayout] dropping a standalone component #${dragSource.id} into a stack ${targetStackItemId}`,
          //   {
          //     dragSource,
          //   },
          // );
          const tabState = gridModel.getTabState(targetStackItemId);
          tabState.addTab(
            { id: dragSource.id, label: dragSource.label },
            dropPosition,
          );
          const gridModelItem = gridModel.getChildItem(dragSource.id, true);
          gridModelItem.dragging = false;
        } else if (sourceIsTemplate(dragSource)) {
          // we're dropping b atemplete item onto a tabstrip. Check that
          // we are handling this in the context of the correct layout
          const gridId = getClosestGridLayout(targetStackItemId);
          if (gridId === id) {
            console.log(
              `[useGridLayout#${id}] dropping a templated source item onto a tabstrip in #${gridId}`,
            );

            const { label = "New Item", ...restJSON } = JSON.parse(
              dragSource.componentJson,
            );

            const newChildId = uuid();
            const gridModelChildItem = new GridModelChildItem({
              id: newChildId,
              column: { start: 1, end: 1 },
              dropTarget: true,
              header: layoutOptions?.newChildItem.header,
              resizeable: "hv",
              row: { start: 1, end: 1 },
              stackId: targetStackItemId,
              title: label,
            });
            gridModel.addChildItem(gridModelChildItem);

            const component = layoutFromJson(restJSON as LayoutJSON, "");
            addChildComponent(component, gridModelChildItem);
            gridModel.notifyChange();
          }
        }
      } else {
        throw Error(
          "[useGridLayout] handleDropStackedItem no details of the stacked drop target",
        );
      }
    },
    [addChildComponent, gridModel, id, layoutOptions?.newChildItem.header],
  );

  const handleTabsChange = useCallback<TabsChangeHandler>(
    (id, active, tabs) => {
      console.log(
        `[useGridLayout] handleTabsChange #${id} selected: ${active} ${JSON.stringify(tabs)}`,
      );
      forceRender({});
    },
    [],
  );

  const handleTabsCreated = useCallback((stackItem: GridModelChildItem) => {
    setNonContentGridItems(({ stackedItems, ...rest }) => ({
      ...rest,
      stackedItems: stackedItems.concat(stackItem),
    }));
  }, []);

  const handleTabsRemoved = useCallback((stackId: string) => {
    setNonContentGridItems(({ stackedItems, ...rest }) => ({
      ...rest,
      stackedItems: stackedItems.filter(({ id }) => id !== stackId),
    }));
  }, []);

  const handleTabSelectionChange = useCallback<TabSelectionChangeHandler>(
    (id, active) => {
      console.log(`[useGridLayout] handleSelectedTabChange #${id} ${active}`);
      forceRender({});
    },
    [],
  );

  const dispatchGridLayoutAction = useCallback<GridLayoutDispatch>(
    (action) => {
      switch (action.type) {
        case "close":
          removeGridItem(action.id, "close");
          break;
        case "add-child":
          {
            const { componentTemplate, title, stackId } = action;
            const componentJSON = JSON.parse(componentTemplate.componentJson);

            const newChildId = uuid();
            const gridModelChildItem = new GridModelChildItem({
              id: newChildId,
              column: { start: 1, end: 1 },
              dropTarget: true,
              header: layoutOptions?.newChildItem.header,
              resizeable: "hv",
              row: { start: 1, end: 1 },
              stackId,
              title: title ?? componentTemplate.label ?? "New Item",
            });
            gridModel.addChildItem(gridModelChildItem);

            const component = layoutFromJson(componentJSON as LayoutJSON, "");
            addChildComponent(component, gridModelChildItem);

            if (stackId) {
              const tabState = gridModel.getTabState(stackId);
              tabState.setActiveTab(title ?? gridModelChildItem.title);
            }
          }
          break;
        case "resize-grid-column":
          {
            gridModel.tracks.resizeTo(
              "column",
              action.trackIndex,
              action.value,
            );
          }
          break;
        default:
          throw Error(
            `[useGridLayout] dispatchGridLayoutAction unknown action type '${action.type}'`,
          );
      }
    },
    [
      addChildComponent,
      gridModel,
      layoutOptions?.newChildItem.header,
      removeGridItem,
    ],
  );

  const handleTrackResize = useCallback<GridTrackResizeHandler>(
    (trackType, tracks) => {
      console.log(
        `[useGridLayout] handleTrackResize ${trackType} [${tracks.join(" ")}]`,
      );
      if (containerRef.current) {
        if (trackType === "column") {
          containerRef.current.style.gridTemplateColumns = tracks.join(" ");
        } else {
          containerRef.current.style.gridTemplateRows = tracks.join(" ");
        }
      }
    },
    [],
  );

  useLayoutEffect(() => {
    /*
     * Initialise Splitters, Placeholders and UI controls for sets of stacked items.
     * Initially, stacked items will always use tabs.
     */
    const stackedItems: GridModelChildItem[] = [];
    for (const [stackId, items] of gridModel.getStackedChildItems()) {
      const tabs = gridModel.getChildItem(stackId);
      if (tabs === undefined) {
        const { column, row } = getSharedGridPosition(items);
        const activeIndex = getActiveIndex(items);
        gridModel.setTabState(stackId, items, activeIndex);
        const stackedItem = new GridModelChildItem({
          column,
          id: stackId,
          row,
          type: "stacked-content",
        });
        gridModel?.addChildItem(stackedItem);
        stackedItems.push(stackedItem);
      }
    }

    gridModel.createPlaceholders();
    const splitters = gridLayoutModel.createSplitters();
    const placeholders = gridModel.getPlaceholders();
    setNonContentGridItems({ placeholders, splitters, stackedItems });
  }, [gridModel, gridLayoutModel]);

  useEffect(() => {
    gridModel.addListener("grid-layout-change", saveGridLayout);
    gridModel.addListener("child-position-updates", updateGridChildItems);
    gridModel.addListener("tab-selection-change", handleTabSelectionChange);
    gridModel.addListener("tabs-change", handleTabsChange);
    gridModel.addListener("tabs-created", handleTabsCreated);
    gridModel.addListener("tabs-removed", handleTabsRemoved);

    gridModel.tracks.on("grid-track-resize", handleTrackResize);

    gridLayoutModel.addListener("child-position-updates", updateGridChildItems);

    return () => {
      gridModel.removeAllListeners();
    };
  }, [
    gridLayoutModel,
    gridModel,
    handleTabsChange,
    handleTabSelectionChange,
    saveGridLayout,
    updateGridChildItems,
    handleTabsCreated,
    handleTabsRemoved,
    handleTrackResize,
  ]);

  return {
    children: childrenRef.current,
    containerCallback,
    containerRef,
    dispatchGridLayoutAction,
    gridLayoutModel,
    gridModel,
    nonContentGridItems,
    onDetachTab: handleDetachTab,
    onDragEnd: handleDragEnd,
    onDragStart: handleDragStart,
    onDrop: handleDrop,
    onDropStackedItem: handleDropStackedItem,
  };
};
