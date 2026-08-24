import { MouseEventHandler, useCallback, useRef } from "react";
import {
  classNameLayoutItem,
  getGridLayoutItem,
  getGridSplitter,
} from "./grid-dom-utils";
import { adjustDistance, getTrackType } from "./grid-layout-utils";
import { GridLayoutProps } from "./GridLayout";
import {
  GridLayoutModel,
  GridLayoutResizeOperation,
  type ResizeState,
} from "./GridLayoutModel";
import { DEFAULT_MIN_GRID_ITEM_SIZE, GridModel } from "./GridModel";
import { queryClosest } from "@vuu-ui/vuu-utils";

export type SplitterResizingHookProps = Pick<
  GridLayoutProps,
  "id" | "onClick"
> & {
  gridLayoutModel: GridLayoutModel;
  gridModel: GridModel;
};

export const useGridSplitterResizing = ({
  gridLayoutModel: layoutModel,
  gridModel,
  onClick: onClickProp,
}: SplitterResizingHookProps) => {
  const resizingState = useRef<ResizeState | undefined>(undefined);
  const splitterRef = useRef<HTMLElement>(undefined);

  const getResizeAllowance = useCallback(
    (
      gridLayout: HTMLElement,
      ids: string[],
      orientation: "horizontal" | "vertical",
    ) => {
      const dimension = orientation === "horizontal" ? "width" : "height";
      const minimum = orientation === "horizontal" ? "minWidth" : "minHeight";
      return Math.min(
        ...ids.map((id) => {
          const item = gridModel.getChildItem(id, true);
          const element = gridLayout.querySelector<HTMLElement>(
            `#${CSS.escape(id)}`,
          );
          if (!element) {
            throw Error(
              `[useGridSplitterResizing] GridItem #${id} not found in #${gridModel.id}`,
            );
          }
          const size = element.getBoundingClientRect()[dimension];
          return Math.max(
            0,
            size - (item[minimum] ?? DEFAULT_MIN_GRID_ITEM_SIZE),
          );
        }),
      );
    },
    [gridModel],
  );

  const createNewTrackForResize = useCallback(
    (moveBy: number) => {
      const resizeOperation = moveBy < 0 ? "contract" : "expand";
      const { current: state } = resizingState;
      if (state) {
        const { splitter } = state;
        const trackType = getTrackType(splitter);

        const [_, resizeTrackIndex] = splitter.resizedGridTracks;

        layoutModel.addTrackForResize(
          trackType,
          Math.abs(moveBy),
          resizeOperation,
          resizeTrackIndex,
          state,
        );

        if (resizeOperation === "contract") {
          // TODO what is this for ?
          splitter.resizedGridTracks[1] += 1;
          splitter.resizedGridTracks[0] += 1;
        }

        state.resizeTrackIsShared = false;
      }
    },
    [layoutModel],
  );

  const removeTrack = useCallback(
    (moveBy: number, resizeOperation: GridLayoutResizeOperation) => {
      const { current: state } = resizingState;
      let restoredDistance = 0;
      if (state) {
        const { resizeTrackIsShared, splitter } = state;

        const [contraTrackIndex, resizeTrackIndex] = splitter.resizedGridTracks;

        const trackType = getTrackType(splitter);
        const targetTrack =
          resizeOperation === "expand" ? contraTrackIndex : resizeTrackIndex;

        const currentTracks = gridModel.tracks.getTracks(trackType);
        restoredDistance = currentTracks[targetTrack].numericValue;

        const assignDirection = resizeTrackIsShared
          ? resizeOperation === "expand"
            ? "bwd"
            : "fwd"
          : resizeOperation === "expand"
            ? "fwd"
            : "bwd";

        gridModel.removeGridTrack(trackType, targetTrack, assignDirection);

        state.resizeTrackIsShared = true;
        if (resizeOperation === "expand") {
          splitter.resizedGridTracks[1] -= 1;
          splitter.resizedGridTracks[0] -= 1;
        }

        const adjustedDistance = adjustDistance(moveBy, restoredDistance);
        if (adjustedDistance !== 0 && resizeOperation) {
          createNewTrackForResize(adjustedDistance);
        }
      }
    },
    [gridModel, createNewTrackForResize],
  );

  const moveSplitter = useCallback(
    (moveBy: number) => {
      const { current: state } = resizingState;
      const directionOfTravel = moveBy < 0 ? "bwd" : "fwd";

      if (state) {
        const { splitter } = state;
        const [contraTrackIndex, resizeTrackIndex] = splitter.resizedGridTracks;
        const trackType =
          splitter.orientation === "vertical" ? "row" : "column";

        const tracks = gridModel.tracks.getTracks(trackType);

        // this gets tricky when reduced track is a fractional value
        const reducedTrack =
          directionOfTravel === "fwd"
            ? tracks[contraTrackIndex]
            : tracks[resizeTrackIndex];

        if (reducedTrack.isFraction) {
          gridModel.tracks.measure(trackType);
        }

        if (
          !reducedTrack.isFraction &&
          reducedTrack.numericValue - Math.abs(moveBy) <= 0
        ) {
          if (directionOfTravel === "fwd") {
            removeTrack(moveBy, "expand");
          } else {
            removeTrack(moveBy, "contract");
          }
        } else {
          gridModel.tracks.resizeBy(
            trackType,
            resizeTrackIndex,
            contraTrackIndex,
            moveBy,
          );
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
        const requestedMousePos =
          splitter.orientation === "vertical" ? clientY : clientX;
        const newMousePos = Math.min(
          state.maxMousePos,
          Math.max(state.minMousePos, requestedMousePos),
        );
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

    if (splitterRef.current) {
      splitterRef.current.classList.remove("vuuGridSplitter-active");
      splitterRef.current = undefined;
    }

    // TODO make sure a resize has actually taken place
    gridModel.notifyChange();
  }, [gridModel, mouseMove]);

  // TODO need to identify the expanding track and the contracting track
  // these may not necessarily be adjacent, when resizeable attribute of
  // gridItems is taken into account
  const onMouseDown = useCallback<MouseEventHandler>(
    (e) => {
      const splitterElement = getGridSplitter(e.target as HTMLDivElement);
      if (splitterElement === null) {
        return;
      }

      const gridLayout = queryClosest(splitterElement, ".vuuGridLayout", true);
      if (gridLayout.id === gridModel.id) {
        e.preventDefault();
        const splitter = layoutModel.getSplitterById(splitterElement.id);
        const mousePos =
          splitter.ariaOrientation === "horizontal" ? e.clientY : e.clientX;
        const beforeAllowance = getResizeAllowance(
          gridLayout,
          splitter.resizedChildItems.before,
          splitter.orientation,
        );
        const afterAllowance = getResizeAllowance(
          gridLayout,
          splitter.resizedChildItems.after,
          splitter.orientation,
        );
        resizingState.current = {
          maxMousePos: mousePos + afterAllowance,
          minMousePos: mousePos - beforeAllowance,
          mousePos,
          resizeTrackIsShared: layoutModel.isResizeTrackShared(splitter),
          splitter,
        };

        document.addEventListener("mousemove", mouseMove);
        document.addEventListener("mouseup", mouseUp);

        splitterElement.classList.add("vuuGridSplitter-active");
        splitterRef.current = splitterElement;
      }
    },
    [getResizeAllowance, gridModel, layoutModel, mouseMove, mouseUp],
  );

  const selectedRef = useRef<string>(undefined);
  const clickHandler = useCallback<MouseEventHandler<HTMLDivElement>>(
    (e) => {
      const gridLayoutItem = getGridLayoutItem(e.target as HTMLElement);
      if (gridLayoutItem) {
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
      onClickProp?.(e);
    },
    [onClickProp],
  );

  return {
    onClick: clickHandler,
    onMouseDown,
  };
};
