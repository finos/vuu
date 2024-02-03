import { useCallback, useEffect, useRef } from "react";
import { CollectionHookResult, hasSelection } from "../common-hooks";
import { DropHandler } from "../drag-drop";
import { MoveItemHandler } from "./listTypes";

export interface ListDropProps<Item = string> {
  dataHook: CollectionHookResult<Item>;
  onDrop?: DropHandler;
  onMoveListItem?: MoveItemHandler;
  selected: string[];
  setHighlightedIndex: (idx: number) => void;
  setSelected: (selected: string[]) => void;
}

export const useListDrop = <Item>({
  dataHook,
  onDrop,
  onMoveListItem,
  selected,
  setHighlightedIndex,
  setSelected,
}: ListDropProps<Item>) => {
  // Used to preserve selection across a drop event.
  const selectedByIndexRef = useRef<number[]>([]);

  /** prevent recreating reorderSelectedIndices when dataHook changes */
  const dataHookRef = useRef(dataHook);
  dataHookRef.current = dataHook;

  const adjustIndex = useCallback(
    (index: number, fromIndex: number, toIndex: number) => {
      if (index === fromIndex) {
        return toIndex;
      } else if (
        index < Math.min(fromIndex, toIndex) ||
        index > Math.max(fromIndex, toIndex)
      ) {
        return index;
      }
      if (fromIndex < index) {
        return index - 1;
      } else {
        return index + 1;
      }
    },
    []
  );

  // Used after a drop event, to calculate wht the new selected indices will be
  const reorderSelectedIndices = useCallback(
    (selected: string[], fromIndex: number, toIndex: number) => {
      const selectedIndices = selected.map((id) =>
        dataHookRef.current.indexOfItemById(id)
      );
      return selectedIndices.map((item) =>
        adjustIndex(item, fromIndex, toIndex)
      );
    },
    [adjustIndex]
  );

  const handleDrop = useCallback<DropHandler>(
    (options) => {
      const { fromIndex, toIndex } = options;
      if (hasSelection(selected)) {
        selectedByIndexRef.current = reorderSelectedIndices(
          selected,
          fromIndex,
          toIndex
        );
      }

      if (options.isExternal) {
        onDrop?.(options);
      } else {
        onMoveListItem?.(fromIndex, toIndex);
      }
      setHighlightedIndex(-1);
    },
    [
      selected,
      setHighlightedIndex,
      reorderSelectedIndices,
      onDrop,
      onMoveListItem,
    ]
  );

  const handleDropSettle = useCallback(
    (toIndex: number) => {
      setHighlightedIndex(toIndex);
    },
    [setHighlightedIndex]
  );

  useEffect(() => {
    const { current: selectedByIndex } = selectedByIndexRef;
    if (hasSelection(selectedByIndex)) {
      selectedByIndexRef.current = [];
      const postDropSelected = Array.isArray(selectedByIndex)
        ? selectedByIndex.map((i) => dataHook.data[i].id)
        : dataHook.data[selectedByIndex].id;

      selectedByIndexRef.current = [];
      // TODO gave up trying to figure out how to type this correctly
      setSelected(postDropSelected as any);
    }
  }, [dataHook.data, setSelected]);

  return {
    handleDrop,
    onDropSettle: handleDropSettle,
  };
};
