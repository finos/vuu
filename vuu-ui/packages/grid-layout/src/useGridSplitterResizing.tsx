import {
  type FocusEvent,
  type FocusEventHandler,
  type KeyboardEvent,
  type KeyboardEventHandler,
  type MouseEvent,
  type MouseEventHandler,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
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
  type ISplitter,
} from "./GridModel";
import { queryClosest } from "@vuu-ui/vuu-utils";
import type { GridController, GridTransaction } from "./GridController";
import { throwForGridCommandFailure } from "./GridCommand";

/** Distance, in pixels, an arrow key moves a splitter. */
export const KEYBOARD_RESIZE_STEP = 10;
/** Distance, in pixels, Shift + arrow key moves a splitter. */
export const KEYBOARD_RESIZE_FINE_STEP = 1;

const classNameSplitterActive = "vuuGridSplitter-active";

type ResizeBounds = Pick<
  ResizeState,
  | "proportionalInitialTrackSizes"
  | "proportionalTrackConstraints"
  | "proportionalTrackGroups"
  | "resizeTrackIsShared"
> & {
  afterAllowance: number;
  afterSize: number;
  beforeAllowance: number;
  beforeSize: number;
};

type KeyboardResizeKey = "decrement" | "increment" | "min" | "max";

/**
 * Maps a key to a splitter movement. Splitters with aria-orientation
 * "vertical" sit between columns and move with Left/Right; "horizontal"
 * splitters sit between rows and move with Up/Down.
 */
const getKeyboardResizeKey = (
  key: string,
  ariaOrientation: ISplitter["ariaOrientation"],
): KeyboardResizeKey | undefined => {
  const [decrementKey, incrementKey] =
    ariaOrientation === "vertical"
      ? ["ArrowLeft", "ArrowRight"]
      : ["ArrowUp", "ArrowDown"];
  switch (key) {
    case decrementKey:
      return "decrement";
    case incrementKey:
      return "increment";
    case "Home":
      return "min";
    case "End":
      return "max";
    default:
      return undefined;
  }
};

const toPercent = (value: number, total: number) =>
  total > 0 ? String(Math.round((value / total) * 100)) : "0";

export type SplitterResizingHookProps = Pick<
  GridLayoutProps,
  | "id"
  | "onBlur"
  | "onClick"
  | "onFocus"
  | "onKeyDown"
  | "onKeyUp"
  | "onMouseDown"
  | "rowResizeDistribution"
> & {
  gridController: GridController;
  gridLayoutModel: GridLayoutModel;
  gridModel: GridModel;
};

