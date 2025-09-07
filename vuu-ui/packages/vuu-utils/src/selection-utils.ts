import {
  DataSourceRow,
  RangeTuple,
  Selection,
  SelectionItem,
} from "@vuu-ui/vuu-data-types";
import { TableSelectionModel } from "@vuu-ui/vuu-table-types";
import { metadataKeys } from "./column-utils";

const NO_SELECTION: number[] = [];

const { SELECTED } = metadataKeys;

export const RowSelected = {
  False: 0,
  True: 1,
  First: 2,
  Last: 4,
};

export const isRowSelected = (row: DataSourceRow): boolean =>
  (row[SELECTED] & RowSelected.True) === RowSelected.True;

export const isRowSelectedLast = (row?: DataSourceRow): boolean =>
  row !== undefined && (row[SELECTED] & RowSelected.Last) === RowSelected.Last;

const inAscendingOrder = (item1: SelectionItem, item2: SelectionItem) => {
  const n1: number = typeof item1 === "number" ? item1 : item1[0];
  const n2: number = typeof item2 === "number" ? item2 : item2[0];
  return n1 - n2;
};

export const deselectItem = (
  selectionModel: TableSelectionModel,
  selected: Selection,
  itemIndex: number,
  rangeSelect: boolean,
  keepExistingSelection = false,
): Selection => {
  const singleSelect = selectionModel === "single";
  const multiSelect =
    selectionModel === "extended" || selectionModel === "checkbox";
  const actsLikeSingleSelect =
    singleSelect || (multiSelect && !keepExistingSelection && !rangeSelect);

  if (actsLikeSingleSelect || (!rangeSelect && !keepExistingSelection)) {
    return NO_SELECTION;
  } else if (!rangeSelect && keepExistingSelection) {
    return removeSelectedItem(selected, itemIndex);
  }
  return NO_SELECTION;
};

const newSelectedFillsGapOrExtends = (
  selection: Selection,
  itemIndex: number,
): boolean => {
  for (let i = 0; i < selection.length; i++) {
    const item = selection[i];
    if (typeof item === "number") {
      if (item === itemIndex - 1) {
        return true;
      } else if (item > itemIndex) {
        return false;
      }
    } else if (item[0] === itemIndex + 1 || item[1] === itemIndex - 1) {
      return true;
    } else if (item[0] > itemIndex) {
      return false;
    }
  }
  return false;
};

const fillGapOrExtendSelection = (
  selection: Selection,
  itemIndex: number,
): Selection => {
  for (let i = 0; i < selection.length; i++) {
    const item = selection[i];
    if (typeof item === "number") {
      if (item === itemIndex - 1) {
        const nextSelectionItem = selection[i + 1];
        if (nextSelectionItem === itemIndex + 1) {
          const newRange: SelectionItem = [item, nextSelectionItem];
          return selection
            .slice(0, i)
            .concat([newRange])
            .concat(selection.slice(i + 2));
        } else {
          const newRange: SelectionItem = [item, itemIndex];
          return selection
            .slice(0, i)
            .concat([newRange])
            .concat(selection.slice(i + 1));
        }
      } else if (item > itemIndex) {
        break;
      }
    } else if (item[0] === itemIndex + 1) {
      const newRange: SelectionItem = [itemIndex, item[1]];
      return selection
        .slice(0, i)
        .concat([newRange])
        .concat(selection.slice(i + 1));
    } else if (item[1] === itemIndex - 1) {
      // check to see whether another contiguous range follows
      const nextItem = selection[i + 1];
      if (Array.isArray(nextItem) && nextItem[0] === itemIndex + 1) {
        const newRange: SelectionItem = [item[0], nextItem[1]];
        return selection
          .slice(0, i)
          .concat([newRange])
          .concat(selection.slice(i + 2));
      } else if (typeof nextItem === "number" && nextItem === itemIndex + 1) {
        const newRange: SelectionItem = [item[0], nextItem];
        return selection
          .slice(0, i)
          .concat([newRange])
          .concat(selection.slice(i + 2));
      } else {
        const newRange: SelectionItem = [item[0], itemIndex];
        return selection
          .slice(0, i)
          .concat([newRange])
          .concat(selection.slice(i + 1));
      }
    }
  }

  return selection;
};

export const selectItem = (
  selectionModel: TableSelectionModel,
  selected: Selection,
  itemIndex: number,
  rangeSelect: boolean,
  keepExistingSelection = false,
  activeItemIndex = -1,
): Selection => {
  const singleSelect = selectionModel === "single";
  const multiSelect =
    selectionModel === "extended" || selectionModel === "checkbox";
  const actsLikeSingleSelect =
    singleSelect ||
    (multiSelect && !keepExistingSelection && !rangeSelect) ||
    (rangeSelect && activeItemIndex === -1);

  if (selectionModel === "none") {
    return NO_SELECTION;
  } else if (actsLikeSingleSelect) {
    return [itemIndex];
  } else if (rangeSelect) {
    if (selected.length === 0) {
      return [itemIndex];
    } else {
      const range: RangeTuple =
        itemIndex > activeItemIndex
          ? [activeItemIndex, itemIndex]
          : [itemIndex, activeItemIndex];
      return insertRange(selected, range);
    }
  } else if (!rangeSelect) {
    // what if we now have a range because we just filled  agap between 2
    if (newSelectedFillsGapOrExtends(selected, itemIndex)) {
      return fillGapOrExtendSelection(selected, itemIndex);
    } else {
      return selected?.concat(itemIndex).sort(inAscendingOrder);
    }
  } else if (multiSelect) {
    // const [from, to] = idx > active ? [active, idx] : [idx, active];
    // newSelected = selected?.slice();
    // for (let i = from; i <= to; i++) {
    //   if (!selected?.includes(i)) {
    //     newSelected.push(i);
    //   }
    // }
  }
  return NO_SELECTION;
};

