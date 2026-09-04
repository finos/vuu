import {
  asReactElements,
  isGridLayoutSplitDirection,
  isSimpleStateValue,
  queryClosest,
  uuid,
} from "@vuu-ui/vuu-utils";
import {
  type ReactElement,
  type ReactNode,
  type RefCallback,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  DragContextCancelTabDragHandler,
  DragContextDetachTabHandler,
  DragContextDropHandler,
} from "./drag-drop-next/DragContextNext";
import { layoutFromJson } from "./layoutFromJson";
import { getClosestGridLayout } from "./grid-dom-utils";
import {
  getActiveIndex,
  getGridArea,
  getSharedGridPosition,
} from "./grid-layout-utils";
import {
  type GridLayoutDispatch,
  type GridLayoutDropHandler,
  sourceIsComponent,
  sourceIsTabbedComponent,
  sourceIsTemplate,
} from "./GridLayoutContext";
import {
  GridLayoutItem,
  type GridLayoutItemProps,
  isGridLayoutItem,
} from "./GridLayoutItem";
import { type GridItemRemoveReason, GridLayoutModel } from "./GridLayoutModel";
import {
  type GridLayoutDragEndHandler,
  useGridChangeHandler,
  useGridLayoutOptions,
  useSavedGrid,
} from "./GridLayoutProvider";
import {
  type GridColumnsAndRows,
  type GridLayoutChangeHandler,
  type GridLayoutDescriptor,
  GridModel,
  GridModelChildItem,
  type ISplitter,
  isStackedItem,
} from "./GridModel";
import {
  addChildToStackedGridItem,
  getGridItemChild,
} from "./react-element-utils";
import type { GridLayoutDragStartHandler } from "./useDraggable";
import type { LayoutJSON } from "./componentToJson";
import {
  GridCommandExecutionError,
  LegacyGridCommandExecutor,
  throwForGridCommandFailure,
} from "./GridCommand";
import { GridController } from "./GridController";
import type { GridTransaction } from "./GridController";
import { gridSnapshotToGridLayoutDescriptor } from "./grid-snapshot-adapters";
import { isGridLayoutStackedItem } from "./GridLayoutStackedtem";
import { useGridControllerSnapshot } from "./useGridControllerSnapshot";

export type GridLayoutHookProps = {
  children: ReactNode;
  id: string;
  colsAndRows?: GridColumnsAndRows;
  onChange?: GridLayoutChangeHandler;
};

type GridLayoutItemElements = Array<ReactElement<GridLayoutItemProps>>;

type NonContentGridItems = {
  splitters: ISplitter[];
  placeholderIds: string[];
  stackIds: string[];
};

