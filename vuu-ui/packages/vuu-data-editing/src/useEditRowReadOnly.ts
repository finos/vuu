import type { DataRow } from "@vuu-ui/vuu-table-types";
import { useEditSession } from "./DataEditingProvider";
import { isEditRowReadOnly } from "./edit-utils";
import { useRowAction } from "./useRowAction";

/**
 * A row deleted in the edit session cannot be edited. The edit session
 * tracks deleted rows, so a session table need not have vuuAction.
 */
export const useEditRowReadOnly = (dataRow: DataRow) => {
  const editSession = useEditSession();
  const rowAction = useRowAction(editSession, dataRow.key);
  return rowAction === "deleteRow" || isEditRowReadOnly(dataRow);
};
