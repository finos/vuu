import {
  FormField,
  FormFieldLabel,
  Input,
  ToggleButton,
  ToggleButtonGroup,
} from "@salt-ds/core";
import { useColumnSettings } from "./useColumnSettings";
import { TableConfig } from "packages/vuu-datagrid-types";
import { HTMLAttributes } from "react";
import { getDefaultAlignment } from "@finos/vuu-utils";
import { ColumnFormattingPanel } from "../column-formatting-settings/ColumnFormattingPanel";

import "./ColumnSettingsPanel.css";

const classBase = "vuuColumnSettingsPanel";

export interface ColumnSettingsProps extends HTMLAttributes<HTMLDivElement> {
  columnName: string;
  onConfigChange: (config: TableConfig) => void;
  tableConfig: TableConfig;
}

export const ColumnSettingsPanel = ({
  columnName,
  onConfigChange,
  tableConfig,
}: ColumnSettingsProps) => {
  const {
    availableRenderers,
    cellRenderer,
    column,
    onChange,
    onChangeFormatting,
    onChangeRenderer,
    onKeyDown,
  } = useColumnSettings({
    columnName,
    onConfigChange,
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
      <FormField data-field="column-label">
        <FormFieldLabel>Column Label</FormFieldLabel>
        <Input
          className="vuuInput"
          onChange={onChange}
          onKeyDown={onKeyDown}
          value={label}
        />
      </FormField>
      <FormField data-field="column-width">
        <FormFieldLabel>Column Width</FormFieldLabel>
        <Input className="vuuInput" onChange={onChange} value={width} />
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
        cellRenderer={cellRenderer}
        column={column}
        onChangeFormatting={onChangeFormatting}
        onChangeRenderer={onChangeRenderer}
      />
    </div>
  );
};
