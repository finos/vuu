import { useCallback, useEffect, useRef, useState } from 'react';

//TODO controlled selection
//TODO extended selection - requires mapping of idx values to id values
// base selection prefixes
export const SINGLE = 'single';
export const CHECKBOX = 'checkbox';
export const MULTI = 'multi';
export const EXTENDED = 'extended';

// group selection
export const GROUP_SELECTION_NONE = 'none';
export const GROUP_SELECTION_SINGLE = 'single';
export const GROUP_SELECTION_CASCADE = 'cascade';

const NO_HANDLERS = {};

export const groupSelectionEnabled = (groupSelection) =>
  groupSelection && groupSelection !== GROUP_SELECTION_NONE;

export const useSelection = ({
  count,
  defaultSelected,
  highlightedIdx,
  indexPositions,
  onChange,
  selected: selectedProp,
  selection = SINGLE,
  selectionKeys = ['Enter', ' ']
}) => {
  console.log(`useSelection highlightedIdx ${highlightedIdx}`);
  // TODO is the count enough ?
  const prevCount = useRef(count);

  const singleSelect = selection === SINGLE;
  const multiSelect = selection === MULTI || selection.startsWith(CHECKBOX);
  const extendedSelect = selection === EXTENDED;
  const lastActive = useRef(-1);
  const [selected, setSelected] = useState(selectedProp ?? defaultSelected ?? []);

  const controlledSelection = selectedProp !== undefined;

  useEffect(() => {
    if (selectedProp) {
      setSelected(selectedProp);
    }
  }, [selectedProp]);

  if (count !== prevCount.current) {
    // label === 'ParsedInput' && console.log(`%c[useKeyboardNavigationHook]<${label}> count changed from ${prevCount.current} to ${count}`,'color:brown')
    prevCount.current = count;
    if (selected.length > 0) {
      setSelected([]);
    }
  }

  const selectItemAtIndex = useCallback(
    (evt, idx, id, rangeSelect, preserveExistingSelection) => {
      const { current: active } = lastActive;
      const isSelected = selected.includes(id);
      const inactiveRange = active === -1;
      const actsLikeSingleSelect =
        singleSelect ||
        (extendedSelect && !preserveExistingSelection && (!rangeSelect || inactiveRange));
      const actsLikeMultiSelect =
        multiSelect || (extendedSelect && preserveExistingSelection && !rangeSelect);

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
        // TODO
        const [from, to] = idx > active ? [active, idx] : [idx, active];
        newSelected = selected.slice();
        for (let i = from; i <= to; i++) {
          // need to identify id from idx
          if (!selected.includes(i)) {
            newSelected.push(i);
          }
        }
      }

      if (!controlledSelection) {
        setSelected(newSelected);
      }
      if (onChange) {
        onChange(evt, newSelected);
      }
    },
    [controlledSelection, extendedSelect, multiSelect, onChange, selected, singleSelect]
  );

  const handleKeyDown = useCallback(
    (evt) => {
      if (~highlightedIdx && selectionKeys.includes(evt.key)) {
        evt.preventDefault();
        const item = indexPositions[highlightedIdx];
        selectItemAtIndex(evt, highlightedIdx, item.id, false, evt.ctrlKey || evt.metaKey);
        if (extendedSelect) {
          lastActive.current = highlightedIdx;
        }
      }
    },
    [extendedSelect, highlightedIdx, indexPositions, selectItemAtIndex, selectionKeys]
  );

  const listHandlers =
    selection === 'none'
      ? NO_HANDLERS
      : {
          onKeyDown: handleKeyDown,
          onKeyboardNavigation: (evt, currentIndex) => {
            if (extendedSelect && evt.shiftKey) {
              // TODO id ?
              selectItemAtIndex(evt, currentIndex, true);
            }
          }
        };

  const handleClick = useCallback(
    (evt) => {
      const item = indexPositions[highlightedIdx];
      if (item.expanded === undefined) {
        evt.preventDefault();
        evt.stopPropagation();
        selectItemAtIndex(evt, highlightedIdx, item.id, evt.shiftKey, evt.ctrlKey || evt.metaKey);
        if (extendedSelect) {
          lastActive.current = highlightedIdx;
        }
      }
    },
    [extendedSelect, highlightedIdx, indexPositions, selectItemAtIndex]
  );

  const listItemHandlers =
    selection === 'none'
      ? NO_HANDLERS
      : {
          onClick: handleClick
        };

  return {
    listHandlers,
    listItemHandlers,
    selected,
    setSelected
  };
};
