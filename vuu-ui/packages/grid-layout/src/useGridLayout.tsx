import {
  asReactElements,
  isGridLayoutSplitDirection,
  isSimpleStateValue,
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
import { GridLayoutModel } from "./GridLayoutModel";
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
import {
  GridDragCoordinator,
  type GridDropIntent,
} from "./GridDragCoordinator";
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
  const contentRegistryRef = useRef(
    new Map(children.map((element) => [element.props.id, element])),
  );

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

      contentRegistryRef.current = new Map(
        childrenRef.current.map((element) => [element.props.id, element]),
      );
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
  const dragCoordinator = useMemo(
    () => new GridDragCoordinator(id, gridController),
    [gridController, id],
  );
  const provisionalTemplateRef = useRef<
    | {
        component: ReactElement;
        componentJson: string;
        itemId: string;
      }
    | undefined
  >(undefined);
  const [dragSourceItemId, setDragSourceItemId] = useState<string>();
  const dragAppearanceFrameRef = useRef<number | undefined>(undefined);
  const clearDragAppearance = useCallback(() => {
    if (dragAppearanceFrameRef.current !== undefined) {
      cancelAnimationFrame(dragAppearanceFrameRef.current);
      dragAppearanceFrameRef.current = undefined;
    }
    containerRef.current?.classList.remove("vuuDragging");
    setDragSourceItemId(undefined);
  }, []);
  useEffect(
    () => () => {
      clearDragAppearance();
      dragCoordinator.dispose();
    },
    [clearDragAppearance, dragCoordinator],
  );
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
  const renderedChildren = snapshot.items.flatMap(({ id: itemId }) => {
    const element = contentRegistryRef.current.get(itemId);
    return element ? [element] : [];
  });
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

  const handleDragStart = useCallback<GridLayoutDragStartHandler>(
    (_evt, options) => {
      const { current: grid } = containerRef;
      if (grid) {
        if (options.type === "text/plain") {
          const result = dragCoordinator.begin({
            itemId: options.id,
            kind: "existing-item",
            sourceGridId: id,
          });
          if (!result.ok) {
            throw Error(result.error.message);
          }
        }
        dragAppearanceFrameRef.current = requestAnimationFrame(() => {
          dragAppearanceFrameRef.current = undefined;
          grid.classList.add("vuuDragging");
          if (options.type === "text/plain") {
            setDragSourceItemId(options.id);
          }
        });
      }
    },
    [dragCoordinator, id],
  );

  const handleCancelDrag = useCallback(() => {
    clearDragAppearance();
    if (
      dragCoordinator.state.phase === "dragging" ||
      dragCoordinator.state.phase === "previewing"
    ) {
      const result = dragCoordinator.cancel();
      if (!result.ok) {
        throw Error(result.error.message);
      }
    }
    provisionalTemplateRef.current = undefined;
  }, [clearDragAppearance, dragCoordinator]);

  const handleDragEnd = useCallback<GridLayoutDragEndHandler>(
    (_evt, dropped) => {
      clearDragAppearance();
      if (!dropped) {
        handleCancelDrag();
      }
      provisionalTemplateRef.current = undefined;
    },
    [clearDragAppearance, handleCancelDrag],
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
  const prepareDragSource = useCallback(
    (dragSource: Parameters<GridLayoutDropHandler>[1]) => {
      if (sourceIsTemplate(dragSource)) {
        let provisional = provisionalTemplateRef.current;
        if (
          !provisional ||
          provisional.componentJson !== dragSource.componentJson
        ) {
          const { label = "New Item", ...restJSON } = JSON.parse(
            dragSource.componentJson,
          );
          provisional = {
            component: layoutFromJson(restJSON as LayoutJSON),
            componentJson: dragSource.componentJson,
            itemId: uuid(),
          };
          provisionalTemplateRef.current = provisional;
        }
        if (
          dragCoordinator.state.phase !== "dragging" &&
          dragCoordinator.state.phase !== "previewing"
        ) {
          const begun = dragCoordinator.begin({
            item: {
              column: { span: 1, start: 1 },
              dropTarget: true,
              header: layoutOptions?.newChildItem.header,
              id: provisional.itemId,
              resizeable: "hv",
              row: { span: 1, start: 1 },
              title: JSON.parse(dragSource.componentJson).label ?? "New Item",
            },
            kind: "palette-template",
            templateId: dragSource.componentJson,
          });
          if (!begun.ok) {
            throw Error(begun.error.message);
          }
        }
      } else if (
        sourceIsComponent(dragSource) &&
        dragCoordinator.state.phase !== "dragging" &&
        dragCoordinator.state.phase !== "previewing"
      ) {
        const begun = dragCoordinator.begin({
          itemId: dragSource.id,
          kind: "existing-item",
          sourceGridId: dragSource.layoutId,
        });
        if (!begun.ok) {
          throw Error(begun.error.message);
        }
      } else if (
        sourceIsTabbedComponent(dragSource) &&
        dragCoordinator.state.phase !== "dragging" &&
        dragCoordinator.state.phase !== "previewing"
      ) {
        const begun = dragCoordinator.begin({
          itemId: dragSource.tab.id,
          kind: "stack-member",
          selected: dragSource.isSelectedTab,
          sourceGridId: dragSource.layoutId,
          stackId: dragSource.tabsId,
        });
        if (!begun.ok) {
          throw Error(begun.error.message);
        }
      }
    },
    [dragCoordinator, layoutOptions?.newChildItem.header],
  );

  const handleDragLeave = useCallback(() => {
    const templateDrag =
      dragCoordinator.state.phase !== "idle" &&
      dragCoordinator.state.source.kind === "palette-template";
    if (dragCoordinator.state.phase === "previewing") {
      const result = dragCoordinator.clearPreview();
      if (!result.ok) {
        throw Error(result.error.message);
      }
    }
    if (templateDrag && dragCoordinator.state.phase === "dragging") {
      const result = dragCoordinator.cancel();
      if (!result.ok) {
        throw Error(result.error.message);
      }
    }
    provisionalTemplateRef.current = undefined;
  }, [dragCoordinator]);

  const handleDragPreview = useCallback<GridLayoutDropHandler>(
    (targetItemId, dragSource, position) => {
      const targetGridItem = gridModel.getChildItem(targetItemId, true);
      if (position === "centre" && isStackedItem(targetGridItem)) {
        return false;
      }
      prepareDragSource(dragSource);
      const targetId =
        isGridLayoutSplitDirection(position) && isStackedItem(targetGridItem)
          ? targetGridItem.stackId
          : targetItemId;
      const intent: GridDropIntent | undefined = isGridLayoutSplitDirection(
        position,
      )
        ? { kind: "split", position }
        : position === "centre"
          ? { kind: "replace" }
          : position === "header"
            ? { kind: "create-stack" }
            : undefined;
      if (!intent) {
        return false;
      }
      if (intent.kind !== "split") {
        const previewed = dragCoordinator.preview({
          gridId: id,
          intent,
          targetId,
        });
        if (!previewed.ok) {
          return false;
        }
        const cleared = dragCoordinator.clearPreview();
        if (!cleared.ok) {
          throw Error(cleared.error.message);
        }
        return true;
      }
      return dragCoordinator.preview({ gridId: id, intent, targetId }).ok;
    },
    [dragCoordinator, gridModel, id, prepareDragSource],
  );

  const handleDrop = useCallback<GridLayoutDropHandler>(
    (targetItemId, dragSource, position) => {
      const targetGridItem = gridModel.getChildItem(targetItemId, true);
      containerRef.current?.classList.remove("vuuDragging");

      prepareDragSource(dragSource);

      if (
        !isGridLayoutSplitDirection(position) &&
        position !== "centre" &&
        position !== "header"
      ) {
        return false;
      }
      if (position === "centre" && isStackedItem(targetGridItem)) {
        return false;
      }
      const preview = isGridLayoutSplitDirection(position)
        ? handleDragPreview(targetItemId, dragSource, position)
        : dragCoordinator.preview({
            gridId: id,
            intent:
              position === "centre"
                ? { kind: "replace" }
                : { kind: "create-stack" },
            targetId: targetItemId,
          }).ok;
      if (!preview) {
        if (
          dragCoordinator.state.phase === "dragging" ||
          dragCoordinator.state.phase === "previewing"
        ) {
          dragCoordinator.cancel();
        }
        provisionalTemplateRef.current = undefined;
        return false;
      }
      const committed = dragCoordinator.commit();
      if (!committed.ok) {
        throw Error(committed.error.message);
      }
      clearDragAppearance();

      if (!sourceIsTemplate(dragSource) && position === "centre") {
        setChildren((current) =>
          current.filter((child) => child.props.id !== targetItemId),
        );
      } else if (sourceIsTemplate(dragSource)) {
        const provisional = provisionalTemplateRef.current;
        if (!provisional) {
          throw Error(`[useGridLayout#${id}] template item id not allocated`);
        }
        const newItem = gridModel.getChildItem(provisional.itemId, true);
        if (position === "centre") {
          replaceChildComponent(targetItemId, provisional.component, newItem);
        } else {
          addChildComponent(provisional.component, newItem);
        }
        provisionalTemplateRef.current = undefined;
      }
      return true;
    },
    [
      addChildComponent,
      clearDragAppearance,
      gridModel,
      id,
      dragCoordinator,
      handleDragPreview,
      prepareDragSource,
      replaceChildComponent,
      setChildren,
    ],
  );

  const handleDetachTab = useCallback<DragContextDetachTabHandler>(
    ({ gridId, itemId, tabsId }) => {
      if (gridId === id) {
        const stack = snapshot.stacks.find(({ id }) => id === tabsId);
        if (!itemId || !stack?.itemIds.includes(itemId)) {
          throw Error(
            `[useGridLayout#${id}] cannot identify dragged tab #${itemId}`,
          );
        }
        const result = dragCoordinator.begin({
          itemId,
          kind: "stack-member",
          selected: stack?.selectedItemId === itemId,
          sourceGridId: id,
          stackId: tabsId,
        });
        if (!result.ok) {
          throw Error(result.error.message);
        }
      }
    },
    [dragCoordinator, id, snapshot],
  );

  const handleCancelTabDrag = useCallback<DragContextCancelTabDragHandler>(
    ({ gridId }) => {
      if (
        gridId === id &&
        (dragCoordinator.state.phase === "dragging" ||
          dragCoordinator.state.phase === "previewing")
      ) {
        const result = dragCoordinator.cancel();
        if (!result.ok) {
          throw Error(result.error.message);
        }
      }
    },
    [dragCoordinator, id],
  );

  const handleDropStackedItem = useCallback<DragContextDropHandler>(
    ({ dragSource, tabsId: targetStackItemId, dropPosition }) => {
      if (!targetStackItemId || !dropPosition) {
        throw Error(
          "[useGridLayout] handleDropStackedItem no details of the stacked drop target",
        );
      }
      const targetStack = snapshot.stacks.find(
        ({ id }) => id === targetStackItemId,
      );
      if (!targetStack) {
        return;
      }
      const targetItemId =
        targetStack.itemIds.find(
          (itemId) =>
            itemId === dropPosition.target ||
            snapshot.items.find(({ id }) => id === itemId)?.title ===
              dropPosition.target,
        ) ?? targetStack.itemIds.at(-1);
      if (!targetItemId) {
        return;
      }

      let component: ReactElement | undefined;
      let newChildId: string | undefined;
      if (sourceIsTemplate(dragSource)) {
        const { label = "New Item", ...restJSON } = JSON.parse(
          dragSource.componentJson,
        );
        newChildId = uuid();
        component = layoutFromJson(restJSON as LayoutJSON);
        const begun = dragCoordinator.begin({
          item: {
            column: { span: 1, start: 1 },
            dropTarget: true,
            header: layoutOptions?.newChildItem.header,
            id: newChildId,
            resizeable: "hv",
            row: { span: 1, start: 1 },
            title: label,
          },
          kind: "palette-template",
          templateId: dragSource.componentJson,
        });
        if (!begun.ok) {
          throw Error(begun.error.message);
        }
      } else if (
        sourceIsComponent(dragSource) &&
        dragCoordinator.state.phase === "idle"
      ) {
        const begun = dragCoordinator.begin({
          itemId: dragSource.id,
          kind: "existing-item",
          sourceGridId: dragSource.layoutId,
        });
        if (!begun.ok) {
          throw Error(begun.error.message);
        }
      }

      const preview = dragCoordinator.preview({
        gridId: id,
        intent: {
          kind: "stack",
          position: dropPosition.position,
          targetItemId,
        },
        targetId: targetStackItemId,
      });
      if (!preview.ok) {
        if (
          dragCoordinator.state.phase === "dragging" ||
          dragCoordinator.state.phase === "previewing"
        ) {
          dragCoordinator.cancel();
        }
        return;
      }
      const committed = dragCoordinator.commit();
      if (!committed.ok) {
        throw Error(committed.error.message);
      }
      clearDragAppearance();
      if (component && newChildId) {
        addChildComponent(component, gridModel.getChildItem(newChildId, true));
      }
    },
    [
      addChildComponent,
      clearDragAppearance,
      dragCoordinator,
      gridModel,
      id,
      layoutOptions?.newChildItem.header,
      snapshot,
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
    dragSourceItemId,
    gridController,
    gridLayoutModel,
    gridModel,
    gridSnapshot: snapshot,
    nonContentGridItems,
    onCancelDrag: handleCancelDrag,
    onCancelTabDrag: handleCancelTabDrag,
    onDetachTab: handleDetachTab,
    onDragEnd: handleDragEnd,
    onDragLeave: handleDragLeave,
    onDragPreview: handleDragPreview,
    onDragStart: handleDragStart,
    onDrop: handleDrop,
    onDropStackedItem: handleDropStackedItem,
    stackTemplates,
  };
};
