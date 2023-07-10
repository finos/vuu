import { MenuActionHandler, MenuBuilder } from "@finos/vuu-data-types";
import { useCallback, useMemo, useRef } from "react";
import { ResizeHandler, useResizeObserver, WidthOnly } from "../responsive";
import {
  applyOverflowClassToWrappedItems,
  removeOverflowIndicatorIfNoLongerNeeded,
  correctForWrappedHighPriorityItems,
  getNonWrappedAndWrappedItems,
  NO_WRAPPED_ITEMS,
  highPriorityItemsHaveWrappedButShouldNotHave,
  switchWrappedItemIntoView,
  unmarkItemsWhichAreNoLongerWrapped,
  OverflowItem,
  overflowIndicatorHasWrappedButShouldNotHave,
  correctForWrappedOverflowIndicator,
} from "./overflow-utils";

export const useOverflowContainer = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const wrappedItemsRef = useRef<OverflowItem[]>(NO_WRAPPED_ITEMS);

  const handleResize: ResizeHandler = useCallback(async () => {
    const { current: container } = rootRef;
    console.log(`resize , {
      container
    }`);
    if (container) {
      let [nonWrapped, wrapped] = getNonWrappedAndWrappedItems(container);
      console.log(`
      nonWrapped ${nonWrapped.map((i) => i.index).join(",")}
      wrapped ${wrapped.map((i) => i.index).join(",")}
    `);

      applyOverflowClassToWrappedItems(container, wrapped);
      if (overflowIndicatorHasWrappedButShouldNotHave(wrapped)) {
        console.log("correct for Wrapped Overflow");
        wrapped = await correctForWrappedOverflowIndicator(container, wrapped);
      }

      if (highPriorityItemsHaveWrappedButShouldNotHave(nonWrapped, wrapped)) {
        console.log("correct for wrapped High Priority");

        wrapped = await correctForWrappedHighPriorityItems(container, wrapped);
      }

      if (wrapped.length === 1) {
        if (removeOverflowIndicatorIfNoLongerNeeded(container)) {
          wrapped = NO_WRAPPED_ITEMS;
        }
      }
      wrappedItemsRef.current = wrapped;
    }
  }, []);

  useResizeObserver(rootRef, WidthOnly, handleResize, true);

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
            label: `Item ${parseInt(item.index) + 1} [${item.index}]`,
            action: `activate-item-${item.index}`,
            options: { overflowItem: item },
          };
        });
      },
      (type, options) => {
        const { current: container } = rootRef;
        if (container && hasOverflowItem(options)) {
          switchWrappedItemIntoView(container, options.overflowItem);
          const [, wrappedItems] = getNonWrappedAndWrappedItems(container);
          unmarkItemsWhichAreNoLongerWrapped(container, wrappedItems);
          wrappedItemsRef.current = wrappedItems;
        }
        return true;
      },
    ];
  }, []);

  return {
    menuActionHandler,
    menuBuilder,
    rootRef,
  };
};
