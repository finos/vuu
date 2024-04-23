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
  removeTrack,
  IGridLayoutModelItem,
} from "@finos/vuu-layout";
import { asReactElements, queryClosest, uuid } from "@finos/vuu-utils";
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
  spansMultipleTracks,
  setGridTrackTemplate,
} from "@finos/vuu-layout";
import {
  GridLayoutItem,
  GridLayoutItemProps,
  GridLayoutProps,
} from "./GridLayout";

const ERROR_NO_RESIZE = "Resize operationn invoked, no resize in operation";

export type SplitterResizingHookProps = Pick<
  GridLayoutProps,
  "children" | "colCount" | "cols" | "id" | "onClick" | "rowCount" | "rows"
>;

/**
 * Get the current mouse position, either x or y depending on direction
 * of resize.
 */
const getCurrentMousePos = (state: ResizeState, evt: MouseEvent) =>
  state.resizeDirection === "vertical" ? evt.clientY : evt.clientX;

/**
 * Distance between mouse starting position and current position, sign
 * taking into account relative position of splitter;
 */
const storePosAndGetMoveDistance = (
  state: ResizeState,
  currentMousePos: number
) => {
  const distance = state.mouseCurrentPos - currentMousePos;
  state.mouseCurrentPos = currentMousePos;
  return [distance, state.mouseStartPos - currentMousePos];
};

