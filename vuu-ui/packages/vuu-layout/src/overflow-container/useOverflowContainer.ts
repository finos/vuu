import { MenuActionHandler, MenuBuilder } from "@finos/vuu-data-types";
import { useCallback, useMemo, useRef, useState } from "react";
import { useLayoutEffectSkipFirst } from "../utils";
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
  itemCount: number;
  onSwitchWrappedItemIntoView?: (overflowItem: OverflowItem) => void;
}

export const useOverflowContainer = ({
  itemCount,
  onSwitchWrappedItemIntoView,
}: OverflowContainerHookProps) => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const wrappedItemsRef = useRef<OverflowItem[]>(NO_WRAPPED_ITEMS);

  const handleResize = useCallback(async () => {
    if (container) {
      let [nonWrapped, wrapped] = getNonWrappedAndWrappedItems(container);
      applyOverflowClassToWrappedItems(container, wrapped);
      if (overflowIndicatorHasWrappedButShouldNotHave(wrapped)) {
        wrapped = await correctForWrappedOverflowIndicator(container, wrapped);
      }
      while (
        highPriorityItemsHaveWrappedButShouldNotHave(nonWrapped, wrapped)
      ) {
        [nonWrapped, wrapped] = await correctForWrappedHighPriorityItems(
          container,
          nonWrapped,
          wrapped
        );
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
      ({ options }) => {
        if (container && hasOverflowItem(options)) {
          // TODO do we always want to switch it into view - leave that to caller
          const [, wrappedItems] = switchWrappedItemIntoView(
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

  useLayoutEffectSkipFirst(() => {
    handleResize();
  }, [handleResize, itemCount]);

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
