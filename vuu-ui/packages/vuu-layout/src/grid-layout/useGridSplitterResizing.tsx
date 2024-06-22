import {
  GridLayoutModel,
  ISplitter,
  GridLayoutResizeOperation,
  GridLayoutModelPosition,
  GridLayoutResizeDirection,
  GridLayoutProviderDispatch,
  ResizeState,
  IPlaceholder,
  GridLayoutMap,
  getRows,
  getColumns,
  splitTrack,
  // TODO rename this
  removeTrackFromTracks,
  adjustDistance,
  GridLayoutDropHandler,
  layoutFromJson,
  IGridLayoutModelItem,
  gridResizeDirectionFromDropPosition,
  LayoutJSON,
} from "@finos/vuu-layout";
import { asReactElements, queryClosest } from "@finos/vuu-utils";
import React, {
  MouseEventHandler,
  ReactElement,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  classNameLayoutItem,
  getGridLayoutItem,
  getGridItemProps,
  isHorizontalSplitter,
  isSplitter,
  setGridColumn,
  setGridRow,
  setGridTrackTemplate,
} from "@finos/vuu-layout";
import {
  GridLayoutItem,
  GridLayoutItemProps,
  GridLayoutProps,
} from "./GridLayout";

export type SplitterResizingHookProps = Pick<
  GridLayoutProps,
  "children" | "colCount" | "cols" | "id" | "onClick" | "rowCount" | "rows"
>;

/**
 * return either cols or rows dependning on resize direction
 */
const getTracks = (state: ResizeState) => {
  const tracks =
    state.resizeDirection === "vertical"
      ? getRows(state.grid)
      : getColumns(state.grid);
  return tracks;
};

type NonContentGridItems = {
  splitters: ISplitter[];
  placeholders: IPlaceholder[];
};

const buildLayoutMap = (
  children:
    | ReactElement<GridLayoutItemProps>[]
    | ReactElement<GridLayoutItemProps>
): GridLayoutMap => {
  const layoutMap: GridLayoutMap = {};
  React.Children.forEach(
    children,
    ({
      props: {
        id,
        style: { gridColumnEnd, gridColumnStart, gridRowEnd, gridRowStart },
      },
    }) => {
      layoutMap[id] = {
        gridColumnEnd,
        gridColumnStart,
        gridRowEnd,
        gridRowStart,
      };
    }
  );
  return layoutMap;
};

