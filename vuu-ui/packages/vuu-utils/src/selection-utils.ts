import { DataRow, TableSelectionModel } from "@vuu-ui/vuu-table-types";
import { SelectRequest } from "@vuu-ui/vuu-protocol-types";

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
  const singleSelect =
    selectionModel === "single" || selectionModel === "single-no-deselect";
  const actsLikeSingleSelect = singleSelect || activeRowKey === undefined;

  if (selectionModel === "none") {
    return;
  } else if (actsLikeSingleSelect) {
    const preserveSelection = singleSelect ? false : preserveExistingSelection;
    return {
      preserveExistingSelection: preserveSelection,
      rowKey,
      type: "SELECT_ROW",
    } as Omit<SelectRequest, "vpId">;
  } else if (rangeSelect) {
    return {
      preserveExistingSelection,
      fromRowKey: rowKey,
      toRowKey: activeRowKey,
      type: "SELECT_ROW_RANGE",
    } as Omit<SelectRequest, "vpId">;
  }
};

/**
 * Split a row range into sub-ranges that exclude non-selectable rows.
 * Returns one SELECT_ROW_RANGE per consecutive run of selectable rows.
 */
export const splitSelectableRanges = (
  rows: DataRow[],
  isRowSelectable: (row: DataRow) => boolean,
  preserveExistingSelection: boolean,
): Omit<SelectRequest, "vpId">[] => {
  const requests: Omit<SelectRequest, "vpId">[] = [];
  let fromKey: string | undefined;
  let toKey: string | undefined;

  for (const row of rows) {
    if (isRowSelectable(row)) {
      if (!fromKey) fromKey = row.key;
      toKey = row.key;
    } else if (fromKey && toKey) {
      requests.push({
        type: "SELECT_ROW_RANGE",
        fromRowKey: fromKey,
        toRowKey: toKey,
        // first sub-range respects the caller's preserve flag; subsequent ones must preserve
        preserveExistingSelection: requests.length > 0 ? true : preserveExistingSelection,
      } as Omit<SelectRequest, "vpId">);
      fromKey = undefined;
      toKey = undefined;
    }
  }
  if (fromKey && toKey) {
    requests.push({
      type: "SELECT_ROW_RANGE",
      fromRowKey: fromKey,
      toRowKey: toKey,
      preserveExistingSelection: requests.length > 0 ? true : preserveExistingSelection,
    } as Omit<SelectRequest, "vpId">);
  }
  return requests;
};
