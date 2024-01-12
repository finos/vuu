import {
  AdjacentItems,
  GridLayoutModel,
  GridLayoutModelItem,
  IGridLayoutModelItem,
  ISplitter,
  NO_ADJACENT_ITEMS,
  SplitterAlign,
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
  ResizeDirection,
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
  resizeDirection: ResizeDirection | null;
  resizeElement?: HTMLElement;
  resizeOrientation: ResizeOrientation | null;
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
  resizeDirection: null,
  resizeElement: undefined,
  resizeOrientation: null,
  resizeItem: undefined,
  rows: [],
  simpleResize: false,
  splitterAlign: "start",
};

const getDirection = (
  moveBy: number,
  splitterAlign: SplitterAlign = "start"
): ResizeDirection | null => {
  if (moveBy > 0 && splitterAlign === "start") {
    return "expand";
  } else if (moveBy < 0 && splitterAlign === "start") {
    return "shrink";
  } else if (moveBy > 0 && splitterAlign === "end") {
    return "shrink";
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
      state.resizeOrientation = resizeOrientation;
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
      resizeDirection,
      resizeOrientation,
      rows,
    } = resizingState.current;

    const [tracks, getTrack, setTrack] =
      resizeOrientation === "vertical"
        ? [rows, getRow, setGridRow]
        : [cols, getColumn, setGridColumn];
    const newTracks = tracks.slice();

    if (resizeDirection === "shrink") {
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
        resizeDirection === "shrink"
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
    const { cols, grid, resizeDirection, resizeOrientation, rows } =
      resizingState.current;
    const tracks = resizeOrientation === "vertical" ? rows : cols;
    const isShrinking = resizeDirection === "shrink";
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

  const restoreComponentPositions = useCallback(() => {
    const { adjacentItems, resizeItem, resizeOrientation } =
      resizingState.current;

    const setValue: any =
      resizeOrientation === "vertical" ? setRowValue : setColValue;

    adjacentItems.contra.forEach(setValue);
    setValue(resizeItem);
    adjacentItems.contraOtherTrack.forEach(setValue);
    adjacentItems.siblingsOtherTrack.forEach(setValue);
  }, []);

  const repositionComponentsForExpand = useCallback(() => {
    const { adjacentItems, resizeOrientation, resizeItem } =
      resizingState.current;

    if (resizeOrientation && resizeItem) {
      const updates = layoutModel.repositionComponentsforResize(
        resizeItem,
        adjacentItems,
        resizeOrientation,
        "expand"
      );
      const setTrack =
        resizeOrientation === "vertical" ? setGridRow : setGridColumn;

      updates.forEach(([id, position]) => {
        setTrack(id, position);
      });

      const splitters = layoutModel.getSplitterPositions();
      console.log({ splitters });
      setSplitters(splitters);
    }
  }, [layoutModel]);

  const repositionComponentsForShrink = useCallback(() => {
    const { adjacentItems, resizeOrientation, resizeItem } =
      resizingState.current;

    if (resizeOrientation && resizeItem) {
      const updates = layoutModel.repositionComponentsforResize(
        resizeItem,
        adjacentItems,
        resizeOrientation,
        "shrink"
      );
      const setTrack =
        resizeOrientation === "vertical" ? setGridRow : setGridColumn;

      updates.forEach(([id, position]) => {
        setTrack(id, position);
      });

      const splitters = layoutModel.getSplitterPositions();
      console.log({ splitters });
      setSplitters(splitters);
    }
  }, [layoutModel]);

  const setGridTrackTemplate = (tracks: number[]) => {
    const { grid, resizeOrientation } = resizingState.current;
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
        contraItems,
        indexOfResizedItem,
        resizeOrientation,
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
        repositionComponentsForExpand();
      }
    },
    [repositionComponentsForExpand]
  );

  const flipToShrink = useCallback(
    (moveBy: number) => {
      const {
        cols,
        contraItems,
        indexOfResizedItem,
        resizeOrientation,
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
        repositionComponentsForShrink();
      }
    },
    [repositionComponentsForShrink]
  );

  const restoreOriginalLayout = useCallback(() => {
    const { cols, contraItems, indexOfResizedItem, resizeOrientation, rows } =
      resizingState.current;

    const tracks = resizeOrientation === "vertical" ? rows : cols;
    if (contraItems.length > 0) {
      tracks.splice(indexOfResizedItem, 1);
    }
    setGridTrackTemplate(tracks);
    if (contraItems.length > 0) {
      restoreComponentPositions();
    }
  }, [restoreComponentPositions]);

  const handleTrackSizedToZero = useCallback(
    (gridTracks: number[], currentMousePos: number) => {
      const {
        contraItems,
        grid,
        indexOfResizedItem,
        resizeDirection,
        resizeElement,
        resizeItem,
        resizeOrientation,
        simpleResize,
      } = resizingState.current;
      const trackProperty = resizeOrientation === "vertical" ? "rows" : "cols";
      const tracks = resizingState.current[trackProperty];
      const isShrinking = resizeDirection === "shrink";
      const index = isShrinking ? indexOfResizedItem : indexOfResizedItem - 1;

      let returnTracks: number[] = gridTracks;

      if (gridTracks[index] === 0) {
        console.log(`handleTrackSizedToZero (reset) ${resizeDirection}`);

        if (simpleResize && resizeOrientation) {
          // we know no other elements adjoin this track except for the resized and contra elements.
          // if the contra elements span at least 2 tracks, we can remove it.
          if (
            (isShrinking && spansMultipleTracks(resizeItem)) ||
            (!isShrinking && contraItems.every(spansMultipleTracks))
          ) {
            returnTracks = removeTrack(index);
            measureAndStoreGridItemDetails(
              grid,
              resizeElement,
              resizeOrientation
            );
            if (!isShrinking) {
              resizingState.current.indexOfResizedItem -= 1;
            }
            resizingState.current.mousePos = currentMousePos;
            resizingState.current.resizeDirection = null;

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
        console.log(`handleTrackSizedToZero (flip) ${resizeDirection} `);

        if (
          spansMultipleTracks(resizeItem) ||
          contraItems.every(spansMultipleTracks)
        ) {
          returnTracks = flipResizeTracks();
          if (resizeDirection === "shrink") {
            resizingState.current.indexOfResizedItem += 1;
            resizingState.current.mousePos += tracks[indexOfResizedItem];
          } else {
            resizingState.current.indexOfResizedItem -= 1;
            resizingState.current.mousePos -= tracks[indexOfResizedItem - 1];
          }

          if (resizeOrientation === "vertical") {
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
        resizeOrientation,
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
        resizeOrientation,
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
        repositionComponentsForExpand();
      }
    },
    [repositionComponentsForExpand]
  );

  const continueShrink = useCallback(
    (moveBy: number, currentMousePos: number) => {
      const {
        adjacentItems,
        indexOfResizedItem,
        resizeOrientation,
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

  const initiateShrink = useCallback(
    (moveBy: number) => {
      const {
        adjacentItems,
        cols,
        indexOfResizedItem,
        resizeOrientation,
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
        repositionComponentsForShrink();
      }
    },
    [repositionComponentsForShrink]
  );

  const mouseMove = useCallback(
    (e: MouseEvent) => {
      if (resizingRef.current === false) {
        return;
      }
      const { mousePos, resizeDirection, resizeOrientation, splitterAlign } =
        resizingState.current;

      const pos = resizeOrientation === "vertical" ? e.clientY : e.clientX;
      const moveBy = mousePos - pos;
      const newDirection = getDirection(moveBy, splitterAlign);
      resizingState.current.resizeDirection = newDirection;

      if (resizeDirection === null && newDirection === null) {
        return;
      } else if (resizeDirection === null && newDirection === "expand") {
        console.log(`initiateExpand ${resizeOrientation}`);
        return initiateExpand(moveBy);
      } else if (resizeDirection === null && newDirection === "shrink") {
        console.log(`initiateShrink ${resizeOrientation}`);
        return initiateShrink(moveBy);
      } else if (resizeDirection === "expand" && newDirection === "expand") {
        console.log(`continueExpand ${resizeOrientation}`);
        return continueExpand(moveBy, pos);
      } else if (resizeDirection === "shrink" && newDirection === "shrink") {
        console.log(`continueShrink ${resizeOrientation}`);
        return continueShrink(moveBy, pos);
      } else if (newDirection === null) {
        console.log("restore original layout");
        restoreOriginalLayout();
      } else if (resizeDirection === "expand" && newDirection === "shrink") {
        console.log("reverse direction flip To Shrink");
        return flipToShrink(moveBy);
      } else if (resizeDirection === "shrink" && newDirection === "expand") {
        console.log("referse direction flip To Expand");
        return flipToExpand(moveBy);
      }
    },
    [
      continueExpand,
      continueShrink,
      flipToExpand,
      flipToShrink,
      initiateExpand,
      initiateShrink,
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
        resizeDirection: null,
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
    },
    [mouseMove]
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