export const useGridSplitterResizing = ({
  gridController,
  gridLayoutModel: layoutModel,
  gridModel,
  onBlur: onBlurProp,
  onClick: onClickProp,
  onFocus: onFocusProp,
  onKeyDown: onKeyDownProp,
  onKeyUp: onKeyUpProp,
  onMouseDown: onMouseDownProp,
  rowResizeDistribution,
}: SplitterResizingHookProps) => {
  const resizingState = useRef<ResizeState | undefined>(undefined);
  const splitterRef = useRef<HTMLElement>(undefined);
  const transactionRef = useRef<GridTransaction | undefined>(undefined);
  /** The resize was started from the keyboard and ends on keyup. */
  const keyboardResizeRef = useRef(false);
  /** Id of the splitter in this grid that has focus. */
  const focusedSplitterIdRef = useRef<string | undefined>(undefined);

  const getOwnSplitter = useCallback(
    (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) {
        return null;
      }
      const splitterElement = getGridSplitter(target);
      if (
        splitterElement === null ||
        queryClosest(splitterElement, ".vuuGridLayout", true).id !==
          gridModel.id
      ) {
        return null;
      }
      return splitterElement;
    },
    [gridModel],
  );

  const getSplitterElementById = useCallback(
    (splitterId: string) =>
      document
        .getElementById(gridModel.id)
        ?.querySelector<HTMLElement>(`#${CSS.escape(splitterId)}`) ?? null,
    [gridModel],
  );

  const getItemSizes = useCallback(
    (
      gridLayout: HTMLElement,
      ids: string[],
      orientation: "horizontal" | "vertical",
    ) => {
      const dimension = orientation === "horizontal" ? "width" : "height";
      const minimum = orientation === "horizontal" ? "minWidth" : "minHeight";
      return ids.map((id) => {
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
        return {
          allowance: Math.max(
            0,
            size - (item[minimum] ?? DEFAULT_MIN_GRID_ITEM_SIZE),
          ),
          size,
        };
      });
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

  /**
   * How far the splitter can travel in each direction, and the sizes of
   * the items either side of it.
   */
  const getResizeBounds = useCallback(
    (splitter: ISplitter, gridLayout: HTMLElement): ResizeBounds => {
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

      const before = getItemSizes(
        gridLayout,
        splitter.resizedChildItems.before,
        splitter.orientation,
      );
      const after = getItemSizes(
        gridLayout,
        splitter.resizedChildItems.after,
        splitter.orientation,
      );

      return {
        afterAllowance: proportionalTrackGroups
          ? gridModel.tracks.getProportionalResizeAllowance(
              "row",
              proportionalTrackGroups.after,
              proportionalTrackConstraints?.after ?? [],
            )
          : Math.min(...after.map(({ allowance }) => allowance)),
        afterSize: Math.min(...after.map(({ size }) => size)),
        beforeAllowance: proportionalTrackGroups
          ? gridModel.tracks.getProportionalResizeAllowance(
              "row",
              proportionalTrackGroups.before,
              proportionalTrackConstraints?.before ?? [],
            )
          : Math.min(...before.map(({ allowance }) => allowance)),
        beforeSize: Math.min(...before.map(({ size }) => size)),
        proportionalInitialTrackSizes: proportionalTrackGroups
          ? gridModel.tracks.getTracks("row").map((track) => track.numericValue)
          : undefined,
        proportionalTrackConstraints,
        proportionalTrackGroups,
        resizeTrackIsShared,
      };
    },
    [
      canResizeGroupsProportionally,
      getItemSizes,
      getProportionalTrackConstraints,
      getProportionalTrackGroups,
      gridModel,
      layoutModel,
      rowResizeDistribution,
    ],
  );

  /**
   * Sets aria-valuenow/min/max from the size of the items before the
   * splitter, as a percentage of the items either side of it.
   */
  const updateAriaValues = useCallback(
    (splitterElement: HTMLElement) => {
      const gridLayout = document.getElementById(gridModel.id);
      if (gridLayout === null) {
        return;
      }
      const splitter = layoutModel.getSplitterById(splitterElement.id);
      const { afterAllowance, afterSize, beforeAllowance, beforeSize } =
        getResizeBounds(splitter, gridLayout);
      const total = beforeSize + afterSize;
      splitterElement.setAttribute(
        "aria-valuenow",
        toPercent(beforeSize, total),
      );
      splitterElement.setAttribute(
        "aria-valuemin",
        toPercent(beforeSize - beforeAllowance, total),
      );
      splitterElement.setAttribute(
        "aria-valuemax",
        toPercent(beforeSize + afterAllowance, total),
      );
    },
    [getResizeBounds, gridModel, layoutModel],
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

  /**
   * Starts a resize transaction for a splitter. `position` is the starting
   * point on the resize axis; later calls to `resizeTo` are relative to it.
   */
  const beginResize = useCallback(
    (splitterElement: HTMLElement, position: number) => {
      const gridLayout = queryClosest(splitterElement, ".vuuGridLayout", true);
      const transactionResult = gridController.beginTransaction("resize");
      if (!transactionResult.ok) {
        return transactionResult;
      }
      transactionRef.current = transactionResult.transaction;
      const splitter = layoutModel.getSplitterById(splitterElement.id);
      const { afterAllowance, beforeAllowance, ...bounds } = getResizeBounds(
        splitter,
        gridLayout,
      );
      resizingState.current = {
        maxPosition: position + afterAllowance,
        minPosition: position - beforeAllowance,
        position,
        proportionalInitialTrackSizes: bounds.proportionalInitialTrackSizes,
        proportionalMoveBy: bounds.proportionalTrackGroups ? 0 : undefined,
        proportionalTrackConstraints: bounds.proportionalTrackConstraints,
        proportionalTrackGroups: bounds.proportionalTrackGroups,
        resizeTrackIsShared: bounds.resizeTrackIsShared,
        splitter,
      };

      splitterElement.classList.add(classNameSplitterActive);
      splitterRef.current = splitterElement;
      return transactionResult;
    },
    [getResizeBounds, gridController, layoutModel],
  );

  /** Moves the splitter of the active resize to `requestedPosition`. */
  const resizeTo = useCallback(
    (requestedPosition: number) => {
      const { current: state } = resizingState;
      if (state) {
        const { position, resizeTrackIsShared } = state;
        const newPosition = Math.min(
          state.maxPosition,
          Math.max(state.minPosition, requestedPosition),
        );
        if (newPosition !== position) {
          const moveBy = position - newPosition;
          state.position = newPosition;
          if (resizeTrackIsShared) {
            createNewTrackForResize(moveBy);
          }
          moveSplitter(moveBy);
          const transaction = transactionRef.current;
          if (transaction) {
            throwForGridCommandFailure(
              transaction.dispatch({ type: "regenerate-placeholders" }),
            );
          }
        }
      }
    },
    [createNewTrackForResize, moveSplitter],
  );

  const endResize = useCallback((outcome: "commit" | "rollback") => {
    if (splitterRef.current) {
      splitterRef.current.classList.remove(classNameSplitterActive);
      splitterRef.current = undefined;
    }
    keyboardResizeRef.current = false;
    resizingState.current = undefined;

    const transaction = transactionRef.current;
    if (transaction) {
      transactionRef.current = undefined;
      const result =
        outcome === "commit" ? transaction.commit() : transaction.rollback();
      if (!result.ok) {
        throw Error(result.error.message);
      }
    }
  }, []);

  const mouseMove = useCallback(
    ({ clientX, clientY }: globalThis.MouseEvent) => {
      const { current: state } = resizingState;
      if (state) {
        resizeTo(state.splitter.orientation === "vertical" ? clientY : clientX);
      }
    },
    [resizeTo],
  );

  const mouseUp = useCallback(() => {
    document.removeEventListener("mousemove", mouseMove);
    document.removeEventListener("mouseup", mouseUp);
    const splitterElement = splitterRef.current;
    endResize("commit");
    splitterElement?.focus();
  }, [endResize, mouseMove]);

  // TODO need to identify the expanding track and the contracting track
  // these may not necessarily be adjacent, when resizeable attribute of
  // gridItems is taken into account
  const onMouseDown = useCallback<MouseEventHandler>(
    (e) => {
      const splitterElement = getOwnSplitter(e.target);
      if (splitterElement === null || resizingState.current) {
        return;
      }
      e.preventDefault();
      const splitter = layoutModel.getSplitterById(splitterElement.id);
      const result = beginResize(
        splitterElement,
        splitter.ariaOrientation === "horizontal" ? e.clientY : e.clientX,
      );
      if (!result.ok) {
        throw Error(result.error.message);
      }
      document.addEventListener("mousemove", mouseMove);
      document.addEventListener("mouseup", mouseUp);
    },
    [beginResize, getOwnSplitter, layoutModel, mouseMove, mouseUp],
  );

  const onKeyDown = useCallback<KeyboardEventHandler>(
    (e) => {
      const splitterElement = getOwnSplitter(e.target);
      if (splitterElement === null || e.defaultPrevented) {
        return;
      }
      if (e.key === "Escape") {
        if (keyboardResizeRef.current) {
          e.preventDefault();
          endResize("rollback");
        }
        return;
      }
      const splitter = layoutModel.getSplitterById(splitterElement.id);
      const resizeKey = getKeyboardResizeKey(e.key, splitter.ariaOrientation);
      if (resizeKey === undefined) {
        return;
      }
      e.preventDefault();
      if (resizingState.current === undefined) {
        if (!beginResize(splitterElement, 0).ok) {
          return;
        }
        keyboardResizeRef.current = true;
      } else if (!keyboardResizeRef.current) {
        // a mouse resize is in progress
        return;
      }
      const state = resizingState.current;
      if (state) {
        const step = e.shiftKey
          ? KEYBOARD_RESIZE_FINE_STEP
          : KEYBOARD_RESIZE_STEP;
        switch (resizeKey) {
          case "decrement":
            resizeTo(state.position - step);
            break;
          case "increment":
            resizeTo(state.position + step);
            break;
          case "min":
            resizeTo(state.minPosition);
            break;
          case "max":
            resizeTo(state.maxPosition);
        }
      }
    },
    [beginResize, endResize, getOwnSplitter, layoutModel, resizeTo],
  );

  const onKeyUp = useCallback<KeyboardEventHandler>(
    (e) => {
      if (keyboardResizeRef.current && getOwnSplitter(e.target) !== null) {
        const splitter = resizingState.current?.splitter;
        if (
          splitter &&
          getKeyboardResizeKey(e.key, splitter.ariaOrientation) !== undefined
        ) {
          endResize("commit");
        }
      }
    },
    [endResize, getOwnSplitter],
  );

  const onFocus = useCallback<FocusEventHandler>(
    (e) => {
      const splitterElement = getOwnSplitter(e.target);
      if (splitterElement !== null) {
        focusedSplitterIdRef.current = splitterElement.id;
        updateAriaValues(splitterElement);
      }
    },
    [getOwnSplitter, updateAriaValues],
  );

  /**
   * A splitter loses focus either because the user moved focus elsewhere,
   * or because a re-render replaced its element. The check is deferred so
   * the layout effect below can restore focus in the second case first.
   */
  const onBlur = useCallback<FocusEventHandler>(
    (e) => {
      const splitterElement = getOwnSplitter(e.target);
      if (splitterElement === null) {
        return;
      }
      const splitterId = splitterElement.id;
      queueMicrotask(() => {
        const current = getSplitterElementById(splitterId);
        if (current === null || document.activeElement !== current) {
          if (focusedSplitterIdRef.current === splitterId) {
            focusedSplitterIdRef.current = undefined;
          }
          if (keyboardResizeRef.current) {
            endResize("commit");
          }
        }
      });
    },
    [endResize, getOwnSplitter, getSplitterElementById],
  );

  // Keeps focus on a splitter whose element was replaced by a re-render,
  // and keeps its aria values in step with the layout.
  useLayoutEffect(() => {
    const splitterId = focusedSplitterIdRef.current;
    if (splitterId === undefined) {
      return;
    }
    const splitterElement = getSplitterElementById(splitterId);
    if (splitterElement === null) {
      return;
    }
    if (document.activeElement !== splitterElement) {
      const { activeElement } = document;
      if (activeElement === null || activeElement === document.body) {
        splitterElement.focus();
      }
    }
    if (document.activeElement === splitterElement) {
      if (resizingState.current) {
        splitterElement.classList.add(classNameSplitterActive);
        splitterRef.current = splitterElement;
      }
      updateAriaValues(splitterElement);
    }
  });

  useEffect(
    () => () => {
      document.removeEventListener("mousemove", mouseMove);
      document.removeEventListener("mouseup", mouseUp);
      const transaction = transactionRef.current;
      if (transaction) {
        transaction.rollback();
        transactionRef.current = undefined;
      }
    },
    [mouseMove, mouseUp],
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

  // Handlers passed to GridLayout run first, so they can preventDefault
  // a key before the splitter acts on it.
  return {
    onBlur: (e: FocusEvent<HTMLDivElement>) => {
      onBlurProp?.(e);
      onBlur(e);
    },
    onClick: clickHandler,
    onFocus: (e: FocusEvent<HTMLDivElement>) => {
      onFocusProp?.(e);
      onFocus(e);
    },
    onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
      onKeyDownProp?.(e);
      onKeyDown(e);
    },
    onKeyUp: (e: KeyboardEvent<HTMLDivElement>) => {
      onKeyUpProp?.(e);
      onKeyUp(e);
    },
    onMouseDown: (e: MouseEvent<HTMLDivElement>) => {
      onMouseDownProp?.(e);
      onMouseDown(e);
    },
  };
};
