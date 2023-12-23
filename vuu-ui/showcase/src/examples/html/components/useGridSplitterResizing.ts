import { MouseEventHandler, useCallback, useRef } from "react";
import {
  getColumn,
  getColumns,
  getGridItemsAdjoiningTrack,
  getRow,
  getRows,
  ResizeDirection,
  ResizeOrientation,
  setGridColumn,
  setGridRow,
  spansMultipleTracks,
  trackRemoved,
} from "./grid-dom-utils";
import { ColItem, GridItem, ResizeItem, RowItem } from "./grid-layout-types";
import { GridLayoutProps } from "./GridLayout";

export type SplitterResizingHookProps = Pick<
  GridLayoutProps,
  "rowCount" | "rows"
>;

type ResizeState = {
  cols: number[];
  contraItemsOtherTrack?: GridItem[];
  contraItems: GridItem[];
  simpleResize: boolean;
  grid?: HTMLElement;
  indexOfResizedItem: number;
  mousePos: number;
  resizeDirection: ResizeDirection | null;
  resizeElement?: HTMLElement;
  resizeOrientation: ResizeOrientation | null;
  resizeItems: GridItem[];
  rows: number[];
  siblingItemsOtherTrack?: GridItem[];
};

const initialState: ResizeState = {
  cols: [],
  contraItemsOtherTrack: undefined,
  contraItems: [],
  grid: undefined,
  indexOfResizedItem: -1,
  mousePos: -1,
  simpleResize: false,
  resizeDirection: null,
  resizeElement: undefined,
  resizeOrientation: null,
  resizeItems: [],
  rows: [],
  siblingItemsOtherTrack: undefined,
};

const getDirection = (moveBy: number): ResizeDirection | null => {
  if (moveBy === 0) {
    return null;
  } else if (moveBy > 0) {
    return "expand";
  } else {
    return "shrink";
  }
};

const setColValue = ({ id, col }: ColItem) => setGridColumn(id, col.value);
const setColExpanded = ({ id, col }: ColItem) =>
  setGridColumn(id, col.expanded);
const setColShrunk = ({ id, col }: ColItem) => setGridColumn(id, col.shrunk);

const setRowValue = ({ id, row }: RowItem) => setGridRow(id, row.value);
const setRowExpanded = ({ id, row }: RowItem) => setGridRow(id, row.expanded);
const setRowShrunk = ({ id, row }: RowItem) => setGridRow(id, row.shrunk);

