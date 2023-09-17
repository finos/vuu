import {
  ForwardedRef,
  MutableRefObject,
  useImperativeHandle,
  useMemo,
} from "react";
import {
  CollectionHookResult,
  CollectionItem,
} from "../../common-hooks/collectionTypes";

export interface ScrollingAPI<Item> {
  scrollToIndex: (itemIndex: number) => void;
  scrollToItem: (item: Item) => void;
  scrollTo: (scrollOffset: number) => void;
}

export interface ScrollingAPIHook<Item> {
  collectionHook: CollectionHookResult<Item>;
  forwardedRef?: ForwardedRef<ScrollingAPI<Item>>;
  scrollableRef: MutableRefObject<HTMLElement | null>;
  scrollIntoView?: (item: CollectionItem<Item>) => void;
}

const noScrolling: ScrollingAPI<unknown> = {
  scrollToIndex: () => undefined,
  scrollToItem: () => undefined,
  scrollTo: () => undefined,
};

export const useImperativeScrollingAPI = <Item>({
  collectionHook,
  forwardedRef,
  scrollableRef,
  scrollIntoView,
}: ScrollingAPIHook<Item>) => {
  const scrollHandles: ScrollingAPI<Item> = useMemo(
    () => ({
      scrollToIndex: (itemIndex: number) => {
        const collectionItem = collectionHook.data[itemIndex];
        if (collectionItem) {
          scrollIntoView?.(collectionItem);
        }
      },
      scrollToItem: (item: Item) => {
        const collectionItem = collectionHook.toCollectionItem(item);
        if (collectionItem) {
          scrollIntoView?.(collectionItem);
        }
      },
      scrollTo: (scrollOffset: number) => {
        if (scrollableRef?.current) {
          scrollableRef.current.scrollTop = scrollOffset;
        }
      },
    }),
    [collectionHook, scrollIntoView, scrollableRef]
  );

  useImperativeHandle(
    forwardedRef,
    () => {
      if (scrollableRef.current) {
        return scrollHandles;
      } else {
        return noScrolling;
      }
    },
    [scrollHandles, scrollableRef]
  );
};
