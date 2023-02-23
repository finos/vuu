import {
  RangeTuple,
  Selection,
  SelectionItem,
  TableSelectionModel,
} from "@finos/vuu-datagrid-types";

const NO_SELECTION: number[] = [];

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
  keepExistingSelection = false
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

export const selectItem = (
  selectionModel: TableSelectionModel,
  selected: Selection,
  itemIndex: number,
  rangeSelect: boolean,
  keepExistingSelection = false,
  activeItemIndex = -1
): Selection => {
  //   const { current: active } = lastActive;
  //   const inactiveRange = active === -1;
  const singleSelect = selectionModel === "single";
  const multiSelect =
    selectionModel === "extended" || selectionModel === "checkbox";
  const actsLikeSingleSelect =
    singleSelect || (multiSelect && !keepExistingSelection && !rangeSelect);

  if (actsLikeSingleSelect) {
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
    return selected?.concat(itemIndex).sort(inAscendingOrder);
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
  index: number
) => {
  if (typeof selectedItem === "undefined" || typeof selectedItem === "number") {
    return false;
  } else return rangeIncludes(selectedItem, index);
};

const rangeIncludes = (range: RangeTuple, index: number) =>
  index >= range[0] && index <= range[1];

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
