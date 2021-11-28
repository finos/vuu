import { useCallback, useRef } from 'react';
import { useControlled } from '../utils';

export const SINGLE = 'single';
export const CHECKBOX = 'checkbox';
export const MULTI = 'multi';
export const EXTENDED = 'extended';

const NO_HANDLERS = {};

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
  // TODO is the count enough ?
  const prevCount = useRef(count);

  const singleSelect = selection === SINGLE;
  const multiSelect = selection === MULTI || selection.startsWith(CHECKBOX);
  const extendedSelect = selection === EXTENDED;
  const lastActive = useRef(-1);

  const [selected, setSelected] = useControlled({
    controlled: selectedProp,
    default: defaultSelected ?? []
  });

  // Get rid of this - if source might change, use controlled mode ?
  if (count !== prevCount.current) {
    prevCount.current = count;
    if (selected.length > 0) {
      setSelected([]);
    }
  }

  const selectItemAtIndex = useCallback(
    (evt, idx, rangeSelect, preserveExistingSelection) => {
      const { current: active } = lastActive;
      const isSelected = selected.includes(idx);
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
        newSelected = [idx];
      } else if (actsLikeMultiSelect && isSelected) {
        newSelected = selected.filter((i) => i !== idx);
      } else if (actsLikeMultiSelect) {
        newSelected = selected.concat(idx);
      } else if (extendedSelect) {
        const [from, to] = idx > active ? [active, idx] : [idx, active];
        newSelected = selected.slice();
        for (let i = from; i <= to; i++) {
          if (!selected.includes(i)) {
            newSelected.push(i);
          }
        }
      }

      setSelected(newSelected);
      if (onChange) {
        onChange(evt, newSelected);
      }
    },
    [extendedSelect, multiSelect, onChange, selected, setSelected, singleSelect]
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
