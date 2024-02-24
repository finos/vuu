import {
  Button,
  FormField,
  FormFieldLabel,
  ToggleButton,
  ToggleButtonGroup,
} from "@salt-ds/core";
import { TableSettingsProps } from "@finos/vuu-table-types";
import { ColumnList } from "../column-list";
import { useTableSettings } from "./useTableSettings";
import { Icon } from "@finos/vuu-ui-controls";
import { VuuInput } from "@finos/vuu-ui-controls";

import "./TableSettingsPanel.css";

const classBase = "vuuTableSettingsPanel";

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
}: TableSettingsProps) => {
  const {
    columnItems,
    columnLabelsValue,
    onChangeColumnLabels,
    onChangeTableAttribute,
    onColumnChange,
    onCommitColumnWidth,
    onMoveListItem,
    tableConfig,
  } = useTableSettings({
    availableColumns,
    onConfigChange,
    onDataSourceConfigChange,
    tableConfig: tableConfigProp,
  });

  return (
    <div className={classBase}>
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

      <FormField>
        <FormFieldLabel>Default Column Width</FormFieldLabel>
        <VuuInput className="vuuInput" onCommit={onCommitColumnWidth} />
      </FormField>

      <ColumnList
        columnItems={columnItems}
        onChange={onColumnChange}
        onMoveListItem={onMoveListItem}
        onNavigateToColumn={onNavigateToColumn}
      />

      <div className={`${classBase}-calculatedButtonbar`}>
        <Button data-icon="plus" onClick={onAddCalculatedColumn} />
        <span className={`${classBase}-calculatedLabel`}>
          Add calculated column
        </span>
      </div>
    </div>
  );
};
