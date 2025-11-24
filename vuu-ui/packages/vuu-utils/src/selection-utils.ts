import { TableSelectionModel } from "@vuu-ui/vuu-table-types";
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
