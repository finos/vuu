import { KeyboardEvent, MouseEvent, useCallback, useState } from "react";

const defaultSelectionKeys = ["Enter", " "];

export const isTabElement = (el: HTMLElement): boolean =>
  el && el.matches('[class*="vuuTab "]');

export interface SelectionHookProps {
  highlightedIdx: number;
  onSelectionChange?: (tabIndex: number) => void;
  selected: number;
}

export const useSelection = ({
  highlightedIdx,
  onSelectionChange,
  selected: selectedProp,
}: SelectionHookProps): {
  activateTab: (tabIndex: number) => void;
  onClick: (evt: MouseEvent<HTMLElement>, tabIndex: number) => void;
  onKeyDown: (evt: KeyboardEvent) => void;
  selected: number;
} => {
  const [selected, setSelected] = useState(selectedProp);

  const isSelectionEvent = useCallback(
    (evt: KeyboardEvent) => defaultSelectionKeys.includes(evt.key),
    []
  );

  const selectItem = useCallback(
    (tabIndex: number) => {
      setSelected(tabIndex);
      onSelectionChange?.(tabIndex);
    },
    [onSelectionChange, setSelected]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const targetElement = e.target as HTMLElement;
      if (
        isSelectionEvent(e) &&
        highlightedIdx !== selected &&
        isTabElement(targetElement)
      ) {
        e.stopPropagation();
        e.preventDefault();
        selectItem(highlightedIdx);
      }
    },
    [isSelectionEvent, highlightedIdx, selected, selectItem]
  );

  const onClick = useCallback(
    (e: MouseEvent, tabIndex: number) => {
      if (tabIndex !== selected) {
        selectItem(tabIndex);
      }
    },
    [selectItem, selected]
  );

  return {
    activateTab: selectItem,
    onClick,
    onKeyDown: handleKeyDown,
    selected,
  };
};
