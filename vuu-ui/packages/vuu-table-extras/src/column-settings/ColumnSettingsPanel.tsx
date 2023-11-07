import { ColumnDescriptor, TableConfig } from "@finos/vuu-datagrid-types";
import { VuuTable } from "@finos/vuu-protocol-types";
import { VuuInput } from "@finos/vuu-ui-controls";
import {
  getCalculatedColumnName,
  getDefaultAlignment,
  isCalculatedColumn,
} from "@finos/vuu-utils";
import {
  Button,
  FormField,
  FormFieldLabel,
  ToggleButton,
  ToggleButtonGroup,
} from "@salt-ds/core";
import cx from "classnames";
import { HTMLAttributes } from "react";
import { ColumnExpressionPanel } from "../column-expression-panel";
import { ColumnFormattingPanel } from "../column-formatting-settings";
import { ColumnNameLabel } from "./ColumnNameLabel";
import { useColumnSettings } from "./useColumnSettings";

import "./ColumnSettingsPanel.css";

const classBase = "vuuColumnSettingsPanel";

const getColumnLabel = (column: ColumnDescriptor) => {
  const { name, label } = column;
  if (isCalculatedColumn(name)) {
    return label ?? getCalculatedColumnName(column);
  } else {
    return label ?? name;
  }
};

export interface ColumnSettingsProps extends HTMLAttributes<HTMLDivElement> {
  column: ColumnDescriptor;
  onConfigChange: (config: TableConfig) => void;
  onCancelCreateColumn: () => void;
  onCreateCalculatedColumn: (column: ColumnDescriptor) => void;
  tableConfig: TableConfig;
  vuuTable: VuuTable;
}

export const ColumnSettingsPanel = ({
  column: columnProp,
  onCancelCreateColumn,
  onConfigChange,
  onCreateCalculatedColumn,
  tableConfig,
  vuuTable,
}: ColumnSettingsProps) => {
  const isNewCalculatedColumn = columnProp.name === "::";
  const {
    availableRenderers,
    editCalculatedColumn,
    column,
    navigateNextColumn,
    navigatePrevColumn,
    onCancel,
    onChange,
    onChangeCalculatedColumnName,
    onChangeFormatting,
    onChangeRendering,
    onEditCalculatedColumn,
    onInputCommit,
    onSave,
  } = useColumnSettings({
    column: columnProp,
    onCancelCreateColumn,
    onConfigChange,
    onCreateCalculatedColumn,
    tableConfig,
  });

  const {
    serverDataType,
    align = getDefaultAlignment(serverDataType),
    name,
    pin,
    width,
  } = column;

  return (
    <div
      className={cx(classBase, {
        [`${classBase}-editing`]: editCalculatedColumn,
      })}
    >
      <div className={`${classBase}-header`}>
        <ColumnNameLabel column={column} onClick={onEditCalculatedColumn} />
      </div>

      {editCalculatedColumn ? (
        <ColumnExpressionPanel
          column={column}
          onChangeName={onChangeCalculatedColumnName}
          tableConfig={tableConfig}
          vuuTable={vuuTable}
        />
      ) : null}

      <FormField data-field="column-label">
        <FormFieldLabel>Column Label</FormFieldLabel>
        <VuuInput
          className="vuuInput"
          onChange={onChange}
          onCommit={onInputCommit}
          value={getColumnLabel(column)}
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
        column={column}
        onChangeFormatting={onChangeFormatting}
        onChangeRendering={onChangeRendering}
      />

      {editCalculatedColumn ? (
        <div className="vuuColumnSettingsPanel-buttonBar" data-align="right">
          <Button
            className={`${classBase}-buttonCancel`}
            onClick={onCancel}
            tabIndex={-1}
          >
            cancel
          </Button>
          <Button
            className={`${classBase}-buttonSave`}
            onClick={onSave}
            variant="cta"
          >
            save
          </Button>
        </div>
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
