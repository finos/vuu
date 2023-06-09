import { IsSelected } from "@finos/vuu-data";
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

const newSelectedFillsGap = (
  selection: Selection,
  itemIndex: number
): boolean => {
  for (let i = 0; i < selection.length; i++) {
    const item = selection[i];
    if (typeof item === "number") {
      if (item === itemIndex - 1) {
        return true;
      } else if (item > itemIndex) {
        return false;
      }
    }
  }
  return false;
};

const fillGapInSelection = (
  selection: Selection,
  itemIndex: number
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
  activeItemIndex = -1
): Selection => {
  //   const { current: active } = lastActive;
  //   const inactiveRange = active === -1;
  const singleSelect = selectionModel === "single";
  const multiSelect =
    selectionModel === "extended" || selectionModel === "checkbox";
  const actsLikeSingleSelect =
    singleSelect || (multiSelect && !keepExistingSelection && !rangeSelect);

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
    if (newSelectedFillsGap(selected, itemIndex)) {
      return fillGapInSelection(selected, itemIndex);
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
  index: number
) => {
  if (typeof selectedItem === "undefined" || typeof selectedItem === "number") {
    return false;
  } else return rangeIncludes(selectedItem, index);
};

const rangeIncludes = (range: RangeTuple, index: number) =>
  index >= range[0] && index <= range[1];

export const getSelectionStatus = (
  selected: Selection,
  itemIndex: number
): IsSelected => {
  for (const item of selected) {
    if (typeof item === "number") {
      if (item === itemIndex) {
        return 3;
      } else if (item === itemIndex + 1) {
        return 2;
      }
    } else if (rangeIncludes(item, itemIndex)) {
      if (itemIndex === item[1]) {
        return 3;
      } else {
        return 1;
      }
    } else if (item[0] === itemIndex + 1) {
      return 2;
    }
  }
  return 0;
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

const selectionItemIndex = (item: SelectionItem): [number, number] =>
  Array.isArray(item) ? item : [item, 0];

export const getSelectionDiff = (
  oldSelection: Selection,
  newSelection: Selection
): SelectionDiff => {
  const diff: SelectionDiff = {
    added: [],
    removed: [],
  };

  if (oldSelection.length === 0 && newSelection.length === 0) {
    // nothing to do
  } else if (oldSelection.length === 0) {
    return {
      added: newSelection,
      removed: [],
    };
  } else if (newSelection.length === 0) {
    return {
      added: [],
      removed: oldSelection,
    };
  } else {
    for (
      let i = 0, j = 0;
      i < oldSelection.length || j < newSelection.length;

    ) {
      const oldItem = oldSelection[i];
      const [oldIndex, oldRangeEnd] = selectionItemIndex(oldItem);
      const newItem = newSelection[j];
      const [newIndex, newRangeEnd] = selectionItemIndex(newItem);
      if (oldIndex === undefined) {
        if (newRangeEnd) {
          diff.added.push([newIndex, newRangeEnd]);
        } else {
          diff.added.push(newIndex);
        }
        j += 1;
      } else if (newIndex === undefined) {
        if (oldRangeEnd) {
          diff.removed.push([oldIndex, oldRangeEnd]);
        } else {
          diff.removed.push(oldIndex);
        }
        i += 1;
      } else if (oldIndex < newIndex) {
        if (oldRangeEnd) {
          if (oldRangeEnd < newIndex) {
            diff.removed.push([oldIndex, oldRangeEnd]);
          } else {
            console.log(
              `old index ${oldIndex} (part of range) gone from selection, but not whole range`
            );
          }
        } else {
          diff.removed.push(oldIndex);
        }
        i += 1;
      } else if (oldIndex > newIndex) {
        if (newRangeEnd) {
          console.log(`new index ${oldIndex} (part of range) in selection`);
        } else {
          diff.added.push(newIndex);
        }
        j += 1;
      } else {
        if (newRangeEnd > oldRangeEnd) {
          if (oldRangeEnd === 0) {
            diff.added.push([newIndex + 1, newRangeEnd]);
          }
        } else if (newRangeEnd < oldRangeEnd) {
          // we've least one selection, possibly more
          let nextNewItem = newSelection[j + 1];
          if (nextNewItem === undefined) {
            diff.removed.push([newRangeEnd + 1, oldRangeEnd]);
          } else {
            let [nextNewIndex, nextNewRangeEnd] =
              selectionItemIndex(nextNewItem);
            if (nextNewIndex > oldRangeEnd) {
              diff.removed.push([newRangeEnd + 1, oldRangeEnd]);
            } else {
              if (newRangeEnd + 1 === nextNewIndex - 1) {
                diff.removed.push(newRangeEnd + 1);
              } else {
                diff.removed.push([newRangeEnd + 1, nextNewIndex - 1]);
              }

              // while ?
              if (nextNewRangeEnd <= oldRangeEnd) {
                j += 1;

                nextNewItem = newSelection[j + 1];
                if (nextNewIndex) {
                  [nextNewIndex, nextNewRangeEnd] =
                    selectionItemIndex(nextNewItem);
                }
              }
            }
          }
        }
        i += 1;
        j += 1;
      }
    }
  }

  return diff;
};
