import { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { ColumnDescriptor, PinLocation } from "@vuu-ui/vuu-table-types";

export interface ColumnPinAction {
  type: "pinColumn";
  column: ColumnDescriptor;
  pin: PinLocation | false;
}

export interface ColumnHideAction {
  type: "hideColumn";
  column: ColumnDescriptor;
}
export interface ColumnRemoveAction {
  type: "removeColumn";
  column: ColumnDescriptor;
}

export type ColumnDisplayAction =
  | ColumnPinAction
  | ColumnHideAction
  | ColumnRemoveAction;

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
