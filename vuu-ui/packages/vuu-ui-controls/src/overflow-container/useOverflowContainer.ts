import { MenuActionHandler, MenuBuilder } from "@finos/vuu-data-types";
import {
  DropOptions,
  useDragDrop as useDragDrop,
} from "@finos/vuu-ui-controls";
import {
  isValidNumber,
  MEASURES,
  useLayoutEffectSkipFirst,
} from "@finos/vuu-utils";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  applyOverflowClassToWrappedItems,
  removeOverflowIndicatorIfNoLongerNeeded,
  correctForWrappedHighPriorityItems,
  getNonWrappedAndWrappedItems,
  NO_WRAPPED_ITEMS,
  highPriorityItemsHaveWrappedButShouldNotHave,
  switchWrappedItemIntoView,
  OverflowItem,
  overflowIndicatorHasWrappedButShouldNotHave,
  correctForWrappedOverflowIndicator,
} from "./overflow-utils";
import { OverflowContainerProps } from "./OverflowContainer";

export interface OverflowContainerHookProps
  extends Pick<OverflowContainerProps, "allowDragDrop" | "onMoveItem">,
    Required<Pick<OverflowContainerProps, "orientation">> {
  itemCount: number;
  onSwitchWrappedItemIntoView?: (overflowItem: OverflowItem) => void;
}

export const useOverflowContainer = ({
  allowDragDrop = false,
  itemCount,
  onMoveItem,
  onSwitchWrappedItemIntoView,
  orientation,
}: OverflowContainerHookProps) => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const wrappedItemsRef = useRef<OverflowItem[]>(NO_WRAPPED_ITEMS);
  // Drag drop needs a ref to container
  const containerRef = useRef<HTMLDivElement | null>(null);

  const setOverflowTabIndex = useCallback((tabIndex: "0" | "-1") => {
    if (containerRef.current) {
      containerRef.current
        .querySelector(".vuuOverflowContainer-OverflowIndicator button")
        ?.setAttribute("tabindex", tabIndex);
    }
  }, []);

  const handleResize = useCallback(async () => {
    if (container) {
      let [nonWrapped, wrapped] = getNonWrappedAndWrappedItems(
        container,
        orientation
      );
      applyOverflowClassToWrappedItems(
        container,
        wrapped,
        "vuuOverflowContainer-wrapContainer"
      );
      if (overflowIndicatorHasWrappedButShouldNotHave(wrapped)) {
        wrapped = await correctForWrappedOverflowIndicator(
          container,
          wrapped,
          orientation
        );
      }
      while (
        highPriorityItemsHaveWrappedButShouldNotHave(nonWrapped, wrapped)
      ) {
        [nonWrapped, wrapped] = await correctForWrappedHighPriorityItems(
          container,
          nonWrapped,
          wrapped,
          orientation
        );
      }
      if (wrapped.length === 1) {
        if (removeOverflowIndicatorIfNoLongerNeeded(container, orientation)) {
          wrapped = NO_WRAPPED_ITEMS;
        }
      }

      if (wrappedItemsRef.current.length === 0 && wrapped.length > 0) {
        setOverflowTabIndex("0");
      } else if (wrappedItemsRef.current.length > 0 && wrapped.length === 0) {
        setOverflowTabIndex("-1");
      }

      wrappedItemsRef.current = wrapped;
    }
  }, [container, orientation, setOverflowTabIndex]);

  const hasOverflowItem = (
    opt: unknown
  ): opt is {
    overflowItem: OverflowItem;
  } => typeof opt === "object" && opt !== null && "overflowItem" in opt;

  const [menuBuilder, menuActionHandler] = useMemo((): [
    MenuBuilder,
    MenuActionHandler
  ] => {
    return [
      () => {
        const { current: menuItems } = wrappedItemsRef;
        return menuItems.map((item: OverflowItem) => {
          return {
            label: item.label,
            action: `activate-item-${item.index}`,
            options: { overflowItem: item },
          };
        });
      },
      // The menu items are our overflowed items, selecting one by default
      // brings it back onto the toolbar - TODO is this right ?
      ({ options }) => {
        if (container && hasOverflowItem(options)) {
          // TODO do we always want to switch it into view - leave that to caller
          const [, wrappedItems] = switchWrappedItemIntoView(
            container,
            options.overflowItem,
            orientation
          );
          wrappedItemsRef.current = wrappedItems;
          onSwitchWrappedItemIntoView?.(options.overflowItem);
        }
        return true;
      },
    ];
  }, [container, onSwitchWrappedItemIntoView, orientation]);

  const resizeObserver = useMemo(() => {
    const { sizeProp } = MEASURES[orientation];
    let currentSize = 0;
    return new ResizeObserver((entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        const { [sizeProp]: actualSize } = entry.contentRect;
        // This is important. Sometimes tiny sub-pixel differeces
        // can be reported, which break the layout assumptions
        const size = Math.round(actualSize as number);
        if (isValidNumber(size) && currentSize !== size) {
          currentSize = size;
          handleResize();
        }
      }
    });
  }, [handleResize, orientation]);

  useLayoutEffectSkipFirst(() => {
    handleResize();
  }, [handleResize, itemCount]);

  useMemo(() => {
    if (container) {
      resizeObserver.observe(container);
    }
  }, [container, resizeObserver]);

  const callbackRef = useCallback((el: HTMLDivElement | null) => {
    setContainer((containerRef.current = el));
  }, []);

  const handleDrop = useCallback(
    ({ fromIndex, toIndex }: DropOptions) => {
      onMoveItem?.(fromIndex, toIndex);
    },
    [onMoveItem]
  );

  const { onMouseDown: dragDropHookHandleMouseDown, ...dragDropHook } =
    useDragDrop({
      allowDragDrop,
      containerRef,
      // this is for useDragDropNext
      draggableClassName: `vuuOverflowContainer`,
      // extendedDropZone: overflowedItems.length > 0,
      onDrop: handleDrop,
      orientation: "horizontal",
      itemQuery: ".vuuOverflowContainer-item",
    });

  return {
    menuActionHandler,
    menuBuilder,
    onItemMouseDown: dragDropHookHandleMouseDown,
    rootRef: callbackRef,
    ...dragDropHook,
  };
};
