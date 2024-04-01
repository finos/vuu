import {
  GridLayoutModel,
  ISplitter,
  GridLayoutResizeOperation,
  SplitterAlign,
  GridLayoutModelPosition,
  GridLayoutResizeDirection,
  GridLayoutProviderDispatch,
  ResizeState,
  IPlaceholder,
  GridLayoutMap,
  getRows,
  getColumns,
} from "@finos/vuu-layout";
import { queryClosest } from "@finos/vuu-utils";
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
import { GridLayoutItemProps, GridLayoutProps } from "./GridLayout";

const ERROR_NO_RESIZE = "Resize operationn invoked, no resize in operation";

export type SplitterResizingHookProps = Pick<
  GridLayoutProps,
  "children" | "colCount" | "cols" | "id" | "rowCount" | "rows"
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
const getMoveDistance = (state: ResizeState, currentMousePos: number) =>
  state.splitterAlign === "start"
    ? state.mousePos - currentMousePos
    : currentMousePos - state.mousePos;

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
const getTracks = (state: ResizeState, clone = false) => {
  const tracks = state[state.resizeDirection === "vertical" ? "rows" : "cols"];
  return clone ? tracks.slice() : tracks;
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
  rowCount,
  rows = Array(rowCount).fill("1fr"),
}: SplitterResizingHookProps) => {
  const [children, setChildren] = useState(childrenProp);
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
      indexOfPrimaryResizeTrack: indexOfPrimaryResizedItem,
      indexOfSecondaryResizeTrack: indexOfSecondaryResizedItem,
      mousePos,
      resizeOperation,
    } = resizingState.current;

    const moveBy = currentMousePos - mousePos;
    const newTracks = getTracks(resizingState.current, true);

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

  const removeTrack = useCallback((indexOfTrack: number) => {
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
      updates: [string, GridLayoutModelPosition][]
    ) => {
      const setTrack =
        resizeDirection === "vertical" ? setGridRow : setGridColumn;

      updates.forEach(([id, position]) => {
        setTrack(id, position);
        setGridLayoutMap(id, position, resizeDirection);
      });
    },
    [setGridLayoutMap]
  );

  const restoreComponentPositions = useCallback(
    (anulledResizeOperation: GridLayoutResizeOperation) => {
      if (resizingState.current) {
        const {
          adjacentItems,
          resizeItem,
          resizeDirection: resizeOrientation,
        } = resizingState.current;

        if (resizeItem && resizeOrientation) {
          const updates = layoutModel.restoreGridItemPositions(
            resizeItem,
            adjacentItems,
            resizeOrientation,
            anulledResizeOperation
          );
          applyUpdates(resizeOrientation, updates);
        }

        const splitters = layoutModel.getSplitterPositions();
        console.log({ splitters });
        setNonContentGridItems((items) => ({ ...items, splitters }));
      }
    },
    [applyUpdates, layoutModel]
  );

  const repositionComponentsForExpand = useCallback(
    (flippedFromContract: boolean) => {
      if (resizingState.current) {
        const {
          adjacentItems,
          resizeDirection: resizeOrientation,
          resizeItem,
        } = resizingState.current;

        if (resizeOrientation && resizeItem) {
          const updates = layoutModel.repositionGridItemsforResize(
            resizeItem,
            adjacentItems,
            resizeOrientation,
            "expand",
            flippedFromContract
          );

          applyUpdates(resizeOrientation, updates);

          const splitters = layoutModel.getSplitterPositions();
          setNonContentGridItems((items) => ({ ...items, splitters }));
        }
      }
    },
    [applyUpdates, layoutModel]
  );

  const repositionComponentsForContract = useCallback(
    (flippedFromExpand: boolean) => {
      if (resizingState.current) {
        const { adjacentItems, resizeDirection, resizeItem } =
          resizingState.current;

        if (resizeDirection && resizeItem) {
          const updates = layoutModel.repositionGridItemsforResize(
            resizeItem,
            adjacentItems,
            resizeDirection,
            "contract",
            flippedFromExpand
          );
          applyUpdates(resizeDirection, updates);

          const splitters = layoutModel.getSplitterPositions();
          setNonContentGridItems((items) => ({ ...items, splitters }));
        }
      }
    },
    [applyUpdates, layoutModel]
  );

  const flipToExpand = useCallback(
    (moveBy: number) => {
      const { current: state } = resizingState;
      if (state) {
        const {
          adjacentItems: { contra: contraItems },
          indexOfPrimaryResizeTrack,
          indexOfSecondaryResizeTrack,
          simpleResize,
        } = state;
        const gridTracks = getTracks(state, true);
        if (contraItems.length > 0 && !simpleResize) {
          gridTracks[indexOfPrimaryResizeTrack] = Math.abs(moveBy);
          gridTracks[indexOfSecondaryResizeTrack] -= moveBy;
        } else {
          gridTracks[indexOfPrimaryResizeTrack] += moveBy;
          gridTracks[indexOfSecondaryResizeTrack] -= moveBy;
        }
        setGridTrackTemplate(state, gridTracks);
        if (contraItems.length > 0 && !simpleResize) {
          // // We could avoid this call if we could handle a flip in the call below
          // restoreComponentPositions("contract");
          repositionComponentsForExpand(true);
        }
      }
    },
    [repositionComponentsForExpand]
  );

  const flipToContract = useCallback(
    (moveBy: number) => {
      const { current: state } = resizingState;
      if (state) {
        const {
          adjacentItems: { contra: contraItems },
          indexOfPrimaryResizeTrack: indexOfPrimaryResizedItem,
          indexOfSecondaryResizeTrack: indexOfSecondaryResizedItem,
          simpleResize,
        } = state;

        const gridTracks = getTracks(state, true);
        if (contraItems.length > 0 && !simpleResize) {
          gridTracks[indexOfPrimaryResizedItem] = Math.abs(moveBy);
          gridTracks[indexOfSecondaryResizedItem] += moveBy;
        } else {
          gridTracks[indexOfSecondaryResizedItem] -= moveBy;
          gridTracks[indexOfPrimaryResizedItem] += moveBy;
        }
        setGridTrackTemplate(state, gridTracks);
        if (contraItems.length > 0 && !simpleResize) {
          // We could avoid this call if we could handle a flip in the call below
          // restoreComponentPositions("expand");
          repositionComponentsForContract(true);
        }
      }
    },
    [repositionComponentsForContract]
  );

  const restoreOriginalLayout = useCallback(
    (anulledResizeOperation: GridLayoutResizeOperation) => {
      const { current: state } = resizingState;
      if (state) {
        const {
          adjacentItems: { contra: contraItems },
          indexOfPrimaryResizeTrack: indexOfPrimaryResizedItem,
        } = state;

        const tracks = getTracks(state);
        if (contraItems.length > 0) {
          tracks.splice(indexOfPrimaryResizedItem, 1);
        }
        setGridTrackTemplate(state, tracks);
        if (contraItems.length > 0) {
          restoreComponentPositions(anulledResizeOperation);
        }
      }
    },
    [restoreComponentPositions]
  );

  const handleTrackSizedToZero = useCallback(
    (gridTracks: number[], mousePos: number) => {
      console.log(
        `handleTrackResizedToZero currentMousePos ${mousePos}
        gridTracks [${gridTracks.join(",")}]`
      );

      const { current: state } = resizingState;
      if (!state) {
        throw Error(ERROR_NO_RESIZE);
      }

      const {
        adjacentItems: { contra: contraItems },
        indexOfPrimaryResizeTrack: indexOfPrimaryResizedItem,
        indexOfSecondaryResizeTrack: indexOfSecondaryResizedItem,
        resizeOperation,
        resizeItem,
        resizeDirection,
        simpleResize,
      } = state;
      const tracks = getTracks(state);
      const isContracting = resizeOperation === "contract";
      const trackIndex = isContracting
        ? indexOfPrimaryResizedItem
        : indexOfSecondaryResizedItem;
      let returnTracks: number[] = gridTracks;

      if (simpleResize) {
        if (gridTracks[trackIndex] === 0) {
          console.log(
            `handleTrackSizedToZero (exactly zero) ${resizeOperation} remove track`
          );
          // we know no other elements adjoin this track except for the resized and contra elements.
          // if the contra elements span at least 2 tracks, we can remove it.
          if (
            (isContracting &&
              spansMultipleTracks(resizeItem, resizeDirection)) ||
            (!isContracting &&
              contraItems.every((item) =>
                spansMultipleTracks(item, resizeDirection)
              ))
          ) {
            const updates = layoutModel.removeTrack(
              trackIndex,
              resizeDirection
            );
            applyUpdates(resizeDirection, updates);

            returnTracks = removeTrack(trackIndex);

            const splitters = layoutModel.getSplitterPositions();
            setNonContentGridItems((items) => ({ ...items, splitters }));

            resizingState.current = layoutModel.measureGridItemDetails({
              ...state,
              mousePos,
            });
          } else {
            console.log("we've gone too far, veto further shrinkage");
          }
        } else if (gridTracks[trackIndex] < 0) {
          console.log(`handleTrackSizedToZero (flip) ${resizeOperation} `);

          if (
            spansMultipleTracks(resizeItem, resizeDirection) ||
            contraItems.every((item) =>
              spansMultipleTracks(item, resizeDirection)
            )
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
              state.indexOfPrimaryResizeTrack += 1;
              state.indexOfSecondaryResizeTrack += 1;
              state.mousePos += tracks[indexOfPrimaryResizedItem];
            } else {
              state.indexOfPrimaryResizeTrack -= 1;
              state.indexOfSecondaryResizeTrack -= 1;
              state.mousePos -= tracks[indexOfPrimaryResizedItem - 1];
            }

            if (resizeDirection === "vertical") {
              state.rows = returnTracks;
            } else {
              state.cols = returnTracks;
            }
          } else {
            console.log("we've gone too far, veto further shrinkage");
          }
        }
      }

      return returnTracks;
    },
    [applyUpdates, flipResizeTracks, layoutModel, removeTrack]
  );

  const continueExpand = useCallback(
    (moveBy: number, currentMousePos: number) => {
      const { current: state } = resizingState;
      if (state) {
        const {
          adjacentItems,
          indexOfPrimaryResizeTrack,
          indexOfSecondaryResizeTrack,
          simpleResize,
        } = state;

        let gridTracks = getTracks(state, true);

        if (adjacentItems.contra.length > 0 && !simpleResize) {
          gridTracks[indexOfPrimaryResizeTrack] = Math.abs(moveBy);
          gridTracks[indexOfPrimaryResizeTrack - 1] -= moveBy;
        } else {
          gridTracks[indexOfPrimaryResizeTrack] += moveBy;
          gridTracks[indexOfSecondaryResizeTrack] -= moveBy;
          if (gridTracks[indexOfSecondaryResizeTrack] <= 0) {
            gridTracks = handleTrackSizedToZero(gridTracks, currentMousePos);
          }
        }

        setGridTrackTemplate(state, gridTracks);
      }
    },
    [handleTrackSizedToZero]
  );

  const initiateExpand = useCallback(
    (moveBy: number) => {
      const { current: state } = resizingState;
      if (state) {
        const {
          adjacentItems,
          indexOfPrimaryResizeTrack,
          indexOfSecondaryResizeTrack,
          simpleResize,
        } = state;

        const tracks = getTracks(state);
        const gridTracks = getTracks(state, true);

        if (simpleResize) {
          gridTracks[indexOfPrimaryResizeTrack] += moveBy;
          gridTracks[indexOfSecondaryResizeTrack] -= moveBy;
          setGridTrackTemplate(state, gridTracks);
        } else {
          tracks.splice(indexOfPrimaryResizeTrack, 0, 0);
          gridTracks.splice(indexOfPrimaryResizeTrack, 0, 0);
          gridTracks[indexOfPrimaryResizeTrack] = Math.abs(moveBy);
          gridTracks[indexOfSecondaryResizeTrack] -= moveBy;
          setGridTrackTemplate(state, gridTracks);

          if (adjacentItems.contra.length > 0) {
            repositionComponentsForExpand(false);
          }
        }
      }
    },
    [repositionComponentsForExpand]
  );

  const continueContract = useCallback(
    (moveBy: number, currentMousePos: number) => {
      const { current: state } = resizingState;
      if (state) {
        const {
          adjacentItems,
          indexOfPrimaryResizeTrack: indexOfPrimaryResizedItem,
          indexOfSecondaryResizeTrack: indexOfSecondaryResizedItem,
          simpleResize,
        } = state;

        let gridTracks = getTracks(state, true);

        if (adjacentItems.contra.length > 0 && !simpleResize) {
          gridTracks[indexOfPrimaryResizedItem] = Math.abs(moveBy);
          gridTracks[indexOfPrimaryResizedItem + 1] += moveBy;
        } else {
          gridTracks[indexOfPrimaryResizedItem] += moveBy;
          gridTracks[indexOfSecondaryResizedItem] -= moveBy;
          if (gridTracks[indexOfPrimaryResizedItem] <= 0) {
            gridTracks = handleTrackSizedToZero(gridTracks, currentMousePos);
          }
        }

        setGridTrackTemplate(state, gridTracks);
      }
    },
    [handleTrackSizedToZero]
  );

  const initiateContract = useCallback(
    (moveBy: number) => {
      const { current: state } = resizingState;
      if (state) {
        const {
          adjacentItems,
          indexOfPrimaryResizeTrack: indexOfPrimaryResizedItem,
          indexOfSecondaryResizeTrack: indexOfSecondaryResizedItem,
          simpleResize,
        } = state;

        const tracks = getTracks(state);
        const gridTracks = getTracks(state, true);

        if (simpleResize) {
          gridTracks[indexOfPrimaryResizedItem] += moveBy;
          gridTracks[indexOfSecondaryResizedItem] -= moveBy;
          setGridTrackTemplate(state, gridTracks);
        } else {
          // TODO aren't we going to end up here with different
          // gridTrack values in DOM and state ?
          tracks.splice(indexOfPrimaryResizedItem, 0, 0);
          gridTracks.splice(indexOfPrimaryResizedItem, 0, 0);
          gridTracks[indexOfPrimaryResizedItem] = Math.abs(moveBy);
          gridTracks[indexOfPrimaryResizedItem + 1] += moveBy;
          setGridTrackTemplate(state, gridTracks);

          if (adjacentItems.contra.length > 0) {
            repositionComponentsForContract(false);
          }
        }
      }
    },
    [repositionComponentsForContract]
  );

  const mouseMove = useCallback(
    (e: MouseEvent) => {
      const { current: state } = resizingState;
      if (state) {
        const { resizeOperation } = state;

        const currentMousePos = getCurrentMousePos(state, e);
        const moveBy = getMoveDistance(state, currentMousePos);
        const newOperation = getResizeOperation(moveBy);
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
          restoreOriginalLayout(resizeOperation as GridLayoutResizeOperation);
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

      const splitterAlign = splitterElement.dataset.align as SplitterAlign;

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

      resizingState.current = layoutModel.measureGridItemDetails({
        grid,
        resizeElement,
        resizeDirection,
        resizeItem,
        splitterAlign,
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

      console.log(layoutModel.toDebugString());
    },
    [layoutModel, mouseMove]
  );

  const selectedRef = useRef<string>();
  const clickHandler = useCallback<MouseEventHandler>((e) => {
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
  }, []);

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
          const splitters = layoutModel.getSplitterPositions();
          const placeholders = layoutModel.getPlaceholders();
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
          const splitters = layoutModel.getSplitterPositions();
          const placeholders = layoutModel.getPlaceholders();

          setNonContentGridItems({ placeholders, splitters });
        }
      } else {
        throw Error(`splitGridRow no gridItem with id ${gridItemId}`);
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

  const handleDrop = useCallback((target, payload, position) => {
    console.log(`handle Drop ${target} ${payload} ${position}`);
  }, []);

  return {
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
    splitGridCol,
    splitGridRow,
    nonContentGridItems,
  };
};
