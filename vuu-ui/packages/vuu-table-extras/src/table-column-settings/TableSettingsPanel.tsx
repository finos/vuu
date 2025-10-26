import {
  Button,
  FormField,
  FormFieldLabel,
  ToggleButton,
  ToggleButtonGroup,
} from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import {
  TableSettingsPermissions,
  TableSettingsProps,
} from "@vuu-ui/vuu-table-types";
import { ColumnList } from "../column-list";
import { useTableSettings } from "./useTableSettings";
import { Icon } from "@vuu-ui/vuu-ui-controls";
import { VuuInput } from "@vuu-ui/vuu-ui-controls";
import cx from "clsx";

import tableSettingsPanelCss from "./TableSettingsPanel.css";
import { toColumnName } from "@vuu-ui/vuu-utils";

const classBase = "vuuTableSettingsPanel";

export const defaultTableSettingsPermissions: Readonly<TableSettingsPermissions> =
  {
    allowColumnLabelCase: true,
    allowColumnDefaultWidth: true,
    allowGridSeparators: true,
    allowReorderColumns: true,
    allowRemoveColumns: true,
    allowHideColumns: true,
    allowCalculatedColumns: true,
  };
export const noTableSettingsPermissions: Readonly<TableSettingsPermissions> = {
  allowColumnLabelCase: false,
  allowColumnDefaultWidth: false,
  allowGridSeparators: false,
  allowReorderColumns: false,
  allowRemoveColumns: false,
  allowHideColumns: false,
  allowCalculatedColumns: false,
};

/**
  The TableSettingsPanel assumes 'ownership' of the tableSettings.
  It updates the settings in state locally and notifies caller of
  every change via onChange callback
 */
export const TableSettingsPanel = ({
  availableColumns,
  onAddCalculatedColumn,
  onConfigChange,
  onDataSourceConfigChange,
  onNavigateToColumn,
  tableConfig: tableConfigProp,
  permissions: permissionsProp,
}: TableSettingsProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-table-settings-panel",
    css: tableSettingsPanelCss,
    window: targetWindow,
  });

  console.log(
    `[TableSettingsPanel] ${tableConfigProp.columns.map(toColumnName).join(",")}`,
  );

  const permissions =
    permissionsProp === undefined || permissionsProp === true
      ? defaultTableSettingsPermissions
      : permissionsProp === false
        ? noTableSettingsPermissions
        : permissionsProp;

  const {
    columnItems,
    columnLabelsValue,
    onChangeColumnLabels,
    onChangeTableAttribute,
    onReorderColumnItems,
    onColumnChange,
    onCommitColumnWidth,
    tableConfig,
  } = useTableSettings({
    availableColumns,
    onConfigChange,
    onDataSourceConfigChange,
    tableConfig: tableConfigProp,
  });

  const {
    allowColumnLabelCase = true,
    allowColumnDefaultWidth = true,
    allowGridSeparators = true,
    allowCalculatedColumns = true,
    ...columnListPermissions
  } = permissions;

  return (
    <div className={classBase}>
      {allowColumnLabelCase ||
      allowColumnDefaultWidth ||
      allowGridSeparators ? (
        <div className={`${classBase}-header`}>
          <span>Column Settings</span>
        </div>
      ) : null}

      {allowColumnDefaultWidth ? (
        <FormField>
          <FormFieldLabel>Column Width</FormFieldLabel>
          <VuuInput
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
              selected={tableConfig.zebraStripes ?? false}
              onChange={onChangeTableAttribute}
              value="zebraStripes"
            >
              <Icon name="row-striping" size={16} />
            </ToggleButton>
            <ToggleButton
              selected={tableConfig.rowSeparators ?? false}
              onChange={onChangeTableAttribute}
              value="rowSeparators"
            >
              <Icon name="row-lines" size={16} />
            </ToggleButton>
            <ToggleButton
              selected={tableConfig.columnSeparators ?? false}
              onChange={onChangeTableAttribute}
              value="columnSeparators"
            >
              <Icon name="col-lines" size={16} />
            </ToggleButton>
          </div>
        </FormField>
      ) : null}

      <div className={cx(`${classBase}-columnListContainer`, "vuuScrollable")}>
        <ColumnList
          columnItems={columnItems}
          permissions={columnListPermissions}
          onChange={onColumnChange}
          onNavigateToColumn={onNavigateToColumn}
          onReorderColumnItems={onReorderColumnItems}
        />
      </div>

      {allowCalculatedColumns ? (
        <div className={`${classBase}-calculatedButtonbar`}>
          <Button data-icon="plus" onClick={onAddCalculatedColumn} />
          <span className={`${classBase}-calculatedLabel`}>
            Add calculated column
          </span>
        </div>
      ) : null}
    </div>
  );
};
