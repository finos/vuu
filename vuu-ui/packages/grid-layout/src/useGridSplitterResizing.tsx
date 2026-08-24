import { type MouseEventHandler, useCallback, useRef } from "react";
import {
  classNameLayoutItem,
  getGridLayoutItem,
  getGridSplitter,
} from "./grid-dom-utils";
import { adjustDistance, getTrackType } from "./grid-layout-utils";
import type { GridLayoutProps } from "./GridLayout";
import type {
  GridLayoutModel,
  GridLayoutResizeOperation,
  ResizeState,
} from "./GridLayoutModel";
import {
  DEFAULT_MIN_GRID_ITEM_SIZE,
  type GridModel,
  type GridTrackResizeConstraint,
} from "./GridModel";
import { queryClosest } from "@vuu-ui/vuu-utils";

export type SplitterResizingHookProps = Pick<
  GridLayoutProps,
  "id" | "onClick" | "rowResizeDistribution"
> & {
  gridLayoutModel: GridLayoutModel;
  gridModel: GridModel;
};

export const useGridSplitterResizing = ({
  gridLayoutModel: layoutModel,
  gridModel,
  onClick: onClickProp,
  rowResizeDistribution,
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

  const getProportionalTrackGroups = useCallback(
    (splitter: ResizeState["splitter"]) => {
      const indicesFor = (ids: string[]) => {
        const items = ids.map((id) => gridModel.getChildItem(id, true));
        const start = Math.min(...items.map(({ row }) => row.start)) - 1;
        const end = Math.max(...items.map(({ row }) => row.end)) - 1;
        return Array.from({ length: end - start }, (_, index) => start + index);
      };
      return {
        after: indicesFor(splitter.resizedChildItems.after),
        before: indicesFor(splitter.resizedChildItems.before),
      };
    },
    [gridModel],
  );

  const canResizeGroupsProportionally = useCallback(
    ({
      after,
      before,
    }: NonNullable<ResizeState["proportionalTrackGroups"]>) => {
      const allTrackIndices = before.concat(after);
      return gridModel.childItems.every((item) => {
        const itemTrackIndices = Array.from(
          { length: item.row.end - item.row.start },
          (_, index) => item.row.start - 1 + index,
        );
        const crossesBoundary =
          before.some((index) => itemTrackIndices.includes(index)) &&
          after.some((index) => itemTrackIndices.includes(index));
        return (
          !crossesBoundary ||
          allTrackIndices.every((index) => itemTrackIndices.includes(index))
        );
      });
    },
    [gridModel],
  );

  const getProportionalTrackConstraints = useCallback(
    (trackIndices: number[], oppositeTrackIndices: number[]) => {
      gridModel.tracks.measure("row");
      const tracks = gridModel.tracks.getTracks("row");
      const groupTrackSet = new Set(trackIndices);
      const firstTrack = Math.min(...trackIndices);
      const lastTrack = Math.max(...trackIndices);
      const constraints: GridTrackResizeConstraint[] = [];
      for (const item of gridModel.childItems) {
        if (
          item.stackId ||
          item.row.end - 2 < firstTrack ||
          item.row.start - 1 > lastTrack
        ) {
          continue;
        }
        const itemTrackIndices = Array.from(
          { length: item.row.end - item.row.start },
          (_, index) => item.row.start - 1 + index,
        );
        if (
          trackIndices
            .concat(oppositeTrackIndices)
            .every((index) => itemTrackIndices.includes(index))
        ) {
          continue;
        }
        const overlappingTrackIndices = itemTrackIndices.filter((index) =>
          groupTrackSet.has(index),
        );
        const externalSize = itemTrackIndices
          .filter((index) => !groupTrackSet.has(index))
          .reduce((total, index) => total + tracks[index].numericValue, 0);
        const requiredGroupSize = Math.max(
          0,
          (item.minHeight ?? DEFAULT_MIN_GRID_ITEM_SIZE) - externalSize,
        );
        if (requiredGroupSize > 0) {
          constraints.push({
            minimum: requiredGroupSize,
            trackIndices: overlappingTrackIndices,
          });
        }
      }
      return constraints;
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
        if (state.proportionalTrackGroups) {
          state.proportionalMoveBy = (state.proportionalMoveBy ?? 0) + moveBy;
          gridModel.tracks.resizeGroupsProportionally(
            "row",
            state.proportionalTrackGroups.before,
            state.proportionalTrackGroups.after,
            state.proportionalMoveBy,
            state.proportionalTrackConstraints?.before,
            state.proportionalTrackConstraints?.after,
            state.proportionalInitialTrackSizes,
          );
          return;
        }
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
        const resizeTrackIsShared = layoutModel.isResizeTrackShared(splitter);
        const candidateTrackGroups =
          rowResizeDistribution === "proportional" &&
          splitter.orientation === "vertical" &&
          !resizeTrackIsShared
            ? getProportionalTrackGroups(splitter)
            : undefined;
        const proportionalTrackGroups =
          candidateTrackGroups &&
          canResizeGroupsProportionally(candidateTrackGroups)
            ? candidateTrackGroups
            : undefined;
        const proportionalTrackConstraints = proportionalTrackGroups
          ? {
              after: getProportionalTrackConstraints(
                proportionalTrackGroups.after,
                proportionalTrackGroups.before,
              ),
              before: getProportionalTrackConstraints(
                proportionalTrackGroups.before,
                proportionalTrackGroups.after,
              ),
            }
          : undefined;
        const mousePos =
          splitter.ariaOrientation === "horizontal" ? e.clientY : e.clientX;
        const beforeAllowance = proportionalTrackGroups
          ? gridModel.tracks.getProportionalResizeAllowance(
              "row",
              proportionalTrackGroups.before,
              proportionalTrackConstraints?.before ?? [],
            )
          : getResizeAllowance(
              gridLayout,
              splitter.resizedChildItems.before,
              splitter.orientation,
            );
        const afterAllowance = proportionalTrackGroups
          ? gridModel.tracks.getProportionalResizeAllowance(
              "row",
              proportionalTrackGroups.after,
              proportionalTrackConstraints?.after ?? [],
            )
          : getResizeAllowance(
              gridLayout,
              splitter.resizedChildItems.after,
              splitter.orientation,
            );
        resizingState.current = {
          maxMousePos: mousePos + afterAllowance,
          minMousePos: mousePos - beforeAllowance,
          mousePos,
          proportionalTrackConstraints,
          proportionalTrackGroups,
          proportionalInitialTrackSizes: proportionalTrackGroups
            ? gridModel.tracks
                .getTracks("row")
                .map((track) => track.numericValue)
            : undefined,
          proportionalMoveBy: proportionalTrackGroups ? 0 : undefined,
          resizeTrackIsShared,
          splitter,
        };

        document.addEventListener("mousemove", mouseMove);
        document.addEventListener("mouseup", mouseUp);

        splitterElement.classList.add("vuuGridSplitter-active");
        splitterRef.current = splitterElement;
      }
    },
    [
      canResizeGroupsProportionally,
      getProportionalTrackGroups,
      getProportionalTrackConstraints,
      getResizeAllowance,
      gridModel,
      layoutModel,
      mouseMove,
      mouseUp,
      rowResizeDistribution,
    ],
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
