import {
  Button,
  FormField,
  FormFieldLabel,
  ToggleButton,
  ToggleButtonGroup,
} from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { Icon, VuuInput } from "@vuu-ui/vuu-ui-controls";
import {
  getCalculatedColumnDetails,
  getDefaultAlignment,
  isCalculatedColumn,
} from "@vuu-ui/vuu-utils";
import { ColumnFormattingPanel } from "../column-formatting-settings";
import { ColumnNameLabel } from "./ColumnNameLabel";
import { ColumnSettingsProps, useColumnSettings } from "./useColumnSettings";

import colunSettingsPanelCss from "./ColumnSettingsPanel.css";

const classBase = "vuuColumnSettingsPanel";

const getColumnLabel = (column: ColumnDescriptor) => {
  const { name, label } = column;
  if (isCalculatedColumn(name)) {
    return label ?? getCalculatedColumnDetails(column).name;
  } else {
    return label ?? name;
  }
};

export interface ColumnSettinsPanelProps extends ColumnSettingsProps {
  onClickEditCalculatedColumn?: () => void;
}

export const ColumnSettingsPanel = ({
  column: columnProp,
  columnModel,
  onClickEditCalculatedColumn,
  onConfigChange,
}: ColumnSettinsPanelProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-column-settings-panel",
    css: colunSettingsPanelCss,
    window: targetWindow,
  });

  const isNewCalculatedColumn = columnProp.name === "::";
  const {
    availableRenderers,
    column,
    navigateNextColumn,
    navigatePrevColumn,
    onChange,
    onChangeFormatting,
    onChangeRendering,
    onChangeToggleButton,
    onChangeType,
    onInputCommit,
  } = useColumnSettings({
    column: columnProp,
    columnModel,
    onConfigChange,
  });

  const {
    serverDataType,
    align = getDefaultAlignment(serverDataType),
    pin,
    width = "",
  } = column;

  return (
    <div className={classBase}>
      <div className={`${classBase}-header`}>
        <ColumnNameLabel
          column={column}
          onClick={onClickEditCalculatedColumn}
        />
      </div>

      <FormField data-field="column-label">
        <FormFieldLabel>Column Label</FormFieldLabel>
        <VuuInput
          bordered
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
          bordered
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
        <ToggleButtonGroup
          onChange={onChangeToggleButton}
          value={pin || "false"}
        >
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
    </div>
  );
};