export const useGridSplitterResizing = ({
  children: childrenProp,
  colCount,
  cols = Array(colCount).fill("1fr"),
  onClick: onClickProp,
  rowCount,
  rows = Array(rowCount).fill("1fr"),
}: SplitterResizingHookProps) => {
  // TODO memoize this call
  const [children, setChildren] = useState<ReactElement<GridLayoutItemProps>[]>(
    asReactElements(childrenProp)
  );
  const [nonContentGridItems, setNonContentGridItems] =
    useState<NonContentGridItems>({
      splitters: [],
      placeholders: [],
    });
  const layoutModel = useMemo(
    // TODO must cater for colCount/rowCount changing
    () => new GridLayoutModel(cols.length, rows.length),
    [cols.length, rows.length]
  );
  const layoutMapRef = useRef<GridLayoutMap>({});
  useMemo(() => {
    layoutMapRef.current = childrenProp ? buildLayoutMap(childrenProp) : {};
  }, [childrenProp]);

  const setGridLayoutMap = useCallback(
    (
      id: string,
      { start, end }: GridLayoutModelPosition,
      resizeDirection: GridLayoutResizeDirection
    ) => {
      const gridItemStyle = layoutMapRef.current[id];
      if (gridItemStyle) {
        // we will have no entries for placeholders
        if (resizeDirection === "horizontal") {
          gridItemStyle.gridColumnStart = start;
          gridItemStyle.gridColumnEnd = end;
        } else {
          gridItemStyle.gridRowStart = start;
          gridItemStyle.gridRowEnd = end;
        }
      }
    },
    []
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const resizingState = useRef<ResizeState | undefined>();

  const applyUpdates = useCallback(
    (
      resizeDirection: GridLayoutResizeDirection,
      updates: [string, GridLayoutModelPosition][],
      resetSplitters = false
    ) => {
      const setTrack =
        resizeDirection === "vertical" ? setGridRow : setGridColumn;

      updates.forEach(([id, position]) => {
        setTrack(id, position);
        setGridLayoutMap(id, position, resizeDirection);
      });

      if (resetSplitters) {
        const splitters = layoutModel.getSplitterPositions();
        setNonContentGridItems((items) => ({ ...items, splitters }));
      }
    },
    [layoutModel, setGridLayoutMap]
  );

  const initiateResize = useCallback(
    (moveBy: number) => {
      const resizeOperation = moveBy < 0 ? "contract" : "expand";
      const { current: state } = resizingState;
      if (state) {
        const { contraTrackIndex, resizeDirection, resizeTrackIndex } = state;
        const tracks = getTracks(state);

        const newTrackIndex =
          resizeOperation === "contract" ? resizeTrackIndex : contraTrackIndex;

        const { newTracks, updates } = layoutModel.addTrackForResize(
          tracks,
          newTrackIndex,
          Math.abs(moveBy),
          resizeOperation,
          state
        );

        if (resizeOperation === "contract") {
          state.resizeTrackIndex += 1;
          state.contraTrackIndex += 1;
        }

        setGridTrackTemplate(state, newTracks);
        applyUpdates(resizeDirection, updates, true);
        state.resizeTrackIsShared = false;
      }
    },
    [applyUpdates, layoutModel]
  );

  const removeTrack = useCallback(
    (
      moveBy: number,
      resizeOperation: GridLayoutResizeOperation,
      nextResizeOperation: GridLayoutResizeOperation | null
    ) => {
      const { current: state } = resizingState;
      let restoredDistance = 0;
      if (state) {
        const {
          resizeDirection,
          resizeTrackIndex,
          contraTrackIndex,
          resizeTrackIsShared: resizeRequiresNewTrack,
        } = state;

        const targetTrack =
          resizeOperation === nextResizeOperation &&
          resizeOperation === "expand"
            ? contraTrackIndex
            : resizeTrackIndex;

        const currentTracks = getTracks(state);
        restoredDistance = currentTracks[targetTrack];

        const assignDirection = resizeRequiresNewTrack
          ? resizeOperation === "expand"
            ? "bwd"
            : "fwd"
          : resizeOperation === "expand"
          ? "fwd"
          : "bwd";

        const newTracks = removeTrackFromTracks(
          currentTracks,
          targetTrack,
          assignDirection
        );

        const updates = layoutModel.removeTrack(targetTrack, resizeDirection);
        setGridTrackTemplate(state, newTracks);
        applyUpdates(resizeDirection, updates, true);

        if (resizeOperation === nextResizeOperation) {
          state.resizeTrackIsShared = true;
          if (resizeOperation === "expand") {
            state.resizeTrackIndex -= 1;
            state.contraTrackIndex -= 1;
          }
        }

        const adjustedDistance = adjustDistance(moveBy, restoredDistance);
        if (adjustedDistance !== 0 && nextResizeOperation) {
          initiateResize(adjustedDistance);
        }
      }
    },
    [applyUpdates, initiateResize, layoutModel]
  );

  const resize = useCallback(
    (moveBy: number) => {
      const { current: state } = resizingState;
      const directionOfTravel = moveBy < 0 ? "bwd" : "fwd";

      if (state) {
        const { resizeTrackIndex, contraTrackIndex } = state;
        const tracks = getTracks(state);
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

          setGridTrackTemplate(state, tracks);
        }
      }
    },
    [removeTrack]
  );

  const mouseMove = useCallback(
    ({ clientX, clientY }: MouseEvent) => {
      const { current: state } = resizingState;
      if (state) {
        const { mousePos, resizeDirection, resizeTrackIsShared } = state;
        const newMousePos = resizeDirection === "vertical" ? clientY : clientX;
        if (newMousePos !== mousePos) {
          const moveBy = mousePos - newMousePos;
          state.mousePos = newMousePos;
          if (moveBy !== 0) {
            if (resizeTrackIsShared) {
              initiateResize(moveBy);
            }
            resize(moveBy);
          }
        }
      }
    },
    [initiateResize, resize]
  );

  // TODO need to identify the expanding track and the contracting track
  // these may not necessarily be adjacent, when resizeable attribute of
  // gridItems is taken into account
  const onMouseDown = useCallback<MouseEventHandler>(
    (e) => {
      const splitterElement = e.target as HTMLElement;
      if (!isSplitter(splitterElement)) {
        return;
      }

      const resizeDirection: GridLayoutResizeDirection = isHorizontalSplitter(
        splitterElement
      )
        ? "horizontal"
        : "vertical";

      const resizeId = splitterElement.getAttribute("aria-controls");
      const resizeElement = resizeId ? document.getElementById(resizeId) : null;
      const grid = queryClosest(resizeElement, ".vuuGridLayout");

      if (!grid || !resizeElement) {
        throw Error(
          `cannot find either grid or element associated with Splitter`
        );
      }

      const mousePos = resizeDirection === "vertical" ? e.clientY : e.clientX;

      const resizeItem = layoutModel.gridItems.find(
        (item) => item.id === resizeElement.id
      );

      if (!resizeItem) {
        throw Error("resize item not found");
      }

      resizingState.current = layoutModel.measureResizeDetails({
        grid,
        resizeElement,
        resizeDirection,
        resizeItem,
        splitterElement,
        mousePos,
      });

      if (resizeDirection === "vertical") {
        resizeElement.classList.add("resizing-v");
      } else if (resizeDirection === "horizontal") {
        resizeElement.classList.add("resizing-h");
      }
      if (grid) {
        document.addEventListener("mousemove", mouseMove);
      }
    },
    [layoutModel, mouseMove]
  );

  const onMouseUp = useCallback<MouseEventHandler>(
    (e) => {
      document.removeEventListener("mousemove", mouseMove);
      const target = e.target as HTMLElement;
      target.classList.remove("resizing-h", "resizing-v");

      // console.log(layoutModel.toDebugString());
    },
    [mouseMove]
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
              selectedRef.current
            ) as HTMLElement;
            el.classList.remove(`${classNameLayoutItem}-active`);
          }

          selectedRef.current = gridLayoutItem.id;
          gridLayoutItem.classList.add(`${classNameLayoutItem}-active`);
        }
      }
      onClickProp?.(e);
    },
    [onClickProp]
  );

  const splitGridCol = useCallback(
    (gridItemId: string) => {
      const { current: grid } = containerRef;
      // const target = document.getElementById(gridItemId) as HTMLElement;
      const gridItem = layoutModel.getGridItem(gridItemId);
      if (grid && gridItem) {
        const columns = getColumns(grid);
        const { tracks, updates } = layoutModel.splitGridItem(
          gridItemId,
          "west",
          columns
        );
        if (updates.length > 0) {
          setGridTrackTemplate({ grid, resizeDirection: "horizontal" }, tracks);
          applyUpdates("horizontal", updates);

          layoutModel.createPlaceholders();
          const placeholders = layoutModel.getPlaceholders();
          const splitters = layoutModel.getSplitterPositions();
          setNonContentGridItems({ placeholders, splitters });

          // add placeholders to the layoutMap
        }
      } else {
        throw Error(`splitGridCol no gridItem with id ${gridItemId}`);
      }
    },
    [applyUpdates, layoutModel]
  );

  const splitGridRow = useCallback(
    (gridItemId: string) => {
      const { current: grid } = containerRef;
      // const target = document.getElementById(gridItemId) as HTMLElement;
      const gridItem = layoutModel.getGridItem(gridItemId);
      if (grid && gridItem) {
        const rows = getRows(grid);
        const { tracks, updates } = layoutModel.splitGridItem(
          gridItemId,
          "north",
          rows
        );

        if (updates.length > 0) {
          // TODO move all into model
          setGridTrackTemplate({ grid, resizeDirection: "vertical" }, tracks);
          applyUpdates("vertical", updates);
          layoutModel.createPlaceholders();
          const placeholders = layoutModel.getPlaceholders();
          const splitters = layoutModel.getSplitterPositions();

          setNonContentGridItems({ placeholders, splitters });
        }
      } else {
        throw Error(`splitGridRow no gridItem with id ${gridItemId}`);
      }
    },
    [applyUpdates, layoutModel]
  );

  const addGridColumn = useCallback(
    (gridItemId: string) => {
      const { current: grid } = containerRef;
      const gridItem = layoutModel.getGridItem(gridItemId);
      const resizeDirection = "horizontal";
      if (grid && gridItem) {
        const {
          column: { start },
        } = gridItem;
        const trackIndex = start - 1;
        const columns = splitTrack(getColumns(grid), trackIndex);
        setGridTrackTemplate(
          { grid, resizeDirection: resizeDirection },
          columns
        );
        const updates = layoutModel.addTrack(trackIndex, resizeDirection);
        if (updates.length > 0) {
          applyUpdates(resizeDirection, updates, true);
        }
      } else {
        throw Error(`addGridTrack no gridItem with id ${gridItemId}`);
      }
    },
    [applyUpdates, layoutModel]
  );

  const addGridRow = useCallback((gridItemId: string) => {
    console.log(`addGrodRow ${gridItemId}`);
  }, []);

  const removeGridColumn = useCallback(
    (trackIndex: number) => {
      const { current: grid } = containerRef;
      if (grid) {
        const resizeDirection = "horizontal";

        const columns = removeTrackFromTracks(getColumns(grid), trackIndex);
        setGridTrackTemplate(
          { grid, resizeDirection: resizeDirection },
          columns
        );

        console.log(`removeGridColumn at ${trackIndex}`, {
          columns,
        });
        const updates = layoutModel.removeTrack(trackIndex, resizeDirection);
        applyUpdates(resizeDirection, updates, true);
      }
    },
    [applyUpdates, layoutModel]
  );

  useLayoutEffect(() => {
    /*
     * Initialise the GridModel content
     */
    if (containerRef.current) {
      containerRef.current.childNodes.forEach((node) => {
        const gridLayoutItem = node as HTMLElement;
        if (gridLayoutItem.classList.contains("vuuGridLayoutItem")) {
          const { column, id, resizeable, row, type } =
            getGridItemProps(gridLayoutItem);
          layoutModel.addGridItem({
            id,
            column,
            resizeable,
            row,
            type,
          });
        }
      });
      layoutModel.createPlaceholders();
      const splitters = layoutModel.getSplitterPositions();
      const placeholders = layoutModel.getPlaceholders();
      setNonContentGridItems({ placeholders, splitters });
    }
  }, [layoutModel]);

  const removeTracks = useCallback(
    (removedTrackLines: [number[], number[]]) => {
      const { current: grid } = containerRef;
      if (grid) {
        const [removedColumnTrackLines, removedRowTrackLines] =
          removedTrackLines;

        if (removedColumnTrackLines.length === 1) {
          const [indexOfRemovedColumnTrack] = removedColumnTrackLines;
          const columnTracks = getColumns(grid);
          const newTracks = removeTrackFromTracks(
            columnTracks,
            indexOfRemovedColumnTrack - 1,
            "bwd"
          );
          setGridTrackTemplate(
            { grid, resizeDirection: "horizontal" },
            newTracks
          );
        }

        if (removedRowTrackLines.length === 1) {
          const [indexOfRemovedRowTrack] = removedRowTrackLines;
          const rowTracks = getRows(grid);
          const newTracks = removeTrackFromTracks(
            rowTracks,
            indexOfRemovedRowTrack - 1,
            "bwd"
          );
          setGridTrackTemplate(
            { grid, resizeDirection: "vertical" },
            newTracks
          );
        }
      }
    },
    []
  );

  const dispatchGridLayoutAction = useCallback<GridLayoutProviderDispatch>(
    (action) => {
      if (action.type === "close") {
        setChildren((c) => c.filter((c) => c.props.id !== action.id));
        const {
          removedTrackLines,
          updates: [horizontalUpdates, verticalUpdates],
        } = layoutModel.removeGridItem(action.id);

        applyUpdates("horizontal", horizontalUpdates);
        applyUpdates("vertical", verticalUpdates);

        if (removedTrackLines) {
          removeTracks(removedTrackLines as [number[], number[]]);
        }

        const placeholders = layoutModel.getPlaceholders();
        const splitters = layoutModel.getSplitterPositions();
        setNonContentGridItems({ placeholders, splitters });
      }
    },
    [applyUpdates, layoutModel, removeTracks]
  );

  const addChildComponent = useCallback(
    (component: JSX.Element, { column, id, row }: IGridLayoutModelItem) => {
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
    },
    []
  );

  const handleDrop = useCallback<GridLayoutDropHandler>(
    (target, payload, position) => {
      const { current: grid } = containerRef;
      const gridItem = layoutModel.getGridItem(target);

      if (grid && gridItem) {
        const component = layoutFromJson(payload as LayoutJSON, "");

        if (position === "centre") {
          const newGridItem = layoutModel.replaceGridItem(target, "content");
          addChildComponent(component, newGridItem);
        } else {
          const resizeDirection = gridResizeDirectionFromDropPosition(position);
          const currentTracks =
            resizeDirection === "vertical" ? getRows(grid) : getColumns(grid);

          const { tracks, updates, newGridItem } = layoutModel.splitGridItem(
            target,
            position,
            currentTracks
          );

          if (updates.length > 0) {
            setGridTrackTemplate({ grid, resizeDirection }, tracks);
            applyUpdates(resizeDirection, updates);

            addChildComponent(component, newGridItem);
          }
        }
        const placeholders = layoutModel.getPlaceholders();
        const splitters = layoutModel.getSplitterPositions();
        setNonContentGridItems({ placeholders, splitters });
      } else {
        throw Error(`splitGridRow no gridItem with id ${target}`);
      }
    },
    [addChildComponent, applyUpdates, layoutModel]
  );

  return {
    addGridColumn,
    addGridRow,
    children,
    containerRef,
    dispatchGridLayoutAction,
    gridTemplateColumns: cols.join(" "),
    gridTemplateRows: rows.join(" "),
    layoutMap: layoutMapRef.current,
    onClick: clickHandler,
    onDrop: handleDrop,
    onMouseDown,
    onMouseUp,
    removeGridColumn,
    splitGridCol,
    splitGridRow,
    nonContentGridItems,
  };
};
