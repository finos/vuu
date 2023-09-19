import {
  Button,
  FormField,
  FormFieldLabel,
  Input,
  ToggleButton,
  ToggleButtonGroup,
} from "@salt-ds/core";
import { useColumnSettings } from "./useColumnSettings";
import { ColumnDescriptor, TableConfig } from "@finos/vuu-datagrid-types";
import { HTMLAttributes } from "react";
import { getDefaultAlignment } from "@finos/vuu-utils";
import { ColumnFormattingPanel } from "../column-formatting-settings/ColumnFormattingPanel";

import {
  ColumnExpressionInput,
  useColumnExpressionSuggestionProvider,
} from "../column-expression-input";

import "./ColumnSettingsPanel.css";
import { VuuTable } from "packages/vuu-protocol-types";

const classBase = "vuuColumnSettingsPanel";

export interface ColumnSettingsProps extends HTMLAttributes<HTMLDivElement> {
  columnName: string;
  isNewCalculatedColumn: boolean;
  onConfigChange: (config: TableConfig) => void;
  onCreateCalculatedColumn: (column: ColumnDescriptor) => void;
  tableConfig: TableConfig;
  vuuTable: VuuTable;
}

export const ColumnSettingsPanel = ({
  columnName,
  isNewCalculatedColumn,
  onConfigChange,
  onCreateCalculatedColumn,
  tableConfig,
  vuuTable,
}: ColumnSettingsProps) => {
  const {
    availableRenderers,
    cellRenderer,
    column,
    navigateNextColumn,
    navigatePrevColumn,
    onChange,
    onChangeExpression,
    onChangeFormatting,
    onChangeRenderer,
    onKeyDown,
    onSave,
    onSubmitExpression,
  } = useColumnSettings({
    columnName,
    isNewCalculatedColumn,
    onConfigChange,
    onCreateCalculatedColumn,
    tableConfig,
  });

  const suggestionProvider = useColumnExpressionSuggestionProvider({
    columns: tableConfig.columns,
    table: vuuTable,
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
        <span>{label}</span>
      </div>

      <FormField data-field="column-label">
        <FormFieldLabel>Column Label</FormFieldLabel>
        <Input
          className="vuuInput"
          onChange={onChange}
          onKeyDown={onKeyDown}
          value={label}
        />
      </FormField>

      {column.isCalculated ? (
        <>
          <div className={`${classBase}-header`}>
            <span>Calculation</span>
          </div>
          <FormField data-field="column-expression">
            <FormFieldLabel>Expression</FormFieldLabel>
            <ColumnExpressionInput
              onChange={onChangeExpression}
              onSubmitExpression={onSubmitExpression}
              suggestionProvider={suggestionProvider}
            />
          </FormField>
        </>
      ) : null}

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

      <div
        className={`${classBase}-buttonBar`}
        data-align={isNewCalculatedColumn ? "right" : undefined}
      >
        {isNewCalculatedColumn ? (
          <>
            <Button className={`${classBase}-buttonCancel`}>cancel</Button>
            <Button className={`${classBase}-buttonApply`}>apply</Button>
            <Button
              className={`${classBase}-buttonSave`}
              onClick={onSave}
              variant="cta"
            >
              save
            </Button>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
};
