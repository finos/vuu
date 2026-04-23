import { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { ColumnDescriptor, ColumnDisplayAction } from "@vuu-ui/vuu-table-types";

export type ColumnDisplayActionHandler = (action: ColumnDisplayAction) => void;

export type DisplayColumnSettingsAction = {
  type: "column-settings";
  column: ColumnDescriptor;
  /**  only for calculated columnn */
  vuuTable?: VuuTable;
};

export type DisplaySettingsAction = DisplayColumnSettingsAction;

export type TableSettingsActionHandler = (
  action: DisplaySettingsAction,
) => void;
