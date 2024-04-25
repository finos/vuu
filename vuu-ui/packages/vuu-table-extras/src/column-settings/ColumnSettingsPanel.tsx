import { ColumnDescriptor, ColumnSettingsProps } from "@finos/vuu-table-types";
import { Icon, VuuInput } from "@finos/vuu-ui-controls";
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
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { ColumnExpressionPanel } from "../column-expression-panel";
import { ColumnFormattingPanel } from "../column-formatting-settings";
import { ColumnNameLabel } from "./ColumnNameLabel";
import { useColumnSettings } from "./useColumnSettings";

import colunSettingsPanelCss from "./ColumnSettingsPanel.css";

const classBase = "vuuColumnSettingsPanel";

const getColumnLabel = (column: ColumnDescriptor) => {
  const { name, label } = column;
  if (isCalculatedColumn(name)) {
    return label ?? getCalculatedColumnName(column);
  } else {
    return label ?? name;
  }
};

export const ColumnSettingsPanel = ({
  column: columnProp,
  onCancelCreateColumn,
  onConfigChange,
  onCreateCalculatedColumn,
  tableConfig,
  vuuTable,
}: ColumnSettingsProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-column-settings-panel",
    css: colunSettingsPanelCss,
    window: targetWindow,
  });

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
    onChangeServerDataType,
    onChangeToggleButton,
    onChangeType,
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
          onChangeServerDataType={onChangeServerDataType}
          tableConfig={tableConfig}
          vuuTable={vuuTable}
        />
      ) : null}

      <FormField data-field="column-label">
        <FormFieldLabel>Column Label</FormFieldLabel>
        <VuuInput
          className="vuuInput"
          data-embedded
          onChange={onChange}
          onCommit={onInputCommit}
          value={getColumnLabel(column)}
        />
      </FormField>

      <FormField data-field="column-width">
        <FormFieldLabel>Column Width</FormFieldLabel>
        <VuuInput
          className="vuuInput"
          data-embedded
          onChange={onChange}
          value={width}
          onCommit={onInputCommit}
        />
      </FormField>
      <FormField data-field="column-alignment">
        <FormFieldLabel>Alignment</FormFieldLabel>
        <ToggleButtonGroup onChange={onChangeToggleButton} value={align}>
          <ToggleButton value="left">
            <Icon name="align-left" size={16} />
          </ToggleButton>
          <ToggleButton value="right">
            <Icon name="align-right" size={16} />
          </ToggleButton>
        </ToggleButtonGroup>
      </FormField>
      <FormField data-field="column-pin">
        <FormFieldLabel>Pin Column</FormFieldLabel>
        <ToggleButtonGroup onChange={onChangeToggleButton} value={pin ?? ""}>
          <ToggleButton value="left">
            <Icon name="pin-left" size={16} />
          </ToggleButton>
          <ToggleButton value="floating">
            <Icon name="pin-float" size={16} />
          </ToggleButton>
          <ToggleButton value="right">
            <Icon name="pin-right" size={16} />
          </ToggleButton>
          <ToggleButton value="">
            <Icon name="cross-circle" size={16} />
          </ToggleButton>
        </ToggleButtonGroup>
      </FormField>
      <ColumnFormattingPanel
        availableRenderers={availableRenderers}
        column={column}
        onChangeFormatting={onChangeFormatting}
        onChangeRendering={onChangeRendering}
        onChangeColumnType={onChangeType}
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
