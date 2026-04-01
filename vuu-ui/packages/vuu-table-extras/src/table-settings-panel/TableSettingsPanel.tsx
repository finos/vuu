import {
  FormField,
  FormFieldLabel,
  ToggleButton,
  ToggleButtonGroup,
} from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import {
  TableDisplayAttributes,
  TableSettingsPermissions,
} from "@vuu-ui/vuu-table-types";
import { useTableSettings } from "./useTableSettings";
import { Icon } from "@vuu-ui/vuu-ui-controls";
import { VuuInput } from "@vuu-ui/vuu-ui-controls";

import tableSettingsPanelCss from "./TableSettingsPanel.css";

const classBase = "vuuTableSettingsPanel";

export const defaultTableSettingsPermissions: Readonly<TableSettingsPermissions> =
  {
    allowColumnLabelCase: true,
    allowColumnDefaultWidth: true,
    allowGridSeparators: true,
  };
export const noTableSettingsPermissions: Readonly<TableSettingsPermissions> = {
  allowColumnLabelCase: false,
  allowColumnDefaultWidth: false,
  allowGridSeparators: false,
};

export type TableDisplayAttributeChangeHandler = (
  displayAttributes: TableDisplayAttributes,
) => void;

/**
 * Describes the props for a Table Configuration Editor, for which
 * an implementation is provided in vuu-table-extras
 */
export interface TableSettingsPanelProps {
  allowColumnLabelCase?: boolean;
  allowColumnDefaultWidth?: boolean;
  allowGridRowStyling?: boolean;
  onDisplayAttributeChange: TableDisplayAttributeChangeHandler;
  tableDisplayAttributes: TableDisplayAttributes;
  permissions?: TableSettingsPermissions | boolean;
}

/**
  The TableSettingsPanel assumes 'ownership' of the tableSettings.
  It updates the settings in state locally and notifies caller of
  every change via onChange callback
 */
export const TableSettingsPanel = ({
  onDisplayAttributeChange,
  tableDisplayAttributes: tableDisplayAttributesProp,
  permissions: permissionsProp,
}: TableSettingsPanelProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-table-settings-panel",
    css: tableSettingsPanelCss,
    window: targetWindow,
  });

  const permissions =
    permissionsProp === undefined || permissionsProp === true
      ? defaultTableSettingsPermissions
      : permissionsProp === false
        ? noTableSettingsPermissions
        : permissionsProp;

  const {
    columnLabelsValue,
    onChangeColumnLabels,
    onChangeTableAttribute,
    onCommitColumnWidth,
    tableDisplayAttributes,
  } = useTableSettings({
    onDisplayAttributeChange,
    tableDisplayAttributes: tableDisplayAttributesProp,
  });

  const {
    allowColumnLabelCase = true,
    allowColumnDefaultWidth = true,
    allowGridSeparators = true,
  } = permissions;

  return (
    <div className={classBase}>
      {allowColumnDefaultWidth ? (
        <FormField>
          <FormFieldLabel>Column Width</FormFieldLabel>
          <VuuInput
            bordered
            className="vuuInput"
            data-embedded
            onCommit={onCommitColumnWidth}
          />
        </FormField>
      ) : null}

      {allowColumnLabelCase ? (
        <FormField>
          <FormFieldLabel>Column Labels</FormFieldLabel>
          <ToggleButtonGroup
            className="vuuToggleButtonGroup"
            onChange={onChangeColumnLabels}
            value={columnLabelsValue}
          >
            <ToggleButton className="vuuIconToggleButton" value={0}>
              <Icon name="text-strikethrough" size={48} />
            </ToggleButton>
            <ToggleButton className="vuuIconToggleButton" value={1}>
              <Icon name="text-Tt" size={48} />
            </ToggleButton>
            <ToggleButton className="vuuIconToggleButton" value={2}>
              <Icon name="text-T" size={48} />
            </ToggleButton>
          </ToggleButtonGroup>
        </FormField>
      ) : null}

      {allowGridSeparators ? (
        <FormField>
          <FormFieldLabel>Grid separators</FormFieldLabel>
          <div className="saltToggleButtonGroup vuuStateButtonGroup saltToggleButtonGroup-horizontal">
            <ToggleButton
              selected={tableDisplayAttributes.zebraStripes ?? false}
              onChange={onChangeTableAttribute}
              value="zebraStripes"
            >
              <Icon name="row-striping" size={16} />
            </ToggleButton>
            <ToggleButton
              selected={tableDisplayAttributes.rowSeparators ?? false}
              onChange={onChangeTableAttribute}
              value="rowSeparators"
            >
              <Icon name="row-lines" size={16} />
            </ToggleButton>
            <ToggleButton
              selected={tableDisplayAttributes.columnSeparators ?? false}
              onChange={onChangeTableAttribute}
              value="columnSeparators"
            >
              <Icon name="col-lines" size={16} />
            </ToggleButton>
          </div>
        </FormField>
      ) : null}
    </div>
  );
};