const layoutDescriptorFromChildren = (
  colsAndRows: GridColumnsAndRows,
  children: GridLayoutItemElements,
): GridLayoutDescriptor => {
  const stackTemplates = new Map(
    children
      .filter(isGridLayoutStackedItem)
      .map((element) => [element.props.id, element.props]),
  );
  return {
    ...colsAndRows,
    gridLayoutItems: Object.fromEntries(
      children.filter(isGridLayoutItem).map(({ props }) => {
        const {
          contentVisible,
          "data-drop-target": dropTarget,
          header,
          id,
          minHeight,
          minWidth,
          resizeable,
          stackId,
          style,
          title,
        } = props;
        const stackTemplate = stackId ? stackTemplates.get(stackId) : undefined;
        const gridArea = style?.gridArea ?? stackTemplate?.style?.gridArea;
        if (!gridArea) {
          throw Error(`[useGridLayout] GridLayoutItem #${id} has no gridArea`);
        }
        return [
          id,
          {
            contentVisible,
            dropTarget,
            gridArea,
            header,
            minHeight: minHeight ?? stackTemplate?.minHeight,
            minWidth: minWidth ?? stackTemplate?.minWidth,
            resizeable: resizeable ?? stackTemplate?.resizeable,
            stackId,
            title,
          },
        ];
      }),
    ),
  };
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

  const getSavedGrid = useSavedGrid();

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
      const reactElements = asReactElements(
        childrenProp,
      ) as GridLayoutItemElements;
      const layoutDescriptor = layoutDescriptorFromChildren(
        colsAndRows,
        reactElements,
      );

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
  const [childElements, setChildElements] =
    useState<GridLayoutItemElements>(children);
  const childrenRef = useRef<GridLayoutItemElements>(childElements);

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

      setChildElements(childrenRef.current);
      onChangeChildElements?.(id, childrenRef.current.filter(isGridLayoutItem));
    },
    [id, onChangeChildElements],
  );

  const [gridModel, gridLayoutModel, containerCallback] = useMemo(
    // TODO handling runtime change of cols, rows etc currently not supported
    () => {
      // console.log(
      //   `%c[useGridLayout#${id}] useMemo create the GridModel`,
      //   "color: green",
      // );
      const gridModel = new GridModel(id, layout);
      for (const [stackId, items] of gridModel.getStackedChildItems()) {
        if (gridModel.getChildItem(stackId) === undefined) {
          const { column, row } = getSharedGridPosition(items);
          const stackTemplate = children.find(
            (element) =>
              isGridLayoutStackedItem(element) && element.props.id === stackId,
          );
          gridModel.setTabState(stackId, items, getActiveIndex(items));
          gridModel.addChildItem(
            new GridModelChildItem({
              column,
              id: stackId,
              minHeight: stackTemplate?.props.minHeight,
              minWidth: stackTemplate?.props.minWidth,
              resizeable: stackTemplate?.props.resizeable,
              row,
              type: "stacked-content",
            }),
          );
        }
      }
      gridModel.createPlaceholders();
      const gridLayoutModel = new GridLayoutModel(gridModel);
      const callbackRef: RefCallback<HTMLDivElement> = (el) => {
        if (el) {
          containerRef.current = el;
        }
      };

      return [gridModel, gridLayoutModel, callbackRef];
    },
    [children, id, layout],
  );
  const dragStartLayoutRef = useRef<GridLayoutDescriptor | undefined>(
    undefined,
  );
  const dragTransactionRef = useRef<GridTransaction | undefined>(undefined);
  const gridController = useMemo(
    () =>
      new GridController(
        gridModel,
        0,
        new LegacyGridCommandExecutor(gridModel, gridLayoutModel),
      ),
    [gridLayoutModel, gridModel],
  );
  const snapshot = useGridControllerSnapshot(gridController);
  const beginLegacyDragTransaction = useCallback(() => {
    if (dragTransactionRef.current) {
      return dragTransactionRef.current;
    }
    const result = gridController.beginTransaction("drag");
    if (!result.ok) {
      throw Error(result.error.message);
    }
    dragTransactionRef.current = result.transaction;
    return result.transaction;
  }, [gridController]);
  const publishLegacyDragMutation = useCallback(() => {
    const transaction = dragTransactionRef.current;
    const result = transaction
      ? transaction.dispatch({ type: "regenerate-placeholders" })
      : gridController.dispatch({ type: "regenerate-placeholders" });
    throwForGridCommandFailure(result);
  }, [gridController]);
  const commitLegacyDragTransaction = useCallback(() => {
    const transaction = dragTransactionRef.current;
    if (transaction) {
      const result = transaction.commit();
      if (!result.ok) {
        throw Error(result.error.message);
      }
      dragTransactionRef.current = undefined;
    }
  }, []);
  const rollbackLegacyDragTransaction = useCallback(() => {
    const transaction = dragTransactionRef.current;
    if (transaction) {
      const result = transaction.rollback();
      if (!result.ok) {
        throw Error(result.error.message);
      }
      dragTransactionRef.current = undefined;
    }
  }, []);
  const contentIds = useMemo(
    () =>
      new Set(
        childElements.filter(isGridLayoutItem).map(({ props: { id } }) => id),
      ),
    [childElements],
  );
  const stackTemplates = useMemo(
    () =>
      new Map(
        childElements
          .filter(isGridLayoutStackedItem)
          .map((element) => [element.props.id, element]),
      ),
    [childElements],
  );
  const renderedChildren = useMemo(
    () =>
      snapshot.items.flatMap(({ id: itemId }) => {
        const element = childElements.find(
          ({ props: { id: elementId } }) => elementId === itemId,
        );
        return element ? [element] : [];
      }),
    [childElements, snapshot],
  );
  const nonContentGridItems = useMemo<NonContentGridItems>(
    () => ({
      placeholderIds: snapshot.items
        .filter(({ id: itemId }) => !contentIds.has(itemId))
        .map(({ id: itemId }) => itemId),
      splitters: gridLayoutModel.createSplitters(),
      stackIds: snapshot.stacks.map(({ id: stackId }) => stackId),
    }),
    [contentIds, gridLayoutModel, snapshot],
  );

  const saveGridLayout = useCallback<GridLayoutChangeHandler>(
    (id, gridLayout) => {
      onChange?.(id, gridLayout);
      onChangeLayout?.(id, gridLayout);
    },
    [onChangeLayout, onChange],
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
    (_evt, options) => {
      const { current: grid } = containerRef;
      if (grid) {
        if (options.type === "text/plain") {
          dragStartLayoutRef.current = gridModel.toGridLayoutDescriptor();
          beginLegacyDragTransaction();
        }
        requestAnimationFrame(() => {
          grid.classList.add("vuuDragging");
          //TODO make this check more explicit
          if (options.type === "text/plain") {
            removeGridItem(options.id, "drag");
            publishLegacyDragMutation();
          }
        });
      }
    },
    [
      beginLegacyDragTransaction,
      gridModel,
      publishLegacyDragMutation,
      removeGridItem,
    ],
  );

  const handleDragEnd = useCallback<GridLayoutDragEndHandler>(
    (_evt, dropped) => {
      containerRef.current?.classList.remove("vuuDragging");
      if (!dropped && dragStartLayoutRef.current) {
        gridModel.restoreLayout(dragStartLayoutRef.current);
        rollbackLegacyDragTransaction();
      } else if (dropped) {
        commitLegacyDragTransaction();
      }
      dragStartLayoutRef.current = undefined;
    },
    [commitLegacyDragTransaction, gridModel, rollbackLegacyDragTransaction],
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
        ) as ReactElement<GridLayoutItemProps>;
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
          rollbackLegacyDragTransaction();
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
        } else if (position === "centre") {
          gridLayoutModel.dropReplaceGridItem(droppedItemId, targetItemId);
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
        } else {
          gridLayoutModel.dropSplitGridItem(
            gridModelChildItem.id,
            targetId,
            position,
          );
          addChildComponent(component, gridModelChildItem);
        }
      } else {
        throw Error(
          `[useGridLayout#${id}] unsupported drag source type for GridLayout drop`,
        );
      }
      publishLegacyDragMutation();
      commitLegacyDragTransaction();
      return true;
    },
    [
      addChildComponent,
      gridLayoutModel,
      gridModel,
      id,
      layoutOptions?.newChildItem.header,
      commitLegacyDragTransaction,
      publishLegacyDragMutation,
      replaceChildComponent,
      rollbackLegacyDragTransaction,
      setChildren,
    ],
  );

  const handleDetachTab = useCallback<DragContextDetachTabHandler>(
    ({ gridId, tabsId, value }) => {
      if (gridId === id) {
        beginLegacyDragTransaction();
        gridModel.detachTab(tabsId, value);
        publishLegacyDragMutation();
      }
    },
    [beginLegacyDragTransaction, gridModel, id, publishLegacyDragMutation],
  );

  const handleCancelTabDrag = useCallback<DragContextCancelTabDragHandler>(
    ({ gridId }) => {
      if (gridId === id) {
        rollbackLegacyDragTransaction();
      }
    },
    [id, rollbackLegacyDragTransaction],
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
          }
        }
      } else {
        throw Error(
          "[useGridLayout] handleDropStackedItem no details of the stacked drop target",
        );
      }
      publishLegacyDragMutation();
      commitLegacyDragTransaction();
    },
    [
      addChildComponent,
      commitLegacyDragTransaction,
      gridModel,
      id,
      layoutOptions?.newChildItem.header,
      publishLegacyDragMutation,
    ],
  );

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

  useEffect(() => {
    return gridController.subscribeCommitted(({ snapshot }) => {
      saveGridLayout(id, gridSnapshotToGridLayoutDescriptor(snapshot));
    });
  }, [gridController, id, saveGridLayout]);

  return {
    children: renderedChildren,
    containerCallback,
    containerRef,
    dispatchGridLayoutAction,
    gridController,
    gridLayoutModel,
    gridModel,
    gridSnapshot: snapshot,
    nonContentGridItems,
    onCancelTabDrag: handleCancelTabDrag,
    onDetachTab: handleDetachTab,
    onDragEnd: handleDragEnd,
    onDragStart: handleDragStart,
    onDrop: handleDrop,
    onDropStackedItem: handleDropStackedItem,
    stackTemplates,
  };
};
