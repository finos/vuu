import { useCallback, useRef } from "react";
import { useControlled } from "../utils";

export const SINGLE = "single";
export const CHECKBOX = "checkbox";
export const MULTI = "multi";
export const EXTENDED = "extended";

export const GROUP_SELECTION_NONE = "none";
export const GROUP_SELECTION_SINGLE = "single";
export const GROUP_SELECTION_CASCADE = "cascade";

const defaultSelectionKeys = ["Enter", " "];

const NO_HANDLERS = {};

const isCollapsibleItem = (item) => item.expanded !== undefined;

export const groupSelectionEnabled = (groupSelection) =>
  groupSelection && groupSelection !== GROUP_SELECTION_NONE;

export const useSelection = ({
  count,
  defaultSelected,
  disableSelection = false,
  // groupSelection = GROUP_SELECTION_NONE,
  highlightedIdx,
  indexPositions,
  onChange,
  selected: selectedProp,
  selection = SINGLE,
  selectionKeys = defaultSelectionKeys,
}) => {
  // TODO is the count enough ?
  const prevCount = useRef(count);

  const singleSelect = selection === SINGLE;
  const multiSelect = selection === MULTI || selection.startsWith(CHECKBOX);
  const extendedSelect = selection === EXTENDED;
  const lastActive = useRef(-1);

  const isSelectionEvent = useCallback(
    (evt) => selectionKeys.includes(evt.key),
    [selectionKeys]
  );

  const [selected, setSelected] = useControlled({
    controlled: selectedProp,
    default: defaultSelected ?? [],
  });

  // const highlightedIdxRef = useRef();
  // highlightedIdxRef.current = highlightedIdx;

  // Get rid of this - if source might change, use controlled mode ?
  if (count !== prevCount.current) {
    prevCount.current = count;
    if (selected.length > 0) {
      setSelected([]);
    }
  }

  const selectItemAtIndex = useCallback(
    (evt, idx, id, rangeSelect, preserveExistingSelection) => {
      const { current: active } = lastActive;
      const isSelected = selected?.includes(id);
      const inactiveRange = active === -1;
      const actsLikeSingleSelect =
        singleSelect ||
        (extendedSelect &&
          !preserveExistingSelection &&
          (!rangeSelect || inactiveRange));
      const actsLikeMultiSelect =
        multiSelect ||
        (extendedSelect && preserveExistingSelection && !rangeSelect);

      let newSelected;
      if (actsLikeSingleSelect && isSelected) {
        newSelected = [];
      } else if (actsLikeSingleSelect) {
        newSelected = [id];
      } else if (actsLikeMultiSelect && isSelected) {
        newSelected = selected.filter((i) => i !== id);
      } else if (actsLikeMultiSelect) {
        newSelected = selected.concat(id);
      } else if (extendedSelect) {
        const [from, to] = idx > active ? [active, idx] : [idx, active];
        newSelected = selected.slice();
        for (let i = from; i <= to; i++) {
          const { id } = indexPositions[i];
          if (!selected.includes(id)) {
            newSelected.push(id);
          }
        }
      }
      setSelected(newSelected);
      if (onChange) {
        onChange(evt, newSelected);
      }
    },
    [
      extendedSelect,
      indexPositions,
      multiSelect,
      onChange,
      selected,
      setSelected,
      singleSelect,
    ]
  );

  const handleKeyDown = useCallback(
    (evt) => {
      if (~highlightedIdx && isSelectionEvent(evt)) {
        evt.preventDefault();
        const item = indexPositions[highlightedIdx];
        selectItemAtIndex(
          evt,
          highlightedIdx,
          item.id,
          false,
          evt.ctrlKey || evt.metaKey
        );
        if (extendedSelect) {
          lastActive.current = highlightedIdx;
        }
      }
    },
    [
      extendedSelect,
      highlightedIdx,
      indexPositions,
      isSelectionEvent,
      selectItemAtIndex,
    ]
  );

  const handleKeyboardNavigation = useCallback(
    (evt, currentIndex) => {
      if (extendedSelect && evt.shiftKey) {
        const item = indexPositions[currentIndex];
        selectItemAtIndex(evt, currentIndex, item.id, true);
      }
    },
    [extendedSelect, indexPositions, selectItemAtIndex]
  );

  const listHandlers =
    selection === "none"
      ? NO_HANDLERS
      : {
          onKeyDown: handleKeyDown,
          onKeyboardNavigation: handleKeyboardNavigation,
        };

  const handleClick = useCallback(
    (evt) => {
      if (!disableSelection && highlightedIdx !== -1) {
        const item = indexPositions[highlightedIdx];
        if (!isCollapsibleItem(item)) {
          evt.preventDefault();
          evt.stopPropagation();
          selectItemAtIndex(
            evt,
            highlightedIdx,
            item.id,
            evt.shiftKey,
            evt.ctrlKey || evt.metaKey
          );
          if (extendedSelect) {
            lastActive.current = highlightedIdx;
          }
        }
      }
    },
    [
      disableSelection,
      extendedSelect,
      highlightedIdx,
      indexPositions,
      selectItemAtIndex,
    ]
  );

  const listItemHandlers =
    selection === "none"
      ? NO_HANDLERS
      : {
          onClick: handleClick,
        };

  return {
    listHandlers,
    listItemHandlers,
    selected,
    setSelected,
  };
};
