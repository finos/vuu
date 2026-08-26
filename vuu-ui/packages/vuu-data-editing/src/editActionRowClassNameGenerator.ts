import type { DataRow } from "@vuu-ui/vuu-table-types";
import { registerComponent } from "@vuu-ui/vuu-utils";

export const EDIT_ACTION_ROW_CLASS_NAME_GENERATOR = "vuu-edit-actions";

export const editActionRowClassNameGenerator = (dataRow: DataRow) => {
  switch (dataRow.vuuAction) {
    case "addRow":
      return "vuuTableRow-inserted";
    case "deleteRow":
      return "vuuTableRow-deleted";
  }
};

registerComponent(
  EDIT_ACTION_ROW_CLASS_NAME_GENERATOR,
  {
    fn: editActionRowClassNameGenerator,
    id: EDIT_ACTION_ROW_CLASS_NAME_GENERATOR,
  },
  "row-class-generator",
);
