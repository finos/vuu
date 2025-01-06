import {
  LayoutJSON,
  asReactElements,
  isGridLayoutSplitDirection,
  queryClosest,
  uuid,
} from "@finos/vuu-utils";
import {
  MouseEventHandler,
  ReactElement,
  RefObject,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { layoutFromJson } from "../layout-reducer";
import {
  classNameLayoutItem,
  getGridLayoutItem,
  isSplitter,
  setGridColumn,
  setGridRow,
} from "./grid-dom-utils";
import { adjustDistance, splitTrack } from "./grid-layout-utils";
import { GridLayoutProps } from "./GridLayout";
import { GridLayoutItem, GridLayoutItemProps } from "./GridLayoutItem";
import {
  GridItemRemoveReason,
  GridItemUpdate,
  GridLayoutModel,
  GridLayoutResizeOperation,
  ISplitter,
  type ResizeState,
} from "./GridLayoutModel";
import { GridLayoutProviderDispatch } from "./GridLayoutProvider";
import { GridLayoutStackedItem } from "./GridLayoutStackedtem";
import { GridModel, GridModelChildItem } from "./GridModel";
import { GridLayoutDropHandler } from "./GridPlaceholder";
import {
  addChildToStackedGridItem,
  getGridItemChild,
  getGridItemComponent,
} from "./react-element-utils";
import { GridLayoutDragStartHandler } from "./useDraggable";

export type SplitterResizingHookProps = Pick<
  GridLayoutProps,
  "children" | "id" | "onClick"
> & {
  containerRef: RefObject<HTMLElement | undefined>;
  gridModel: GridModel;
};

type NonContentGridItems = {
  splitters: ISplitter[];
  placeholders: GridModelChildItem[];
};

export const useGridSplitterResizing = ({
  children: childrenProp,
  containerRef,
  gridModel,
  onClick: onClickProp,
}: SplitterResizingHookProps) => {
  // TODO memoize this call
  const [children, setChildren] = useState<ReactElement<GridLayoutItemProps>[]>(
    asReactElements(childrenProp),
  );
  const [nonContentGridItems, setNonContentGridItems] =
    useState<NonContentGridItems>({
      splitters: [],
      placeholders: [],
    });
  const layoutModel = useMemo(
    () => new GridLayoutModel(gridModel),
    [gridModel],
  );

  const resizingState = useRef<ResizeState | undefined>();

  const applyUpdates = useCallback(
    (updates: GridItemUpdate[], resetSplitters = false) => {
      updates.forEach(([id, { column: columnPosition, row: rowPosition }]) => {
        if (columnPosition) {
          setGridColumn(id, columnPosition);
        }
        if (rowPosition) {
          setGridRow(id, rowPosition);
        }
      });

      if (resetSplitters) {
        const splitters = layoutModel.createSplitters();
        setNonContentGridItems((items) => ({ ...items, splitters }));
      }
    },
    [layoutModel],
  );

  const createNewTrackForResize = useCallback(
    (moveBy: number) => {
      const resizeOperation = moveBy < 0 ? "contract" : "expand";
      const { current: state } = resizingState;
      if (state) {
        const { splitter } = state;
        const tracks = gridModel.getTracks(splitter.orientation);

        const [contraTrackIndex, resizeTrackIndex] = splitter.resizedGridTracks;

        const newTrackIndex =
          resizeOperation === "contract" ? resizeTrackIndex : contraTrackIndex;

        const { newTracks, updates } = layoutModel.addTrackForResize(
          tracks,
          newTrackIndex,
          Math.abs(moveBy),
          resizeOperation,
          state,
        );

        if (resizeOperation === "contract") {
          splitter.resizedGridTracks[1] += 1;
          splitter.resizedGridTracks[0] += 1;
        }

        if (splitter.orientation === "horizontal") {
          gridModel.setGridCols(newTracks);
        } else {
          gridModel.setGridRows(newTracks);
        }
        applyUpdates(updates, true);
        state.resizeTrackIsShared = false;
      }
    },
    [applyUpdates, gridModel, layoutModel],
  );

  // called only during resize
  const removeTrack = useCallback(
    (
      moveBy: number,
      resizeOperation: GridLayoutResizeOperation,
      nextResizeOperation: GridLayoutResizeOperation | null,
    ) => {
      const { current: state } = resizingState;
      let restoredDistance = 0;
      if (state) {
        const { resizeTrackIsShared: resizeRequiresNewTrack, splitter } = state;

        const [contraTrackIndex, resizeTrackIndex] = splitter.resizedGridTracks;

        const targetTrack =
          resizeOperation === nextResizeOperation &&
          resizeOperation === "expand"
            ? contraTrackIndex
            : resizeTrackIndex;

        const currentTracks = gridModel.getTracks(splitter.orientation);
        restoredDistance = currentTracks[targetTrack];

        const assignDirection = resizeRequiresNewTrack
          ? resizeOperation === "expand"
            ? "bwd"
            : "fwd"
          : resizeOperation === "expand"
            ? "fwd"
            : "bwd";

        if (splitter.orientation === "horizontal") {
          const updates = gridModel.removeGridColumn(
            targetTrack,
            assignDirection,
          );
          applyUpdates(updates, true);
        } else {
          const updates = gridModel.removeGridRow(targetTrack, assignDirection);
          applyUpdates(updates, true);
        }

        if (resizeOperation === nextResizeOperation) {
          state.resizeTrackIsShared = true;
          if (resizeOperation === "expand") {
            splitter.resizedGridTracks[1] -= 1;
            splitter.resizedGridTracks[0] -= 1;
          }
        }

        const adjustedDistance = adjustDistance(moveBy, restoredDistance);
        if (adjustedDistance !== 0 && nextResizeOperation) {
          createNewTrackForResize(adjustedDistance);
        }
      }
    },
    [applyUpdates, gridModel, createNewTrackForResize],
  );

  const moveSplitter = useCallback(
    (moveBy: number) => {
      const { current: state } = resizingState;
      const directionOfTravel = moveBy < 0 ? "bwd" : "fwd";

      if (state) {
        const { splitter } = state;
        const [contraTrackIndex, resizeTrackIndex] = splitter.resizedGridTracks;
        const tracks = gridModel.getTracks(splitter.orientation);
        const reducedTrackSize =
          directionOfTravel === "fwd"
            ? tracks[contraTrackIndex]
            : tracks[resizeTrackIndex];

        if (reducedTrackSize - Math.abs(moveBy) <= 0) {
          if (directionOfTravel === "fwd") {
            removeTrack(moveBy, "expand", "expand");
          } else {
            removeTrack(moveBy, "contract", "contract");
          }
        } else {
          tracks[resizeTrackIndex] += moveBy;
          tracks[contraTrackIndex] -= moveBy;

          if (splitter.orientation === "horizontal") {
            gridModel.setGridCols(tracks);
          } else {
            gridModel.setGridRows(tracks);
          }
        }
      }
    },
    [gridModel, removeTrack],
  );

  const mouseMove = useCallback(
    ({ clientX, clientY }: MouseEvent) => {
      const { current: state } = resizingState;
      if (state) {
        const { mousePos, resizeTrackIsShared, splitter } = state;
        const newMousePos =
          splitter.orientation === "vertical" ? clientY : clientX;
        if (newMousePos !== mousePos) {
          const moveBy = mousePos - newMousePos;
          state.mousePos = newMousePos;
          if (moveBy !== 0) {
            if (resizeTrackIsShared) {
              createNewTrackForResize(moveBy);
            }
            moveSplitter(moveBy);
          }
        }
      }
    },
    [createNewTrackForResize, moveSplitter],
  );

  const mouseUp = useCallback(() => {
    document.removeEventListener("mousemove", mouseMove);
    document.removeEventListener("mouseup", mouseUp);
    // console.log(layoutModel.toDebugString());
  }, [mouseMove]);

  // TODO need to identify the expanding track and the contracting track
  // these may not necessarily be adjacent, when resizeable attribute of
  // gridItems is taken into account
  const onMouseDown = useCallback<MouseEventHandler>(
    (e) => {
      const splitterElement = e.target as HTMLDivElement;
      if (!isSplitter(splitterElement)) {
        return;
      }

      const splitter = layoutModel.getSplitterById(splitterElement.id);
      resizingState.current = {
        mousePos:
          splitter.ariaOrientation === "horizontal" ? e.clientY : e.clientX,
        resizeTrackIsShared: layoutModel.isResizeTrackShared(splitter),
        splitter,
      };

      document.addEventListener("mousemove", mouseMove);
      document.addEventListener("mouseup", mouseUp);
    },
    [layoutModel, mouseMove, mouseUp],
  );

  const selectedRef = useRef<string>();
  const clickHandler = useCallback<MouseEventHandler<HTMLDivElement>>(
    (e) => {
      const gridLayoutItem = getGridLayoutItem(e.target as HTMLElement);
      if (gridLayoutItem) {
        if (isSplitter(gridLayoutItem)) {
          // ignore
        } else {
          const { left, top } = gridLayoutItem.getBoundingClientRect();

          if (e.clientY < top || e.clientX < left) {
            return;
          }

          if (selectedRef.current) {
            const el = document.getElementById(
              selectedRef.current,
            ) as HTMLElement;
            el.classList.remove(`${classNameLayoutItem}-active`);
          }

          selectedRef.current = gridLayoutItem.id;
          gridLayoutItem.classList.add(`${classNameLayoutItem}-active`);
        }
      }
      onClickProp?.(e);
    },
    [onClickProp],
  );

  useLayoutEffect(() => {
    /*
     * Initialise Splitters and Placeholders
     */
    gridModel.createPlaceholders();
    const splitters = layoutModel.createSplitters();
    const placeholders = gridModel.getPlaceholders();
    setNonContentGridItems({ placeholders, splitters });
  }, [gridModel, layoutModel]);

  const removeGridItem = useCallback(
    (id: string, reason: Extract<GridItemRemoveReason, "close" | "drag">) => {
      if (reason === "close") {
        setChildren((c) => c.filter((c) => c.props.id !== id));
      } else {
        // set a className
        const gridItemEl = document.getElementById(id);
        if (gridItemEl) {
          gridItemEl.classList.add("vuuGridLayoutItem-dragging");
          gridItemEl.style.gridColumn = "1/1";
        }
      }

      const updates = layoutModel.removeGridItem(id, reason);

      applyUpdates(updates);

      const placeholders = gridModel.getPlaceholders();
      const splitters = layoutModel.createSplitters();
      setNonContentGridItems({ placeholders, splitters });
    },
    [applyUpdates, gridModel, layoutModel],
  );

  const dispatchGridLayoutAction = useCallback<GridLayoutProviderDispatch>(
    (action) => {
      if (action.type === "close") {
        removeGridItem(action.id, "close");
      } else if (action.type === "insert-tab") {
        console.log(`insert tab`);
      }
    },
    [removeGridItem],
  );

  const addChildComponent = useCallback(
    (component: JSX.Element, { column, id, row, type }: GridModelChildItem) => {
      if (type === "stacked-content") {
        const stackedGridItem = getGridItemChild(children, id);
        const newChild = addChildToStackedGridItem(stackedGridItem, component);
        setChildren((c) =>
          c.map((child) => (child.props.id === id ? newChild : child)),
        );
      } else {
        const newChild = (
          <GridLayoutItem
            header
            id={id}
            key={id}
            resizeable="hv"
            style={{
              gridColumnStart: column.start,
              gridColumnEnd: column.end,
              gridRowStart: row.start,
              gridRowEnd: row.end,
            }}
            title="New One"
          >
            {component}
          </GridLayoutItem>
        );
        setChildren((c) => c.concat(newChild));
      }
    },
    [children],
  );

  const replaceChildComponent = useCallback(
    (component: JSX.Element, { column, id, row, type }: GridModelChildItem) => {
      const props: Pick<GridLayoutItemProps, "id" | "resizeable" | "style"> & {
        key: string;
      } = {
        id,
        key: id,
        resizeable: "hv",
        style: {
          gridColumnStart: column.start,
          gridColumnEnd: column.end,
          gridRowStart: row.start,
          gridRowEnd: row.end,
        },
      };

      const newChild =
        type === "stacked-content" ? (
          <GridLayoutStackedItem {...props} active={1}>
            {[getGridItemComponent(children, id), component]}
          </GridLayoutStackedItem>
        ) : (
          <GridLayoutItem {...props} header title="New One">
            {component}
          </GridLayoutItem>
        );
      setChildren((c) =>
        c.map((child) => (child.props.id === id ? newChild : child)),
      );
    },
    [children],
  );

  const handleDragStart = useCallback<GridLayoutDragStartHandler>(
    (evt, options) => {
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
    [containerRef, removeGridItem],
  );

  /**
   * payload is either the id of an existing gridLayoutItem that we are dragging
   * of a json description of a new component
   */
  const handleDrop = useCallback<GridLayoutDropHandler>(
    (targetItemId, payload, position) => {
      const targetGridItem = gridModel.getChildItem(targetItemId, true);
      if (typeof payload === "string") {
        const droppedItemId = gridModel.validateChildId(payload);
        if (isGridLayoutSplitDirection(position)) {
          const updates = layoutModel.dropSplitGridItem(
            droppedItemId,
            targetItemId,
            position,
          );

          if (updates.length > 0) {
            applyUpdates(updates);
          }
          const gridItemElement = document.getElementById(droppedItemId);
          if (gridItemElement) {
            gridItemElement.classList.remove("vuuGridLayoutItem-dragging");
          }

          const placeholders = gridModel.getPlaceholders();
          const splitters = layoutModel.createSplitters();
          console.log({ splitters });
          setNonContentGridItems({ placeholders, splitters });
        } else if (position === "centre") {
          const { column, row } = layoutModel.dropReplaceGridItem(
            droppedItemId,
            targetItemId,
          );
          setGridColumn(droppedItemId, column);
          setGridRow(droppedItemId, row);

          const gridItemElement = document.getElementById(droppedItemId);
          if (gridItemElement) {
            gridItemElement.classList.remove("vuuGridLayoutItem-dragging");
          }

          setChildren((c) =>
            c.filter((child) => child.props.id !== targetItemId),
          );
        } else {
          console.log(`how do we handle ${position}`);
        }
      } else {
        // dragging from palette or similar
        const { type } = targetGridItem;
        // TODO look at how we manage component id values
        const gridModelChildItem = new GridModelChildItem({
          id: uuid(),
          column: { start: 1, end: 1 },
          row: { start: 1, end: 1 },
        });
        gridModel.addChildItem(gridModelChildItem);

        const component = layoutFromJson(
          { ...payload, id: gridModelChildItem.id } as LayoutJSON,
          "",
        );
        if (position === "centre") {
          const newGridItem = layoutModel.dropReplaceGridItem(
            gridModelChildItem.id,
            targetItemId,
          );
          addChildComponent(component, newGridItem);
        } else if (position === "tabs") {
          if (type === "content") {
            // all this does is change the type
            const newGridItem = layoutModel.dropReplaceGridItem(
              targetItemId,
              "stacked-content",
            );
            replaceChildComponent(component, newGridItem);
          } else if (type === "stacked-content") {
            addChildComponent(component, targetGridItem);
          } else {
            console.log(`how do we handle tabs ${type}`);
          }
        } else {
          const updates = layoutModel.dropSplitGridItem(
            gridModelChildItem.id,
            targetItemId,
            position,
          );

          if (updates.length > 0) {
            applyUpdates(
              updates.filter(([id]) => id !== gridModelChildItem.id),
            );
            addChildComponent(component, gridModelChildItem);
            console.log(gridModel.toDebugString());
          }
        }
      }
    },
    [
      addChildComponent,
      applyUpdates,
      gridModel,
      layoutModel,
      replaceChildComponent,
    ],
  );

  const api_addGridColumn = useCallback(
    (gridItemId: string) => {
      const gridItem = gridModel.getChildItem(gridItemId, true);
      const resizeDirection = "horizontal";
      const {
        column: { start },
      } = gridItem;
      const trackIndex = start - 1;
      const columns = splitTrack(gridModel.cols, trackIndex);

      gridModel.setGridCols(columns);
      const updates = layoutModel.addTrack(trackIndex, resizeDirection);
      if (updates.length > 0) {
        applyUpdates(updates, true);
      }
    },
    [applyUpdates, gridModel, layoutModel],
  );

  const api_addGridRow = useCallback((gridItemId: string) => {
    console.log(`addGridRow ${gridItemId}`);
  }, []);

  const api_removeGridColumn = useCallback(
    (trackIndex: number) => {
      console.log(`api_removeGridColumn [${trackIndex}]`);
      const { current: grid } = containerRef;
      if (grid) {
        const updates = gridModel.removeGridColumn(trackIndex);
        applyUpdates(updates, true);
      }
    },
    [applyUpdates, containerRef, gridModel],
  );

  const api_splitGridCol = useCallback((gridItemId: string) => {
    // const target = document.getElementById(gridItemId) as HTMLElement;
    // const { tracks, updates } = layoutModel.splitGridItem(
    //   gridItemId,
    //   "west",
    //   gridModel.cols,
    // );
    // if (updates.length > 0) {
    //   gridModel.setGridCols(tracks);
    //   applyUpdates(updates);
    //   gridModel.createPlaceholders();
    //   const placeholders = gridModel.getPlaceholders();
    //   const splitters = layoutModel.getSplitterPositions();
    //   setNonContentGridItems({ placeholders, splitters });
    // add placeholders to the layoutMap
    // }
  }, []);

  const api_splitGridRow = useCallback((gridItemId: string) => {
    // const target = document.getElementById(gridItemId) as HTMLElement;
    // const { tracks, updates } = layoutModel.splitGridItem(
    //   gridItemId,
    //   "north",
    //   gridModel.rows,
    // );
    // if (updates.length > 0) {
    //   // TODO move all into model
    //   gridModel.setGridRows(tracks);
    //   applyUpdates(updates);
    //   gridModel.createPlaceholders();
    //   const placeholders = gridModel.getPlaceholders();
    //   const splitters = layoutModel.getSplitterPositions();
    //   setNonContentGridItems({ placeholders, splitters });
    // }
  }, []);

  return {
    addGridColumn: api_addGridColumn,
    addGridRow: api_addGridRow,
    children,
    dispatchGridLayoutAction,
    onClick: clickHandler,
    onDragStart: handleDragStart,
    onDrop: handleDrop,
    onMouseDown,
    removeGridColumn: api_removeGridColumn,
    splitGridCol: api_splitGridCol,
    splitGridRow: api_splitGridRow,
    nonContentGridItems,
  };
};
