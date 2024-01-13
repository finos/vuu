import {
  AdjacentItems,
  GridLayoutModel,
  GridLayoutModelItem,
  IGridLayoutModelItem,
  ISplitter,
  NO_ADJACENT_ITEMS,
  GridLayoutResizeOperation,
  SplitterAlign,
  GridLayoutModelPosition,
  GridLayoutResizeDirection,
} from "@finos/vuu-layout";
import {
  MouseEventHandler,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  classNameLayoutItem,
  getColumn,
  getColumns,
  getGridLayoutItem,
  getRow,
  getRows,
  isHorizontalSplitter,
  isSplitter,
  ResizeOrientation,
  setGridColumn,
  setGridRow,
  spansMultipleTracks,
  splitGridTracks,
  trackRemoved,
} from "./grid-dom-utils";
import { GridLayoutProps } from "./GridLayout";

export type SplitterResizingHookProps = Pick<
  GridLayoutProps,
  "id" | "rowCount" | "rows"
>;

type ResizeState = {
  adjacentItems: AdjacentItems;
  cols: number[];
  simpleResize: boolean;
  grid?: HTMLElement;
  indexOfResizedItem: number;
  mousePos: number;
  resizeOperation: GridLayoutResizeOperation | null;
  resizeElement?: HTMLElement;
  resizeDirection: GridLayoutResizeDirection | null;
  resizeItem?: IGridLayoutModelItem;
  rows: number[];
  splitterAlign: SplitterAlign;
  splitterElement?: HTMLElement;
};

const initialState: ResizeState = {
  adjacentItems: NO_ADJACENT_ITEMS,
  cols: [],
  grid: undefined,
  indexOfResizedItem: -1,
  mousePos: -1,
  resizeOperation: null,
  resizeElement: undefined,
  resizeDirection: null,
  resizeItem: undefined,
  rows: [],
  simpleResize: false,
  splitterAlign: "start",
};

const getResizeOperation = (
  moveBy: number,
  splitterAlign: SplitterAlign = "start"
): GridLayoutResizeOperation | null => {
  if (moveBy > 0 && splitterAlign === "start") {
    return "expand";
  } else if (moveBy < 0 && splitterAlign === "start") {
    return "contract";
  } else if (moveBy > 0 && splitterAlign === "end") {
    return "contract";
  } else if (moveBy < 0 && splitterAlign === "end") {
    return "expand";
  } else {
    return null;
  }
};

