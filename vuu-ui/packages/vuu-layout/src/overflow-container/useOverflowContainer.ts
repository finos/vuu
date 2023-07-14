import { MenuActionHandler, MenuBuilder } from "@finos/vuu-data-types";
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

export interface OverflowContainerHookProps {
  onSwitchWrappedItemIntoView?: (overflowItem: OverflowItem) => void;
}

export const useOverflowContainer = ({ onSwitchWrappedItemIntoView }) => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const wrappedItemsRef = useRef<OverflowItem[]>(NO_WRAPPED_ITEMS);

  const handleResize = useCallback(async () => {
    if (container) {
      let [nonWrapped, wrapped] = getNonWrappedAndWrappedItems(container);
      applyOverflowClassToWrappedItems(container, wrapped);
      if (overflowIndicatorHasWrappedButShouldNotHave(wrapped)) {
        wrapped = await correctForWrappedOverflowIndicator(container, wrapped);
      }
      if (highPriorityItemsHaveWrappedButShouldNotHave(nonWrapped, wrapped)) {
        wrapped = await correctForWrappedHighPriorityItems(container, wrapped);
      }
      if (wrapped.length === 1) {
        if (removeOverflowIndicatorIfNoLongerNeeded(container)) {
          wrapped = NO_WRAPPED_ITEMS;
        }
      }
      wrappedItemsRef.current = wrapped;
    }
  }, [container]);

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
      (type, options) => {
        if (container && hasOverflowItem(options)) {
          const wrappedItems = switchWrappedItemIntoView(
            container,
            options.overflowItem
          );
          wrappedItemsRef.current = wrappedItems;
          onSwitchWrappedItemIntoView?.(options.overflowItem);
        }
        return true;
      },
    ];
  }, [container, onSwitchWrappedItemIntoView]);

  const resizeObserver = useMemo(() => {
    let currentWidth = 0;
    return new ResizeObserver((entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (currentWidth !== width) {
          currentWidth = width;
          handleResize();
        }
      }
    });
  }, [handleResize]);

  useMemo(() => {
    if (container) {
      resizeObserver.observe(container);
    }
  }, [container, resizeObserver]);

  const callbackRef = useCallback((el: HTMLDivElement | null) => {
    setContainer(el);
  }, []);

  return {
    menuActionHandler,
    menuBuilder,
    rootRef: callbackRef,
  };
};
