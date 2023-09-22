import { ColumnDescriptor, TableConfig } from "@finos/vuu-datagrid-types";
import { VuuTable } from "@finos/vuu-protocol-types";
import { getDefaultAlignment, isCalculatedColumn } from "@finos/vuu-utils";
import {
  Button,
  FormField,
  FormFieldLabel,
  ToggleButton,
  ToggleButtonGroup,
} from "@salt-ds/core";
import { HTMLAttributes } from "react";
import { ColumnFormattingPanel } from "../column-formatting-settings/ColumnFormattingPanel";
import { useColumnSettings } from "./useColumnSettings";
import { ColumnExpressionPanel } from "../column-expression-panel";
import { VuuInput } from "@finos/vuu-ui-controls";

import "./ColumnSettingsPanel.css";

const classBase = "vuuColumnSettingsPanel";

export interface ColumnSettingsProps extends HTMLAttributes<HTMLDivElement> {
  column: ColumnDescriptor;
  onConfigChange: (config: TableConfig) => void;
  onCreateCalculatedColumn: (column: ColumnDescriptor) => void;
  tableConfig: TableConfig;
  vuuTable: VuuTable;
}

export const ColumnSettingsPanel = ({
  column: columnProp,
  onConfigChange,
  onCreateCalculatedColumn,
  tableConfig,
  vuuTable,
}: ColumnSettingsProps) => {
  const isNewCalculatedColumn = columnProp.name === "::";
  const {
    availableRenderers,
    selectedCellRenderer,
    column,
    navigateNextColumn,
    navigatePrevColumn,
    onChange,
    onChangeFormatting,
    onChangeRenderer,
    onInputCommit,
    onSave,
  } = useColumnSettings({
    column: columnProp,
    onConfigChange,
    onCreateCalculatedColumn,
    tableConfig,
  });

  const {
    serverDataType,
    align = getDefaultAlignment(serverDataType),
    name,
    label = name,
    pin,
    width,
  } = column;

  return (
    <div className={classBase}>
      <div className={`${classBase}-header`}>
        <span>{name}</span>
      </div>

      <FormField data-field="column-label">
        <FormFieldLabel>Column Label</FormFieldLabel>
        <VuuInput
          className="vuuInput"
          onChange={onChange}
          onCommit={onInputCommit}
          value={label}
        />
      </FormField>

      <FormField data-field="column-width">
        <FormFieldLabel>Column Width</FormFieldLabel>
        <VuuInput
          className="vuuInput"
          onChange={onChange}
          value={width}
          onCommit={onInputCommit}
        />
      </FormField>
      <FormField data-field="column-alignment">
        <FormFieldLabel>Alignment</FormFieldLabel>
        <ToggleButtonGroup
          className="vuuToggleButtonGroup"
          onChange={onChange}
          value={align}
        >
          <ToggleButton
            data-icon="align-left"
            className="vuuIconToggleButton"
            value="left"
          />
          <ToggleButton
            data-icon="align-right"
            className="vuuIconToggleButton"
            value="right"
          />
        </ToggleButtonGroup>
      </FormField>
      <FormField data-field="column-pin">
        <FormFieldLabel>Pin Column</FormFieldLabel>
        <ToggleButtonGroup
          className="vuuToggleButtonGroup"
          onChange={onChange}
          value={pin ?? ""}
        >
          <ToggleButton
            className="vuuIconToggleButton"
            data-icon="cross-circle"
            value=""
          />
          <ToggleButton
            className="vuuIconToggleButton"
            data-icon="pin-left"
            value="left"
          />
          <ToggleButton
            className="vuuIconToggleButton"
            data-icon="pin-float"
            value="floating"
          />
          <ToggleButton
            className="vuuIconToggleButton"
            data-icon="pin-right"
            value="right"
          />
        </ToggleButtonGroup>
      </FormField>
      <ColumnFormattingPanel
        availableRenderers={availableRenderers}
        selectedCellRenderer={selectedCellRenderer}
        column={column}
        onChangeFormatting={onChangeFormatting}
        onChangeRenderer={onChangeRenderer}
      />

      {isCalculatedColumn(column.name) ? (
        <ColumnExpressionPanel
          column={column}
          onSave={onSave}
          tableConfig={tableConfig}
          vuuTable={vuuTable}
        />
      ) : (
        <div
          className={`${classBase}-buttonBar`}
          data-align={isNewCalculatedColumn ? "right" : undefined}
        >
          <Button
            className={`${classBase}-buttonNavPrev`}
            variant="secondary"
            data-icon="arrow-left"
            onClick={navigatePrevColumn}
          >
            PREVIOUS
          </Button>
          <Button
            className={`${classBase}-buttonNavNext`}
            variant="secondary"
            data-icon="arrow-right"
            onClick={navigateNextColumn}
          >
            NEXT
          </Button>
        </div>
      )}
    </div>
  );
};