const getResizeOperation = (
  moveBy: number
): GridLayoutResizeOperation | null => {
  if (moveBy > 0) {
    return "expand";
  } else if (moveBy < 0) {
    return "contract";
  } else {
    return null;
  }
};
/**
 * return either cols or rows dependning on resze direction
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

  // reset the anchored track for resize item(s) and contra item(s)
  const flipResizeTracks = useCallback((currentMousePos: number) => {
    if (!resizingState.current) {
      throw Error(ERROR_NO_RESIZE);
    }
    const {
      resizeTrackIndex: indexOfPrimaryResizedItem,
      contraTrackIndex: indexOfSecondaryResizedItem,
      mouseStartPos: mousePos,
      resizeOperation,
    } = resizingState.current;

    const moveBy = currentMousePos - mousePos;
    const newTracks = getTracks(resizingState.current);

    if (resizeOperation === "contract") {
      const targetTrackSize = newTracks[indexOfPrimaryResizedItem];
      newTracks[indexOfSecondaryResizedItem] += targetTrackSize;
      newTracks[indexOfPrimaryResizedItem] = 0;
    } else {
      const targetTrackSize = newTracks[indexOfPrimaryResizedItem - 1];
      const resizeAmount = targetTrackSize - Math.abs(moveBy);
      newTracks[indexOfPrimaryResizedItem] += targetTrackSize;

      newTracks[indexOfSecondaryResizedItem] = Math.abs(resizeAmount);
      newTracks[indexOfSecondaryResizedItem - 1] -= Math.abs(resizeAmount);
    }

    return newTracks;
  }, []);

  const removeGridTrack = useCallback((indexOfTrack: number) => {
    const { current: state } = resizingState;
    if (!state) {
      throw Error(ERROR_NO_RESIZE);
    }

    const tracks = getTracks(state);
    const isShrinking = state.resizeOperation === "contract";
    const trackToBeRemoved = tracks[indexOfTrack];

    tracks.splice(indexOfTrack, 1);
    if (isShrinking) {
      tracks[indexOfTrack - 1] += trackToBeRemoved;
    } else {
      tracks[indexOfTrack] += trackToBeRemoved;
    }

    return tracks;
  }, []);

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

  const restoreOriginalLayout = useCallback(() => {
    const { current: state } = resizingState;
    if (state) {
      const { resizeRequiresNewTrack, resizeDirection, resizeTrackIndex } =
        state;
      if (resizeRequiresNewTrack) {
        const tracks = getTracks(state);
        const { newTracks, updates } = layoutModel.restoreGridItemPositions(
          tracks,
          resizeTrackIndex,
          state
        );
        setGridTrackTemplate(state, newTracks);
        applyUpdates(resizeDirection, updates, true);
      }
    }
  }, [applyUpdates, layoutModel]);

  const handleTrackSizedToZero = useCallback(
    (gridTracks: number[], mousePos: number) => {
      const { current: state } = resizingState;
      if (!state) {
        throw Error(ERROR_NO_RESIZE);
      }

      const {
        contras,
        resizeTrackIndex: indexOfPrimaryResizedItem,
        contraTrackIndex: indexOfSecondaryResizedItem,
        resizeOperation,
        resizeItem,
        resizeDirection,
        resizeRequiresNewTrack,
      } = state;
      const tracks = getTracks(state);
      const isContracting = resizeOperation === "contract";
      const trackIndex = isContracting
        ? indexOfPrimaryResizedItem
        : indexOfSecondaryResizedItem;
      let returnTracks: number[] = gridTracks;

      if (!resizeRequiresNewTrack) {
        if (gridTracks[trackIndex] === 0) {
          // we know no other elements adjoin this track except for the resized and contra elements.
          // if the contra elements span at least 2 tracks, we can remove it.
          if (
            (isContracting &&
              spansMultipleTracks(resizeItem, resizeDirection)) ||
            (!isContracting &&
              contras.every((item) =>
                spansMultipleTracks(item, resizeDirection)
              ))
          ) {
            const updates = layoutModel.removeTrack(
              trackIndex,
              resizeDirection
            );
            applyUpdates(resizeDirection, updates);

            returnTracks = removeGridTrack(trackIndex);

            const splitters = layoutModel.getSplitterPositions();
            setNonContentGridItems((items) => ({ ...items, splitters }));

            resizingState.current = layoutModel.measureResizeDetails({
              ...state,
              mouseStartPos: mousePos,
            });
          } else {
            //onsole.log("we've gone too far, veto further shrinkage");
          }
        } else if (gridTracks[trackIndex] < 0) {
          if (
            spansMultipleTracks(resizeItem, resizeDirection) ||
            contras.every((item) => spansMultipleTracks(item, resizeDirection))
          ) {
            const updates = layoutModel.flipResizeTracks(
              trackIndex,
              resizeDirection
            );

            applyUpdates(resizeDirection, updates);
            returnTracks = flipResizeTracks(mousePos);

            const splitters = layoutModel.getSplitterPositions();
            setNonContentGridItems((items) => ({ ...items, splitters }));

            if (isContracting) {
              state.resizeTrackIndex += 1;
              state.contraTrackIndex += 1;
              state.mouseStartPos += tracks[indexOfPrimaryResizedItem];
            } else {
              state.resizeTrackIndex -= 1;
              state.contraTrackIndex -= 1;
              state.mouseStartPos -= tracks[indexOfPrimaryResizedItem - 1];
            }

            if (resizeDirection === "vertical") {
              state.rows = returnTracks;
            } else {
              state.cols = returnTracks;
            }
          } else {
            // onsole.log("we've gone too far, veto further shrinkage");
          }
        }
      }

      return returnTracks;
    },
    [applyUpdates, flipResizeTracks, layoutModel, removeGridTrack]
  );

  const continueExpand = useCallback(
    (moveBy: number, currentMousePos: number) => {
      const { current: state } = resizingState;
      if (state) {
        const { resizeTrackIndex, contraTrackIndex } = state;

        let gridTracks = getTracks(state);

        gridTracks[resizeTrackIndex] += moveBy;
        gridTracks[contraTrackIndex] -= moveBy;

        if (gridTracks[contraTrackIndex] <= 0) {
          gridTracks = handleTrackSizedToZero(gridTracks, currentMousePos);
        }

        setGridTrackTemplate(state, gridTracks);
      }
    },
    [handleTrackSizedToZero]
  );

  const continueContract = useCallback(
    (moveBy: number, currentMousePos: number) => {
      const { current: state } = resizingState;
      if (state) {
        const { resizeTrackIndex, contraTrackIndex, resizeRequiresNewTrack } =
          state;

        let tracks = getTracks(state);

        if (resizeRequiresNewTrack) {
          tracks[resizeTrackIndex + 1] += moveBy;
          tracks[contraTrackIndex + 1] -= moveBy;
        } else {
          tracks[resizeTrackIndex] += moveBy;
          tracks[contraTrackIndex] -= moveBy;
          if (tracks[resizeTrackIndex] <= 0) {
            tracks = handleTrackSizedToZero(tracks, currentMousePos);
          }
        }

        setGridTrackTemplate(state, tracks);
      }
    },
    [handleTrackSizedToZero]
  );

  const initiateResize = useCallback(
    (moveBy: number, resizeOperation: GridLayoutResizeOperation) => {
      const { current: state } = resizingState;
      if (state) {
        const {
          contraTrackIndex,
          resizeDirection,
          resizeTrackIndex,
          resizeRequiresNewTrack,
        } = state;

        const tracks = getTracks(state);

        const newTrackIndex =
          resizeOperation === "contract" ? resizeTrackIndex : contraTrackIndex;

        if (resizeRequiresNewTrack) {
          const { newTracks, updates } = layoutModel.addTrackForResize(
            tracks,
            newTrackIndex,
            moveBy,
            state
          );
          setGridTrackTemplate(state, newTracks);
          applyUpdates(resizeDirection, updates, true);
        } else {
          tracks[resizeTrackIndex] += moveBy;
          tracks[contraTrackIndex] -= moveBy;
          setGridTrackTemplate(state, tracks);
        }
      }
    },
    [applyUpdates, layoutModel]
  );

  const initiateExpand = useCallback(
    (moveBy: number) => initiateResize(moveBy, "expand"),
    [initiateResize]
  );

  const initiateContract = useCallback(
    (moveBy: number) => initiateResize(moveBy, "contract"),
    [initiateResize]
  );

  const flipToContract = useCallback(
    (moveBy: number) => {
      restoreOriginalLayout();
      initiateResize(moveBy, "contract");
    },
    [initiateResize, restoreOriginalLayout]
  );

  const flipToExpand = useCallback(
    (moveBy: number) => {
      restoreOriginalLayout();
      initiateResize(moveBy, "expand");
    },
    [initiateResize, restoreOriginalLayout]
  );

  const mouseMove = useCallback(
    (e: MouseEvent) => {
      const { current: state } = resizingState;
      if (state) {
        const { resizeOperation } = state;

        const currentMousePos = getCurrentMousePos(state, e);
        const [moveBy, totalMoveDistance] = storePosAndGetMoveDistance(
          state,
          currentMousePos
        );
        const newOperation = getResizeOperation(totalMoveDistance);
        state.resizeOperation = newOperation;

        //TODO ignore if same as previous moveBy

        if (resizeOperation === null && newOperation === null) {
          return;
        } else if (resizeOperation === null && newOperation === "expand") {
          console.log(`initiateExpand `);
          return initiateExpand(moveBy);
        } else if (resizeOperation === null && newOperation === "contract") {
          console.log(`initiateContract ${state.resizeDirection}`);
          return initiateContract(moveBy);
        } else if (resizeOperation === "expand" && newOperation === "expand") {
          console.log(`continueExpand `);
          return continueExpand(moveBy, currentMousePos);
        } else if (
          resizeOperation === "contract" &&
          newOperation === "contract"
        ) {
          console.log(`continueToContract`);
          return continueContract(moveBy, currentMousePos);
        } else if (newOperation === null) {
          console.log("restore original layout");
          restoreOriginalLayout();
        } else if (
          resizeOperation === "expand" &&
          newOperation === "contract"
        ) {
          console.log("reverse direction flip To Contract");
          return flipToContract(moveBy);
        } else if (
          resizeOperation === "contract" &&
          newOperation === "expand"
        ) {
          console.log("referse direction flip To Expand");
          return flipToExpand(moveBy);
        }
      }
    },
    [
      continueExpand,
      continueContract,
      flipToExpand,
      flipToContract,
      initiateExpand,
      initiateContract,
      restoreOriginalLayout,
    ]
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
        mouseStartPos: mousePos,
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

      console.log(layoutModel.toDebugString());
    },
    [layoutModel, mouseMove]
  );

  const selectedRef = useRef<string>();
  const clickHandler = useCallback<MouseEventHandler>(
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
          "horizontal",
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
          "vertical",
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

        const columns = removeTrack(getColumns(grid), trackIndex);
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

  const dispatchGridLayoutAction = useCallback<GridLayoutProviderDispatch>(
    (action) => {
      if (action.type === "close") {
        setChildren((c) => c.filter((c) => c.props.id !== action.id));
        const [horizontalUpdates, verticalUpdates] = layoutModel.removeGridItem(
          action.id
        );

        applyUpdates("horizontal", horizontalUpdates);
        applyUpdates("vertical", verticalUpdates);

        const placeholders = layoutModel.getPlaceholders();
        const splitters = layoutModel.getSplitterPositions();
        setNonContentGridItems({ placeholders, splitters });
      }
    },
    [applyUpdates, layoutModel]
  );

  const handleDrop = useCallback(
    (target, payload, position) => {
      const targetGridItem = layoutModel.getGridItem(target);
      if (targetGridItem) {
        const {
          column: { start: columnStart, end: columnEnd },
          row: { start: rowStart, end: rowEnd },
        } = targetGridItem;

        const gridItem: IGridLayoutModelItem = {
          id: uuid(),
          column: { start: columnStart, end: columnEnd },
          resizeable: "vh",
          row: { start: rowStart, end: rowEnd },
          type: "content",
        };

        const newChild = (
          <GridLayoutItem
            header
            id={gridItem.id}
            resizeable="hv"
            style={{
              gridColumnStart: columnStart,
              gridColumnEnd: columnEnd,
              gridRowStart: rowStart,
              gridRowEnd: rowEnd,
            }}
            title="New One"
          >
            <div style={{ background: payload }} />
          </GridLayoutItem>
        );

        layoutModel.addGridItem(gridItem);

        // splitGridRow(target, gridItem);

        setChildren((c) => c.concat(newChild));
        console.log({ position });
        const targetElement = document.getElementById(target);
        if (targetElement) {
          targetElement.classList.remove(`vuuGridPlaceholder-${position}`);
        }
      }

      // now need to ...
      // reposition split item
      // create a new child
      // call layoutModel add GridItem
      // call setChildren
    },
    [splitGridRow]
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
