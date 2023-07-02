import { MenuActionHandler, MenuBuilder } from "@finos/vuu-data-types";
import { useCallback, useMemo, useRef } from "react";
import { ResizeHandler, useResizeObserver, WidthOnly } from "../responsive";
import {
  applyOverflowClass,
  correctForUnnecessaryOverflowIndicator,
  correctForWrappedOverflowIndicator,
  detectOverflow,
  NO_WRAPPED_ITEMS,
  switchWrappedItemIntoView,
  unmarkItemsWhichAreNoLongerWrapped,
} from "./overflow-utils";

export const useOverflowContainer = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const wrappedItemsRef = useRef<string[]>(NO_WRAPPED_ITEMS);

  const handleResize: ResizeHandler = useCallback(async () => {
    const { current: container } = rootRef;
    if (container) {
      let wrapped = detectOverflow(container);
      applyOverflowClass(container, wrapped);
      if (wrapped.length > 1 && wrapped.at(-1) === "overflow") {
        wrapped = await correctForWrappedOverflowIndicator(container, wrapped);
      } else if (wrapped.length === 1) {
        if (correctForUnnecessaryOverflowIndicator(container)) {
          wrapped = NO_WRAPPED_ITEMS;
        }
      }
      wrappedItemsRef.current = wrapped;
    }
  }, []);

  useResizeObserver(rootRef, WidthOnly, handleResize);

  const hasIndex = (
    opt: unknown
  ): opt is {
    index: string;
  } => typeof opt === "object" && opt !== null && "index" in opt;

  const [menuBuilder, menuActionHandler] = useMemo((): [
    MenuBuilder,
    MenuActionHandler
  ] => {
    return [
      () => {
        const { current: menuItems } = wrappedItemsRef;
        return menuItems.map((index: string) => {
          return {
            label: `Item ${parseInt(index) + 1} [${index}]`,
            action: `activate-item-${index}`,
            options: { index },
          };
        });
      },
      (type, options) => {
        const { current: container } = rootRef;
        if (container && hasIndex(options)) {
          switchWrappedItemIntoView(container, options.index);
          const wrappedItems = detectOverflow(container);
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
