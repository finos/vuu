import { registerComponent } from "@vuu-ui/vuu-utils";
import { useIdMemo } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import {
  cloneElement,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from "react";
import { DragDropProviderNext } from "./drag-drop-next/DragDropProviderNext";
import { computeFocusOrder } from "./grid-focus-order";
import { getGridArea } from "./grid-layout-utils";
import { GridLayoutContext } from "./GridLayoutContext";
import { GridLayoutHeaderSlots } from "./GridLayoutHeaderSlots";
import type { GridLayoutItemProps } from "./GridLayoutItem";
import { GridLayoutStackedItem } from "./GridLayoutStackedtem";
import type {
  GridColumnsAndRows,
  GridLayoutChangeHandler,
  ISplitter,
} from "./GridModel";
import { GridPlaceholder } from "./GridPlaceholder";
import { useGridFocusOrder } from "./useGridFocusOrder";
import { useGridLayout } from "./useGridLayout";
import type { GridMaximizedChangeHandler } from "./useGridMaximize";
import { useGridSplitterResizing } from "./useGridSplitterResizing";
import { GridSplitter } from "./GridSplitter";

import gridLayoutCss from "./GridLayout.css";

const classBase = "vuuGridLayout";

const startsAtHorizontalSplitter = (
  splitter: ISplitter,
  splitters: ISplitter[],
) =>
  splitter.ariaOrientation === "vertical" &&
  splitters.some(
    (candidate) =>
      candidate.ariaOrientation === "horizontal" &&
      candidate.row.start === splitter.row.start &&
      candidate.column.start <= splitter.column.start &&
      candidate.column.end > splitter.column.start,
  );

/**
 * Accessible name for a splitter, from the titles of the items either side
 * of it, e.g. "Resize Blotter and Orders".
 */
const getSplitterLabel = (
  splitter: ISplitter,
  getItemTitle: (itemId: string) => string | undefined,
) => {
  const titles = (ids: string[]) =>
    ids
      .map(getItemTitle)
      .filter((title): title is string => !!title)
      .join(", ");
  const before = titles(splitter.resizedChildItems.before);
  const after = titles(splitter.resizedChildItems.after);
  if (before && after) {
    return `Resize ${before} and ${after}`;
  }
  return splitter.ariaOrientation === "vertical"
    ? "Resize columns"
    : "Resize rows";
};

export type GridResizeable = "h" | "v" | "hv";
export type GridResizeDistribution = "adjacent" | "proportional";

export interface GridLayoutProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  children?:
    | ReactElement<GridLayoutItemProps>
    | ReactElement<GridLayoutItemProps>[];
  "full-page"?: boolean;
  colsAndRows?: GridColumnsAndRows;
  /**
   * Default for items that don't set `maximizable`: whether their header
   * offers to maximize them to fill the grid.
   */
  maximizable?: boolean;
  /** @deprecated Use GridLayoutProvider onDocumentChange. */
  onChange?: GridLayoutChangeHandler;
  /**
   * Called when an item or stack is maximized (with its id) or the grid is
   * restored (with undefined).
   */
  onMaximizedChange?: GridMaximizedChangeHandler;
  /** Content rendered inside canonical placeholders without obscuring their drop target. */
  placeholderContent?: ReactNode;
  /** Coupled boundaries with partial cross-group spans retain adjacent resizing. */
  rowResizeDistribution?: GridResizeDistribution;
}

const NO_DRAG_SOURCES = {} as const;

/** Ctrl/Cmd+Z undoes, Ctrl/Cmd+Shift+Z or Ctrl+Y redoes. */
const getHistoryShortcut = ({
  altKey,
  ctrlKey,
  key,
  metaKey,
  shiftKey,
}: KeyboardEvent): "undo" | "redo" | undefined => {
  if (altKey || !(ctrlKey || metaKey)) {
    return undefined;
  }
  const lowerKey = key.toLowerCase();
  if (lowerKey === "z") {
    return shiftKey ? "redo" : "undo";
  }
  if (lowerKey === "y" && ctrlKey && !shiftKey) {
    return "redo";
  }
  return undefined;
};

/** Text fields keep their own undo. */
const isEditableElement = (target: EventTarget) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    target.matches("input, textarea, select, [contenteditable]"));

