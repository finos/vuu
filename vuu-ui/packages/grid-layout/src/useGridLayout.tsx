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
  DragContextCancelTabDragHandler,
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
import {
  GridCommandExecutionError,
  LegacyGridCommandExecutor,
  throwForGridCommandFailure,
} from "./GridCommand";
import { GridController } from "./GridController";

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

const assertNeverGridLayoutAction = (action: never): never => {
  throw new GridCommandExecutionError({
    code: "UNSUPPORTED_ACTION",
    message: `Unsupported GridLayoutAction: ${JSON.stringify(action)}`,
  });
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
  const containerRef = useRef<HTMLDivElement>(null);
  const { onChangeChildElements, onChangeLayout } = useGridChangeHandler();
  const layoutOptions = useGridLayoutOptions();

  const layoutId = useGridLayoutId();
  const getSavedGrid = useSavedGrid();

  const [, forceRender] = useState({});

  /**
   * Construct the initial set of child elements and the GridLayoutDescriptor
   * which will be used to create the GridModel. We also save in state a copy
   * of the child elements as a map, keyed by id.
   */
  const [[children, layout]] = useState<
    [GridLayoutItemElements, GridLayoutDescriptor]
  >(() => {
    const savedGrid = getSavedGrid?.(id);
    if (savedGrid) {
      const { components: savedChildren, layout: savedLayout } = savedGrid;
      return [Object.values(savedChildren), savedLayout];
    } else if (colsAndRows) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const reactElements = asReactElements(childrenProp) as any;
      const layoutDescriptor = {
        ...colsAndRows,
      };

      return [reactElements, layoutDescriptor];
    } else {
      throw Error(
        "[useGridLayout] no saved grid details available and no layout provided. Either pass layout props or provide a layout using GridLayoutProvider",
      );
    }
  });

  // Note we initialise this ref with the initial children from props. We subsequently
  // only update it in response to manipulation of the GridLayout NOT in case of the
  // children prop changing.
  const childrenRef = useRef<GridLayoutItemElements>(children);

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
  const dragStartLayoutRef = useRef<GridLayoutDescriptor | undefined>(
    undefined,
  );
  const gridController = useMemo(
    () =>
      new GridController(
        gridModel,
        0,
        new LegacyGridCommandExecutor(gridModel, gridLayoutModel),
      ),
    [gridLayoutModel, gridModel],
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
      const { current: grid } = containerRef;
      if (grid) {
        if (options.type === "text/plain") {
          dragStartLayoutRef.current = gridModel.toGridLayoutDescriptor();
        }
        requestAnimationFrame(() => {
          grid.classList.add("vuuDragging");
          //TODO make this check more explicit
          if (options.type === "text/plain") {
            removeGridItem(options.id, "drag");
          }
        });
      }
    },
    [gridModel, removeGridItem],
  );

  const handleDragEnd = useCallback<GridLayoutDragEndHandler>(
    (_evt, dropped) => {
      containerRef.current?.classList.remove("vuuDragging");
      if (!dropped && dragStartLayoutRef.current) {
        gridModel.restoreLayout(dragStartLayoutRef.current);
        setNonContentGridItems((items) => ({
          ...items,
          placeholders: gridModel.getPlaceholders(),
          splitters: gridLayoutModel.createSplitters(),
        }));
      }
      dragStartLayoutRef.current = undefined;
    },
    [gridLayoutModel, gridModel],
  );

  const addChildComponent = useCallback(
    (
      component: ReactElement,
      { column, header, id, row, title, type }: GridModelChildItem,
    ) => {
      // TODO we want to store components internally in a map, as well as providing an
      // array for rendering. The map will be used for persistence, to tie the component
      // to layout props - Q do we need to, can't the layout props be derived from the
      // GridLayoutItem ?

      if (type === "stacked-content") {
        const stackedGridItem = getGridItemChild(childrenRef.current, id);
        const newChild = addChildToStackedGridItem(
          stackedGridItem,
          component,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ) as any;
        setChildren((c) =>
          c.map((child) => (child.props.id === id ? newChild : child)),
        );
      } else {
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

  const replaceChildComponent = useCallback(
    (
      targetItemId: string,
      component: ReactElement,
      { column, header, id, row, title }: GridModelChildItem,
    ) => {
      // TODO we want to store components internally in a map, as well as providing an
      // array for rendering. The map will be used for persistence, to tie the component
      // to layout props - Q do we need to, can't the layout props be derived from the
      // GridLayoutItem ?

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
      setChildren((c) =>
        c.map((child) => (child.props.id === targetItemId ? newChild : child)),
      );
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
      const splitTargetId = isStackedItem(targetGridItem)
        ? targetGridItem.stackId
        : targetItemId;

      containerRef.current?.classList.remove("vuuDragging");

      if (
        isGridLayoutSplitDirection(position) &&
        !gridLayoutModel.canSplitGridItem(splitTargetId, position)
      ) {
        if (sourceIsComponent(dragSource) && dragStartLayoutRef.current) {
          gridModel.restoreLayout(dragStartLayoutRef.current);
          dragStartLayoutRef.current = undefined;
          setNonContentGridItems((items) => ({
            ...items,
            placeholders: gridModel.getPlaceholders(),
            splitters: gridLayoutModel.createSplitters(),
          }));
        }
        return false;
      }

      if (sourceIsComponent(dragSource)) {
        dragStartLayoutRef.current = undefined;
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
          const stackId = droppedGridItem.stackId;
          if (!stackId) {
            throw Error(
              `[useGridLayout#${id}] stacked component #${droppedItemId} has no stack id`,
            );
          }
          gridModel.selectStackItem(stackId, droppedItemId);
          gridModel.notifyChange();
        }
      } else if (sourceIsTabbedComponent(dragSource)) {
        // We are dropping a component dragged from a tabstrip and dropping it into
        // a regular grid position (i.e. not into another or same tabstrip)
        if (!isGridLayoutSplitDirection(position)) {
          return false;
        }

        const sourceGridItem = gridModel.getChildItem(dragSource.tab.id, true);

        const targetId = isStackedItem(targetGridItem)
          ? targetGridItem.stackId
          : targetItemId;

        sourceGridItem.stackId = undefined;
        sourceGridItem.contentVisible = true;
        sourceGridItem.contentDetached = undefined;

        gridLayoutModel.dropSplitGridItem(
          dragSource.tab.id,
          targetId,
          position,
        );

        // Important that we defer removing the tab until after the drop
        // handling. Removing the tab will remove the entire tabstrip if
        // only one tab remains after removing the dragged tab.
        const removed = gridModel.removeStackItem(
          dragSource.tabsId,
          sourceGridItem.id,
        );
        if (!removed.ok) {
          throw Error(removed.error.message);
        }

        const placeholders = gridModel.getPlaceholders();
        const splitters = gridLayoutModel.createSplitters();
        setNonContentGridItems(({ stackedItems }) => ({
          placeholders,
          splitters,
          stackedItems,
        }));
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

        const targetId = isStackedItem(targetGridItem)
          ? targetGridItem.stackId
          : targetItemId;

        const component = layoutFromJson(restJSON as LayoutJSON);
        if (position === "centre") {
          const newGridItem = gridLayoutModel.dropReplaceGridItem(
            gridModelChildItem.id,
            targetItemId,
          );
          replaceChildComponent(targetItemId, component, newGridItem);
          gridModel.notifyChange();
        } else if (position === "header") {
          gridModel.stackChildItems(targetItemId, newChildId);
          const stackId = gridModel.getChildItem(newChildId, true).stackId;
          if (!stackId) {
            throw Error(
              `[useGridLayout#${id}] stacked template #${newChildId} has no stack id`,
            );
          }
          gridModel.selectStackItem(stackId, newChildId);
          addChildComponent(component, gridModelChildItem);
          gridModel.notifyChange();
        } else {
          gridLayoutModel.dropSplitGridItem(
            gridModelChildItem.id,
            targetId,
            position,
          );
          addChildComponent(component, gridModelChildItem);
          gridModel.notifyChange();
        }
      } else {
        throw Error(
          `[useGridLayout#${id}] unsupported drag source type for GridLayout drop`,
        );
      }
      return true;
    },
    [
      addChildComponent,
      gridLayoutModel,
      gridModel,
      layoutOptions?.newChildItem.header,
      replaceChildComponent,
      setChildren,
    ],
  );

  const handleDetachTab = useCallback<DragContextDetachTabHandler>(
    ({ gridId, tabsId, value }) => {
      if (gridId === id) {
        gridModel.detachTab(tabsId, value);
      }
    },
    [gridModel, id],
  );

  const handleCancelTabDrag = useCallback<DragContextCancelTabDragHandler>(
    ({ gridId, tabsId, value }) => {
      if (gridId === id) {
        gridModel.restoreDetachedTab(tabsId, value);
      }
    },
    [gridModel, id],
  );

  const handleDropStackedItem = useCallback<DragContextDropHandler>(
    ({ dragSource, tabsId: targetStackItemId, dropPosition }) => {
      if (sourceIsTabbedComponent(dragSource)) {
        const { id: sourceStackItemId } = queryClosest(
          document.getElementById(dragSource.tabsId),
          ".vuuGridLayoutItem",
          true,
        );

        if (sourceStackItemId === targetStackItemId) {
          // ignore a drag within tabstrip this is not the closest layout, it will
          // be handled by closest layout to tabstrip.
          if (dragSource.layoutId === id) {
            if (dropPosition) {
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
          const added = gridModel.addStackMember(
            targetStackItemId,
            dragSource.id,
            dropPosition,
          );
          if (!added.ok) {
            throw Error(added.error.message);
          }
          const gridModelItem = gridModel.getChildItem(dragSource.id, true);
          gridModelItem.dragging = false;
        } else if (sourceIsTemplate(dragSource)) {
          // we're dropping a template item onto a tabstrip. Check that
          // we are handling this in the context of the correct layout
          const gridId = getClosestGridLayout(targetStackItemId);
          if (gridId === id) {
            const { label = "New Item", ...restJSON } = JSON.parse(
              dragSource.componentJson,
            );
            const { column, row } = gridModel.getChildItem(
              targetStackItemId,
              true,
            );

            const newChildId = uuid();
            const gridModelChildItem = new GridModelChildItem({
              id: newChildId,
              column,
              dropTarget: true,
              header: layoutOptions?.newChildItem.header,
              resizeable: "hv",
              row,
              stackId: targetStackItemId,
              title: label,
            });
            gridModel.addChildItem(gridModelChildItem, dropPosition);

            const component = layoutFromJson(restJSON as LayoutJSON);
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

  const handleTabsChange = useCallback<TabsChangeHandler>(() => {
    const splitters = gridLayoutModel.createSplitters();
    setNonContentGridItems((items) => ({ ...items, splitters }));
  }, [gridLayoutModel]);

  const handleTabsCreated = useCallback(
    (stackItem: GridModelChildItem) => {
      const splitters = gridLayoutModel.createSplitters();
      setNonContentGridItems(({ stackedItems, ...rest }) => ({
        ...rest,
        splitters,
        stackedItems: stackedItems.concat(stackItem),
      }));
    },
    [gridLayoutModel],
  );

  const handleTabsRemoved = useCallback(
    (stackId: string) => {
      const splitters = gridLayoutModel.createSplitters();
      setNonContentGridItems(({ stackedItems, ...rest }) => ({
        ...rest,
        splitters,
        stackedItems: stackedItems.filter(({ id }) => id !== stackId),
      }));
    },
    [gridLayoutModel],
  );

  const handleTabSelectionChange =
    useCallback<TabSelectionChangeHandler>(() => {
      forceRender({});
    }, []);

  const dispatchGridLayoutAction = useCallback<GridLayoutDispatch>(
    (action) => {
      switch (action.type) {
        case "close": {
          throwForGridCommandFailure(
            gridController.dispatch({
              itemId: action.id,
              reason: "close",
              type: "remove-item",
            }),
          );
          setChildren((children) =>
            children.filter((child) => child.props.id !== action.id),
          );
          break;
        }
        case "rename-tab":
          throwForGridCommandFailure(
            gridController.dispatch({
              itemId: action.id,
              title: action.title,
              type: "rename-item",
            }),
          );
          break;
        case "add-tabbed-child":
          {
            const { componentTemplate, title, stackId } = action;
            const { componentJson, dropTarget = true } = componentTemplate;
            const componentJSON = JSON.parse(componentJson);
            const { column, row } = gridModel.getChildItem(stackId, true);

            const newChildId = uuid();
            throwForGridCommandFailure(
              gridController.dispatch({
                item: {
                  id: newChildId,
                  column: {
                    span: column.end - column.start,
                    start: column.start,
                  },
                  dropTarget: dropTarget || undefined,
                  header: layoutOptions?.newChildItem.header,
                  resizeable: "hv",
                  row: { span: row.end - row.start, start: row.start },
                  title: title ?? componentTemplate.label ?? "New Item",
                },
                stackId,
                type: "add-stack-item",
              }),
            );
            const gridModelChildItem = gridModel.getChildItem(newChildId, true);

            const component = layoutFromJson({
              ...componentJSON,
              title,
            } as LayoutJSON);
            addChildComponent(component, gridModelChildItem);

            throwForGridCommandFailure(
              gridController.dispatch({
                itemId: newChildId,
                stackId,
                type: "select-stack-item",
              }),
            );
            gridModel.notifyChange();
          }
          break;
        case "resize-grid-column":
          throwForGridCommandFailure(
            gridController.dispatch({
              index: action.trackIndex,
              size: action.value,
              track: "column",
              type: "resize-track",
            }),
          );
          break;
        case "resize-grid-row":
          throwForGridCommandFailure(
            gridController.dispatch({
              index: action.trackIndex,
              size: action.value,
              track: "row",
              type: "resize-track",
            }),
          );
          break;
        case "select-tab":
          throwForGridCommandFailure(
            gridController.dispatch({
              itemId: action.itemId,
              stackId: action.stackId,
              type: "select-stack-item",
            }),
          );
          break;
        case "switch-tab":
          throw new GridCommandExecutionError({
            code: "UNSUPPORTED_ACTION",
            message:
              "GridLayoutAction 'switch-tab' has no supported legacy semantics",
          });
        default:
          return assertNeverGridLayoutAction(action);
      }
    },
    [
      addChildComponent,
      gridController,
      gridModel,
      layoutOptions?.newChildItem.header,
      setChildren,
    ],
  );

  const handleTrackResize = useCallback<GridTrackResizeHandler>(
    (trackType, tracks) => {
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
    onCancelTabDrag: handleCancelTabDrag,
    onDetachTab: handleDetachTab,
    onDragEnd: handleDragEnd,
    onDragStart: handleDragStart,
    onDrop: handleDrop,
    onDropStackedItem: handleDropStackedItem,
  };
};
