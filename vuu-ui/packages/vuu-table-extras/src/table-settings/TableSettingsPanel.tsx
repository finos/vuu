import {
  FormField,
  FormFieldLabel,
  Input,
  ToggleButton,
  ToggleButtonGroup,
} from "@salt-ds/core";
import { SchemaColumn } from "packages/vuu-data/src";
import { TableConfig } from "packages/vuu-datagrid-types";
import { HTMLAttributes } from "react";
import { ColumnList } from "../column-list";
import { useTableSettings } from "./useTableSettings";

import "./TableSettingsPanel.css";

const classBase = "vuuTableSettingsPanel";

export interface TableSettingsProps extends HTMLAttributes<HTMLDivElement> {
  availableColumns: SchemaColumn[];
  onConfigChange: (config: TableConfig) => void;
  tableConfig: TableConfig;
}

/**
  The TableSettingsPanel assumes 'ownership' of the tableSettings.
  It updates the settings in state locally and notifies caller of
  every change via onChange callback
 */
export const TableSettingsPanel = ({
  availableColumns,
  onConfigChange,
  tableConfig: tableConfigProp,
  ...htmlAttributes
}: TableSettingsProps) => {
  const {
    columnItems,
    columnLabelsValue,
    onChangeColumnLabels,
    onChangeTableAttribute,
    onColumnChange,
    onMoveListItem,
    tableConfig,
  } = useTableSettings({
    availableColumns,
    onConfigChange,
    tableConfig: tableConfigProp,
  });

  return (
    <div {...htmlAttributes} className={classBase}>
      <FormField>
        <FormFieldLabel>Column Labels</FormFieldLabel>
        <ToggleButtonGroup
          className="vuuToggleButtonGroup"
          onChange={onChangeColumnLabels}
          value={columnLabelsValue}
        >
          <ToggleButton
            className="vuuIconToggleButton"
            data-icon="text-strikethrough"
            value={0}
          />
          <ToggleButton
            className="vuuIconToggleButton"
            data-icon="text-Tt"
            value={1}
          />
          <ToggleButton
            className="vuuIconToggleButton"
            data-icon="text-T"
            value={2}
          />
        </ToggleButtonGroup>
      </FormField>

      <FormField>
        <FormFieldLabel>Grid separators</FormFieldLabel>
        <div className="saltToggleButtonGroup vuuToggleButtonGroup saltToggleButtonGroup-horizontal vuuGridSeparators">
          <ToggleButton
            className="vuuIconToggleButton"
            data-icon="row-striping"
            selected={tableConfig.zebraStripes}
            onChange={onChangeTableAttribute}
            value="zebraStripes"
          />
          <ToggleButton
            className="vuuIconToggleButton"
            data-icon="row-lines"
            selected={tableConfig.rowSeparators}
            onChange={onChangeTableAttribute}
            value="rowSeparators"
          />
          <ToggleButton
            className="vuuIconToggleButton"
            data-icon="col-lines"
            selected={tableConfig.columnSeparators}
            onChange={onChangeTableAttribute}
            value="columnSeparators"
          />
        </div>
      </FormField>

      <FormField>
        <FormFieldLabel>Default Column Width</FormFieldLabel>
        <Input className="vuuInput" />
      </FormField>

      <ColumnList
        columnItems={columnItems}
        onChange={onColumnChange}
        onMoveListItem={onMoveListItem}
      />
    </div>
  );
};
