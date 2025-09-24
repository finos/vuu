import { RangeTuple, Selection, SelectionItem } from "@vuu-ui/vuu-data-types";
import { TableSelectionModel } from "@vuu-ui/vuu-table-types";
import { SelectRequest } from "@vuu-ui/vuu-protocol-types";

const NO_SELECTION: number[] = [];

export const deselectItem = (
  selectionModel: TableSelectionModel,
  rowKey: string,
  rangeSelect: boolean,
  preserveExistingSelection = false,
): Omit<SelectRequest, "vpId"> | undefined => {
  return {
    preserveExistingSelection,
    rowKey,
    type: "DESELECT_ROW",
  } as Omit<SelectRequest, "vpId">;
};

export const selectItem = (
  selectionModel: TableSelectionModel,
  rowKey: string,
  rangeSelect: boolean,
  preserveExistingSelection = false,
  activeRowKey?: string,
): Omit<SelectRequest, "vpId"> | undefined => {
  const singleSelect = selectionModel === "single";
  const actsLikeSingleSelect = singleSelect || activeRowKey === undefined;

  if (selectionModel === "none") {
    return;
  } else if (actsLikeSingleSelect) {
    return {
      preserveExistingSelection,
      rowKey,
      type: "SELECT_ROW",
    } as Omit<SelectRequest, "vpId">;
  } else if (rangeSelect) {
    return {
      preserveExistingSeletion: preserveExistingSelection,
      fromRowKey: rowKey,
      toRowKey: activeRowKey,
      type: "SELECT_ROW_RANGE",
    } as Omit<SelectRequest, "vpId">;
  }
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
