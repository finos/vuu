import { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { ColumnDescriptor, ColumnDisplayAction } from "@vuu-ui/vuu-table-types";

export type ColumnDisplayActionHandler = (action: ColumnDisplayAction) => void;

export type DisplayTableSettingsAction = {
  type: "table-settings";
};

export type DisplayColumnSettingsAction = {
  type: "column-settings";
  column: ColumnDescriptor;
  /**  only for calculated columnn */
  vuuTable?: VuuTable;
};

export type DisplaySettingsAction =
  | DisplayTableSettingsAction
  | DisplayColumnSettingsAction;

export type TableSettingsActionHandler = (
  action: DisplaySettingsAction,
) => void;