function removeSelectedItem(selected: Selection, itemIndex: number) {
  if (selected.includes(itemIndex)) {
    return selected.filter((selectedItem) => selectedItem !== itemIndex);
  } else {
    const newSelected: Selection = [];
    for (const selectedItem of selected) {
      if (Array.isArray(selectedItem)) {
        if (rangeIncludes(selectedItem, itemIndex)) {
          newSelected.push(...splitRange(selectedItem, itemIndex));
        } else {
          newSelected.push(selectedItem);
        }
      } else {
        newSelected.push(selectedItem);
      }
    }
    return newSelected;
  }
}

function insertRange(selected: Selection, range: RangeTuple): Selection {
  const [from, to] = range;
  return selected.reduce<Selection>((newSelected, selectedItem) => {
    if (typeof selectedItem === "number") {
      if (selectedItem < from || selectedItem > to) {
        newSelected.push(selectedItem);
      } else if (!includedInRange(newSelected.at(-1), selectedItem)) {
        newSelected.push(range);
      }
    } else if (overlappingRange(selectedItem, range)) {
      newSelected.push(mergeRanges(selectedItem, range));
    } else {
      if (range[1] < selectedItem[0]) {
        newSelected.push(range);
      }
      newSelected.push(selectedItem);
    }

    return newSelected;
  }, []);
}

const overlappingRange = (r1: RangeTuple, r2: RangeTuple) =>
  (r1[1] >= r2[0] && r1[1] <= r2[1]) || (r1[0] >= r2[0] && r1[0] <= r2[1]);
const mergeRanges = (r1: RangeTuple, r2: RangeTuple): RangeTuple => [
  Math.min(r1[0], r2[0]),
  Math.max(r1[1], r2[1]),
];

const includedInRange = (
  selectedItem: SelectionItem | undefined,
  index: number,
) => {
  if (typeof selectedItem === "undefined" || typeof selectedItem === "number") {
    return false;
  } else return rangeIncludes(selectedItem, index);
};

const rangeIncludes = (range: RangeTuple, index: number) =>
  index >= range[0] && index <= range[1];

const SINGLE_SELECTED_ROW =
  RowSelected.True + RowSelected.First + RowSelected.Last;
const FIRST_SELECTED_ROW_OF_BLOCK = RowSelected.True + RowSelected.First;
const LAST_SELECTED_ROW_OF_BLOCK = RowSelected.True + RowSelected.Last;

/**
 *  Determine the value for selected. We use a bitmap to represent a number of selection states
 * a row might exhibit. selected/not-selected is the fundamental value. We also identify first
 * row of a selected block, last row of a selected block;
 */
export const getSelectionStatus = (
  selected: Selection,
  itemIndex: number,
): number => {
  for (const item of selected) {
    if (typeof item === "number") {
      if (item === itemIndex) {
        return SINGLE_SELECTED_ROW;
      }
    } else if (rangeIncludes(item, itemIndex)) {
      if (itemIndex === item[0]) {
        return FIRST_SELECTED_ROW_OF_BLOCK;
      } else if (itemIndex === item[1]) {
        return LAST_SELECTED_ROW_OF_BLOCK;
      } else {
        return RowSelected.True;
      }
    }
  }
  return RowSelected.False;
};

export const isSelected = (selected: Selection, itemIndex: number) => {
  for (const item of selected) {
    if (typeof item === "number") {
      if (item === itemIndex) {
        return true;
      } else if (item > itemIndex) {
        return false;
      }
    } else if (rangeIncludes(item, itemIndex)) {
      return true;
    } else if (item[0] > itemIndex) {
      return false;
    }
  }

  return false;
};
/**
 * Vuu server expects a full list if indexes of selected rows. Client represents selection in a more
 * efficient structure. This converts client structure to full server format.
 */
export const expandSelection = (selected: Selection): number[] => {
  if (selected.every((selectedItem) => typeof selectedItem === "number")) {
    return selected as number[];
  }
  const expandedSelected = [];
  for (const selectedItem of selected) {
    if (typeof selectedItem === "number") {
      expandedSelected.push(selectedItem);
    } else {
      for (let i = selectedItem[0]; i <= selectedItem[1]; i++) {
        expandedSelected.push(i);
      }
    }
  }
  return expandedSelected;
};

function splitRange([from, to]: RangeTuple, itemIndex: number): Selection {
  if (itemIndex === from) {
    return [[from + 1, to]];
  } else if (itemIndex === to) {
    return [[from, to - 1]];
  } else if (to - from === 2) {
    return [from, to];
  } else if (itemIndex === to - 1) {
    return [[from, to - 2], to];
  } else {
    return [
      [from, itemIndex - 1],
      [itemIndex + 1, to],
    ];
  }
}

export type SelectionDiff = {
  added: SelectionItem[];
  removed: SelectionItem[];
};

export const selectionCount = (selected: Selection = NO_SELECTION) => {
  let count = selected.length;
  for (const selectionItem of selected) {
    if (Array.isArray(selectionItem)) {
      const [from, to] = selectionItem;
      // we've already counted the entry as 1, add the rest of the range
      count += to - from;
    }
  }
  return count;
};