export const useGridSplitterResizing = ({
  id,
  rowCount,
  rows = Array(rowCount).fill("1fr"),
}: SplitterResizingHookProps) => {
  const [splitters, setSplitters] = useState<ISplitter[]>([]);
  const layoutModel = useMemo(() => new GridLayoutModel(id, 2, 2), [id]);

  const containerRef = useRef<HTMLDivElement>(null);
  const resizingState = useRef<ResizeState>(initialState);

  const resizingRef = useRef(true);

  const measureAndStoreGridItemDetails = useCallback(
    (
      grid: HTMLElement | undefined,
      resizeElement: HTMLElement | undefined,
      resizeOrientation: ResizeOrientation,
      splitterAlign: SplitterAlign = "start"
    ) => {
      if (grid === undefined || resizeElement === undefined) {
        throw Error(`measureAndStoreGridItemDetails missing required param`);
      }
      const { current: state } = resizingState;

      const items = layoutModel.getGridItemsAdjoiningTrack(
        resizeElement.id,
        resizeOrientation,
        splitterAlign
      );

      console.log({ items });

      // Simple resize is one where we do not need to dynamically add/remove tracks
      const simpleResize =
        items.contraOtherTrack.length === 0 ||
        (items.contra.length === 0 && items.contraOtherTrack.length > 0);
      state.adjacentItems = items;
      state.grid = grid;
      state.resizeElement = resizeElement;
      state.resizeDirection = resizeOrientation;
      state.simpleResize = simpleResize;
    },
    [layoutModel]
  );

  // reset the anchored track for resize item(s) and contra item(s)
  const flipResizeTracks = useCallback(() => {
    console.log("flip resize tracks");
    const {
      cols,
      grid,
      indexOfResizedItem,
      resizeOperation,
      resizeDirection: resizeOrientation,
      rows,
    } = resizingState.current;

    const [tracks, getTrack, setTrack] =
      resizeOrientation === "vertical"
        ? [rows, getRow, setGridRow]
        : [cols, getColumn, setGridColumn];
    const newTracks = tracks.slice();

    if (resizeOperation === "contract") {
      const targetTrackSize = tracks[indexOfResizedItem];
      newTracks[indexOfResizedItem - 1] += targetTrackSize;
      // Note, should be moveBy
      newTracks[indexOfResizedItem] = 0;
    } else {
      const targetTrackSize = tracks[indexOfResizedItem - 1];
      newTracks[indexOfResizedItem] += targetTrackSize;
      // Note, should be moveBy
      newTracks[indexOfResizedItem - 1] = 0;
    }

    if (grid) {
      const [targetEdge1, targetEdge2] =
        resizeOperation === "contract"
          ? [indexOfResizedItem + 1, indexOfResizedItem + 2]
          : [indexOfResizedItem, indexOfResizedItem + 1];

      for (const node of grid.childNodes) {
        const el = node as HTMLElement;
        const [from, to] = getTrack(el);

        if (to === targetEdge2) {
          setTrack(el, [from, to - 1]);
        }
        if (to === targetEdge1) {
          setTrack(el, [from, to + 1]);
        }
        if (from === targetEdge1) {
          setTrack(el, [from + 1, to]);
        }
        if (from === targetEdge2) {
          setTrack(el, [from - 1, to]);
        }
      }
    }

    return newTracks;
  }, []);

  const removeTrack = useCallback((indexOfTrack: number) => {
    const {
      cols,
      grid,
      resizeOperation,
      resizeDirection: resizeOrientation,
      rows,
    } = resizingState.current;
    const tracks = resizeOrientation === "vertical" ? rows : cols;
    const isShrinking = resizeOperation === "contract";
    const trackToBeRemoved = tracks[indexOfTrack];

    tracks.splice(indexOfTrack, 1);
    if (isShrinking) {
      tracks[indexOfTrack - 1] += trackToBeRemoved;
    } else {
      tracks[indexOfTrack] += trackToBeRemoved;
    }

    if (grid) {
      const targetTrack = indexOfTrack + 1;
      for (const node of grid.childNodes) {
        trackRemoved(node as HTMLElement, targetTrack, resizeOrientation);
      }
    }
    return tracks;
  }, []);

  const applyUpdates = useCallback(
    (
      resizeOrientation: GridLayoutResizeDirection,
      updates: [string, GridLayoutModelPosition][]
    ) => {
      const setTrack =
        resizeOrientation === "vertical" ? setGridRow : setGridColumn;

      updates.forEach(([id, position]) => {
        setTrack(id, position);
      });
    },
    []
  );

  const restoreComponentPositions = useCallback(
    (anulledResizeOperation: GridLayoutResizeOperation) => {
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
      setSplitters(splitters);
    },
    [applyUpdates, layoutModel]
  );

  const repositionComponentsForExpand = useCallback(
    (flippedFromContract: boolean) => {
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
        console.log({ splitters });
        setSplitters(splitters);
      }
    },
    [applyUpdates, layoutModel]
  );

  const repositionComponentsForContract = useCallback(
    (flippedFromExpand: boolean) => {
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
          "contract",
          flippedFromExpand
        );
        applyUpdates(resizeOrientation, updates);

        const splitters = layoutModel.getSplitterPositions();
        console.log({ splitters });
        setSplitters(splitters);
      }
    },
    [applyUpdates, layoutModel]
  );

  const setGridTrackTemplate = (tracks: number[]) => {
    const { grid, resizeDirection: resizeOrientation } = resizingState.current;
    const trackTemplate = tracks.map((r) => `${r}px`).join(" ");
    if (grid && resizeOrientation === "vertical") {
      grid.style.gridTemplateRows = trackTemplate;
    } else if (grid && resizeOrientation === "horizontal") {
      grid.style.gridTemplateColumns = trackTemplate;
    }
  };

  const flipToExpand = useCallback(
    (moveBy: number) => {
      const {
        cols,
        adjacentItems: { contra: contraItems },
        indexOfResizedItem,
        resizeDirection: resizeOrientation,
        rows,
        simpleResize,
      } = resizingState.current;
      const tracks = resizeOrientation === "vertical" ? rows : cols;
      const gridTracks = tracks.slice();
      if (contraItems.length > 0 && !simpleResize) {
        gridTracks[indexOfResizedItem] = Math.abs(moveBy);
        gridTracks[indexOfResizedItem - 1] -= moveBy;
      } else {
        gridTracks[indexOfResizedItem] += moveBy;
        gridTracks[indexOfResizedItem - 1] -= moveBy;
      }
      setGridTrackTemplate(gridTracks);
      if (contraItems.length > 0 && !simpleResize) {
        // // We could avoid this call if we could handle a flip in the call below
        // restoreComponentPositions("contract");
        repositionComponentsForExpand(true);
      }
    },
    [repositionComponentsForExpand]
  );

  const flipToContract = useCallback(
    (moveBy: number) => {
      const {
        cols,
        adjacentItems: { contra: contraItems },
        indexOfResizedItem,
        resizeDirection: resizeOrientation,
        rows,
        simpleResize,
      } = resizingState.current;

      const tracks = resizeOrientation === "vertical" ? rows : cols;
      const gridTracks = tracks.slice();
      if (contraItems.length > 0 && !simpleResize) {
        gridTracks[indexOfResizedItem] = Math.abs(moveBy);
        gridTracks[indexOfResizedItem - 1] += moveBy;
      } else {
        gridTracks[indexOfResizedItem - 1] -= moveBy;
        gridTracks[indexOfResizedItem] += moveBy;
      }
      setGridTrackTemplate(gridTracks);
      if (contraItems.length > 0 && !simpleResize) {
        // We could avoid this call if we could handle a flip in the call below
        // restoreComponentPositions("expand");
        repositionComponentsForContract(true);
      }
    },
    [repositionComponentsForContract]
  );

  const restoreOriginalLayout = useCallback(
    (anulledResizeOperation: GridLayoutResizeOperation) => {
      const {
        cols,
        adjacentItems: { contra: contraItems },
        indexOfResizedItem,
        resizeDirection: resizeOrientation,
        rows,
      } = resizingState.current;

      const tracks = resizeOrientation === "vertical" ? rows : cols;
      if (contraItems.length > 0) {
        tracks.splice(indexOfResizedItem, 1);
      }
      setGridTrackTemplate(tracks);
      if (contraItems.length > 0) {
        restoreComponentPositions(anulledResizeOperation);
      }
    },
    [restoreComponentPositions]
  );

  const handleTrackSizedToZero = useCallback(
    (gridTracks: number[], currentMousePos: number) => {
      const {
        adjacentItems: { contra: contraItems },
        grid,
        indexOfResizedItem,
        resizeOperation,
        resizeElement,
        resizeItem,
        resizeDirection,
        simpleResize,
      } = resizingState.current;
      const trackProperty = resizeDirection === "vertical" ? "rows" : "cols";
      const tracks = resizingState.current[trackProperty];
      const isContracting = resizeOperation === "contract";
      const index = isContracting ? indexOfResizedItem : indexOfResizedItem - 1;

      let returnTracks: number[] = gridTracks;

      if (gridTracks[index] === 0) {
        console.log(`handleTrackSizedToZero (reset) ${resizeOperation}`);

        if (simpleResize && resizeDirection) {
          // we know no other elements adjoin this track except for the resized and contra elements.
          // if the contra elements span at least 2 tracks, we can remove it.
          if (
            (isContracting && spansMultipleTracks(resizeItem)) ||
            (!isContracting && contraItems.every(spansMultipleTracks))
          ) {
            returnTracks = removeTrack(index);
            measureAndStoreGridItemDetails(
              grid,
              resizeElement,
              resizeDirection
            );
            if (!isContracting) {
              resizingState.current.indexOfResizedItem -= 1;
            }
            resizingState.current.mousePos = currentMousePos;
            resizingState.current.resizeOperation = null;

            const resizeItem = layoutModel.gridItems.find(
              (item) => item.id === resizeElement?.id
            );
            if (resizeItem) {
              resizingState.current.resizeItem = resizeItem;
            }
          } else {
            console.log("we've gone too far, veto further shrinkage");
          }
        }
      } else if (gridTracks[index] < 0) {
        console.log(`handleTrackSizedToZero (flip) ${resizeOperation} `);

        if (
          spansMultipleTracks(resizeItem) ||
          contraItems.every(spansMultipleTracks)
        ) {
          returnTracks = flipResizeTracks();
          if (resizeOperation === "contract") {
            resizingState.current.indexOfResizedItem += 1;
            resizingState.current.mousePos += tracks[indexOfResizedItem];
          } else {
            resizingState.current.indexOfResizedItem -= 1;
            resizingState.current.mousePos -= tracks[indexOfResizedItem - 1];
          }

          if (resizeDirection === "vertical") {
            resizingState.current.rows = returnTracks;
          } else {
            resizingState.current.cols = returnTracks;
          }
        } else {
          console.log("we've gone too far, veto further shrinkage");
        }
      }

      return returnTracks;
    },
    [
      flipResizeTracks,
      layoutModel.gridItems,
      measureAndStoreGridItemDetails,
      removeTrack,
    ]
  );

  const continueExpand = useCallback(
    (moveBy: number, currentMousePos: number) => {
      const {
        adjacentItems,
        cols,
        indexOfResizedItem,
        resizeDirection: resizeOrientation,
        rows,
        simpleResize,
        splitterAlign,
      } = resizingState.current;

      const tracks = resizeOrientation === "vertical" ? rows : cols;
      let gridTracks = tracks.slice();
      if (adjacentItems.contra.length > 0 && !simpleResize) {
        gridTracks[indexOfResizedItem] = Math.abs(moveBy);
        gridTracks[indexOfResizedItem - 1] -= moveBy;
      } else {
        if (splitterAlign === "start") {
          gridTracks[indexOfResizedItem] += moveBy;
          gridTracks[indexOfResizedItem - 1] -= moveBy;
        } else {
          gridTracks[indexOfResizedItem] -= moveBy;
          gridTracks[indexOfResizedItem + 1] += moveBy;
        }
        if (gridTracks[indexOfResizedItem - 1] <= 0) {
          gridTracks = handleTrackSizedToZero(gridTracks, currentMousePos);
        }
      }

      setGridTrackTemplate(gridTracks);
    },
    [handleTrackSizedToZero]
  );

  const initiateExpand = useCallback(
    (moveBy: number) => {
      const {
        adjacentItems,
        cols,
        indexOfResizedItem,
        resizeDirection: resizeOrientation,
        rows,
        simpleResize,
        splitterAlign,
      } = resizingState.current;

      const tracks = resizeOrientation === "vertical" ? rows : cols;
      const gridTracks = tracks.slice();

      if (simpleResize) {
        if (splitterAlign === "start") {
          gridTracks[indexOfResizedItem] += moveBy;
          gridTracks[indexOfResizedItem - 1] -= moveBy;
        } else {
          gridTracks[indexOfResizedItem] -= moveBy;
          gridTracks[indexOfResizedItem + 1] += moveBy;
        }
        setGridTrackTemplate(gridTracks);
      } else {
        tracks.splice(indexOfResizedItem, 0, 0);
        gridTracks.splice(indexOfResizedItem, 0, 0);
        gridTracks[indexOfResizedItem] = Math.abs(moveBy);
        gridTracks[indexOfResizedItem - 1] -= moveBy;
        setGridTrackTemplate(gridTracks);
      }

      if (
        adjacentItems.contra.length > 0 &&
        !simpleResize &&
        resizeOrientation
      ) {
        repositionComponentsForExpand(false);
      }
    },
    [repositionComponentsForExpand]
  );

  const continueContract = useCallback(
    (moveBy: number, currentMousePos: number) => {
      const {
        adjacentItems,
        indexOfResizedItem,
        resizeDirection: resizeOrientation,
        simpleResize,
        splitterAlign,
      } = resizingState.current;
      const trackProperty = resizeOrientation === "vertical" ? "rows" : "cols";
      const tracks = resizingState.current[trackProperty];
      let gridTracks = tracks.slice();

      if (adjacentItems.contra.length > 0 && !simpleResize) {
        gridTracks[indexOfResizedItem] = Math.abs(moveBy);
        gridTracks[indexOfResizedItem + 1] += moveBy;
      } else {
        if (splitterAlign === "start") {
          gridTracks[indexOfResizedItem - 1] -= moveBy;
          gridTracks[indexOfResizedItem] += moveBy;
        } else {
          gridTracks[indexOfResizedItem + 1] += moveBy;
          gridTracks[indexOfResizedItem] -= moveBy;
        }

        if (gridTracks[indexOfResizedItem] <= 0) {
          gridTracks = handleTrackSizedToZero(gridTracks, currentMousePos);
        }
      }

      setGridTrackTemplate(gridTracks);
    },
    [handleTrackSizedToZero]
  );

  const initiateContract = useCallback(
    (moveBy: number) => {
      const {
        adjacentItems,
        cols,
        indexOfResizedItem,
        resizeDirection: resizeOrientation,
        rows,
        simpleResize,
        splitterAlign,
      } = resizingState.current;

      const tracks = resizeOrientation === "vertical" ? rows : cols;
      const gridTracks = tracks.slice();

      if (simpleResize) {
        if (splitterAlign === "start") {
          gridTracks[indexOfResizedItem] -= moveBy;
          gridTracks[indexOfResizedItem - 1] += moveBy;
        } else {
          gridTracks[indexOfResizedItem] += moveBy;
          gridTracks[indexOfResizedItem + 1] -= moveBy;
        }
        setGridTrackTemplate(gridTracks);
      } else {
        tracks.splice(indexOfResizedItem, 0, 0);
        gridTracks.splice(indexOfResizedItem, 0, 0);
        gridTracks[indexOfResizedItem] = Math.abs(moveBy);
        gridTracks[indexOfResizedItem + 1] += moveBy;
        setGridTrackTemplate(gridTracks);
      }

      if (adjacentItems.contra.length > 0 && !simpleResize) {
        repositionComponentsForContract(false);
      }
    },
    [repositionComponentsForContract]
  );

  const mouseMove = useCallback(
    (e: MouseEvent) => {
      if (resizingRef.current === false) {
        return;
      }
      const {
        mousePos,
        resizeOperation,
        resizeDirection: resizeOrientation,
        splitterAlign,
      } = resizingState.current;

      const pos = resizeOrientation === "vertical" ? e.clientY : e.clientX;
      const moveBy = mousePos - pos;
      const newOperation = getResizeOperation(moveBy, splitterAlign);
      resizingState.current.resizeOperation = newOperation;

      if (resizeOperation === null && newOperation === null) {
        return;
      } else if (resizeOperation === null && newOperation === "expand") {
        console.log(`initiateExpand ${resizeOrientation}`);
        return initiateExpand(moveBy);
      } else if (resizeOperation === null && newOperation === "contract") {
        console.log(`initiateContract ${resizeOrientation}`);
        return initiateContract(moveBy);
      } else if (resizeOperation === "expand" && newOperation === "expand") {
        console.log(`continueExpand ${resizeOrientation}`);
        return continueExpand(moveBy, pos);
      } else if (
        resizeOperation === "contract" &&
        newOperation === "contract"
      ) {
        console.log(`continueToContract ${resizeOrientation}`);
        return continueContract(moveBy, pos);
      } else if (newOperation === null) {
        console.log("restore original layout");
        restoreOriginalLayout(resizeOperation as GridLayoutResizeOperation);
      } else if (resizeOperation === "expand" && newOperation === "contract") {
        console.log("reverse direction flip To Contract");
        return flipToContract(moveBy);
      } else if (resizeOperation === "contract" && newOperation === "expand") {
        console.log("referse direction flip To Expand");
        return flipToExpand(moveBy);
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

  const onMouseDown = useCallback<MouseEventHandler>(
    (e) => {
      const splitterElement = e.target as HTMLElement;
      if (!isSplitter(splitterElement)) {
        return;
      }

      const resizeOrientation: ResizeOrientation | undefined =
        isHorizontalSplitter(splitterElement) ? "horizontal" : "vertical";
      const splitterAlign = splitterElement.dataset.align as SplitterAlign;

      const resizeId = splitterElement.getAttribute("aria-controls");
      const resizeElement = resizeId ? document.getElementById(resizeId) : null;
      if (!resizeElement) {
        throw Error(`cannot find element associated with Splitter`);
      }

      const grid = resizeElement.closest(".vuuGridLayout") as HTMLElement;

      const mousePos = resizeOrientation === "vertical" ? e.clientY : e.clientX;

      measureAndStoreGridItemDetails(
        grid,
        resizeElement,
        resizeOrientation,
        splitterAlign
      );

      const cols = getColumns(grid);
      const rows = getRows(grid);

      const resizeItem = layoutModel.gridItems.find(
        (item) => item.id === resizeElement.id
      );

      if (!resizeItem) {
        throw Error("resize item not found");
      }
      resizingState.current = {
        ...resizingState.current,
        cols,
        indexOfResizedItem:
          resizeOrientation === "vertical"
            ? resizeItem.row.start - 1
            : resizeItem.column.start - 1,
        mousePos,
        resizeOperation: null,
        rows,
        splitterAlign,
      };

      resizingState.current.resizeItem = resizeItem;
      if (resizeOrientation === "vertical") {
        resizeElement.classList.add("resizing-v");
      } else if (resizeOrientation === "horizontal") {
        resizeElement.classList.add("resizing-h");
      }
      if (grid) {
        document.addEventListener("mousemove", mouseMove);
      }
    },
    [layoutModel.gridItems, measureAndStoreGridItemDetails, mouseMove]
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

  const splitGridCol = useCallback((id: string) => {
    const target = document.getElementById(id) as HTMLElement;
    const col = getColumn(target);
    const splitTracks = splitGridTracks(
      containerRef.current,
      col,
      "horizontal"
    );
    if (splitTracks) {
      setGridColumn(target, splitTracks[0]);
    }
  }, []);
  const splitGridRow = useCallback((id: string) => {
    const target = document.getElementById(id) as HTMLElement;
    const row = getRow(target);
    const splitTracks = splitGridTracks(containerRef.current, row, "vertical");
    if (splitTracks) {
      setGridRow(target, splitTracks[0]);
    }
    console.log({ splitTracks });
  }, []);

  useLayoutEffect(() => {
    if (containerRef.current) {
      containerRef.current.childNodes.forEach((node) => {
        const gridLayoutItem = node as HTMLElement;
        if (gridLayoutItem.classList.contains("vuuGridLayoutItem")) {
          const { id } = gridLayoutItem;
          const col = getColumn(gridLayoutItem);
          const row = getRow(gridLayoutItem);
          layoutModel.addGridItem(
            new GridLayoutModelItem(id, col[0], col[1], row[0], row[1])
          );
        }
      });
      const splitters = layoutModel.getSplitterPositions();
      console.log({ splitters });
      setSplitters(splitters);
    }
  }, [layoutModel]);

  return {
    containerRef,
    gridTemplateRows: rows.join(" "),
    onClick: clickHandler,
    onMouseDown,
    onMouseUp,
    splitGridCol,
    splitGridRow,
    splitters,
  };
};