export const useGridSplitterResizing = ({
  rowCount,
  // rows = ["80px"].concat(Array(rowCount).fill("1fr")),
  rows = Array(rowCount).fill("1fr"),
}: SplitterResizingHookProps) => {
  const resizingState = useRef<ResizeState>(initialState);

  const resizingRef = useRef(true);

  const measureAndStoreGridItemDetails = useCallback(
    (
      grid: HTMLElement | undefined,
      resizeElement: HTMLElement | undefined,
      resizeOrientation: ResizeOrientation
    ) => {
      if (grid === undefined || resizeElement === undefined) {
        throw Error(`measureAndStoreGridItemDetails missing required param`);
      }
      const { current: state } = resizingState;
      const [
        contraItems,
        contraItemsMaybe,
        contraItemsOtherTrack,
        siblingItemsOtherTrack,
      ] = getGridItemsAdjoiningTrack(grid, resizeElement, resizeOrientation);

      if (Array.isArray(contraItemsMaybe) && contraItemsMaybe.length > 0) {
        // if  contraItemsMaybe together fill the track, they go into contraItems
        contraItemsOtherTrack?.push(...contraItemsMaybe);
      }

      // Simple resize is one where we do not need to dynamically add/remove tracks
      const simpleResize =
        contraItemsOtherTrack === undefined ||
        (contraItems.length === 0 && contraItemsOtherTrack.length > 0);
      state.contraItems = contraItems;
      state.contraItemsOtherTrack = contraItemsOtherTrack;
      state.grid = grid;
      state.resizeElement = resizeElement;
      state.resizeOrientation = resizeOrientation;
      state.siblingItemsOtherTrack = siblingItemsOtherTrack;
      state.simpleResize = simpleResize;

      console.log({
        simpleResize,
        contraItems,
        contraItemsMaybe,
        contraItemsOtherTrack,
        siblingItemsOtherTrack,
      });
    },
    []
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
    const {
      contraItemsOtherTrack,
      contraItems,
      resizeItems,
      resizeOrientation,
      siblingItemsOtherTrack,
    } = resizingState.current;

    const setValue: any =
      resizeOrientation === "vertical" ? setRowValue : setColValue;

    contraItems.forEach(setValue);
    resizeItems.forEach(setValue);
    contraItemsOtherTrack?.forEach(setValue);
    siblingItemsOtherTrack?.forEach(setValue);
  }, []);

  const repositionComponentsForExpand = useCallback(() => {
    const {
      contraItemsOtherTrack,
      contraItems,
      resizeOrientation,
      resizeItems,
      siblingItemsOtherTrack,
    } = resizingState.current;

    const setExpanded: any =
      resizeOrientation === "vertical" ? setRowExpanded : setColExpanded;

    resizeItems.forEach(setExpanded);
    contraItems.forEach(setExpanded);
    contraItemsOtherTrack?.forEach(setExpanded);
    siblingItemsOtherTrack?.forEach(setExpanded);
  }, []);

  const repositionComponentsForShrink = useCallback(() => {
    const {
      contraItemsOtherTrack,
      contraItems,
      resizeItems,
      resizeOrientation,
      siblingItemsOtherTrack,
    } = resizingState.current;

    const setShrunk: any =
      resizeOrientation === "vertical" ? setRowShrunk : setColShrunk;

    contraItems.forEach(setShrunk);
    resizeItems.forEach(setShrunk);
    contraItemsOtherTrack?.forEach(setShrunk);
    siblingItemsOtherTrack?.forEach(setShrunk);
  }, []);

  const setGridTrackTemplate = (tracks: number[]) => {
    if (tracks.some(isNaN)) {
      console.warn("Nan alert");
    }
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
        resizeItems,
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
            (isShrinking && resizeItems.every(spansMultipleTracks)) ||
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

            if (resizeOrientation === "vertical") {
              // TODO can thi sjust be moved into measureAndStoreGridItemDetails
              const row = getRow(resizeElement);
              const [from] = row;
              const resizeItem = new ResizeItem(row);

              resizingState.current.resizeItems = [
                { id: resizeElement.id, row: resizeItem },
              ];
            } else {
              // TODO horizontal
            }
          } else {
            console.log("we've gone too far, veto further shrinkage");
          }
        }
      } else if (gridTracks[index] < 0) {
        console.log(`handleTrackSizedToZero (flip) ${resizeDirection} `);

        if (
          resizeItems.every(spansMultipleTracks) ||
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
    [flipResizeTracks, measureAndStoreGridItemDetails, removeTrack]
  );

  const continueExpand = useCallback(
    (moveBy: number, currentMousePos: number) => {
      const {
        cols,
        contraItems,
        indexOfResizedItem,
        resizeOrientation,
        rows,
        simpleResize,
      } = resizingState.current;

      const tracks = resizeOrientation === "vertical" ? rows : cols;
      let gridTracks = tracks.slice();
      if (contraItems.length > 0 && !simpleResize) {
        gridTracks[indexOfResizedItem] = Math.abs(moveBy);
        gridTracks[indexOfResizedItem - 1] -= moveBy;
      } else {
        gridTracks[indexOfResizedItem] += moveBy;
        gridTracks[indexOfResizedItem - 1] -= moveBy;
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
        cols,
        contraItems,
        indexOfResizedItem,
        resizeOrientation,
        rows,
        simpleResize,
      } = resizingState.current;

      const tracks = resizeOrientation === "vertical" ? rows : cols;
      const gridTracks = tracks.slice();

      if (simpleResize) {
        gridTracks[indexOfResizedItem] += moveBy;
        gridTracks[indexOfResizedItem - 1] -= moveBy;
        setGridTrackTemplate(gridTracks);
      } else {
        tracks.splice(indexOfResizedItem, 0, 0);
        gridTracks.splice(indexOfResizedItem, 0, 0);
        gridTracks[indexOfResizedItem] = Math.abs(moveBy);
        gridTracks[indexOfResizedItem - 1] -= moveBy;
        setGridTrackTemplate(gridTracks);
      }

      if (contraItems.length > 0 && !simpleResize) {
        repositionComponentsForExpand();
      }
    },
    [repositionComponentsForExpand]
  );

  const continueShrink = useCallback(
    (moveBy: number, currentMousePos: number) => {
      const {
        contraItems,
        indexOfResizedItem,
        resizeOrientation,
        simpleResize,
      } = resizingState.current;
      const trackProperty = resizeOrientation === "vertical" ? "rows" : "cols";
      const tracks = resizingState.current[trackProperty];
      let gridTracks = tracks.slice();

      if (contraItems.length > 0 && !simpleResize) {
        gridTracks[indexOfResizedItem] = Math.abs(moveBy);
        gridTracks[indexOfResizedItem + 1] += moveBy;
      } else {
        gridTracks[indexOfResizedItem - 1] -= moveBy;
        gridTracks[indexOfResizedItem] += moveBy;

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
        cols,
        contraItems,
        indexOfResizedItem,
        resizeOrientation,
        rows,
        simpleResize,
      } = resizingState.current;

      const tracks = resizeOrientation === "vertical" ? rows : cols;
      const gridTracks = tracks.slice();

      if (simpleResize) {
        gridTracks[indexOfResizedItem] -= moveBy;
        gridTracks[indexOfResizedItem - 1] += moveBy;
        setGridTrackTemplate(gridTracks);
      } else {
        tracks.splice(indexOfResizedItem, 0, 0);
        gridTracks.splice(indexOfResizedItem, 0, 0);
        gridTracks[indexOfResizedItem] = Math.abs(moveBy);
        gridTracks[indexOfResizedItem + 1] += moveBy;
        setGridTrackTemplate(gridTracks);
      }

      if (contraItems.length > 0 && !simpleResize) {
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
      const { mousePos, resizeDirection, resizeOrientation } =
        resizingState.current;

      const pos = resizeOrientation === "vertical" ? e.clientY : e.clientX;
      const moveBy = mousePos - pos;
      const newDirection = getDirection(moveBy);
      resizingState.current.resizeDirection = newDirection;

      if (resizeDirection === null && newDirection === null) {
        return;
      } else if (resizeDirection === null && newDirection === "expand") {
        console.log(`initiate ${resizeOrientation} expand `);
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
      const resizeElement = e.target as HTMLElement;
      const grid = resizeElement.closest(".vuuGridLayout") as HTMLElement;
      const { left, top } = resizeElement.getBoundingClientRect();

      const resizeOrientation: ResizeOrientation | undefined =
        e.clientY < top
          ? "vertical"
          : e.clientX < left
          ? "horizontal"
          : undefined;

      if (resizeOrientation === undefined) {
        return;
      }

      const mousePos = resizeOrientation === "vertical" ? e.clientY : e.clientX;

      measureAndStoreGridItemDetails(grid, resizeElement, resizeOrientation);

      const cols = getColumns(grid);
      const rows = getRows(grid);

      // We have mouse down on a splitter (rendered outside the owner component)
      // Can we make this more definitive ?
      if (resizeOrientation === "vertical") {
        const row = getRow(resizeElement);
        const [from] = row;
        const resizeItem = new ResizeItem(row);

        resizingState.current = {
          ...resizingState.current,
          cols,
          indexOfResizedItem: from - 1,
          mousePos,
          resizeDirection: null,
          resizeItems: [{ id: resizeElement.id, row: resizeItem }],
          rows,
        };
        resizeElement.classList.add("resizing-v");
      } else if (resizeOrientation === "horizontal") {
        const col = getColumn(resizeElement);
        const [from] = col;
        const resizeItem = new ResizeItem(col);

        resizingState.current = {
          ...resizingState.current,
          cols,
          indexOfResizedItem: from - 1,
          mousePos,
          resizeDirection: null,
          resizeItems: [{ id: resizeElement.id, col: resizeItem }],
          rows,
        };
        resizeElement.classList.add("resizing-h");
      }
      if (grid) {
        document.addEventListener("mousemove", mouseMove);
      }
    },
    [measureAndStoreGridItemDetails, mouseMove]
  );

  const onMouseUp = useCallback<MouseEventHandler>(
    (e) => {
      document.removeEventListener("mousemove", mouseMove);
      const target = e.target as HTMLElement;
      target.classList.remove("resizing-h", "resizing-v");
    },
    [mouseMove]
  );

  return {
    gridTemplateRows: rows.join(" "),
    onMouseDown,
    onMouseUp,
  };
};