export const GridLayout = ({
  id: idProp,
  children: childrenProp,
  className,
  "full-page": fullPage,
  colsAndRows,
  maximizable,
  onBlur,
  onClick,
  onChange,
  onFocus,
  onKeyDown,
  onKeyUp,
  onMaximizedChange,
  onMouseDown,
  placeholderContent,
  rowResizeDistribution = "adjacent",
  style: styleProp,
  ...htmlAttributes
}: GridLayoutProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-grid-layout",
    css: gridLayoutCss,
    window: targetWindow,
  });

  const id = useIdMemo(idProp);
  const [headerSlots] = useState(() => new GridLayoutHeaderSlots());

  const {
    children,
    containerCallback,
    dispatchGridLayoutAction,
    gridController,
    gridLayoutModel,
    gridModel,
    gridSnapshot,
    maximizeRefusedIds,
    maximizedId,
    nonContentGridItems: { placeholders, splitters, stackIds },
    onCancelDrag,
    onCancelTabDrag,
    onDetachTab,
    onDragEnd,
    onDragLeave,
    onDragPreview,
    onDragStart,
    onDrop,
    onDropStackedItem,
    restore,
    setContentMaximizable,
    history,
    stackTemplates,
    toggleMaximized,
  } = useGridLayout({
    children: childrenProp,
    id,
    colsAndRows,
    onChange,
    onMaximizedChange,
  });

  const focusOrder = useMemo(
    () => computeFocusOrder(gridSnapshot, splitters),
    [gridSnapshot, splitters],
  );
  const {
    headSentinelProps,
    onKeyDown: onFocusOrderKeyDown,
    tailSentinelProps,
  } = useGridFocusOrder({ focusOrder });
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(e);
      if (maximizedId && e.key === "Escape" && !e.defaultPrevented) {
        e.preventDefault();
        restore();
      }
      const historyShortcut = getHistoryShortcut(e);
      if (
        historyShortcut &&
        !e.defaultPrevented &&
        !isEditableElement(e.target)
      ) {
        e.preventDefault();
        if (historyShortcut === "undo") {
          history.undo();
        } else {
          history.redo();
        }
      }
      onFocusOrderKeyDown(e);
    },
    [history, maximizedId, onFocusOrderKeyDown, onKeyDown, restore],
  );

  const splitterLayoutProps = useGridSplitterResizing({
    gridLayoutModel,
    gridModel,
    gridController,
    id,
    onBlur,
    onClick,
    onFocus,
    onKeyDown: handleKeyDown,
    onKeyUp,
    onMouseDown,
    rowResizeDistribution,
  });

  // const splitterProps = useGridSplitter();

  const style = {
    gridTemplateColumns: gridSnapshot.columns.map(({ size }) => size).join(" "),
    gridTemplateRows: gridSnapshot.rows.map(({ size }) => size).join(" "),
    ...styleProp,
  } as CSSProperties;
  const snapshotItemById = new Map(
    gridSnapshot.items.map((item) => [item.id, item]),
  );
  const getItemTitle = (itemId: string) => {
    const stack = gridSnapshot.stacks.find((s) => s.id === itemId);
    return snapshotItemById.get(stack ? stack.selectedItemId : itemId)?.title;
  };

  return (
    <GridLayoutContext.Provider
      value={{
        dispatchGridLayoutAction,
        gridController,
        gridLayoutModel,
        gridModel,
        gridSnapshot,
        headerSlots,
        id,
        maximizable,
        maximizeRefusedIds,
        maximizedId,
        onDragEnd,
        onDragLeave,
        onDragPreview,
        onDragStart,
        onDrop,
        setContentMaximizable,
        toggleMaximized,
      }}
    >
      <DragDropProviderNext
        dragSources={NO_DRAG_SOURCES}
        onCancelDrag={onCancelDrag}
        onCancelTabDrag={onCancelTabDrag}
        onDetachTab={onDetachTab}
        onDrop={onDropStackedItem}
      >
        <div
          {...htmlAttributes}
          {...splitterLayoutProps}
          id={id}
          ref={containerCallback}
          style={style}
          className={cx(classBase, className, {
            vuuFullPage: fullPage,
            [`${classBase}-maximized`]: maximizedId !== undefined,
          })}
        >
          <div {...headSentinelProps} />
          {stackIds.map((stackId) => {
            const template = stackTemplates.get(stackId);
            return template ? (
              cloneElement(template, { key: stackId })
            ) : (
              <GridLayoutStackedItem id={stackId} key={stackId} />
            );
          })}
          {children}
          {placeholders.map(({ id: placeholderId, snapshotId }) => {
            const placeholder = snapshotItemById.get(snapshotId);
            if (!placeholder) {
              throw Error(
                `[GridLayout] canonical placeholder #${placeholderId} not found`,
              );
            }
            return (
              <GridPlaceholder
                id={placeholderId}
                key={placeholderId}
                style={{
                  gridArea: `${placeholder.row.start}/${placeholder.column.start}/${placeholder.row.start + placeholder.row.span}/${placeholder.column.start + placeholder.column.span}`,
                }}
              >
                {placeholderContent}
              </GridPlaceholder>
            );
          })}
          {splitters.map((splitter) => (
            <GridSplitter
              // {...splitterProps}
              aria-controls={splitter.controls}
              aria-label={getSplitterLabel(splitter, getItemTitle)}
              ariaOrientation={splitter.ariaOrientation}
              data-resized-child-items-after={splitter.resizedChildItems.after.join(
                " ",
              )}
              data-resized-child-items-before={splitter.resizedChildItems.before.join(
                " ",
              )}
              id={splitter.id}
              key={splitter.id}
              offsetStart={startsAtHorizontalSplitter(splitter, splitters)}
              orientation={splitter.orientation}
              style={{
                gridArea: getGridArea(splitter),
              }}
            />
          ))}
          <div {...tailSentinelProps} />
        </div>
      </DragDropProviderNext>
    </GridLayoutContext.Provider>
  );
};

GridLayout.displayName = "Grid";

registerComponent("Grid", GridLayout, "container");
